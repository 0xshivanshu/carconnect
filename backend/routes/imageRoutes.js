const express = require('express');
const router = express.Router();

const CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const slugify = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const buildCandidateUrls = (brand, name) => {
    const b = slugify(brand);
    const m = slugify(name);
    if (!b || !m) return [];
    const suffixes = ['', '-2025', '-2024', '-2023', '-2022'];
    const urls = [];
    for (const s of suffixes) {
        urls.push(`https://www.carwale.com/${b}-cars/${m}${s}/`);
        urls.push(`https://www.carwale.com/${b}-suzuki-cars/${m}${s}/`);
        urls.push(`https://www.carwale.com/${b}/${m}${s}/`);
    }
    return urls;
};

const extractImageUrls = (html) => {
    const urls = new Set();
    const re = /https:\/\/imgd\.aeplcdn\.com\/\d+x\d+\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp)/gi;
    let match;
    while ((match = re.exec(html)) !== null) {
        const url = match[0];
        if (/\/cw\//i.test(url) || /\/n\/cw\//i.test(url) || /gallery/i.test(url) || /versions/i.test(url)) {
            urls.add(url);
        }
    }
    return [...urls].sort((a, b) => {
        const wA = parseInt(a.match(/\/(\d+)x\d+\//)?.[1] || '0', 10);
        const wB = parseInt(b.match(/\/(\d+)x\d+\//)?.[1] || '0', 10);
        return wB - wA;
    });
};

const isModelRelevant = (url, brand, name) => {
    const file = url.split('/').pop().split('?')[0].toLowerCase();
    const modelSlug = slugify(name);
    const brandSlug = slugify(brand);
    return file.includes(modelSlug) || file.includes(brandSlug);
};

const fetchFirstImage = async (brand, name) => {
    const pageUrls = buildCandidateUrls(brand, name);
    for (const pageUrl of pageUrls) {
        try {
            const res = await fetch(pageUrl, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-IN,en;q=0.9'
                },
                signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) continue;
            const html = await res.text();
            if (html.length < 10000) continue;
            const urls = extractImageUrls(html);
            const relevant = urls.find(u => isModelRelevant(u, brand, name));
            if (relevant) return relevant;
        } catch (err) {
            continue;
        }
    }
    return null;
};

// GET /api/images/:brand/:name
router.get('/:brand/:name', async (req, res) => {
    try {
        const brand = String(req.params.brand || '').trim();
        const name = String(req.params.name || '').trim();
        if (!brand || !name) return res.status(400).json({ message: 'brand and name are required' });

        const cacheKey = `${brand.toLowerCase()}|${name.toLowerCase()}`;
        if (CACHE.has(cacheKey)) {
            const cached = CACHE.get(cacheKey);
            if (Date.now() - cached.time < CACHE_TTL) return res.json({ url: cached.url });
            CACHE.delete(cacheKey);
        }

        const url = await fetchFirstImage(brand, name);
        if (!url) return res.status(404).json({ message: 'No image found' });

        CACHE.set(cacheKey, { url, time: Date.now() });
        res.json({ url });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
