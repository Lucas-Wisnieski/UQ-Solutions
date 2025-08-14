export default async function handler(req, res) {
  // CORS headers for extension access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { action, context, program, institution } = req.body;
    
    console.log('🚀 AI Summary trigger:', { action, program, institution });
    
    // Call your existing Gemini API
    const summaryResponse = await fetch('https://uq-solutions-gemini.vercel.app/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: `Generate summary for ${program} at ${institution}` 
      })
    });
    
    const summaryData = await summaryResponse.json();
    
    return res.status(200).json({
      success: true,
      message: 'AI Summary generated',
      summary: summaryData.content
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
