// A helper utility to classify user agents and flags into our agent attribution funnels
export type AgentClassification = {
    type: "Human" | "Browser Extension" | "Headless Browser" | "Datacenter Bot" | "CLI Tool" | "Unknown";
    confidence: "High" | "Medium" | "Low";
    name: string;
};

export function classifyAgent(userAgent: string | null, requestHeaders: Record<string, string>): AgentClassification {
    if (!userAgent) {
        return { type: "Unknown", confidence: "Low", name: "No User-Agent" };
    }

    const uaLower = userAgent.toLowerCase();

    // 1. Explicit Agent/CLI Tools (Highest confidence)
    if (uaLower.includes("curl") || uaLower.includes("wget")) {
        return { type: "CLI Tool", confidence: "High", name: "cURL/Wget" };
    }
    if (uaLower.includes("python-requests") || uaLower.includes("urllib")) {
        return { type: "CLI Tool", confidence: "High", name: "Python Script" };
    }
    if (uaLower.includes("postman") || uaLower.includes("insomnia")) {
        return { type: "CLI Tool", confidence: "High", name: "API Client" };
    }

    // 2. Headless Browsers (Often used by browser-based agents like sweep or simple scrapers)
    if (uaLower.includes("headlesschrome") || uaLower.includes("puppeteer") || uaLower.includes("playwright")) {
        return { type: "Headless Browser", confidence: "High", name: "Automated Browser (Chrome/Playwright)" };
    }

    // Check for specialized agent HTTP clients
    if (uaLower.includes("go-http-client")) {
        return { type: "Datacenter Bot", confidence: "High", name: "Golang HTTP Client (e.g., Antigravity Native Webfetch)" };
    }

    // Check generic 'bot' strings
    if (uaLower.includes("bot") || uaLower.includes("spider") || uaLower.includes("scraper") || uaLower.includes("crawler")) {
        return { type: "Datacenter Bot", confidence: "Medium", name: "Generic Bot/Crawler" };
    }

    // 3. Browser Extensions / IDE Injections (Tricky, sometimes rely on custom headers)
    // For standard humans
    if (uaLower.includes("mozilla") && uaLower.includes("applewebkit") && uaLower.includes("chrome")) {
        // If it's a very standard browser, assume human for now
        return { type: "Human", confidence: "Low", name: "Standard Browser" };
    }

    return { type: "Unknown", confidence: "Low", name: "Unclassified Client" };
}
