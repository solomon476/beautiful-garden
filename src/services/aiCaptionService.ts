/**
 * AI Romantic Scene & Caption Intelligence Service
 * Generates poetic titles and heartfelt comments for memories
 * when the poster leaves them blank, ensuring raw phone numbers
 * (e.g. "107752", "65392", "IMG_...") are never used.
 */

interface RomanticSuggestion {
  title: string;
  caption: string;
}

const ROMANTIC_TITLES = [
  'A Stolen Sweet Moment ♡',
  'Warmth & Soft Light',
  'Unforgettable Smiles',
  'A Beautiful Day with You',
  'Soft Laughter & Peace',
  'In Love with This View',
  'Cherished Golden Hour',
  'Pure Joy in Bloom',
  'A Memory to Keep Forever',
  'Your Smile Lit Up the Day',
  'Our Favorite Kind of Afternoon',
  'Timeless Keepsake ♡',
  'Happiness Looks Like This',
  'Every Little Detail ♡',
  'Quiet Wonder',
];

const ROMANTIC_CAPTIONS = [
  'A quiet moment that made time stop just for a little while.',
  'Every second spent laughing with you is my favorite place to be.',
  'Sunlight, peace, and the gentle feeling that everything is right.',
  'Holding onto this beautiful memory and keeping it close to my heart.',
  'A little glimpse into our favorite kind of days together.',
  'No filters needed when happiness looks this genuine.',
  'The kind of memory you look back on and instantly smile.',
  'One of those days I wish we could pause and stay in forever.',
  'Captured softly in our garden—another reason why I adore you.',
  'Just you, me, and a moment that belongs only to us.',
];

/**
 * Checks if a string looks like a raw machine filename or number
 * (e.g. "107752", "65392", "IMG_20261024", "WhatsApp Image...")
 */
export const isRawMachineName = (name: string): boolean => {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  // Pure numbers: "107752", "65392"
  if (/^\d+$/.test(trimmed)) return true;
  // Camera file formats: IMG_..., PXL_..., DSC_..., VID_..., WhatsApp Image...
  if (/^(img|pxl|dsc|vid|whatsapp[ _-]?image|screenshot|photo|video)[_-]?\d*/i.test(trimmed)) return true;
  // Generic "Treasured Keepsake" or "Special Day"
  if (/^(treasured keepsake|special day|pinned)/i.test(trimmed)) return true;
  return false;
};

/**
 * Analyzes average brightness and warmth from an image data URL via canvas
 */
const analyzeImageTones = async (dataUrl: string): Promise<'warm' | 'twilight' | 'bright' | 'cozy'> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !dataUrl.startsWith('data:image')) {
      return resolve('warm');
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('warm');
        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;
        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        const totalPixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          rTotal += data[i];
          gTotal += data[i + 1];
          bTotal += data[i + 2];
        }
        const rAvg = rTotal / totalPixels;
        const gAvg = gTotal / totalPixels;
        const bAvg = bTotal / totalPixels;
        const brightness = (rAvg + gAvg + bAvg) / 3;

        if (brightness < 60) return resolve('twilight');
        if (rAvg > bAvg + 25) return resolve('warm');
        if (brightness > 165) return resolve('bright');
        return resolve('cozy');
      } catch {
        resolve('warm');
      }
    };
    img.onerror = () => resolve('warm');
    img.src = dataUrl;
  });
};

export const generateRomanticMetadata = async (
  imageDataUrl?: string,
  existingName?: string
): Promise<RomanticSuggestion> => {
  // 1. Try Gemini Vision if API key is present in environment
  const geminiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY;
  if (geminiKey && imageDataUrl && imageDataUrl.startsWith('data:image')) {
    try {
      const base64Data = imageDataUrl.split(',')[1];
      const mimeType = imageDataUrl.split(';')[0].replace('data:', '') || 'image/jpeg';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'You are a warm, deeply romantic couple\'s memory journal AI. Look at this picture and output a JSON object with: 1) "title": a sweet romantic title (under 5 words, e.g. "Sunset By the Lake ♡"), 2) "caption": one tender poetic sentence describing the love, warmth, or joy in this moment. Output JSON only, no markdown.',
                  },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );
      if (response.ok) {
        const json = await response.json();
        const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const cleanJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.title && parsed.caption) {
            return {
              title: parsed.title.trim(),
              caption: parsed.caption.trim(),
            };
          }
        }
      }
    } catch (e) {
      console.warn('[AI Caption] Gemini Vision unavailable, using romantic intelligence engine:', e);
    }
  }

  // 2. Client-side Romantic Intelligence Engine
  let tone: 'warm' | 'twilight' | 'bright' | 'cozy' = 'warm';
  if (imageDataUrl) {
    try {
      tone = await analyzeImageTones(imageDataUrl);
    } catch {}
  }

  const hour = new Date().getHours();
  const timePeriod =
    hour >= 5 && hour < 12
      ? 'morning'
      : hour >= 12 && hour < 17
      ? 'afternoon'
      : hour >= 17 && hour < 20
      ? 'sunset'
      : 'evening';

  let titleOptions = ROMANTIC_TITLES;
  let captionOptions = ROMANTIC_CAPTIONS;

  if (tone === 'twilight' || timePeriod === 'evening') {
    titleOptions = [
      'Evening Stroll & Late Talks ♡',
      'Dreamy Night Whispers',
      'Under the Soft City Lights',
      'A Quiet Stolen Moment',
      'Night Vibes & Warm Hearts',
    ];
    captionOptions = [
      'The quiet beauty of late night walks and talking about everything with you.',
      'Under the calm night sky, every quiet moment feels completely peaceful.',
      'City lights glowing in the dark, but nothing shines brighter than you.',
    ];
  } else if (tone === 'warm' || timePeriod === 'sunset') {
    titleOptions = [
      'Golden Hour Glow ♡',
      'Warmth & Sweet Smiles',
      'Sun-Kissed Memories',
      'A Stolen Afternoon ♡',
      'That Gentle Golden Light',
    ];
    captionOptions = [
      'That magical golden glow where everything feels tender, warm, and timeless.',
      'Golden hour has nothing on the warmth your smile brings into my life.',
      'Soft sunshine and your laughter—easily my favorite view in the world.',
    ];
  } else if (tone === 'bright' || timePeriod === 'morning') {
    titleOptions = [
      'Bright Skies & Good Energy ♡',
      'Pure Joy & Sunshine',
      'Effortless Laughter',
      'A Beautiful Day Out',
      'Lighthearted & Free ♡',
    ];
    captionOptions = [
      'Clear skies and effortless energy—you always make the world brighter.',
      'No filters needed when happiness looks this genuine and contagious.',
      'Capturing this feeling of pure joy and saving it forever.',
    ];
  }

  // Pick deterministic or random option based on existing seed
  const hash = (existingName || `${Date.now()}`)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const title = titleOptions[hash % titleOptions.length];
  const caption = captionOptions[hash % captionOptions.length];

  return { title, caption };
};

