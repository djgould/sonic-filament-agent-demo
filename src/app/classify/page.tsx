import { headers } from "next/headers";
import Link from "next/link";
import { classifyAgent, getBadgeClasses, FINGERPRINT_RULES } from "@/lib/classify";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Fingerprinting - Passive Agent Attribution",
  description: "See how we classify HTTP clients using header-based fingerprinting",
};

// Vercel/Next.js infrastructure headers to filter out of display
const INFRA_HEADERS = new Set([
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "x-real-ip",
  "x-vercel-id",
  "x-vercel-ip-city",
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "x-vercel-ip-latitude",
  "x-vercel-ip-longitude",
  "x-vercel-ip-timezone",
  "x-vercel-forwarded-for",
  "x-vercel-deployment-url",
  "x-vercel-proxy-signature",
  "x-vercel-proxy-signature-ts",
  "x-middleware-subrequest",
  "x-invoke-path",
  "x-invoke-query",
]);

// Headers that are strong classification signals
const SIGNAL_HEADERS = new Set([
  "user-agent",
  "accept",
  "accept-encoding",
  "accept-language",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
  "sec-fetch-user",
  "sec-gpc",
  "dnt",
]);

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color =
    confidence === "High"
      ? "bg-emerald-400"
      : confidence === "Medium"
        ? "bg-amber-400"
        : "bg-neutral-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default async function ClassifyPage() {
  const headerStore = await headers();
  const requestHeaders: Record<string, string> = {};
  headerStore.forEach((value, key) => {
    requestHeaders[key] = value;
  });

  const userAgent = requestHeaders["user-agent"] || null;
  const classification = classifyAgent(userAgent, requestHeaders);

  // Split headers into signal vs other (filtering out infra)
  const visibleHeaders = Object.entries(requestHeaders).filter(
    ([key]) => !INFRA_HEADERS.has(key.toLowerCase())
  );
  const signalHeaders = visibleHeaders.filter(([key]) =>
    SIGNAL_HEADERS.has(key.toLowerCase())
  );
  const otherHeaders = visibleHeaders.filter(
    ([key]) => !SIGNAL_HEADERS.has(key.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-neutral-700">/</span>
            <span className="text-sm text-neutral-300">Classify</span>
          </div>
          <h1 className="text-4xl tracking-tight font-bold text-white">
            Agent Fingerprinting
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">
            We classify HTTP clients using a tiered system that combines
            User-Agent analysis with header-based fingerprinting. Headers like{" "}
            <code className="text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded text-sm">
              sec-fetch-*
            </code>
            ,{" "}
            <code className="text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded text-sm">
              accept-encoding
            </code>
            , and{" "}
            <code className="text-emerald-400 bg-neutral-900 px-1.5 py-0.5 rounded text-sm">
              sec-ch-ua
            </code>{" "}
            reveal far more about a client than the User-Agent string alone.
          </p>
        </header>

        {/* Your Classification */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Your Classification
          </h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getBadgeClasses(classification.type)}`}
              >
                {classification.type}
              </span>
              <span className="flex items-center gap-2 text-sm text-neutral-400">
                <ConfidenceDot confidence={classification.confidence} />
                {classification.confidence} confidence
              </span>
            </div>
            <div className="text-lg text-white font-medium">
              {classification.name}
            </div>
            <div className="text-sm text-neutral-500 font-mono bg-neutral-950 p-3 rounded border border-neutral-800 break-all">
              {userAgent || <span className="italic">No User-Agent sent</span>}
            </div>
          </div>
        </section>

        {/* Your Signals */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Your Signals</h2>
          <p className="text-sm text-neutral-400">
            These are the headers your client sent. Signal headers used for
            classification are highlighted.
          </p>

          {signalHeaders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-emerald-500 font-medium">
                Classification Signals
              </h3>
              <div className="bg-neutral-900 border border-emerald-500/20 rounded-xl overflow-hidden divide-y divide-neutral-800">
                {signalHeaders.map(([key, value]) => (
                  <div key={key} className="px-4 py-3 flex gap-4">
                    <span className="text-emerald-400 font-mono text-sm shrink-0 w-48 truncate">
                      {key}
                    </span>
                    <span className="text-neutral-300 text-sm font-mono break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherHeaders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                Other Headers
              </h3>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800">
                {otherHeaders.map(([key, value]) => (
                  <div key={key} className="px-4 py-3 flex gap-4">
                    <span className="text-neutral-500 font-mono text-sm shrink-0 w-48 truncate">
                      {key}
                    </span>
                    <span className="text-neutral-400 text-sm font-mono break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Fingerprint Rules Reference */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Fingerprint Rules
          </h2>
          <p className="text-sm text-neutral-400">
            Agents are classified in priority order. The first matching rule
            wins.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FINGERPRINT_RULES.map((rule, i) => (
              <div
                key={rule.name}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-600 font-mono">
                      #{i + 1}
                    </span>
                    <span className="text-white font-medium">{rule.name}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeClasses(rule.type)}`}
                  >
                    {rule.type}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 font-mono bg-neutral-950 px-3 py-2 rounded">
                  {rule.uaPattern}
                </div>
                <ul className="space-y-1">
                  {rule.headerSignals.map((signal) => (
                    <li
                      key={signal}
                      className="text-xs text-neutral-400 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                      {signal}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5">
                  <ConfidenceDot confidence={rule.confidence} />
                  <span className="text-xs text-neutral-500">
                    {rule.confidence} confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Methodology</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 text-sm text-neutral-400 leading-relaxed">
            <p>
              Traditional bot detection relies almost entirely on the{" "}
              <code className="text-emerald-400 bg-neutral-950 px-1 py-0.5 rounded">
                User-Agent
              </code>{" "}
              string, which is trivially spoofable. Our system takes a different
              approach: <strong className="text-neutral-200">header fingerprinting</strong>.
            </p>
            <p>
              Every HTTP client has a distinct &ldquo;handshake&rdquo; &mdash; the combination of
              headers it sends, their ordering, and their values. Real browsers
              include modern security headers like{" "}
              <code className="text-emerald-400 bg-neutral-950 px-1 py-0.5 rounded">
                sec-ch-ua
              </code>{" "}
              and{" "}
              <code className="text-emerald-400 bg-neutral-950 px-1 py-0.5 rounded">
                sec-fetch-*
              </code>
              . AI coding tools like Claude Code, Codex, and Copilot each have
              unique header patterns that no amount of UA spoofing can hide.
            </p>
            <p>
              The classifier uses a <strong className="text-neutral-200">tiered priority system</strong>.
              Highly specific rules (like Codex&apos;s unique UA) are checked first,
              followed by multi-signal header patterns, then generic UA matches.
              Confidence levels reflect how many independent signals confirmed
              the classification.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-800 pt-8 space-y-4">
          <p className="text-sm text-neutral-400">
            Try hitting the tracking endpoint yourself:
          </p>
          <pre className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm font-mono text-emerald-400 overflow-x-auto">
            curl https://sonic-filament.vercel.app/api/track -v
          </pre>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
