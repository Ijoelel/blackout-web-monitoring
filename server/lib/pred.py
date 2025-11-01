import os, json, joblib, numpy as np, torch
import torch.nn as nn
from collections import deque
from math import exp
from typing import Dict, List, Any

# ------------------ Model ------------------
class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, latent_dim=32, num_layers=2, dropout=0.0):
        super().__init__()
        self.encoder = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True)
        self.h2z = nn.Linear(hidden_dim, latent_dim)
        self.z2h = nn.Linear(latent_dim, hidden_dim)
        self.decoder = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.out = nn.Linear(hidden_dim, input_dim)
        self.num_layers = num_layers; self.hidden_dim = hidden_dim

    def forward(self, x):
        # Encode
        _, (h_n, _) = self.encoder(x)
        h = h_n[-1]                   # (B, hidden)
        z = self.h2z(h)               # (B, latent)
        # Decode from latent
        h0 = self.z2h(z).unsqueeze(0).repeat(self.num_layers, x.size(0), 1)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim, device=x.device)
        dec_in = torch.zeros_like(x)   # zero input (as in training)
        dec_out, _ = self.decoder(dec_in, (h0, c0))
        return self.out(dec_out)       # (B,L,D)

class LSTMAE_Evaluator:
    MODE_MAP = {"startup": 1, "stable": 2, "high_load": 3, "bad_env": 4}

    def __init__(self, artifacts_dir="artifacts", device=None, prob_alpha=0.25, topk=5):
        self.art_dir = artifacts_dir
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.prob_alpha = float(prob_alpha)
        self.topk = int(topk)

        # Load config/scaler
        with open(os.path.join(self.art_dir, "config.json")) as f:
            cfg = json.load(f)

        self.feature_cols: List[str] = cfg["feature_cols"]
        self.scaled_columns: List[str] = cfg.get("scaled_columns", [c for c in self.feature_cols if not c.endswith("_online")])
        self.seq_len: int = int(cfg["seq_len"])
        self.threshold: float = float(cfg["threshold"])

        self.scaler = joblib.load(os.path.join(self.art_dir, "scaler.pkl"))

        # Strict contract: scaler vs scaled_columns
        if not hasattr(self.scaler, "n_features_in_"):
            raise RuntimeError("Scaler has no n_features_in_. Refit scaler with the current continuous columns.")
        n_scaled = int(self.scaler.n_features_in_)
        if len(self.scaled_columns) != n_scaled:
            raise RuntimeError(
                f"Mismatch scaled_columns ({len(self.scaled_columns)}) vs scaler.n_features_in_ ({n_scaled}). "
                "Refit scaler to the exact list (names & order)."
            )
        missing = [c for c in self.scaled_columns if c not in self.feature_cols]
        if missing:
            raise RuntimeError(f"scaled_columns not present in feature_cols: {missing}")

        self.name_to_idx = {c:i for i,c in enumerate(self.feature_cols)}
        self.scale_idx = np.array([self.feature_cols.index(c) for c in self.scaled_columns], dtype=int)
        self.n_features = len(self.feature_cols)

        # Binary columns (treated as 0/1, not scaled, not penalized)
        self.binary_cols = [c for c in self.feature_cols if c.endswith("_online")]
        self.bin_idx = np.array([self.name_to_idx[c] for c in self.binary_cols], dtype=int) if self.binary_cols else np.array([], int)

        # Per-gen groups for dynamic masking (skip recon error when a gen is offline)
        def _gen_cont(k: int):
            names = [f"g{k}_load_kw", f"g{k}_frequency_hz", f"g{k}_lube_oil_pressure_bar",
                     f"g{k}_coolant_temperature_celsius", f"g{k}_exhaust_gas_temperature_celsius",
                     f"g{k}_vibration_level_mm_s"]
            return [self.name_to_idx[n] for n in names if n in self.name_to_idx]
        self.gen_groups = {}
        for k in (1,2,3,4):
            on_name = f"g{k}_online"
            if on_name in self.name_to_idx:
                self.gen_groups[k] = {"online": self.name_to_idx[on_name], "cont": _gen_cont(k)}

        # Base weights (down-weight noisy channels)
        base_w = np.ones(self.n_features, np.float32)
        for b in self.binary_cols:
            base_w[self.name_to_idx[b]] = 0.0
        if "mode_code" in self.name_to_idx:
            base_w[self.name_to_idx["mode_code"]] = 0.0
        low_w = {
            "g1_load_kw":0.3, "g2_load_kw":0.3, "g3_load_kw":0.3, "g4_load_kw":0.3,
            "g1_vibration_level_mm_s":0.4, "g2_vibration_level_mm_s":0.35,
            "g3_vibration_level_mm_s":0.4, "g4_vibration_level_mm_s":0.4,
            "msb_total_active_power_kw":0.5,
        }
        for k,v in low_w.items():
            if k in self.name_to_idx:
                base_w[self.name_to_idx[k]] = min(base_w[self.name_to_idx[k]], np.float32(v))
        self.base_w = torch.from_numpy(base_w).to(self.device).view(1,1,-1)

        # Model
        self.model = LSTMAutoencoder(input_dim=self.n_features).to(self.device)
        state = torch.load(os.path.join(self.art_dir, "lstm_ae_best.pth"), map_location=self.device)
        self.model.load_state_dict(state)   # should succeed now
        self.model.eval()

        # Window buffer
        self.buf = deque(maxlen=self.seq_len)

    # ---------- 1) Map mode -> integer (if requested by your features) ----------
    @staticmethod
    def map_mode_to_int(sample: Dict[str, Any]) -> None:
        """
        Mutates sample in place:
        If 'mode' is present and you want a 'mode_code' feature, add it using MODE_MAP.
        If 'mode_code' is not part of your feature_cols, this is a no-op for the model.
        """
        if "mode" in sample and isinstance(sample["mode"], str):
            m = sample["mode"].strip().lower()
            sample["mode_code"] = float(LSTMAE_Evaluator.MODE_MAP.get(m, 0))
        # If no 'mode' present, you can also set sample['mode_code']=0.0 as default if needed.

    # ---------- 2) Build vector in feature order ----------
    def vectorize(self, flat_sample: Dict[str, float]) -> np.ndarray:
        """
        flat_sample: dict of raw numeric features whose keys match feature_cols + maybe 'mode' (string).
        Returns (D,) float32 vector. Missing numeric keys default to 0.0 (you can change that if needed).
        """
        # if you expect mode_code and only have 'mode' -> generate it
        if "mode_code" in self.feature_cols and "mode_code" not in flat_sample:
            self.map_mode_to_int(flat_sample)

        vec = []
        for name in self.feature_cols:
            v = flat_sample.get(name, 0.0)
            try:
                vec.append(float(v))
            except Exception:
                # If any leftover strings slip in, treat as 0.0
                vec.append(0.0)
        return np.array(vec, dtype=np.float32)

    # ---------- 3) Impute + scale only continuous columns ----------
    def _post_scale_sanity(self, window_sc: np.ndarray):
        sub = window_sc[:, self.scale_idx]
        m = np.nanmean(sub, axis=0)
        s = np.nanstd(sub, axis=0)
        if np.nanmedian(s) > 3.0 or np.nanmax(s) > 10.0:
            raise RuntimeError(
                "Runtime scaling sanity failed: scaled std too large "
                f"(median std={float(np.nanmedian(s)):.2f}, max std={float(np.nanmax(s)):.2f}). "
                "Likely scaler/columns mismatch or passing raw (unscaled) inputs."
            )

    def _impute_scale_inplace(self, window: np.ndarray) -> np.ndarray:
        if self.scale_idx.size == 0:
            return window

        sub = window[:, self.scale_idx].astype(np.float64, copy=True)

        # --- get scaler center vector safely (no boolean 'or' on arrays) ---
        center = getattr(self.scaler, "center_", None)
        if center is None:
            center = getattr(self.scaler, "mean_", None)

        if center is not None:
            center = np.asarray(center, dtype=np.float64)
            if center.shape[0] != sub.shape[1]:
                raise RuntimeError(
                    f"Scaler/columns mismatch: center length ({center.shape[0]}) != n_scaled ({sub.shape[1]})."
                )
            # column-wise impute NaN with scaler center
            # fast vectorized form:
            mask = np.isnan(sub)
            if mask.any():
                # broadcast per-column centers to rows
                sub[mask] = np.take(center, np.nonzero(mask)[1])

        sub_sc = self.scaler.transform(sub).astype(np.float32)
        window[:, self.scale_idx] = sub_sc

        # optional safety
        np.clip(window, -8.0, 8.0, out=window)

        # quick sanity
        s = np.nanstd(window[:, self.scale_idx], axis=0)
        if np.nanmedian(s) > 3.0 or np.nanmax(s) > 10.0:
            raise RuntimeError(
                f"Runtime scaling sanity failed: median std={float(np.nanmedian(s)):.2f}, max std={float(np.nanmax(s)):.2f}. "
                "Likely scaler/columns mismatch or raw inputs not matching training."
            )
        return window


    # ---------- 4) Dynamic mask + weighted contributions ----------
    def _build_weight_mask(self, xb: torch.Tensor) -> torch.Tensor:
        """xb: (1,L,D). Return W (1,L,D) with 0 on gen-continuous features when that gen is OFF."""
        W = torch.ones_like(xb, device=xb.device)
        for k, grp in self.gen_groups.items():
            on_col = grp["online"]; cont_cols = grp["cont"]
            if not cont_cols: continue
            online = (xb[:, :, on_col] > 0.5).unsqueeze(-1)
            off = ~online
            W[:, :, cont_cols] = torch.where(off, torch.zeros_like(W[:, :, cont_cols]), W[:, :, cont_cols])
        return W

    def _score_with_explanations(self, xb: torch.Tensor, recon: torch.Tensor):
        Wdyn = self._build_weight_mask(xb)      # dynamic mask
        Wtot = Wdyn * self.base_w               # + base weights
        diff2 = (xb - recon) ** 2               # (1,L,D)
        masked = diff2 * Wtot                   # (1,L,D)

        total_mse = masked.mean(dim=(1,2)).item()
        per_feat = masked.mean(dim=1).squeeze(0).detach().cpu().numpy()   # (D,)
        s = per_feat.sum()
        pct = (per_feat / s) if s > 0 else np.zeros_like(per_feat)

        order = np.argsort(-per_feat)[:self.topk]
        top = [{"name": self.feature_cols[i], "contribution": float(per_feat[i]), "percent": float(pct[i])}
               for i in order]
        return total_mse, per_feat, top

    def _prob_from_score(self, mse: float) -> float:
        denom = max(self.prob_alpha * self.threshold, 1e-6)
        z = (mse - self.threshold) / denom
        return float(1.0 / (1.0 + exp(-z)))

    # ---------- 5) Public API: push samples (flat dicts) & evaluate ----------
    def push_sample_and_eval(self, flat_sample: Dict[str, float]) -> Dict[str, Any]:
        """
        flat_sample: dict with keys in feature_cols (+ maybe 'mode' as string).
        Returns a dict with:
          - ready: bool
          - score: float
          - threshold: float
          - blackout_prob: float (0..1)
          - top_contributors: list of {name, contribution, percent}
        """
        vec = self.vectorize(flat_sample)               # (D,)
        self.buf.append(vec)

        if len(self.buf) < self.seq_len:
            return {
                "ready": False,
                "score": None,
                "threshold": float(self.threshold),
                "blackout_prob": 0.0,
                "top_contributors": [],
            }

        window = np.stack(self.buf, axis=0).astype(np.float32)   # (L,D) raw
        window = self._impute_scale_inplace(window.copy())       # scale continuous only

        x = torch.from_numpy(window).unsqueeze(0).to(self.device).float()  # (1,L,D)
        with torch.no_grad():
            recon = self.model(x)
            total_mse, per_feat, top = self._score_with_explanations(x, recon)

        p = self._prob_from_score(total_mse)
        return {
            "ready": True,
            "score": float(total_mse),
            "threshold": float(self.threshold),
            "blackout_prob": float(p),
            "top_contributors": top,
        }

    def getBuffer(self):
        return self.buf
