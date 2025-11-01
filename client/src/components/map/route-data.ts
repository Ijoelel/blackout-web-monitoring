export type RouteCheckpoint = {
    name: string;
    description: string;
    coords: [number, number];
    eta: string;
};

export const ROUTE_CHECKPOINTS: RouteCheckpoint[] = [
    {
        name: "Pelabuhan Ketapang",
        description: "Titik berangkat kapal",
        coords: [-8.1445988, 114.397147],
        eta: "00:00",
    },
    {
        name: "Pelabuhan Gilimanuk",
        description: "Titik berhenti kapal",
        coords: [-8.1638021, 114.4367777],
        eta: "+45 menit",
    },
];

export const ACTIVE_CHECKPOINT_INDEX = 2;

export const ROUTE_PROGRESS = 68;
