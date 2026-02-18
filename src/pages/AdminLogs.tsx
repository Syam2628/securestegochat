import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface SecurityLog {
    id: number;
    detection_type: string;
    extracted_payload: string | null;
    classification: string | null;
    confidence: number;
    action_taken: string;
    created_at: string;
    source_id: string; // Filename
    file_hash: string | null;
    bit_depth: string | null;
    status: string; // 'clean', 'suspicious', 'pending', 'warning'
}

export function AdminLogs() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    useEffect(() => {
        if (token) {
            fetchLogs();
        }
    }, [token]);

    const fetchLogs = async () => {
        try {
            const response = await axios.get('https://securestegochat.onrender.com/api/admin/security-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'clean': return 'bg-primary/10 text-primary';
            case 'suspicious': return 'bg-red-100 dark:bg-red-500/20 text-red-600';
            case 'warning': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getRowClass = (status: string) => {
        switch (status) {
            case 'suspicious': return 'hover:bg-red-500/5 border-l-4 border-red-500/60 bg-red-500/5';
            case 'warning': return 'hover:bg-amber-500/5 border-l-4 border-amber-500/60';
            default: return 'hover:bg-primary/5';
        }
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#dbe6e0] dark:border-white/10 bg-white dark:bg-background-dark px-6 md:px-10 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">security</span>
                        </div>
                        <h2 className="text-[#111814] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">SecureStegano Admin</h2>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <a className="text-[#111814] dark:text-white/80 text-sm font-medium hover:text-primary transition-colors" href="/chat">Chat</a>
                        <a className="text-primary text-sm font-bold border-b-2 border-primary pb-1" href="#">Security Logs</a>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 border-r border-[#dbe6e0] dark:border-white/10 bg-white dark:bg-background-dark p-4">
                    <div className="flex flex-col gap-6">
                        <div className="flex gap-3 items-center px-2">
                            <div className="bg-primary/20 text-primary rounded-lg p-2">
                                <span className="material-symbols-outlined">admin_panel_settings</span>
                            </div>
                            <div>
                                <h1 className="text-[#111814] dark:text-white text-sm font-bold">Security Panel</h1>
                                <p className="text-[#618972] text-xs font-normal">v2.1.0-stable</p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-1">
                            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#f0f4f2] dark:bg-primary/10 text-primary" href="#">
                                <span className="material-symbols-outlined">list_alt</span>
                                <p className="text-sm font-bold">Activity Logs</p>
                            </a>
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light dark:bg-background-dark/50">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-[#111814] dark:text-white text-2xl font-bold tracking-tight">Security Log & Alerts</h2>
                            <div className="flex gap-2">
                                <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold">
                                    <span className="material-symbols-outlined text-lg">refresh</span>
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 border border-[#dbe6e0] dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f0f4f2] dark:bg-white/5 text-[#618972] dark:text-white/60 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Event</th>
                                        <th className="px-6 py-4">Source ID</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#dbe6e0] dark:divide-white/10">
                                    {logs.map((log) => (
                                        <>
                                            <tr
                                                key={log.id}
                                                onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                                className={`cursor-pointer transition-colors focus:outline-none ${getRowClass(log.status)}`}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {log.status === 'suspicious' ? (
                                                            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                                                        ) : log.status === 'warning' ? (
                                                            <span className="material-symbols-outlined text-amber-500 text-lg">info</span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                                                        )}
                                                        <span className="text-sm font-semibold">{log.detection_type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-[#618972] dark:text-white/60">
                                                    {log.source_id}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(log.status)}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            {expandedRow === log.id && (
                                                <tr className="bg-gray-50 dark:bg-black/20">
                                                    <td colSpan={4} className="px-6 py-4">
                                                        <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-[#dbe6e0] dark:border-white/10">
                                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-[10px] text-[#618972] uppercase font-bold">File Hash</p>
                                                                    <p className="text-sm font-mono">{log.file_hash || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-[#618972] uppercase font-bold">Bit Depth</p>
                                                                    <p className="text-sm font-mono">{log.bit_depth || 'N/A'}</p>
                                                                </div>
                                                            </div>

                                                            {log.extracted_payload && (
                                                                <>
                                                                    <h4 className="text-[10px] uppercase font-bold text-[#618972] mb-2 flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-xs">visibility</span> Extracted Payload ({log.classification})
                                                                    </h4>
                                                                    <div className="font-mono text-sm p-3 bg-gray-100 dark:bg-black/40 rounded border border-[#dbe6e0] dark:border-white/10 text-[#111814] dark:text-primary overflow-x-auto whitespace-pre-wrap">
                                                                        {log.extracted_payload}
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-gray-500">
                                                                        Confidence: {log.confidence}%
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