# class AnomalyPredictor:
#     def __init__(self, artifacts_dir="artifacts", device=None, smoothing_k=3,
#                  prob_alpha=0.25, topk=5):
#         """
#         prob_alpha: sensitivitas probabilitas; makin kecil -> sigmoid makin 'tajam'
#         topk: banyaknya fitur yang ditampilkan pada top_contributors
#         """
#         self.art_dir = artifacts_dir
#         self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
#         self.k = int(smoothing_k)
#         self.prob_alpha = float(prob_alpha)
#         self.topk = int(topk)

#         # Load config / scaler / model
#         with open(os.path.join(self.art_dir, "config.json")) as f:
#             cfg = json.load(f)

#         self.feature_cols = cfg["feature_cols"]
#         self.seq_len = int(cfg["seq_len"])
#         self.threshold = float(cfg["threshold"])

#         self.scaler = joblib.load(os.path.join(self.art_dir, "scaler.pkl"))
#         self.scaled_columns = cfg.get("scaled_columns", [c for c in self.feature_cols if not c.endswith("_online")])
#         self.n_features = len(self.feature_cols)

#         # Precompute indices
#         self.name_to_idx = {c:i for i,c in enumerate(self.feature_cols)}
#         self.scale_idx = np.array([self.name_to_idx[c] for c in self.scaled_columns if c in self.name_to_idx], dtype=int)

