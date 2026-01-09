
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ConflictLog, PeaceMetrics } from '../types';
import { isAdmin } from '../services/admin';
import { ArrowLeft, Loader2, TrendingUp, Users, MessageSquare, ShieldAlert } from 'lucide-react';

interface AdminMetricsProps {
    onBack: () => void;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ onBack }) => {
    const [logs, setLogs] = useState<ConflictLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PeaceMetrics>({
        totalInteractions: 0,
        averageSentiment: 0,
        uniqueUsers: 0,
        weeklyActiveUsers: 0
    });

    useEffect(() => {
        const fetchMetrics = async () => {
            // REDUNDANT SECURITY CHECK: Verify Admin ID before even attempting network request
            const { data: { user } } = await supabase.auth.getUser();
            if (!isAdmin(user?.id)) {
                console.warn("Security Alert: Unauthorized admin access attempt blocked.");
                setLoading(false);
                return;
            }

            // 1. Fetch Logs (Limit 100 for now)
            const { data, error } = await supabase
                .from('conflict_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (data) {
                // @ts-ignore - Supabase types might not be perfectly inferred yet
                setLogs(data);

                // 2. Compute Stats
                const uniqueUsers = new Set(data.map((l: any) => l.user_id)).size;
                const sentimentSum = data.reduce((acc: number, l: any) => acc + (l.sentiment_score || 0), 0);
                const avgSentiment = data.length > 0 ? (sentimentSum / data.length) : 0;
                
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const thisWeekCount = data.filter((l: any) => new Date(l.created_at) > oneWeekAgo).length;

                setStats({
                    totalInteractions: data.length,
                    averageSentiment: parseFloat(avgSentiment.toFixed(2)),
                    uniqueUsers,
                    weeklyActiveUsers: thisWeekCount // Using weekly conflict logs as proxy for now
                });
            } else if (error) {
                console.error("Admin fetch error (likely RLS):", error);
            }
            setLoading(false);
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto animate-fade-in">
            <div className="max-w-7xl mx-auto p-6 md:p-12 font-sans text-slate-900">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} /> Back to App
                </button>

                <h1 className="text-3xl font-serif font-bold mb-2">Conflict Mediator Metrics</h1>
                <p className="text-slate-500 mb-10">Real-time telemetry on conflict resolution usage.</p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <MessageSquare size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Interactions</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.totalInteractions}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <ShieldAlert size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Avg Toxicity</span>
                        </div>
                        <div className={`text-3xl font-bold ${stats.averageSentiment < -0.5 ? 'text-rose-500' : 'text-slate-900'}`}>{stats.averageSentiment}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <Users size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Unique Users</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.uniqueUsers}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <TrendingUp size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">This Week</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.weeklyActiveUsers}</div>
                    </div>
                </div>

                {/* Raw Data Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50">
                        <h2 className="font-bold text-lg">Recent Logs</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Original Input (User)</th>
                                    <th className="px-6 py-4">AI Suggestion</th>
                                    <th className="px-6 py-4">Toxicity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap text-xs">
                                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate font-medium text-rose-900 bg-rose-50/30" title={log.original_input}>
                                            {log.original_input}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={log.ai_suggestion}>
                                            {log.ai_suggestion}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.sentiment_score < -0.5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {log.sentiment_score}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No conflict data logged yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMetrics;
