import {
    getEvents,
    getEventTypeCounts,
    getEventsByYear,
    getEventsWithCost,
    getEventStats
} from "@/lib/events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, DollarSign, Building2, ArrowUp, Wrench, RefreshCw, Users, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Event type icons and colors
const EVENT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
    'fee_increase': { icon: ArrowUp, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    'major_maintenance': { icon: Wrench, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    'renovation': { icon: Building2, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    'refinancing': { icon: RefreshCw, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    'new_loan': { icon: DollarSign, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    'contract_change': { icon: FileText, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
    'board_change': { icon: Users, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    'other': { icon: Calendar, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

function formatCost(cost: number | null): string {
    if (!cost) return '';
    if (cost >= 1000000) return `${(cost / 1000000).toFixed(1)}M kr`;
    if (cost >= 1000) return `${(cost / 1000).toFixed(0)}k kr`;
    return `${cost} kr`;
}

function formatEventType(type: string): string {
    const labels: Record<string, string> = {
        'fee_increase': 'Avgiftshöjning',
        'major_maintenance': 'Större underhåll',
        'renovation': 'Renovering',
        'refinancing': 'Refinansiering',
        'new_loan': 'Nytt lån',
        'contract_change': 'Avtalsbyte',
        'board_change': 'Styrelseändring',
        'other': 'Övrigt',
    };
    return labels[type] || type;
}

interface EventsPageProps {
    searchParams: { type?: string };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
    const selectedType = searchParams.type || 'all';

    const [events, typeCounts, yearData, topCostEvents, stats] = await Promise.all([
        getEvents({
            eventType: selectedType !== 'all' ? selectedType : undefined,
            limit: 100
        }),
        getEventTypeCounts(),
        getEventsByYear(),
        getEventsWithCost(10),
        getEventStats()
    ]);

    // Group events by year for timeline
    const eventsByYear = events.reduce((acc, event) => {
        const year = event.year || 'Okänt år';
        if (!acc[year]) acc[year] = [];
        acc[year].push(event);
        return acc;
    }, {} as Record<string | number, typeof events>);

    const sortedYears = Object.keys(eventsByYear)
        .sort((a, b) => {
            if (a === 'Okänt år') return 1;
            if (b === 'Okänt år') return -1;
            return parseInt(b as string) - parseInt(a as string);
        });

    return (
        <div className="space-y-6 p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-indigo-400" />
                    Händelser & Tidslinje
                </h1>
                <p className="text-slate-400 mt-2">
                    {stats.total_events} händelser från {stats.brfs_with_events} BRFs • {stats.earliest_year}–{stats.latest_year}
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Totalt händelser
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-400">{stats.total_events}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            BRFs med händelser
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-400">{stats.brfs_with_events}</div>
                        <div className="text-xs text-slate-500">{Math.round((stats.brfs_with_events / 113) * 100)}% täckning</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <ArrowUp className="w-4 h-4" />
                            Avgiftshöjningar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-400">
                            {typeCounts.find(t => t.event_type === 'fee_increase')?.count || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Total kostnad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-400">
                            {stats.total_cost ? formatCost(parseInt(stats.total_cost)) : '–'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Event Type Filters */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle>Filtrera efter händelsetyp</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/events?type=all">
                            <Badge
                                className={`px-4 py-2 cursor-pointer transition-all ${selectedType === 'all'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                Alla ({stats.total_events})
                            </Badge>
                        </Link>
                        {typeCounts.map(typeInfo => {
                            const config = EVENT_CONFIG[typeInfo.event_type] || EVENT_CONFIG.other;
                            const Icon = config.icon;
                            const isSelected = selectedType === typeInfo.event_type;
                            return (
                                <Link key={typeInfo.event_type} href={`/events?type=${typeInfo.event_type}`}>
                                    <Badge
                                        className={`px-4 py-2 cursor-pointer transition-all flex items-center gap-2 ${isSelected
                                                ? `${config.bgColor} ${config.color} border border-current`
                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {formatEventType(typeInfo.event_type)} ({typeInfo.count})
                                    </Badge>
                                </Link>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Timeline */}
                <div className="lg:col-span-2">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                Tidslinje
                            </CardTitle>
                            <CardDescription>
                                {selectedType === 'all'
                                    ? 'Alla händelser'
                                    : formatEventType(selectedType)
                                } • {events.length} händelser
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {sortedYears.slice(0, 15).map(year => (
                                    <div key={year}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="text-xl font-bold text-slate-200">{year}</div>
                                            <div className="flex-1 h-px bg-slate-700" />
                                            <Badge variant="outline" className="text-slate-400">
                                                {eventsByYear[year].length} händelser
                                            </Badge>
                                        </div>
                                        <div className="space-y-3 pl-4 border-l-2 border-slate-700">
                                            {eventsByYear[year].slice(0, 10).map((event, idx) => {
                                                const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.other;
                                                const Icon = config.icon;
                                                return (
                                                    <div key={idx} className="relative pl-6">
                                                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                                            <Icon className={`w-2.5 h-2.5 ${config.color}`} />
                                                        </div>
                                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <Link href={`/brf/${event.zelda_id}`} className="text-sm font-medium text-sky-400 hover:text-sky-300">
                                                                        {event.brf_name}
                                                                    </Link>
                                                                    <p className="text-sm text-slate-300 mt-1">{event.description}</p>
                                                                </div>
                                                                {event.cost && (
                                                                    <Badge className="bg-emerald-500/20 text-emerald-400 whitespace-nowrap">
                                                                        {formatCost(event.cost)}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Badge className={`${config.bgColor} ${config.color} text-xs`}>
                                                                    {formatEventType(event.event_type)}
                                                                </Badge>
                                                                {event.district && (
                                                                    <span className="text-xs text-slate-500">{event.district}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {eventsByYear[year].length > 10 && (
                                                <div className="pl-6 text-sm text-slate-500">
                                                    +{eventsByYear[year].length - 10} fler händelser
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Top Costs */}
                <div className="space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                                Största investeringar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topCostEvents.map((event, idx) => {
                                    const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.other;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                            <div className="min-w-0">
                                                <Link href={`/brf/${event.zelda_id}`} className="text-sm text-sky-400 hover:text-sky-300 truncate block">
                                                    {event.brf_name}
                                                </Link>
                                                <div className="text-xs text-slate-500 truncate">{event.description?.slice(0, 40)}...</div>
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="font-mono text-emerald-400">{formatCost(event.cost)}</div>
                                                <div className="text-xs text-slate-500">{event.year}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Event Type Distribution */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle>Händelsetyper</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {typeCounts.map(typeInfo => {
                                    const config = EVENT_CONFIG[typeInfo.event_type] || EVENT_CONFIG.other;
                                    const Icon = config.icon;
                                    const percentage = (typeInfo.count / parseInt(stats.total_events)) * 100;
                                    return (
                                        <div key={typeInfo.event_type} className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${config.color}`} />
                                            <div className="flex-1">
                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${config.bgColor.replace('/20', '')} rounded-full`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 w-8 text-right">{typeInfo.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
