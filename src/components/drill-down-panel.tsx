
import { BrfOverview } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Zap, Droplets, Flame, Trash2, ArrowRight, TrendingUp, Building2, Coins, Receipt, Clock, Banknote, Calendar, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MultiYearTrends } from "./multi-year-trends";
import Link from "next/link";

interface DrillDownPanelProps {
    brf: BrfOverview | null;
    onClose: () => void;
}

// Simple Tabs Component
function TabButton({ active, onClick, children, icon: Icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon: any }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                active
                    ? "border-sky-500 text-sky-400 bg-sky-500/10"
                    : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            )}
        >
            <Icon className="w-3 h-3" />
            {children}
        </button>
    );
}

export function DrillDownPanel({ brf, onClose }: DrillDownPanelProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "financials" | "property" | "trends" | "timeline" | "loans">("overview");

    if (!brf) return null;

    // Benchmarking (Mocked relative to district logic for now, or dynamic client-side)
    const costs = [
        { label: "Electricity", value: brf.electricity_cost, unit: "kr/m²", icon: Zap, color: "text-amber-400" },
        { label: "Heating", value: brf.heating_cost, unit: "kr/m²", icon: Flame, color: "text-rose-400" },
        { label: "Water", value: brf.water_cost, unit: "kr/m²", icon: Droplets, color: "text-sky-400" },
    ];

    return (
        <div className="absolute top-0 right-0 h-full w-[500px] bg-slate-900/95 backdrop-blur-3xl border-l border-slate-700 shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-6 pb-2 border-b border-slate-800">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                            {brf.brf_name}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{brf.address || "Stockholm"} • {brf.district}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/brf/${brf.zelda_id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-sm font-medium transition-colors border border-sky-500/30"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Full Details
                        </Link>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={TrendingUp}>Overview</TabButton>
                    <TabButton active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} icon={Coins}>Financials</TabButton>
                    <TabButton active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} icon={Banknote}>Loans</TabButton>
                    <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={Clock}>Timeline</TabButton>
                    <TabButton active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} icon={TrendingUp}>Trends</TabButton>
                    <TabButton active={activeTab === 'property'} onClick={() => setActiveTab('property')} icon={Building2}>Property</TabButton>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* KPIs */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="bg-slate-800/50 border-slate-700 p-4">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Soliditet</div>
                                <div className="text-2xl font-mono text-white flex items-baseline gap-1">
                                    {brf.solidarity_percent}%
                                </div>
                            </Card>
                            <Card className="bg-slate-800/50 border-slate-700 p-4">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Debt/sqm</div>
                                <div className="text-2xl font-mono text-white flex items-baseline gap-1">
                                    {brf.debt_per_sqm_total ? new Intl.NumberFormat('sv-SE').format(brf.debt_per_sqm_total) : '-'} <span className="text-xs text-slate-500">kr</span>
                                </div>
                            </Card>
                        </div>

                        {/* Benchmark Chart */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Cost Efficiency</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={costs} layout="vertical" barSize={20}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="label" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#334155', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                        />
                                        <Bar dataKey="value" name="Cost (kr/m²)" radius={[0, 4, 4, 0]}>
                                            {costs.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color === 'text-amber-400' ? '#fbbf24' : entry.color === 'text-rose-400' ? '#fb7185' : entry.color === 'text-sky-400' ? '#38bdf8' : '#34d399'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Suppliers Mini List */}
                        {brf.top_suppliers && (
                            <div>
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Recent Spend</h3>
                                <div className="space-y-2">
                                    {brf.top_suppliers.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-slate-800/50 transition-colors">
                                            <span className="text-slate-300">{s.name}</span>
                                            <span className="text-slate-500 font-mono">{new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(s.spend)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TIMELINE TAB (NEW) */}
                {activeTab === 'timeline' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {brf.events && brf.events.length > 0 ? (
                            <div className="relative border-l border-slate-700 ml-3 space-y-6">
                                {brf.events.map((e, i) => (
                                    <div key={i} className="ml-6 relative">
                                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                                        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-sm font-semibold text-indigo-300">{e.type?.replace(/_/g, ' ') || 'Event'}</span>
                                                <span className="text-xs text-slate-500">{e.date && Number(e.date) > 1900 ? e.date : 'Historical'}</span>
                                            </div>
                                            <p className="text-sm text-slate-300">{e.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500 italic">No renovation events recorded</div>
                        )}
                    </div>
                )}


                {/* LOANS TAB (UPGRADED Phase 8.4) */}
                {activeTab === 'loans' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {brf.loans && brf.loans.length > 0 ? (
                            <div className="space-y-4">
                                {brf.loans.map((l, i) => (
                                    <div key={i} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-200">{l.lender}</h4>
                                                {l.loan_type && (
                                                    <Badge variant="outline" className="mt-1 text-xs text-sky-400 border-sky-400/30">
                                                        {l.loan_type}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-mono text-emerald-400">
                                                    {l.interest}%
                                                </div>
                                                <div className="text-xs text-slate-500">Interest Rate</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">Original Amount</div>
                                                <div className="font-mono text-slate-200">{new Intl.NumberFormat('sv-SE').format(l.amount)} kr</div>
                                            </div>
                                            {l.outstanding && (
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">Outstanding</div>
                                                    <div className="font-mono text-amber-400">{new Intl.NumberFormat('sv-SE').format(l.outstanding)} kr</div>
                                                </div>
                                            )}
                                            {l.expiry && (
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">Maturity Date</div>
                                                    <div className="text-slate-300">{new Date(l.expiry).toLocaleDateString('sv-SE')}</div>
                                                </div>
                                            )}
                                            {l.term_years && (
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">Term</div>
                                                    <div className="text-slate-300">{l.term_years} years</div>
                                                </div>
                                            )}
                                        </div>

                                        {l.collateral && (
                                            <div className="mt-3 pt-3 border-t border-slate-700">
                                                <div className="text-xs text-slate-500 mb-1">Collateral</div>
                                                <div className="text-xs text-slate-300">{l.collateral}</div>
                                            </div>
                                        )}

                                        {l.penalty && l.penalty > 0 && (
                                            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
                                                <span className="text-amber-400">⚠️ Early Repayment Penalty:</span> {new Intl.NumberFormat('sv-SE').format(l.penalty)} kr
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500 italic">Loan details not public</div>
                        )}
                    </div>
                )}

                {/* FINANCIALS TAB (UPGRADED) */}
                {activeTab === 'financials' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Granular Cost Breakdown */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Complete Cost Breakdown</h3>
                            <div className="bg-slate-800/30 rounded border border-slate-700 divide-y divide-slate-800">
                                {(brf.detailed_costs && brf.detailed_costs.length > 0) ? (
                                    brf.detailed_costs.map((item, i) => (
                                        <div key={i} className="flex justify-between p-3 text-sm hover:bg-slate-800/50 transition-colors">
                                            <span className="text-slate-300">{item.category}</span>
                                            <span className="text-slate-200 font-mono">
                                                {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(item.amount)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    // Fallback to legacy static list if detailed_costs is empty (shouldn't happen with new query)
                                    [
                                        { l: "Site Leasehold (Tomträtt)", v: brf.site_leasehold_fee ? `${brf.site_leasehold_fee} kr` : 'N/A' },
                                        { l: "Elevator Maint.", v: brf.elevator_cost ? `${brf.elevator_cost} kr` : 'N/A' },
                                        { l: "Property Tax", v: brf.property_tax ? `${brf.property_tax} kr` : 'N/A' },
                                        { l: "Heating", v: brf.heating_cost ? `${brf.heating_cost} kr` : '-' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between p-3 text-sm">
                                            <span className="text-slate-400">{item.l}</span>
                                            <span className="text-slate-200 font-mono">{item.v}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Suppliers Full List */}
                        {brf.top_suppliers && (
                            <div>
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">All Major Suppliers</h3>
                                <div className="space-y-2">
                                    {brf.top_suppliers.map((s, i) => (
                                        <div key={i} className="flex justify-between text-sm p-3 bg-slate-800/30 rounded border border-slate-700/50">
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-medium">{s.name}</span>
                                                <span className="text-slate-500 text-xs mt-0.5">{s.category}</span>
                                            </div>
                                            <span className="text-slate-300 font-mono self-center">
                                                {new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(s.spend)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TRENDS TAB */}
                {activeTab === 'trends' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <MultiYearTrends history={brf.history} brfName={brf.brf_name} />
                    </div>
                )}

                {/* PROPERTY TAB */}
                {activeTab === 'property' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Vital Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-800/30 rounded border border-slate-700">
                                <div className="text-xs text-slate-500 uppercase tracking-widest">Built</div>
                                <div className="text-xl text-white mt-1">{brf.built_year || '-'}</div>
                            </div>
                            <div className="p-4 bg-slate-800/30 rounded border border-slate-700">
                                <div className="text-xs text-slate-500 uppercase tracking-widest">Units</div>
                                <div className="text-xl text-white mt-1">{brf.total_apartments || '-'}</div>
                            </div>
                        </div>

                        {/* Governance */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Board & Audit</h3>
                            <div className="bg-slate-800/30 rounded border border-slate-700 p-4 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 text-sm">Chairman</span>
                                    <span className="text-slate-200 text-sm font-medium">{brf.chairman || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 text-sm">Board Size</span>
                                    <span className="text-slate-200 text-sm">{brf.board_size || '-'}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-700">
                                    <span className="text-slate-500 text-sm">Auditor</span>
                                    <div className="text-right">
                                        <div className="text-slate-200 text-sm">{brf.auditor}</div>
                                        <div className="text-xs text-slate-500">{brf.primary_auditor_firm}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Building-Level Details */}
                        {brf.buildings_detail && brf.buildings_detail.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                                    Building Details ({brf.buildings_detail.length} buildings)
                                </h3>
                                <div className="space-y-3">
                                    {brf.buildings_detail.map((building, idx) => (
                                        <div key={building.building_id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-200">
                                                        Building #{idx + 1}
                                                    </h4>
                                                    {building.address && (
                                                        <div className="text-xs text-slate-500 mt-1">{building.address}</div>
                                                    )}
                                                </div>
                                                {building.energy_class && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {building.energy_class}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                {building.floors != null && (
                                                    <div>
                                                        <span className="text-slate-500">Floors:</span>{' '}
                                                        <span className="text-slate-200">{building.floors}</span>
                                                    </div>
                                                )}
                                                {building.built_year && (
                                                    <div>
                                                        <span className="text-slate-500">Built:</span>{' '}
                                                        <span className="text-slate-200">{building.built_year}</span>
                                                    </div>
                                                )}
                                                {building.last_renovation && (
                                                    <div>
                                                        <span className="text-slate-500">Renovated:</span>{' '}
                                                        <span className="text-slate-200">{building.last_renovation}</span>
                                                    </div>
                                                )}
                                                {building.facade_condition && (
                                                    <div>
                                                        <span className="text-slate-500">Facade:</span>{' '}
                                                        <span className="text-slate-200">{building.facade_condition}</span>
                                                    </div>
                                                )}
                                                {building.window_type && (
                                                    <div>
                                                        <span className="text-slate-500">Windows:</span>{' '}
                                                        <span className="text-slate-200">{building.window_type}</span>
                                                    </div>
                                                )}
                                                {building.ventilation_type && (
                                                    <div>
                                                        <span className="text-slate-500">Ventilation:</span>{' '}
                                                        <span className="text-slate-200">{building.ventilation_type}</span>
                                                    </div>
                                                )}
                                                {building.heating_type && (
                                                    <div>
                                                        <span className="text-slate-500">Heating:</span>{' '}
                                                        <span className="text-slate-200">{building.heating_type}</span>
                                                    </div>
                                                )}
                                                {building.solar_panels != null && (
                                                    <div>
                                                        <span className="text-slate-500">Solar Panels:</span>{' '}
                                                        <span className={building.solar_panels ? "text-emerald-400" : "text-slate-400"}>
                                                            {building.solar_panels ? "✓ Yes" : "✗ No"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {building.accessibility_features && (
                                                <div className="mt-3 pt-3 border-t border-slate-700">
                                                    <div className="text-xs text-slate-500 mb-1">Accessibility</div>
                                                    <div className="text-xs text-slate-300">{building.accessibility_features}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
