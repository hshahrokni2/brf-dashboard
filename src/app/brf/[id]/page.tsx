import { getBrfFullDetail } from "@/lib/brf-detail";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Building2, Users, Wallet, Zap, Calendar,
    TrendingUp, MapPin, Banknote, Briefcase, Shield, Home,
    Wrench, Thermometer, Percent
} from "lucide-react";

export const dynamic = "force-dynamic";

interface BrfPageProps {
    params: { id: string };
}

function PercentileBadge({ value, label }: { value: number | null; label: string }) {
    if (value === null) return null;

    const color = value >= 75 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : value >= 50 ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
            : value >= 25 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30';

    return (
        <div className="text-center">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${color}`}>
                Top {value}%
            </div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
        </div>
    );
}

function PercentileIndicator({ value }: { value: number | null }) {
    if (value === null) return <span className="w-2 h-2 rounded-full bg-slate-600 inline-block mr-2"></span>;
    const color = value >= 75 ? 'bg-emerald-500'
        : value >= 50 ? 'bg-sky-500'
            : value >= 25 ? 'bg-amber-500'
                : 'bg-red-500';
    return (
        <span className={`w-2 h-2 rounded-full ${color} inline-block mr-2`} title={`Top ${value}%`}></span>
    );
}

function StatCard({ icon: Icon, label, value, subValue, iconColor }: {
    icon: any;
    label: string;
    value: string | number | null;
    subValue?: string;
    iconColor?: string;
}) {
    return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Icon className={`w-4 h-4 ${iconColor || ''}`} />
                <span className="text-xs uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">
                    {value ?? 'N/A'}
                </span>
            </div>
            {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
        </div>
    );
}

export default async function BrfDetailPage({ params }: BrfPageProps) {
    const brf = await getBrfFullDetail(params.id);

    if (!brf) {
        notFound();
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(val);

    const totalLoans = brf.loans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const avgInterest = brf.loans.length > 0
        ? brf.loans.reduce((sum, l) => sum + (l.interest_rate || 0), 0) / brf.loans.length
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                            {brf.brf_name}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-slate-400 flex-wrap">
                            {brf.address && (
                                <span className="flex items-center gap-1">
                                    <Home className="w-4 h-4" />
                                    {brf.address}
                                </span>
                            )}
                            {brf.district && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {brf.district}
                                </span>
                            )}
                            {brf.built_year && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Built {brf.built_year}
                                </span>
                            )}
                        </div>
                    </div>
                    {brf.energy_class && (
                        <div className={`text-4xl font-bold px-4 py-2 rounded-xl border-2 ${brf.energy_class === 'A' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' :
                            brf.energy_class === 'B' ? 'bg-green-500/20 text-green-400 border-green-500' :
                                brf.energy_class === 'C' ? 'bg-lime-500/20 text-lime-400 border-lime-500' :
                                    brf.energy_class === 'D' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' :
                                        brf.energy_class === 'E' ? 'bg-amber-500/20 text-amber-400 border-amber-500' :
                                            brf.energy_class === 'F' ? 'bg-orange-500/20 text-orange-400 border-orange-500' :
                                                'bg-red-500/20 text-red-400 border-red-500'
                            }`}>
                            {brf.energy_class}
                        </div>
                    )}
                </div>
            </div>

            {/* Percentile Rankings */}
            <Card className="bg-slate-900/50 border-slate-800 mb-8">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-sky-400" />
                        Market Position
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <PercentileBadge value={brf.percentiles.solidarity} label="Financial Health" />
                        <PercentileBadge value={brf.percentiles.debt_per_sqm} label="Debt Level" />
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard icon={Building2} label="Apartments" value={brf.total_apartments} />
                <StatCard icon={Building2} label="Total Area" value={brf.total_area_sqm?.toLocaleString('sv-SE')} subValue="m²" />
                <StatCard icon={Shield} label="Soliditet" value={brf.solidarity_percent ? `${brf.solidarity_percent.toFixed(1)}%` : null} />
                <StatCard icon={Wallet} label="Debt/m²" value={brf.debt_per_sqm?.toLocaleString('sv-SE')} subValue="kr/m²" />
                <StatCard icon={Percent} label="Avg Interest" value={avgInterest?.toFixed(2)} subValue="%" />
                <StatCard icon={Users} label="Board Size" value={brf.board_size} />
            </div>

            {/* Energy Declaration */}
            {(brf.heating_type || brf.energy_kwh_per_sqm) && (
                <Card className="bg-slate-900/50 border-slate-800 mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Energy Declaration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            {brf.energy_class && (
                                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                    <span className="text-slate-300">Energy Class</span>
                                    <span className={`text-2xl font-bold ${brf.energy_class <= 'C' ? 'text-emerald-400' :
                                        brf.energy_class <= 'E' ? 'text-amber-400' :
                                            'text-red-400'
                                        }`}>{brf.energy_class}</span>
                                </div>
                            )}
                            {brf.energy_kwh_per_sqm && (
                                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                    <span className="text-slate-300">Energy Use</span>
                                    <span className="text-slate-100 font-mono">{brf.energy_kwh_per_sqm} kWh/m²</span>
                                </div>
                            )}
                            {brf.heating_type && (
                                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-orange-400" />
                                        <span className="text-slate-300">Heating</span>
                                    </div>
                                    <span className="text-slate-100 capitalize">{brf.heating_type}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Board Members */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-sky-400" />
                            Board Members ({brf.board_members.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {brf.board_members.map((member, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                                    <span className="text-slate-200">{member.name}</span>
                                    {member.role && (
                                        <Badge variant="outline" className="text-xs">
                                            {member.role}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                            {brf.board_members.length === 0 && (
                                <div className="text-slate-500 italic">No board members listed</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Key Events */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-purple-400" />
                            Key Events ({brf.events.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {brf.events.length > 0 ? brf.events.map((event, i) => (
                                <div key={i} className="p-2 bg-slate-800/30 rounded">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            {event.event_type && (
                                                <Badge variant="outline" className="text-xs mr-2 mb-1">{event.event_type.replace(/_/g, ' ')}</Badge>
                                            )}
                                            <span className="text-slate-200 text-sm">{event.description}</span>
                                        </div>
                                        {event.year && (
                                            <span className="text-xs text-slate-500 ml-2 shrink-0">{event.year}</span>
                                        )}
                                    </div>
                                    {event.cost && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            Cost: {formatCurrency(event.cost)}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-slate-500 italic">No events recorded</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Loans with Percentile Colors */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-emerald-400" />
                                Loans ({brf.loans.length})
                            </span>
                            {brf.loans.length > 0 && (
                                <div className="text-sm font-normal text-slate-400">
                                    Total: {formatCurrency(totalLoans)} | Avg: {avgInterest?.toFixed(2)}%
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {brf.loans.map((loan, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                                    <div>
                                        <span className="text-slate-200">{loan.lender}</span>
                                        {loan.amount && (
                                            <span className="text-xs text-slate-500 ml-2">
                                                {formatCurrency(loan.amount)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <PercentileIndicator value={loan.interest_percentile} />
                                        <span className="text-emerald-400 font-mono">{loan.interest_rate?.toFixed(2)}%</span>
                                        {loan.maturity_date && (
                                            <span className="text-xs text-slate-500">
                                                → {new Date(loan.maturity_date).toLocaleDateString('sv-SE')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {brf.loans.length === 0 && (
                                <div className="text-slate-500 italic">No loans listed</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Suppliers */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-amber-400" />
                            Suppliers ({brf.suppliers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {brf.suppliers.map((supplier, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                                    <span className="text-slate-200">{supplier.company_name}</span>
                                    {supplier.service_type && (
                                        <Badge variant="outline" className="text-xs">
                                            {supplier.service_type}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                            {brf.suppliers.length === 0 && (
                                <div className="text-slate-500 italic">No suppliers listed</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Breakdown with Percentile Colors */}
                <Card className="bg-slate-900/50 border-slate-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-red-400" />
                            Cost Breakdown
                            <span className="text-xs font-normal text-slate-500 ml-2">
                                (🟢 top 25% | 🔵 25-50% | 🟠 50-75% | 🔴 bottom 25%)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                            {brf.detailed_costs.map((cost, i) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-slate-800/30 rounded">
                                    <span className="text-slate-300 text-sm truncate max-w-[200px] flex items-center">
                                        <PercentileIndicator value={cost.percentile} />
                                        {cost.category}
                                    </span>
                                    <span className="text-slate-200 font-mono">{formatCurrency(cost.amount)}</span>
                                </div>
                            ))}
                            {brf.detailed_costs.length === 0 && (
                                <div className="text-slate-500 italic col-span-2">No cost data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
