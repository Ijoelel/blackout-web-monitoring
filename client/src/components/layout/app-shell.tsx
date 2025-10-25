"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MapPinned,
    Ship,
} from "lucide-react";

const NAVIGATION_ITEMS = [
    {
        title: "Dashboard",
        href: "/",
        description: "Ringkasan kondisi sistem dan generator.",
        icon: LayoutDashboard,
    },
    {
        title: "Peta Kapal",
        href: "/map",
        description: "Visualisasi posisi kapal dan kondisi lingkungan.",
        icon: MapPinned,
    },
];

function formatDateTime(current: Date) {
    return {
        date: current.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        time: current.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
}

interface AppShellProps {
    children: React.ReactNode;
    contentClassName?: string;
}

export default function AppShell({
    children,
    contentClassName,
}: AppShellProps) {
    const pathname = usePathname();
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60_000);

        return () => clearInterval(timer);
    }, []);

    const activeItem = useMemo(
        () => NAVIGATION_ITEMS.find((item) => item.href === pathname),
        [pathname]
    );

    const { date, time } = useMemo(
        () => formatDateTime(currentTime),
        [currentTime]
    );

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon" className="border-r border-border/60">
                <SidebarHeader className="py-6">
                    <div className="flex items-center gap-3 px-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Ship className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                                KM Arthawijaya Explorer
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Blackout Monitoring System
                            </span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
                        <SidebarMenu>
                            {NAVIGATION_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.href}>
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarSeparator />
                <SidebarRail />
            </Sidebar>
            <SidebarInset className="bg-muted/30">
                <header className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-border/60 sticky top-0 z-20">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="h-9 w-9" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {activeItem?.description ?? "Pantau operasi kapal secara real-time."}
                                </p>
                                <h1 className="text-xl font-semibold text-foreground">
                                    {activeItem?.title ?? "Monitoring"}
                                </h1>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{date}</p>
                            <p className="text-xs text-muted-foreground">{time} WIB</p>
                        </div>
                    </div>
                </header>
                <div
                    className={cn(
                        "flex-1 bg-gradient-to-br from-slate-50 to-blue-50",
                        contentClassName
                    )}
                >
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