#         # indeks biner (tidak di-scale, tidak dihukum)
#         self.binary_cols = [c for c in self.feature_cols if c.endswith("_online")]
#         self.bin_idx = np.array([self.name_to_idx[c] for c in self.binary_cols], dtype=int) if self.binary_cols else np.array([], int)

#         # grup per genset untuk dynamic mask
#         def _gen_cont(k:int):
#             names = [f"g{k}_load_kw", f"g{k}_frequency_hz", f"g{k}_lube_oil_pressure_bar",
#                      f"g{k}_coolant_temperature_celsius", f"g{k}_exhaust_gas_temperature_celsius",
#                      f"g{k}_vibration_level_mm_s"]
#             return [self.name_to_idx[n] for n in names if n in self.name_to_idx]
#         self.gen_groups = {}
#         for k in (1,2,3,4):
#             online_name = f"g{k}_online"
#             if online_name in self.name_to_idx:
#                 self.gen_groups[k] = {
#                     "online": self.name_to_idx[online_name],
#                     "cont": _gen_cont(k)
#                 }

#         # per-feature base weight (kanal liar dibobotkan lebih kecil)
#         base_w = np.ones(self.n_features, np.float32)
#         for b in self.binary_cols:
#             base_w[self.name_to_idx[b]] = 0.0
#         # mode_code jika ada → jangan dihukum
#         if "mode_code" in self.name_to_idx:
#             base_w[self.name_to_idx["mode_code"]] = 0.0
#         # load, vibration, total power → soft weights
#         low_w = {
#             "g1_load_kw":0.3, "g2_load_kw":0.3, "g3_load_kw":0.3, "g4_load_kw":0.3,
#             "g1_vibration_level_mm_s":0.4, "g2_vibration_level_mm_s":0.35,
#             "g3_vibration_level_mm_s":0.4, "g4_vibration_level_mm_s":0.4,
#             "msb_total_active_power_kw":0.5,
#         }
#         for k,v in low_w.items():
#             if k in self.name_to_idx:
#                 base_w[self.name_to_idx[k]] = min(base_w[self.name_to_idx[k]], np.float32(v))
#         self.base_w = torch.from_numpy(base_w).to(self.device).view(1,1,-1)  # (1,1,D)

