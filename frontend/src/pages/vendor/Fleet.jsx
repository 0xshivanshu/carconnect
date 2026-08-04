import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveVehicleImage } from "../../utils/vehicleImage";
import VehicleSilhouette from "../../components/VehicleSilhouette";
import StarRating from "../../components/StarRating";

function VendorFleet() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [vehicles, setVehicles] = useState([]);
    const [imageUrls, setImageUrls] = useState({});
    const [fetchingImage, setFetchingImage] = useState(false);

    const getLocalDateString = (offsetDays = 0) => {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        name: '', brand: '', type: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', pricePerDay: '', image: '', district: '', location: '',
        availableFrom: getLocalDateString(0),
        availableUntil: getLocalDateString(30)
    });

    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) return navigate('/signIn');
        if (JSON.parse(rawUser).role !== 'vendor') return navigate('/user/dashboard');
        fetchVehicles();
    }, [navigate]);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    const fetchVehicles = async () => {
        const res = await fetch(`${apiUrl}api/vendor/vehicles`, { headers: getHeaders() });
        if (res.ok) setVehicles(await res.json());
    };

    const getResolvedImage = (v) => imageUrls[v._id] || null;

    useEffect(() => {
        let cancelled = false;
        vehicles.forEach(v => {
            if (imageUrls[v._id] === undefined) {
                resolveVehicleImage(v).then(url => {
                    if (!cancelled) setImageUrls(prev => ({ ...prev, [v._id]: url }));
                });
            }
        });
        return () => { cancelled = true; };
    }, [vehicles]);

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiUrl}api/vendor/vehicles`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                const js = await res.json().catch(() => ({ message: 'Server Error' }));
                alert(`Failed to list vehicle: ${js.message}`);
                return;
            }
            setFormData({ name: '', brand: '', type: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', pricePerDay: '', image: '', district: '', location: '', availableFrom: getLocalDateString(0), availableUntil: getLocalDateString(30) });
            fetchVehicles();
            alert('Vehicle successfully added to fleet!');
        } catch (err) { alert(`Network Error: ${err.message}`); }
    };

    const autoFetchImage = async () => {
        if (!formData.brand || !formData.name) return alert('Enter brand and model name first.');
        setFetchingImage(true);
        try {
            const res = await fetch(`${apiUrl}api/images/${encodeURIComponent(formData.brand)}/${encodeURIComponent(formData.name)}`);
            const js = await res.json().catch(() => null);
            if (res.ok && js?.url) {
                setFormData(prev => ({ ...prev, image: js.url }));
                alert('Image fetched from the web!');
            } else {
                alert('No photo found for that car online. Add a URL manually or leave it blank.');
            }
        } catch (err) {
            alert(`Network Error: ${err.message}`);
        } finally {
            setFetchingImage(false);
        }
    };

    const fleetRatings = vehicles.flatMap(v => v.ratings || []);
    const avgPrice = vehicles.length ? Math.round(vehicles.reduce((a, b) => a + Number(b.pricePerDay || 0), 0) / vehicles.length) : 0;
    const avgRating = fleetRatings.length ? (fleetRatings.reduce((a, b) => a + b.rating, 0) / fleetRatings.length).toFixed(1) : '—';

    const getAvgRating = (v) => {
        const ratingArr = v.ratings || [];
        return ratingArr.length ? (ratingArr.reduce((a, b) => a + b.rating, 0) / ratingArr.length).toFixed(1) : 'New';
    };

    const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition";
    const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";
    const sectionTitleClass = "text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-4 flex items-center gap-2";

    const SectionDivider = () => <div className="border-t border-slate-100 my-6" />;

    const StatCard = ({ title, value, accent }) => (
        <div className={accent
            ? "bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl text-white transform hover:-translate-y-1 transition duration-300"
            : "bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transform hover:-translate-y-1 transition duration-300"}>
            <h3 className={`font-bold mb-1 uppercase tracking-wider text-sm ${accent ? 'text-blue-200' : 'text-slate-500'}`}>{title}</h3>
            <p className={`text-4xl font-black ${accent ? '' : 'text-slate-800'}`}>{value}</p>
        </div>
    );

    const Label = ({ children }) => <label className={labelClass}>{children}</label>;

    const RatingBadge = ({ rating }) => {
        if (rating === 'New') {
            return <span className="shrink-0 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">New</span>;
        }
        return (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                <StarRating value={parseFloat(rating)} size="w-3.5 h-3.5" />
                {rating}
            </span>
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            <div className="container mx-auto px-5 md:px-10 py-12 max-w-[1500px]">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Vendor Portal</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            Fleet <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-slate-900">Management</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-4 max-w-xl">List new cars, keep availability up to date, and watch your rental lineup grow.</p>
                    </div>
                    <button onClick={() => navigate('/vendor/dashboard')} className="self-start lg:self-auto shrink-0 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition flex items-center gap-2">
                        <span className="text-lg leading-none">&larr;</span> Back to Dashboard
                    </button>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    <StatCard title="Fleet Size" value={vehicles.length} accent />
                    <StatCard title="Avg Price / Day" value={`₹${avgPrice.toLocaleString()}`} />
                    <StatCard title="Fleet Rating" value={`${avgRating} ⭐`} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">

                    {/* Add Vehicle Form */}
                    <div className="xl:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden xl:sticky xl:top-28">
                            <div className="px-8 pt-8 pb-7 border-b border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-800">Add New Vehicle</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1.5">Fill in the details to list your car for rent.</p>
                            </div>

                            <form onSubmit={handleAddVehicle} className="px-8 py-7">
                                <p className={sectionTitleClass}>Car Specs</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Brand</Label>
                                        <input type="text" placeholder="e.g. Hyundai" required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <Label>Model</Label>
                                        <input type="text" placeholder="e.g. Creta" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <Label>Type</Label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={`${inputClass} cursor-pointer`}>
                                            <option value="SUV">SUV</option>
                                            <option value="Sedan">Sedan</option>
                                            <option value="Hatchback">Hatchback</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Transmission</Label>
                                        <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })} className={`${inputClass} cursor-pointer`}>
                                            <option value="Automatic">Automatic</option>
                                            <option value="Manual">Manual</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Fuel Type</Label>
                                        <select value={formData.fuelType} onChange={e => setFormData({ ...formData, fuelType: e.target.value })} className={`${inputClass} cursor-pointer`}>
                                            <option value="Petrol">Petrol</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Electric">Electric</option>
                                            <option value="Hybrid">Hybrid</option>
                                            <option value="CNG">CNG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Price / Day (₹)</Label>
                                        <input type="number" placeholder="e.g. 2500" required value={formData.pricePerDay} onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })} className={inputClass} />
                                    </div>
                                </div>

                                <SectionDivider />
                                <p className={sectionTitleClass}>Pickup Location</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>City / District</Label>
                                        <input type="text" placeholder="e.g. Pune" required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <Label>Exact Area</Label>
                                        <input type="text" placeholder="e.g. Koregaon Park" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className={inputClass} />
                                    </div>
                                </div>

                                <SectionDivider />
                                <p className={sectionTitleClass}>Availability</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>From</Label>
                                        <input type="date" required value={formData.availableFrom} onChange={e => setFormData({ ...formData, availableFrom: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <Label>Until</Label>
                                        <input type="date" required value={formData.availableUntil} onChange={e => setFormData({ ...formData, availableUntil: e.target.value })} className={inputClass} />
                                    </div>
                                </div>

                                <SectionDivider />
                                <p className={sectionTitleClass}>Photo</p>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Label>Image URL <span className="normal-case font-medium text-slate-400">(optional)</span></Label>
                                        <input type="url" placeholder="https://…" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className={inputClass} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={autoFetchImage}
                                        disabled={fetchingImage}
                                        className="shrink-0 self-end border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-bold px-4 py-3 rounded-xl transition text-sm disabled:opacity-50"
                                    >
                                        {fetchingImage ? '…' : 'Auto-fetch'}
                                    </button>
                                </div>
                                {formData.image && (
                                    <div className="mt-4 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden h-28">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-contain p-2" />
                                    </div>
                                )}

                                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition shadow-md mt-8">
                                    List Vehicle to Fleet
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Your Active Fleet */}
                    <div className="xl:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">
                            <div className="flex items-center justify-between gap-4 mb-7 border-b border-slate-100 pb-5">
                                <h2 className="text-2xl font-bold text-slate-800">Your Active Fleet</h2>
                                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shrink-0">
                                    {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            {vehicles.length === 0 ? (
                                <div className="border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
                                    <div className="w-32 h-24 text-slate-200 mb-6">
                                        <VehicleSilhouette type="SUV" className="w-full h-full" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-700">Your fleet is empty</p>
                                    <p className="text-slate-400 font-medium mt-2 max-w-sm">List your first vehicle using the form and it will show up here instantly.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5 overflow-y-auto max-h-[620px] pr-3 pt-1">
                                    {vehicles.map(v => (
                                        <div key={v._id} className="flex flex-col sm:flex-row gap-5 border border-slate-200 rounded-2xl p-5 bg-slate-50 hover:bg-white hover:border-slate-300 transition shadow-sm">
                                            <div className="w-full sm:w-48 h-36 sm:h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                                                {getResolvedImage(v) ? (
                                                    <img src={getResolvedImage(v)} alt={`${v.brand} ${v.name}`} loading="lazy" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <VehicleSilhouette type={v.type} className="w-full h-full p-4 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-black text-slate-800 text-lg truncate">{v.brand} {v.name}</h3>
                                                    <RatingBadge rating={getAvgRating(v)} />
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-1.5">{v.location}, {v.district} · {v.type} · {v.transmission}</p>
                                                <p className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-widest mt-3 self-start leading-relaxed">
                                                    {new Date(v.availableFrom).toLocaleDateString()} &rarr; {new Date(v.availableUntil).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t sm:border-t-0 border-slate-200 pt-4 sm:pt-0">
                                                <span className="font-black text-slate-900 text-xl">₹{v.pricePerDay}<span className="text-xs font-normal text-slate-400">/day</span></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VendorFleet;
