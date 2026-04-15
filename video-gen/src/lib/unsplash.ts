const imageCache     = new Map<string, string>()
const translateCache = new Map<string, string>()

// Seed ổn định cho Picsum fallback
function hashSeed(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) >>> 0
  }
  return String(h)
}

function picsumUrl(prompt: string): string {
  return `https://picsum.photos/seed/${hashSeed(prompt.trim().toLowerCase())}/1920/1080`
}

// Google Translate public endpoint — không cần API key
async function translateToEnglish(text: string): Promise<string> {
  if (translateCache.has(text)) return translateCache.get(text)!
  try {
    const q   = encodeURIComponent(text.slice(0, 200))
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${q}`,
      { signal: AbortSignal.timeout(4000) },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    // Response: [[["translated text", "original", ...], ...], ...]
    const translated: string = (data[0] as any[][])
      ?.map(item => item[0])
      .filter(Boolean)
      .join('') ?? text
    const clean = translated.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    translateCache.set(text, clean)
    return clean
  } catch (err) {
    console.warn('[translate] Google Translate failed, using original:', err)
    return text
  }
}

export async function searchImage(prompt: string): Promise<string> {
  if (imageCache.has(prompt)) return imageCache.get(prompt)!

  // Dịch sang tiếng Anh để Unsplash tìm được đúng ảnh
  const englishQuery = await translateToEnglish(prompt)

  if (!process.env.UNSPLASH_ACCESS_KEY) {
    const url = picsumUrl(englishQuery)
    imageCache.set(prompt, url)
    return url
  }

  try {
    const q   = encodeURIComponent(englishQuery.slice(0, 80))
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${q}&per_page=10&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } },
    )
    if (!res.ok) throw new Error(`Unsplash ${res.status}`)
    const data = await res.json()
    const results: any[] = data.results ?? []
    const top = results.slice(0, 5)
    const picked = top.length > 0
      ? top[Math.floor(Math.random() * top.length)].urls.regular
      : picsumUrl(englishQuery)
    imageCache.set(prompt, picked)
    return picked
  } catch (err) {
    console.warn('[unsplash] Search failed:', err)
    const url = picsumUrl(englishQuery)
    imageCache.set(prompt, url)
    return url
  }
}