#         # Model
#         self.model = LSTMAutoencoder(input_dim=self.n_features).to(self.device)
#         state = torch.load(os.path.join(self.art_dir, "lstm_ae_best.pth"), map_location=self.device)
#         self.model.load_state_dict(state); self.model.eval()

#         # buffers
#         self.buf = deque(maxlen=self.seq_len)
#         self.above = 0  # streak di atas threshold untuk keperluan UI (opsional)

#     # ------------------ Utils ------------------
#     def vectorize(self, sample_dict):
#         """Ambil urutan fitur sesuai feature_cols (float32)."""
#         return np.array([sample_dict[c] for c in self.feature_cols], dtype=np.float32)

#     def _impute_scale_inplace(self, window: np.ndarray) -> np.ndarray:
#         """window: (T,D) raw; impute NaN di kolom kontinu -> scale hanya kolom kontinu."""
#         if self.scale_idx.size == 0:
#             return window
#         sub = window[:, self.scale_idx].astype(np.float64, copy=True)

#         # Impute NaN ke pusat scaler (center_ untuk Robust, mean_ untuk Standard)
#         center = getattr(self.scaler, "center_", None)
#         if center is None:
#             center = getattr(self.scaler, "mean_", None)
#         if center is not None:
#             center = np.asarray(center, dtype=np.float64)
#             if center.shape[0] != sub.shape[1]:
#                 raise ValueError("Scaler n_features_in_ tidak cocok dengan scaled_columns.")
#             # isi per kolom
#             for j in range(sub.shape[1]):
#                 m = np.isnan(sub[:, j])
#                 if m.any():
#                     sub[m, j] = center[j]

