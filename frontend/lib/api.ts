export async function fetchTrends(query = '') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const url = query ? `${apiUrl}/api/trends?q=${encodeURIComponent(query)}` : `${apiUrl}/api/trends`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch trends');
  }
  return res.json();
}

export async function generateStrategy(topic: string, platform: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const res = await fetch(`${apiUrl}/api/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, platform })
  });
  
  if (!res.ok) {
    throw new Error('Failed to generate strategy');
  }

  return res.json();
}
