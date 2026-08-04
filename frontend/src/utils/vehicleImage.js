const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const IMAGE_CACHE = new Map();
const PENDING = new Map();

const cleanQuery = (str) => String(str || '').replace(/[^\w\s-]/g, ' ').trim();

const TYPE_WORDS = ['suv', 'sedan', 'hatchback', 'mpv', 'crossover', 'wagon', 'truck', 'van', 'coup\u00e9', 'coupe', 'convertible'];
const PENALTY_WORDS = ['logo', 'schematic', 'drawing', 'diagram', 'map', 'cutaway', 'render', 'model car', 'hot wheels', 'lego', 'badge', 'emblem', 'interior', 'dashboard', 'engine bay', 'wheel', 'tire', 'tyre'];

const fetchThumb = async (searchTerm) => {
    const url = `${WIKIMEDIA_API}?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages || {};
    return Object.values(pages).map(p => p?.imageinfo?.[0]?.thumburl).filter(Boolean);
};

const scoreImage = (url, model, type) => {
    const file = url.split('/').pop().split('?')[0].toLowerCase().replace(/[_-]/g, ' ');
    const modelTokens = model.toLowerCase().split(/\s+/);
    let score = 0;

    const hasExactModel = modelTokens.every(t => file.includes(t));
    if (hasExactModel) score += 100;
    else if (modelTokens.some(t => file.includes(t))) score += 30;

    if (TYPE_WORDS.some(w => file.includes(w))) score += 10;
    if (type && file.includes(type.toLowerCase())) score += 15;

    const penalty = PENALTY_WORDS.find(w => file.includes(w));
    if (penalty) score -= 40;

    return score;
};

export async function resolveVehicleImage(vehicle) {
    const existing = vehicle.image;
    const cacheKey = `${vehicle.brand}-${vehicle.name}`.toLowerCase();
    if (IMAGE_CACHE.has(cacheKey)) return IMAGE_CACHE.get(cacheKey);
    if (PENDING.has(cacheKey)) return PENDING.get(cacheKey);

    const promise = (async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/';

        // Tier 1: CarWale gallery image via backend proxy (scraped + cached server-side)
        try {
            const res = await fetch(`${apiUrl}api/images/${encodeURIComponent(vehicle.brand)}/${encodeURIComponent(vehicle.name)}`);
            if (res.ok) {
                const data = await res.json();
                if (data?.url) return data.url;
            }
        } catch (err) {
            // backend offline — continue to next tier
        }

        // Tier 2: Wikimedia Commons exact-model search
        const brand = cleanQuery(vehicle.brand);
        const modelName = cleanQuery(vehicle.name);
        const model = `${brand} ${modelName}`;
        const queries = [
            `"${model}" car`,
            `"${model}"`,
            `${brand} ${modelName} ${cleanQuery(vehicle.type)}`,
        ];
        try {
            let best = null;
            let bestScore = -1;
            for (const q of queries) {
                const thumbs = await fetchThumb(q);
                for (const url of thumbs) {
                    const s = scoreImage(url, model, vehicle.type);
                    if (s > bestScore) {
                        bestScore = s;
                        best = url;
                    }
                }
                if (bestScore >= 110) break;
            }
            return best || null;
        } catch (err) {
            console.error('Image fetch failed:', err);
            return null;
        }
    })();

    PENDING.set(cacheKey, promise);
    try {
        let resolved = await promise;
        // Tier 3: keep the DB image as a last-resort fallback
        if (!resolved && existing) resolved = existing;
        if (resolved) IMAGE_CACHE.set(cacheKey, resolved);
        return resolved;
    } finally {
        PENDING.delete(cacheKey);
    }
}
