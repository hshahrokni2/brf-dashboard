"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BrfOverview } from "@/types"; // Make sure to update types if needed
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Add energy_performance_kwh_sqm to BrfOverview in types/index.ts (Already doing this in parallel)

const ENERGY_COLORS: Record<string, string> = {
    A: "bg-green-600",
    B: "bg-green-500",
    C: "bg-lime-500",
    D: "bg-yellow-500",
    E: "bg-orange-500",
    F: "bg-red-500",
    G: "bg-red-600",
    Unknown: "bg-slate-400",
};

export const columns: ColumnDef<BrfOverview>[] = [
    {
        accessorKey: "brf_name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    BRF Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("brf_name")}</div>,
    },
    {
        accessorKey: "district",
        header: "District",
        cell: ({ row }) => <div className="text-slate-500">{row.getValue("district")}</div>,
    },
    {
        accessorKey: "energy_class",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Energy Class
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const cls = row.getValue("energy_class") as string || "Unknown";
            const colorClass = ENERGY_COLORS[cls] || "bg-slate-400";
            return (
                <Badge className={`${colorClass} hover:${colorClass} text-white w-8 justify-center`}>
                    {cls}
                </Badge>
            );
        },
    },
    {
        accessorKey: "solidarity_percent",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Soliditet %
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const val = row.getValue("solidarity_percent");
            return <div className="text-right font-mono">{val !== null ? `${val}%` : "-"}</div>;
        },
    },
    {
        accessorKey: "debt_per_sqm_total",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Debt/m²
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const val = row.getValue("debt_per_sqm_total") as number;
            return <div className="text-right font-mono">{val ? `${Math.round(val).toLocaleString()} kr` : "-"}</div>;
        },
    },
    {
        accessorKey: "energy_performance_kwh_sqm",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    kWh/m²
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const val = row.getValue("energy_performance_kwh_sqm") as number;
            return <div className="text-right font-mono">{val ? Math.round(val) : "-"}</div>;
        },
    },
];
