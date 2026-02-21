// Script to simulate various agent interactions for testing our passive attribution

const trackUrl = "http://localhost:3000/api/track";

const testProfiles = [
    {
        name: "Standard Human",
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
    },
    {
        name: "cURL Script",
        headers: {
            "User-Agent": "curl/8.4.0",
        }
    },
    {
        name: "Python Requests (Default)",
        headers: {
            "User-Agent": "python-requests/2.31.0",
        }
    },
    {
        name: "Headless Playwright",
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
        }
    },
    {
        name: "Generic Web Scraper",
        headers: {
            "User-Agent": "ScraperBot/1.0",
        }
    }
];

async function runTests() {
    console.log("Starting agent simulation...");

    for (const profile of testProfiles) {
        try {
            console.log(`Sending ping as: ${profile.name}`);
            const res = await fetch(trackUrl, {
                headers: profile.headers
            });

            if (!res.ok) throw new Error(`Status ${res.status}`);
            console.log(`✅ Success logging ${profile.name}\n`);

        } catch (err: any) {
            console.error(`❌ Failed logging ${profile.name}:`, err.message, "\n");
        }

        // Wait a brief moment between requests
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("Simulations complete! Check the dashboard.");
}

runTests();
