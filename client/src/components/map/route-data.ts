export type RouteCheckpoint = {
    name: string;
    description: string;
    coords: [number, number];
    eta: string;
};

export const ROUTE_CHECKPOINTS: RouteCheckpoint[] = [
    {
        name: "Pelabuhan Tanjung Priok",
        description: "Jakarta, titik keberangkatan utama",
        coords: [-6.121435, 106.774124],
        eta: "00:00",
    },
    {
        name: "Selat Karimata",
        description: "Perairan Kalimantan Barat",
        coords: [-2.687, 108.997],
        eta: "+18 jam",
    },
    {
        name: "Laut Natuna Utara",
        description: "Zona operasional utama saat ini",
        coords: [1.289, 109.03],
        eta: "+32 jam",
    },
    {
        name: "Pelabuhan Tanjung Balai Karimun",
        description: "Kepulauan Riau, tujuan akhir",
        coords: [0.999, 103.403],
        eta: "+48 jam",
    },
];

export const ACTIVE_CHECKPOINT_INDEX = 2;

export const ROUTE_PROGRESS = 68;
