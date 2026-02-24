export default async function handler(req, res) {
  // allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, query, songId } = req.query;
  const token = process.env.GENIUS_ACCESS_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Genius token not configured.' });
  }

  try {
    // Search songs
    if (action === 'search') {
      if (!query) return res.status(400).json({ error: 'Missing query.' });

      const url = `https://api.genius.com/search?q=${encodeURIComponent(query)}&per_page=10`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      const hits = data.response?.hits || [];

      const results = hits.map(hit => ({
        id:        hit.result.id,
        title:     hit.result.title,
        artist:    hit.result.primary_artist.name,
        thumbnail: hit.result.song_art_image_thumbnail_url,
        url:       hit.result.url
      }));

      return res.status(200).json({ results });
    }

    // Get lyrics page URL by song ID
    if (action === 'song') {
      if (!songId) return res.status(400).json({ error: 'Missing songId.' });

      const url = `https://api.genius.com/songs/${songId}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      const song = data.response?.song;

      if (!song) return res.status(404).json({ error: 'Song not found.' });

      return res.status(200).json({
        id:        song.id,
        title:     song.title,
        artist:    song.primary_artist.name,
        thumbnail: song.song_art_image_url,
        lyricsUrl: song.url
      });
    }

    return res.status(400).json({ error: 'Invalid action.' });

  } catch (err) {
    console.error('Genius API error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
