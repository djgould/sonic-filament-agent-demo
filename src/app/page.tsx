"use client";

import { useEffect, useState } from "react";
import { classifyAgent } from "@/lib/classify";

interface AttributionEvent {
  id: string;
  timestamp: string;
  ip: string | null;
  userAgent: string | null;
  headers: Record<string, string>;
  method: string;
  url: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<AttributionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myIp, setMyIp] = useState<string | null>(null);
  const [filterMyIp, setFilterMyIp] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Fetch user's IP address
    fetch("/api/my-ip")
      .then(res => res.json())
      .then(data => setMyIp(data.ip))
      .catch(console.error);

    // Poll every 5 seconds for demo purposes
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayLogs = filterMyIp ? logs.filter(l => l.ip === myIp) : logs;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl tracking-tight font-bold text-white">Passive Agent Attribution</h1>
            <p className="text-neutral-400 mt-1 text-sm">Real-time tracking of top-of-funnel agent activity.</p>
          </div>
          <div className="flex items-center gap-4">
            {myIp && (
              <div className="flex items-center gap-2 border-r border-neutral-800 pr-4">
                <span className="text-sm text-neutral-400">My IP Only</span>
                <button
                  onClick={() => setFilterMyIp(!filterMyIp)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${filterMyIp ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                >
                  <span className="sr-only">Toggle IP Filter</span>
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${filterMyIp ? 'translate-x-2' : '-translate-x-2'}`} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-emerald-500">Listening</span>
            </div>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md text-sm font-medium transition-colors border border-neutral-700"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Simple Stats Cards */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-neutral-400 text-sm font-medium">Total Captured Events</h3>
            <p className="text-4xl font-semibold text-white mt-2">{displayLogs.length}</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-neutral-400 text-sm font-medium">Unique IPs</h3>
            <p className="text-4xl font-semibold text-white mt-2">
              {new Set(displayLogs.map(l => l.ip).filter(Boolean)).size}
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-neutral-400 text-sm font-medium">Active Tracking Route</h3>
            <p className="text-lg font-mono text-emerald-400 mt-2 truncate bg-neutral-950 p-2 rounded border border-neutral-800">
              GET /api/track
            </p>
          </div>
        </section>

        <section className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent Activity Stream</h2>
            <p className="text-xs text-neutral-500 font-mono">Simulate a request: `curl http://localhost:3000/api/track -A "your-agent"`</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4 border-b border-neutral-800">Time</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Classification</th>
                  <th className="px-6 py-4 border-b border-neutral-800">Source IP</th>
                  <th className="px-6 py-4 border-b border-neutral-800 max-w-sm">Raw User-Agent</th>
                  <th className="px-6 py-4 border-b border-neutral-800 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading && displayLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                      Loading data stream...
                    </td>
                  </tr>
                ) : displayLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <p>No attribution events captured yet.</p>
                        <p className="text-xs">Run <code className="bg-neutral-800 px-1 rounded text-emerald-400">curl http://localhost:3000/api/track</code> in your terminal to see it in action.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayLogs.map((log) => {
                    const classification = classifyAgent(log.userAgent, log.headers);
                    return (
                      <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4 text-neutral-400 font-mono text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit
                              ${classification.type === 'Human' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                              ${classification.type === 'CLI Tool' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : ''}
                              ${classification.type === 'Headless Browser' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : ''}
                              ${classification.type === 'Datacenter Bot' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : ''}
                              ${classification.type === 'Unknown' ? 'bg-neutral-700 border border-neutral-600' : ''}
                            `}>
                              {classification.type}
                            </span>
                            <span className="text-xs text-neutral-500">{classification.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-300 font-mono text-xs">
                          {log.ip || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-neutral-400 max-w-sm truncate text-xs" title={log.userAgent || "None"}>
                          {log.userAgent || <span className="text-neutral-600 italic">None provided</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                            onClick={() => alert(`Full Headers:\n${JSON.stringify(log.headers, null, 2)}`)}
                          >
                            View Headers
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
