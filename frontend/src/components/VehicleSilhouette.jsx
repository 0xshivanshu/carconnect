const SILHOUETTES = {
    SUV: (
        <>
            <path d="M10 82 H20 L34 56 C37 50 42 46 49 46 H92 L106 26 C109 21 114 18 121 18 H172 C184 18 191 22 194 32 L202 46 H210 C217 46 220 49 220 55 V72 C220 78 216 82 210 82 H192" />
            <circle cx="58" cy="92" r="14" />
            <circle cx="172" cy="92" r="14" />
        </>
    ),
    Sedan: (
        <>
            <path d="M10 84 H26 L46 58 C49 53 54 50 61 50 H100 L120 28 C123 24 128 22 135 22 H178 C189 22 195 26 197 36 L205 50 H210 C216 50 220 53 220 60 V74 C220 80 217 84 211 84 H194" />
            <circle cx="64" cy="94" r="14" />
            <circle cx="166" cy="94" r="14" />
        </>
    ),
    Hatchback: (
        <>
            <path d="M10 82 H22 L40 56 C43 51 48 48 55 48 H96 L114 28 C117 24 122 22 129 22 H162 C172 22 176 26 178 34 L184 48 H206 C213 48 218 51 219 58 V68 C220 74 217 78 211 78 H172" />
            <circle cx="60" cy="90" r="14" />
            <circle cx="150" cy="90" r="14" />
        </>
    )
};

function VehicleSilhouette({ type, className }) {
    const shape = SILHOUETTES[type] || SILHOUETTES.Sedan;
    return (
        <svg
            viewBox="0 0 220 120"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {shape}
        </svg>
    );
}

export default VehicleSilhouette;
