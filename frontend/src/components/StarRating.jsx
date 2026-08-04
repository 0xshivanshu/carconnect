const STAR_PATH = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function StarRating({ value = 0, size = "w-4 h-4", className = "" }) {
    const num = typeof value === "number" && isFinite(value) ? value : 0;
    return (
        <span className={`inline-flex ${className}`} role="img" aria-label={`${num.toFixed(1)} out of 5 stars`}>
            {[0, 1, 2, 3, 4].map(i => {
                const pct = Math.max(0, Math.min(100, Math.round((num - i) * 100)));
                return (
                    <span key={i} className={`relative inline-block ${size}`}>
                        <svg viewBox="0 0 24 24" className={`absolute inset-0 ${size} text-slate-200`} fill="currentColor" aria-hidden="true">
                            <path d={STAR_PATH} />
                        </svg>
                        <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
                            <svg viewBox="0 0 24 24" className={`${size} text-yellow-400`} fill="currentColor" aria-hidden="true">
                                <path d={STAR_PATH} />
                            </svg>
                        </span>
                    </span>
                );
            })}
        </span>
    );
}

export default StarRating;
