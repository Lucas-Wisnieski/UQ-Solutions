// GitHub Proxy API for authenticated requests
// This prevents rate limiting by using a GitHub token stored securely in environment variables

export default async function handler(req, res) {
    // Enable CORS for your Tableau extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET.' });
    }
    
    // Get the GitHub token from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
        console.error('GITHUB_TOKEN environment variable is not set');
        return res.status(500).json({ 
            error: 'Server configuration error: GitHub token not configured' 
        });
    }
    
    // Get the URL to proxy from query parameters
    const { url } = req.query;
    
    // Validate the URL
    if (!url) {
        return res.status(400).json({ 
            error: 'Missing required parameter: url' 
        });
    }
    
    // Security: Only allow GitHub raw content URLs
    const allowedDomains = [
        'https://raw.githubusercontent.com/',
        'https://github.com/',
        'https://api.github.com/'
    ];
    
    const isAllowed = allowedDomains.some(domain => url.startsWith(domain));
    
    if (!isAllowed) {
        return res.status(403).json({ 
            error: 'Forbidden: URL must be from GitHub domains',
            allowedDomains: allowedDomains
        });
    }
    
    try {
        console.log(`Proxying request to: ${url}`);
        
        // Make authenticated request to GitHub
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3.raw',
                'User-Agent': 'UQ-Solutions-Tableau-Extension'
            }
        });
        
        // Check if request was successful
        if (!response.ok) {
            console.error(`GitHub API error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ 
                error: `GitHub API error: ${response.status} ${response.statusText}`,
                details: await response.text()
            });
        }
        
        // Get the content
        const data = await response.text();
        
        // Log rate limit info (helpful for monitoring)
        const rateLimit = response.headers.get('X-RateLimit-Remaining');
        const rateReset = response.headers.get('X-RateLimit-Reset');
        
        if (rateLimit && rateReset) {
            console.log(`Rate limit remaining: ${rateLimit}, resets at: ${new Date(rateReset * 1000).toLocaleString()}`);
        }
        
        // Return the content
        res.status(200).send(data);
        
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch from GitHub',
            message: error.message 
        });
    }
}
