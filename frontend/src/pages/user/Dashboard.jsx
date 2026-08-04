import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveVehicleImage } from "../../utils/vehicleImage";
import VehicleSilhouette from "../../components/VehicleSilhouette";

function UserDashboard() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ name: '', email: '', _id: '' });
    const [imageUrls, setImageUrls] = useState({});

    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) return navigate('/signIn');
        const parsedUser = JSON.parse(rawUser);
        if (parsedUser.role !== 'user') return navigate('/vendor/dashboard');
        setProfile(parsedUser);

        fetchOrders();
    }, [navigate]);

    const getHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    const fetchOrders = async () => {
        const res = await fetch(`${apiUrl}api/user/orders`, { headers: getHeaders() });
        if (res.ok) setOrders(await res.json());
    };

    const getResolvedImage = (o) => (o.vehicle ? imageUrls[o.vehicle._id] || null : null);

    useEffect(() => {
        let cancelled = false;
        orders.forEach(o => {
            if (o.vehicle && imageUrls[o.vehicle._id] === undefined) {
                resolveVehicleImage(o.vehicle).then(url => {
                    if (!cancelled) setImageUrls(prev => ({ ...prev, [o.vehicle._id]: url }));
                });
            }
        });
        return () => { cancelled = true; };
    }, [orders]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const res = await fetch(`${apiUrl}api/user/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ name: profile.name })
        });
        if (res.ok) {
            const updatedUser = await res.json();
            localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user')), name: updatedUser.name }));
            alert("Profile updated successfully!");
        } else {
            alert("Failed to update profile.");
        }
    };

    const handleRate = async (vehicleId, rating) => {
        const res = await fetch(`${apiUrl}api/user/vehicles/${vehicleId}/rate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ rating })
        });
        if (res.ok) {
            alert(`You rated this journey ${rating} stars!`);
            fetchOrders();
        } else {
            alert('Failed to submit rating.');
        }
    };

    // Calculate Analytics
    const totalTrips = orders.length;
    const totalSpent = orders.reduce((acc, o) => acc + o.totalCost, 0);
    const activeRentals = orders.filter(o => new Date() <= new Date(o.endDate)).length;

    const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition";
    const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";

    const StatCard = ({ title, value, accent }) => (
        <div className={`p-6 rounded-2xl transform hover:-translate-y-1 transition duration-300 ${accent ? 'bg-emerald-50/70 border border-emerald-100' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <h3 className={`font-bold mb-2 uppercase tracking-wider text-sm ${accent ? 'text-emerald-700' : 'text-slate-500'}`}>{title}</h3>
            <p className={`text-4xl font-black ${accent ? 'text-emerald-900' : 'text-slate-800'}`}>{value}</p>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            <div className="container mx-auto px-5 md:px-10 py-12 max-w-[1500px]">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">User Portal</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">My Dashboard</h1>
                        <p className="text-slate-500 font-medium mt-4">Welcome back{profile.name ? `, ${profile.name}` : ''}. Manage your rentals and profile.</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="self-start lg:self-auto shrink-0 border border-slate-300 text-slate-700 hover:bg-white bg-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2">
                        Logout
                    </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard title="Total Trips" value={`${totalTrips} Trips`} accent />
                    <StatCard title="Lifetime Expenditure" value={`₹${totalSpent.toLocaleString()}`} />
                    <StatCard title="Active & Upcoming" value={`${activeRentals} Rentals`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Section */}
                    <div className="lg:col-span-1 bg-white p-7 rounded-2xl border border-slate-200 shadow-sm self-start">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">Profile Settings</h2>
                        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                            <div>
                                <label className={labelClass}>Full Name</label>
                                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" value={profile.email} disabled className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium bg-slate-50 text-slate-400 select-none" />
                            </div>
                            <button type="submit" className="bg-slate-900 text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-slate-800 transition shadow-md">Save Modifications</button>
                        </form>
                    </div>

                    {/* Bookings Section */}
                    <div className="lg:col-span-2 bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">Booking History</h2>
                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[620px] pr-2">
                            {orders.length === 0 ? <p className="text-slate-400 font-medium py-6">You haven't booked any vehicles yet.</p> : orders.map(o => {
                                const isCompleted = new Date() > new Date(o.endDate);
                                const existingRatingObject = o.vehicle?.ratings?.find(r => r.user === profile._id);
                                const existingRating = existingRatingObject ? existingRatingObject.rating : 0;

                                return (
                                    <div key={o._id} className="flex flex-col xl:flex-row justify-between items-start xl:items-center border border-slate-200 rounded-2xl p-5 bg-slate-50 hover:bg-white hover:border-slate-300 transition">
                                        <div className="flex gap-5 items-center w-full">
                                            <div className="w-28 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                                                {getResolvedImage(o) ? (
                                                    <img src={getResolvedImage(o)} alt={`${o.vehicle?.brand} ${o.vehicle?.name}`} loading="lazy" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <VehicleSilhouette type={o.vehicle?.type} className="w-full h-full p-3 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-xl text-slate-800">{o.vehicle?.brand} {o.vehicle?.name}</p>
                                                <p className="text-slate-600 font-medium mb-2 text-sm"><span className="font-bold text-slate-400">PICKUP:</span> {o.pickupLocation || o.vehicle?.location}, {o.pickupDistrict || o.vehicle?.district}</p>
                                                <p className="text-[11px] font-black text-emerald-700 bg-emerald-100 inline-block px-3 py-1 rounded-full border border-emerald-200 tracking-widest">
                                                    {new Date(o.startDate).toLocaleDateString()} &rarr; {new Date(o.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 xl:mt-0 xl:text-right w-full xl:w-auto flex flex-col items-start xl:items-end justify-center border-t xl:border-t-0 border-slate-200 pt-4 xl:pt-0">
                                            <span className={isCompleted
                                                ? "bg-slate-200 text-slate-600 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                                                : "bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm"}>
                                                {isCompleted ? "COMPLETED" : "RESERVED"}
                                            </span>
                                            <p className="font-black text-3xl mt-2 text-slate-800">₹{o.totalCost}</p>

                                            {isCompleted && (
                                                <div className="mt-3 flex items-center justify-center gap-1 bg-white px-3 py-1.5 border border-slate-200 rounded-full">
                                                    <span className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">Rate:</span>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button key={star} onClick={() => handleRate(o.vehicle._id, star)} className={`text-lg hover:scale-125 transition ${star <= existingRating ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}>
                                                            ★
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default UserDashboard;
