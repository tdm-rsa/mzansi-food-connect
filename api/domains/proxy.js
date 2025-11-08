// Vercel Serverless Function to proxy Domains.co.za API requests
// Handles: /api/domains/proxy?path=domain/check&sld=...&tld=...&token=...

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the API path from query params
    const { path: apiPath, ...queryParams } = req.query;

    if (!apiPath) {
      return res.status(400).json({
        error: 'Missing path parameter',
        message: 'Please provide the API path as a query parameter'
      });
    }

    // Remove 'path' from query params and build query string
    const queryString = new URLSearchParams(queryParams).toString();

    // Build Domains.co.za API URL
    const domainsUrl = `https://api.domains.co.za/api/${apiPath}${queryString ? `?${queryString}` : ''}`;

    console.log('Proxying request:', {
      method: req.method,
      url: domainsUrl,
      hasAuth: !!req.headers.authorization
    });

    // Prepare request options
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization header if present
    if (req.headers.authorization) {
      options.headers['Authorization'] = req.headers.authorization;
    }

    // Add body for POST/PUT requests
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
      options.body = JSON.stringify(req.body);
    }

    // Forward the request to Domains.co.za API
    const response = await fetch(domainsUrl, options);
    const data = await response.json();

    console.log('Domains.co.za response:', {
      status: response.status,
      hasData: !!data
    });

    // Return the response
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Domain API proxy error:', error);
    return res.status(500).json({
      error: 'Domain API request failed',
      message: error.message
    });
  }
}
