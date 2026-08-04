import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resolveVehicleImage } from '../../utils/vehicleImage';
import VehicleSilhouette from '../../components/VehicleSilhouette';
import StarRating from '../../components/StarRating';

function Vehicles() {
    const apiUrl = import.meta.env.VITE_API_URL;
    const [vehicles, setVehicles] = useState([]);
    const [imageUrls, setImageUrls] = useState({});
    const [detailsVehicle, setDetailsVehicle] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedTransmissions, setSelectedTransmissions] = useState([]);
    const [priceSort, setPriceSort] = useState('');
    const [yearSort, setYearSort] = useState('');
    const navigate = useNavigate();
    const routerLocation = useLocation();

    useEffect(() => {
        if (routerLocation.state?.searchResults) {
            setVehicles(routerLocation.state.searchResults);
        } else {
            fetch(`${apiUrl}api/user/vehicles`)
                .then(res => res.json())
                .then(data => setVehicles(data))
                .catch(err => console.error(err));
        }
    }, [routerLocation.state]);

    const toggleType = (type) => {
        setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const toggleTransmission = (transmission) => {
        setSelectedTransmissions(prev => prev.includes(transmission) ? prev.filter(t => t !== transmission) : [...prev, transmission]);
    };

    const applyFilters = () => {
        setFiltersOpen(false);
    };

    const visibleVehicles = useMemo(() => {
        let result = [...vehicles];

        if (selectedTypes.length > 0) {
            result = result.filter(v => selectedTypes.includes(v.type));
        }
        if (selectedTransmissions.length > 0) {
            result = result.filter(v => selectedTransmissions.includes(v.transmission));
        }

        if (priceSort === 'low-high') result.sort((a, b) => a.pricePerDay - b.pricePerDay);
        if (priceSort === 'high-low') result.sort((a, b) => b.pricePerDay - a.pricePerDay);

        if (yearSort === 'newest') result.sort((a, b) => new Date(b.availableFrom || 0) - new Date(a.availableFrom || 0));
        if (yearSort === 'oldest') result.sort((a, b) => new Date(a.availableFrom || 0) - new Date(b.availableFrom || 0));

        return result;
    }, [vehicles, selectedTypes, selectedTransmissions, priceSort, yearSort]);

    const getResolvedImage = (vehicle) => imageUrls[vehicle._id] || null;

    useEffect(() => {
        let cancelled = false;
        visibleVehicles.forEach(vehicle => {
            if (imageUrls[vehicle._id] === undefined) {
                resolveVehicleImage(vehicle).then(url => {
                    if (!cancelled) setImageUrls(prev => ({ ...prev, [vehicle._id]: url }));
                });
            }
        });
        return () => { cancelled = true; };
    }, [visibleVehicles]);

    const openBooking = (vehicle) => {
        navigate('/checkout', {
            state: {
                vehicle,
                startDate: routerLocation.state?.searchDates?.start?.split('T')[0] || '',
                endDate: routerLocation.state?.searchDates?.end?.split('T')[0] || '',
                pickupDistrict: vehicle.district || '',
                pickupLocation: vehicle.location || ''
            }
        });
    };

    const getAvgRating = (vehicle) => {
        const ratingArr = vehicle.ratings || [];
        return ratingArr.length ? (ratingArr.reduce((a, b) => a + b.rating, 0) / ratingArr.length).toFixed(1) : 'New';
    };

    const MetaIcon = ({ children }) => (
        <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {children}
        </svg>
    );

    return (
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-[1500px]">
            <div className="flex flex-col lg:flex-row gap-10">

                {/* Left Sidebar: Filter Panel */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-28">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Filters</h2>
                            <button
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition flex items-center justify-center text-lg font-bold"
                                aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
                            >
                                {filtersOpen ? '−' : '+'}
                            </button>
                        </div>

                        {filtersOpen && (
                            <div className="px-6 py-4 space-y-6">
                                {/* Type accordion */}
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-3">Type</p>
                                    <div className="space-y-2.5">
                                        {['SUV', 'Sedan', 'Hatchback'].map(type => (
                                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTypes.includes(type)}
                                                    onChange={() => toggleType(type)}
                                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 capitalize">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Transmission accordion */}
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-3">Transmission</p>
                                    <div className="space-y-2.5">
                                        {['Automatic', 'Manual'].map(transmission => (
                                            <label key={transmission} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTransmissions.includes(transmission)}
                                                    onChange={() => toggleTransmission(transmission)}
                                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 capitalize">{transmission}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={applyFilters}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition shadow-md mt-2"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                            Available Vehicles <span className="text-slate-400 font-bold text-lg">({visibleVehicles.length})</span>
                        </h1>
                        <div className="flex gap-3">
                            <select
                                value={priceSort}
                                onChange={e => setPriceSort(e.target.value)}
                                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
                            >
                                <option value="">Price</option>
                                <option value="low-high">Price: Low to High</option>
                                <option value="high-low">Price: High to Low</option>
                            </select>
                            <select
                                value={yearSort}
                                onChange={e => setYearSort(e.target.value)}
                                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none cursor-pointer"
                            >
                                <option value="">Year</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Vehicle Grid */}
                    {visibleVehicles.length === 0 ? (
                        routerLocation.state?.searchArea ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm p-12 md:p-16 text-center">
                                <p className="text-xl font-bold text-slate-700">No vehicles in this area</p>
                                <p className="text-slate-400 font-medium mt-2 max-w-md mx-auto">
                                    We don't have any cars available in {routerLocation.state.searchArea.location ? `${routerLocation.state.searchArea.location}, ` : ''}{routerLocation.state.searchArea.district} for your selected dates. Try another city or adjust your dates.
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500">No vehicles match your filters at the moment.</p>
                        )
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-14">
                            {visibleVehicles.map(vehicle => (
                                <div key={vehicle._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition flex flex-col overflow-hidden">
                                    {/* Image Container */}
                                    <div className="p-7 pb-0">
                                        <div className="aspect-[3/2] bg-slate-100 rounded-xl overflow-hidden">
                                            {getResolvedImage(vehicle) ? (
                                                <img
                                                    src={getResolvedImage(vehicle)}
                                                    alt={`${vehicle.brand} ${vehicle.name}`}
                                                    loading="lazy"
                                                    className="w-full h-full object-contain p-5 hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <VehicleSilhouette type={vehicle.type} className="w-full h-full p-10 text-slate-300" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-9 pt-8 flex flex-col flex-1">
                                        {/* Title & Pricing Row */}
                                        <div className="flex items-center justify-between gap-4 mb-8">
                                            <h2 className="text-xl font-bold text-slate-900 truncate">{vehicle.brand} {vehicle.name}</h2>
                                            <p className="text-lg font-black text-slate-900 shrink-0">
                                                ₹{vehicle.pricePerDay}
                                                <span className="text-xs font-normal text-slate-400">/day</span>
                                            </p>
                                        </div>

                                        {/* Metadata Section */}
                                        <div className="grid grid-cols-2 gap-y-7 gap-x-4 mb-9">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <MetaIcon>
                                                    <path d="M12 3l9 5v8l-9 5-9-5V8l9-5z" />
                                                    <path d="M12 3v22" />
                                                </MetaIcon>
                                                <span className="text-sm font-medium text-slate-600 truncate capitalize">{vehicle.brand}</span>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <MetaIcon>
                                                    <circle cx="12" cy="7" r="4" />
                                                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                                                </MetaIcon>
                                                <span className="text-sm font-medium text-slate-600 truncate">{vehicle.seats} Seats</span>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <MetaIcon>
                                                    <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
                                                    <circle cx="7" cy="17" r="2" />
                                                    <circle cx="17" cy="17" r="2" />
                                                    <path d="M9 17h6" />
                                                </MetaIcon>
                                                <span className="text-sm font-medium text-slate-600 truncate capitalize">{vehicle.type}</span>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <MetaIcon>
                                                    <path d="M4 22V10a8 8 0 0 1 16 0v12" />
                                                    <path d="M2 22h20" />
                                                    <path d="M9 10h6" />
                                                </MetaIcon>
                                                <span className="text-sm font-medium text-slate-600 truncate capitalize">{vehicle.fuelType}</span>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="grid grid-cols-2 gap-6 mt-auto">
                                            <button
                                                onClick={() => openBooking(vehicle)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition shadow-md text-sm"
                                            >
                                                Book Ride
                                            </button>
                                            <button
                                                onClick={() => setDetailsVehicle(vehicle)}
                                                className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-4 rounded-xl transition text-sm"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Details Modal */}
            {detailsVehicle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="relative bg-slate-100">
                            {getResolvedImage(detailsVehicle) ? (
                                <img src={getResolvedImage(detailsVehicle)} alt={detailsVehicle.name} className="w-full h-56 object-cover" />
                            ) : (
                                <div className="w-full h-56 flex items-center justify-center">
                                    <VehicleSilhouette type={detailsVehicle.type} className="w-64 h-40 text-slate-300" />
                                </div>
                            )}
                            <button
                                onClick={() => setDetailsVehicle(null)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 rounded-full w-9 h-9 flex items-center justify-center transition font-bold"
                            >
                                ✕
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900 to-transparent px-6 pt-10 pb-4">
                                <h2 className="text-2xl font-black text-white">{detailsVehicle.brand} {detailsVehicle.name}</h2>
                                <p className="text-white/80 text-sm font-medium">
                                    {detailsVehicle.location}, {detailsVehicle.district}
                                </p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rating</span>
                                <span className="inline-flex items-center gap-2">
                                    {getAvgRating(detailsVehicle) === 'New' ? (
                                        <span className="font-bold text-slate-400">New</span>
                                    ) : (
                                        <>
                                            <StarRating value={parseFloat(getAvgRating(detailsVehicle))} size="w-4 h-4" />
                                            <span className="font-black text-slate-800">{getAvgRating(detailsVehicle)}</span>
                                        </>
                                    )}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-5">
                                <span className="font-semibold text-slate-500">Type</span>
                                <span className="font-bold text-slate-800 capitalize">{detailsVehicle.type}</span>
                                <span className="font-semibold text-slate-500">Transmission</span>
                                <span className="font-bold text-slate-800 capitalize">{detailsVehicle.transmission}</span>
                                <span className="font-semibold text-slate-500">Fuel Type</span>
                                <span className="font-bold text-slate-800 capitalize">{detailsVehicle.fuelType}</span>
                                <span className="font-semibold text-slate-500">Seats</span>
                                <span className="font-bold text-slate-800">{detailsVehicle.seats}</span>
                                <span className="font-semibold text-slate-500">Price</span>
                                <span className="font-black text-slate-800">₹{detailsVehicle.pricePerDay}<span className="text-xs font-normal text-slate-400">/day</span></span>
                            </div>
                            {detailsVehicle.availableFrom && detailsVehicle.availableUntil && (
                                <p className="text-[11px] font-black text-blue-700 bg-blue-100 inline-block px-2 py-1 rounded border border-blue-200 uppercase tracking-widest mb-5">
                                    Available: {new Date(detailsVehicle.availableFrom).toLocaleDateString()} to {new Date(detailsVehicle.availableUntil).toLocaleDateString()}
                                </p>
                            )}
                            <button
                                onClick={() => openBooking(detailsVehicle)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition shadow-md"
                            >
                                Book Ride
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Vehicles;
