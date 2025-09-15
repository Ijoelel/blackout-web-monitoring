# --- load model hasil training ---
# pastikan sudah kamu simpan sebelumnya: torch.save(model.state_dict(), "lstm_model.pth")
from torch import nn


class LSTMPredictor(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        self.sigmoid = nn.Sigmoid()
    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return self.sigmoid(out)

features = ["voltage_L1","voltage_L2","voltage_L3",
            "current_L1","current_L2","current_L3",
            "frequency","power_kW","pf",
            "genset_rpm","battery_soc",
            "oil_temp","oil_pressure",
            "room_temp","humidity"]
