import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CarSearch = () => {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [formData, setFormData] = useState({
        pickup_district: "",
        pickup_location: "",
        pickuptime: "",
        dropofftime: "",
    });
    const [cities, setCities] = useState([]);
    const [locationQuery, setLocationQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        fetch(`${apiUrl}api/user/locations`)
            .then(res => res.json())
            .then(data => setCities(data.cities || []))
            .catch(err => console.error(err));
    }, [apiUrl]);

    // Debounced live locality typeahead via the pincode API proxy
    useEffect(() => {
        const q = locationQuery.trim();
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoadingLocations(true);
            try {
                const res = await fetch(`${apiUrl}api/user/locations/search?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.results || []);
                }
            } catch (err) {
                setSuggestions([]);
            } finally {
                setLoadingLocations(false);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [locationQuery, apiUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null);
        setNotice(null);
        setFormData(prev => name === 'pickup_district'
            ? { ...prev, [name]: value, pickup_location: '' }
            : { ...prev, [name]: value });
    };

    const handleSelectSuggestion = (s) => {
        setFormData(prev => {
            let district = prev.pickup_district;
            if (!district) {
                const known = cities.find(c => c.city.toLowerCase() === String(s.district || '').toLowerCase());
                if (known) district = known.city;
            }
            return { ...prev, pickup_location: s.name, pickup_district: district };
        });
        setLocationQuery(s.name);
        setSuggestionsOpen(false);
        setError(null);
        setNotice(null);
    };

    const handleData = async (e) => {
        e.preventDefault();
        setError(null);
        setNotice(null);
        try {
            const start = new Date(formData.pickuptime);
            const end = new Date(formData.dropofftime);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) {
                setError("Validation Error: You cannot search for a pickup date in the past.");
                return;
            }
            if (end < start) {
                setError("Validation Error: Your return date cannot be before your pickup date.");
                return;
            }

            const datas = {
                pickupDate: formData.pickuptime,
                dropOffDate: formData.dropofftime,
                pickUpDistrict: formData.pickup_district,
                pickUpLocation: formData.pickup_location,
            };

            const res = await fetch(`${apiUrl}api/user/showSingleofSameModel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datas),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.message);
                return;
            }
            const result = await res.json();
            if (result.length === 0) {
                setNotice(
                    `We don't have vehicles in ${formData.pickup_location ? formData.pickup_location + ', ' : ''}${formData.pickup_district} for your selected dates. Try another area or check back soon.`
                );
                return;
            }
            navigate("/vehicles", {
                state: {
                    searchResults: result,
                    searchDates: { start: formData.pickuptime, end: formData.dropofftime },
                    searchArea: { district: formData.pickup_district, location: formData.pickup_location }
                }
            });
            setFormData({
                pickup_district: "",
                pickup_location: "",
                pickuptime: "",
                dropofftime: "",
            });
            setLocationQuery("");
        } catch (error) {
            console.log("Error: ", error);
        }
    };

    return (
        <section id="booking-section" className="mx-auto max-w-[1300px] px-4 md:px-8 relative z-20">
            <div className="bg-white/80 backdrop-blur-2xl border border-white p-8 md:p-10 shadow-2xl rounded-3xl w-full">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><span className="text-emerald-500">📍</span> Search Available Fleet</h2>

                {error && <p className="text-red-500 mb-4 font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
                {notice && <p className="text-amber-700 mb-4 font-bold bg-amber-50 p-3 rounded-lg border border-amber-200">{notice}</p>}
                <form onSubmit={handleData} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">

                    <div className="flex flex-col">
                        <label htmlFor="pickup_district" className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Pick-up City <span className="text-emerald-500">*</span></label>
                        <select
                            name="pickup_district"
                            required
                            value={formData.pickup_district}
                            onChange={handleChange}
                            className="p-4 border border-slate-200 rounded-xl shadow-sm capitalize bg-white/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition appearance-none"
                        >
                            <option value="">Select City</option>
                            {cities.map(c => (
                                <option value={c.city} key={c.city}>{c.city}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col relative">
                        <label htmlFor="pickup_location" className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Specific Area</label>
                        <input
                            type="text"
                            id="pickup_location"
                            value={locationQuery}
                            onChange={(e) => {
                                setLocationQuery(e.target.value);
                                setFormData(prev => ({ ...prev, pickup_location: '' }));
                                setSuggestionsOpen(true);
                                setError(null);
                                setNotice(null);
                            }}
                            onFocus={() => setSuggestionsOpen(true)}
                            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                            placeholder="Type an area, e.g. Koregaon Park"
                            className="p-4 border border-slate-200 rounded-xl shadow-sm bg-white/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition text-slate-700"
                        />
                        {loadingLocations && <p className="text-xs text-slate-400 mt-1.5">Searching areas…</p>}
                        {suggestionsOpen && suggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                {suggestions.map((s, idx) => (
                                    <li key={idx}>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSelectSuggestion(s)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex flex-col"
                                        >
                                            <span className="font-semibold text-slate-800">{s.name}</span>
                                            <span className="text-xs text-slate-500">{s.district}, {s.state}{s.pincode ? ` · ${s.pincode}` : ''}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {suggestionsOpen && locationQuery.trim().length >= 2 && suggestions.length === 0 && !loadingLocations && (
                            <p className="text-xs font-bold text-slate-400 mt-1.5">No exact area found — we'll match your city instead.</p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="pickuptime" className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Start Date <span className="text-emerald-500">*</span></label>
                        <input
                            type="datetime-local"
                            name="pickuptime"
                            required
                            value={formData.pickuptime}
                            onChange={handleChange}
                            className="p-4 border border-slate-200 rounded-xl shadow-sm bg-white/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition text-slate-700"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="dropofftime" className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">End Date <span className="text-emerald-500">*</span></label>
                        <input
                            type="datetime-local"
                            name="dropofftime"
                            required
                            value={formData.dropofftime}
                            onChange={handleChange}
                            className="p-4 border border-slate-200 rounded-xl shadow-sm bg-white/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition text-slate-700"
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <button type="submit" className="bg-slate-900 hover:bg-emerald-600 transition duration-300 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-emerald-500/30 w-full md:w-auto h-full max-h-[58px] flex justify-center items-center">
                            Find Vehicle
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};
export default CarSearch;