#         sub_sc = self.scaler.transform(sub).astype(np.float32)
#         window[:, self.scale_idx] = sub_sc
#         return window

#     def _build_weight_mask(self, xb: torch.Tensor) -> torch.Tensor:
#         """xb: (1,L,D) sudah di-scale. Kembalikan W: (1,L,D) dengan dynamic mask per genset offline."""
#         W = torch.ones_like(xb, device=xb.device)
#         # nolkan biner (dan mode_code jika ada) via base_w (sudah 0 disana)
#         # nolkan fitur kontinyu milik genset OFF
#         for k, grp in self.gen_groups.items():
#             on_col = grp["online"]
#             cont_cols = grp["cont"]
#             if not cont_cols:
#                 continue
#             online = (xb[:, :, on_col] > 0.5).unsqueeze(-1)  # (1,L,1)
#             off = ~online
#             W[:, :, cont_cols] = torch.where(off, torch.zeros_like(W[:, :, cont_cols]), W[:, :, cont_cols])
#         return W

#     def _score_with_explanations(self, xb: torch.Tensor, recon: torch.Tensor):
#         """
#         xb, recon: (1,L,D). Hitung total score + kontribusi per fitur (masked + weighted).
#         return: total_mse, per_feat_contrib(np.array[D]), top_contributors(list)
#         """
#         Wdyn = self._build_weight_mask(xb)                 # dynamic mask
#         Wtot = Wdyn * self.base_w                          # gabung base weight

#         diff2 = (xb - recon)**2                            # (1,L,D)
#         masked = diff2 * Wtot                              # (1,L,D)

#         # total window score = mean over time dan fitur
#         total_mse = masked.mean(dim=(1,2)).item()

#         # kontribusi per fitur (rata2 time)
#         per_feat = masked.mean(dim=1).squeeze(0).detach().cpu().numpy()  # (D,)
#         s = per_feat.sum()
#         pct = (per_feat / s) if s > 0 else np.zeros_like(per_feat)

#         # top-k fitur
#         order = np.argsort(-per_feat)[:self.topk]
#         top = [{"name": self.feature_cols[i], "contribution": float(per_feat[i]), "percent": float(pct[i])}
#                for i in order]

#         return total_mse, per_feat, top

#     def _prob_from_score(self, mse: float) -> float:
#         """
#         P(blackout) ~ sigmoid((mse - threshold) / (alpha * threshold)).
#         alpha kecil → lebih sensitif di sekitar threshold.
#         """
#         denom = max(self.prob_alpha * self.threshold, 1e-6)
#         z = (mse - self.threshold) / denom
#         p = 1.0 / (1.0 + exp(-z))
#         return float(p)

#     # ------------------ Public API ------------------
#     def update_and_score(self, vec: np.ndarray):
#         """
#         vec: (D,) raw. Return:
#           - ready: bool (window sudah penuh)
#           - score: float (total MSE masked+weighted)
#           - threshold: float
#           - blackout_prob: float [0..1]
#           - consecutive_above: int (streak skor > threshold)
#           - top_contributors: list[{name, contribution, percent}]
#         """
#         self.buf.append(vec)
#         if len(self.buf) < self.seq_len:
#             return {
#                 "ready": False,
#                 "score": None,
#                 "threshold": float(self.threshold),
#                 "blackout_prob": 0.0,
#                 "consecutive_above": 0,
#                 "top_contributors": [],
#             }

#         # (T,D) → impute+scale kontinu
#         window = np.stack(self.buf, axis=0).astype(np.float32)  # raw
#         window = self._impute_scale_inplace(window.copy())

#         # ke torch
#         x = torch.from_numpy(window).unsqueeze(0).to(self.device).float()  # (1,L,D)

#         with torch.no_grad():
#             recon = self.model(x)
#             total_mse, per_feat, top = self._score_with_explanations(x, recon)

#         # streak di atas threshold (untuk UI)
#         if total_mse > self.threshold:
#             self.above += 1
#         else:
#             self.above = 0

#         # prob blackout (berbasis skor)
#         p = self._prob_from_score(total_mse)

#         return {
#             "ready": True,
#             "score": float(total_mse),
#             "threshold": float(self.threshold),
#             "blackout_prob": float(p),           # persentase peluang (0..1). Kali 100 di UI jika mau %
#             "consecutive_above": int(self.above),
#             "top_contributors": top,             # list of dicts: name, contribution (abs), percent (0..1)
#         }
