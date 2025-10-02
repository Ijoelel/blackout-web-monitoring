# predictor.py (drop-in replacement of AnomalyPredictor)
import os, json, joblib, numpy as np, torch, torch.nn as nn
from collections import deque

class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, latent_dim=32, num_layers=2):
        super().__init__()
        self.encoder = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True)
        self.h2z = nn.Linear(hidden_dim, latent_dim)
        self.z2h = nn.Linear(latent_dim, hidden_dim)
        self.decoder = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True)
        self.out = nn.Linear(hidden_dim, input_dim)
        self.num_layers = num_layers; self.hidden_dim = hidden_dim
    def forward(self, x):
        _, (h_n, _) = self.encoder(x)
        h = h_n[-1]
        z = self.h2z(h)
        h0 = self.z2h(z).unsqueeze(0).repeat(self.num_layers, 1, 1)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim, device=x.device)
        dec_in = torch.zeros_like(x)
        dec_out, _ = self.decoder(dec_in, (h0, c0))
        return self.out(dec_out)

class AnomalyPredictor:
    def __init__(self, artifacts_dir="artifacts", device=None, smoothing_k=3):
        self.art_dir = artifacts_dir
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # Load config / scaler / model
        with open(os.path.join(self.art_dir, "config.json")) as f:
            cfg = json.load(f)

        self.feature_cols = cfg["feature_cols"]
        self.seq_len = int(cfg["seq_len"])
        self.threshold = float(cfg["threshold"])

        self.scaler = joblib.load(os.path.join(self.art_dir, "scaler.pkl"))
        self.n_scaled = getattr(self.scaler, "n_features_in_", None)

        # Determine which columns to scale:
        if "scaled_columns" in cfg:
            # Preferred: exact list from training
            self.scaled_columns = cfg["scaled_columns"]
        else:
            # Fallback heuristic: scale all except *_online
            self.scaled_columns = [c for c in self.feature_cols if not c.endswith("_online")]

        # Enforce match to scaler’s expected count if defined
        if self.n_scaled is not None and len(self.scaled_columns) != self.n_scaled:
            # Keep order stable; trim or warn
            if len(self.scaled_columns) > self.n_scaled:
                self.scaled_columns = self.scaled_columns[:self.n_scaled]
            else:
                # pad/log warning: better to re-export with exact names
                pass

        # Precompute indices for speed
        name_to_idx = {c:i for i,c in enumerate(self.feature_cols)}
        self.scale_idx = [name_to_idx[c] for c in self.scaled_columns if c in name_to_idx]
        self.n_features = len(self.feature_cols)

        # Load model (input_dim = all features)
        self.model = LSTMAutoencoder(input_dim=self.n_features).to(self.device)
        state = torch.load(os.path.join(self.art_dir, "lstm_ae_best.pth"), map_location=self.device)
        self.model.load_state_dict(state); self.model.eval()

        self.buf = deque(maxlen=self.seq_len)
        self.above = 0; self.k = int(smoothing_k)

    def vectorize(self, sample_dict):
        return np.array([sample_dict[c] for c in self.feature_cols], dtype=np.float32)

    def _apply_scaler_inplace(self, window):
        """
        window: (T, D) ndarray (raw).
        We scale only columns in self.scale_idx using self.scaler, leave others as-is.
        """
        if not self.scale_idx:
            return window  # nothing to scale

        # Extract submatrix, transform, then write back:
        sub = window[:, self.scale_idx]                   # (T, n_scaled)
        sub_sc = self.scaler.transform(sub)               # (T, n_scaled)
        window[:, self.scale_idx] = sub_sc
        return window

    def update_and_score(self, vec):
        """vec: (D,) raw. return dict(score, is_anomaly, consecutive_above, ready)"""
        self.buf.append(vec)
        if len(self.buf) < self.seq_len:
            return {"ready": False, "score": None, "is_anomaly": False, "consecutive_above": 0}

        window = np.stack(self.buf, axis=0).astype(np.float32)  # (T,D)
        window = self._apply_scaler_inplace(window.copy())

        x = torch.from_numpy(window).unsqueeze(0).to(self.device).float()
        with torch.no_grad():
            recon = self.model(x)
            mse = torch.mean((x - recon)**2, dim=(1,2)).item()

        if mse > self.threshold:
            self.above += 1
        else:
            self.above = 0

        return {
            "ready": True,
            "score": float(mse),
            "is_anomaly": bool(self.above >= self.k),
            "consecutive_above": int(self.above),
            "threshold": float(self.threshold),
        }
