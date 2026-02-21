// A helper utility to classify user agents and flags into our agent attribution funnels
export type AgentClassification = {
    type: "Human" | "Browser Extension" | "Headless Browser" | "Datacenter Bot" | "CLI Tool" | "AI Coding Tool" | "Unknown";
    confidence: "High" | "Medium" | "Low";
    name: string;
};

export type FingerprintRule = {
    name: string;
    type: AgentClassification["type"];
    confidence: AgentClassification["confidence"];
    uaPattern: string;
    headerSignals: string[];
};

// --- Header helpers ---

function getHeader(headers: Record<string, string>, name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === lower) return headers[key];
    }
    return undefined;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
    return getHeader(headers, name) !== undefined;
}

function headerContains(headers: Record<string, string>, name: string, substring: string): boolean {
    const val = getHeader(headers, name);
    return val !== undefined && val.toLowerCase().includes(substring.toLowerCase());
}

function countMatchingHeaders(headers: Record<string, string>, names: string[]): number {
    return names.filter(n => hasHeader(headers, n)).length;
}

// --- Exported fingerprint rules for /classify showcase ---

export const FINGERPRINT_RULES: FingerprintRule[] = [
    {
        name: "Codex (OpenAI)",
        type: "AI Coding Tool",
        confidence: "High",
        uaPattern: "UA contains `ChatGPT-User`",
        headerSignals: ["User-Agent includes ChatGPT-User identifier"],
    },
    {
        name: "Claude Code",
        type: "AI Coding Tool",
        confidence: "High",
        uaPattern: "UA starts with `axios/`",
        headerSignals: [
            "Accept includes `text/markdown`",
            "Accept-Encoding includes `compress`",
            "Missing `accept-language` header",
        ],
    },
    {
        name: "Copilot (VS Code)",
        type: "AI Coding Tool",
        confidence: "High",
        uaPattern: "UA contains `Code/` and `Electron/`",
        headerSignals: [
            "`dnt: 1` header present",
            "`sec-gpc: 1` header present",
        ],
    },
    {
        name: "OpenCode",
        type: "AI Coding Tool",
        confidence: "High",
        uaPattern: "Chrome-like UA",
        headerSignals: [
            "Accept has explicit q-values for text/plain and text/markdown",
            "Missing `sec-fetch-*` headers",
            "Missing `sec-ch-ua` header",
        ],
    },
    {
        name: "Antigravity",
        type: "AI Coding Tool",
        confidence: "Medium",
        uaPattern: "UA is `Go-http-client`",
        headerSignals: ["Minimal header count (typically < 5)"],
    },
    {
        name: "cURL / Wget",
        type: "CLI Tool",
        confidence: "High",
        uaPattern: "UA contains `curl` or `wget`",
        headerSignals: ["Standard CLI tool User-Agent string"],
    },
    {
        name: "Python Script",
        type: "CLI Tool",
        confidence: "High",
        uaPattern: "UA contains `python-requests` or `urllib`",
        headerSignals: ["Standard Python HTTP library User-Agent"],
    },
    {
        name: "API Client (Postman/Insomnia)",
        type: "CLI Tool",
        confidence: "High",
        uaPattern: "UA contains `postman` or `insomnia`",
        headerSignals: ["API client specific User-Agent string"],
    },
    {
        name: "Headless Browser",
        type: "Headless Browser",
        confidence: "High",
        uaPattern: "UA contains `HeadlessChrome`, `Puppeteer`, or `Playwright`",
        headerSignals: ["Headless browser automation identifiers in UA"],
    },
    {
        name: "Generic Bot/Crawler",
        type: "Datacenter Bot",
        confidence: "Medium",
        uaPattern: "UA contains `bot`, `spider`, `scraper`, or `crawler`",
        headerSignals: ["Standard bot identification strings"],
    },
    {
        name: "Real Chrome Browser",
        type: "Human",
        confidence: "High",
        uaPattern: "Standard Chrome UA with `Mozilla/` and `AppleWebKit/`",
        headerSignals: [
            "Full `sec-ch-ua` + `sec-ch-ua-*` header suite",
            "`sec-fetch-site`, `sec-fetch-mode`, `sec-fetch-dest` present",
            "Accept-Encoding includes `zstd`",
        ],
    },
    {
        name: "Standard Browser (fallback)",
        type: "Human",
        confidence: "Low",
        uaPattern: "UA contains `Mozilla` and `AppleWebKit`",
        headerSignals: ["Generic browser UA without modern Chrome signals"],
    },
];

// --- Badge styling helper ---

export function getBadgeClasses(type: AgentClassification["type"]): string {
    switch (type) {
        case "Human":
            return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
        case "AI Coding Tool":
            return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
        case "CLI Tool":
            return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
        case "Headless Browser":
            return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
        case "Datacenter Bot":
            return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
        case "Browser Extension":
            return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        case "Unknown":
        default:
            return "bg-neutral-700 border border-neutral-600";
    }
}

// --- Main classifier ---

export function classifyAgent(userAgent: string | null, requestHeaders: Record<string, string>): AgentClassification {
    if (!userAgent) {
        return { type: "Unknown", confidence: "Low", name: "No User-Agent" };
    }

    const uaLower = userAgent.toLowerCase();

    // --- Priority 1: Codex (OpenAI) ---
    if (uaLower.includes("chatgpt-user")) {
        return { type: "AI Coding Tool", confidence: "High", name: "Codex (OpenAI)" };
    }

    // --- Priority 2: Claude Code ---
    // axios/ UA + markdown in Accept + compress in Accept-Encoding + no accept-language
    if (uaLower.startsWith("axios/")) {
        const hasMarkdownAccept = headerContains(requestHeaders, "accept", "text/markdown");
        const hasCompress = headerContains(requestHeaders, "accept-encoding", "compress");
        const noAcceptLang = !hasHeader(requestHeaders, "accept-language");

        if (hasMarkdownAccept && hasCompress && noAcceptLang) {
            return { type: "AI Coding Tool", confidence: "High", name: "Claude Code" };
        }
        // Even without all signals, axios/ is unusual enough
        return { type: "AI Coding Tool", confidence: "Medium", name: "Claude Code (likely)" };
    }

    // --- Priority 3: Copilot (VS Code Electron) ---
    if (uaLower.includes("code/") && uaLower.includes("electron/")) {
        const hasDnt = getHeader(requestHeaders, "dnt") === "1";
        const hasSecGpc = getHeader(requestHeaders, "sec-gpc") === "1";
        if (hasDnt && hasSecGpc) {
            return { type: "AI Coding Tool", confidence: "High", name: "Copilot (VS Code)" };
        }
        return { type: "AI Coding Tool", confidence: "Medium", name: "VS Code Extension (likely Copilot)" };
    }

    // --- Priority 4: OpenCode ---
    // Chrome-like UA but Accept has explicit q-values for text/plain and text/markdown, missing sec-fetch-* and sec-ch-ua
    if (uaLower.includes("chrome/") && uaLower.includes("mozilla/")) {
        const accept = getHeader(requestHeaders, "accept") || "";
        const hasQValues = /text\/plain/.test(accept) && /text\/markdown/.test(accept) && /q=/.test(accept);
        const missingSecFetch = !hasHeader(requestHeaders, "sec-fetch-site") && !hasHeader(requestHeaders, "sec-fetch-mode");
        const missingSecChua = !hasHeader(requestHeaders, "sec-ch-ua");

        if (hasQValues && missingSecFetch && missingSecChua) {
            return { type: "AI Coding Tool", confidence: "High", name: "OpenCode" };
        }
    }

    // --- Priority 5: Antigravity (Go-http-client) ---
    if (uaLower.includes("go-http-client")) {
        const headerCount = Object.keys(requestHeaders).length;
        return {
            type: "AI Coding Tool",
            confidence: headerCount < 5 ? "Medium" : "Low",
            name: "Antigravity (Go HTTP)",
        };
    }

    // --- Priority 6: CLI tools ---
    if (uaLower.includes("curl") || uaLower.includes("wget")) {
        return { type: "CLI Tool", confidence: "High", name: "cURL/Wget" };
    }
    if (uaLower.includes("python-requests") || uaLower.includes("urllib")) {
        return { type: "CLI Tool", confidence: "High", name: "Python Script" };
    }
    if (uaLower.includes("postman") || uaLower.includes("insomnia")) {
        return { type: "CLI Tool", confidence: "High", name: "API Client" };
    }

    // --- Priority 7: Headless browsers ---
    if (uaLower.includes("headlesschrome") || uaLower.includes("puppeteer") || uaLower.includes("playwright")) {
        return { type: "Headless Browser", confidence: "High", name: "Automated Browser (Chrome/Playwright)" };
    }

    // --- Priority 8: Generic bots ---
    if (uaLower.includes("bot") || uaLower.includes("spider") || uaLower.includes("scraper") || uaLower.includes("crawler")) {
        return { type: "Datacenter Bot", confidence: "Medium", name: "Generic Bot/Crawler" };
    }

    // --- Priority 9: Real Chrome browser (full sec-ch-ua + sec-fetch-* suite) ---
    if (uaLower.includes("chrome/") && uaLower.includes("mozilla/") && uaLower.includes("applewebkit/")) {
        const secHeaders = ["sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-dest"];
        const matchCount = countMatchingHeaders(requestHeaders, secHeaders);
        const hasZstd = headerContains(requestHeaders, "accept-encoding", "zstd");

        if (matchCount >= 5 && hasZstd) {
            return { type: "Human", confidence: "High", name: "Chrome Browser" };
        }
        if (matchCount >= 4) {
            return { type: "Human", confidence: "Medium", name: "Chrome Browser (likely)" };
        }
    }

    // --- Priority 10: Standard browser fallback ---
    if (uaLower.includes("mozilla") && uaLower.includes("applewebkit")) {
        return { type: "Human", confidence: "Low", name: "Standard Browser" };
    }

    return { type: "Unknown", confidence: "Low", name: "Unclassified Client" };
}
