import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserDashboard() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ name: '', email: '', _id: '' });

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

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-slate-900 drop-shadow-sm">My Portal</h1>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-slate-800 transition">Logout</button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-xl text-white transform hover:-translate-y-1 transition duration-300">
                        <h3 className="text-emerald-200 font-bold mb-1 uppercase tracking-wider text-sm">Total Lifetime Miles</h3>
                        <p className="text-5xl font-black">{totalTrips} <span className="text-xl font-medium tracking-normal text-emerald-300">Trips</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transform hover:-translate-y-1 transition duration-300">
                        <h3 className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-sm">Lifetime Expenditure</h3>
                        <p className="text-5xl font-black text-slate-800">₹{totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transform hover:-translate-y-1 transition duration-300">
                        <h3 className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-sm">Active & Upcoming</h3>
                        <p className="text-5xl font-black text-slate-800">{activeRentals} <span className="text-xl font-medium tracking-normal text-slate-500">Rentals</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Section */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 self-start">
                        <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-slate-800">Profile Settings</h2>
                        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="border border-slate-300 p-3 rounded-lg w-full mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Document</label>
                                <input type="email" value={profile.email} disabled className="border border-slate-200 p-3 rounded-lg w-full mt-1 bg-slate-100 text-slate-400 font-medium select-none" />
                            </div>
                            <button type="submit" className="bg-emerald-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">Save Modifications</button>
                        </form>
                    </div>

                    {/* Bookings Section */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-slate-800">Booking History</h2>
                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {orders.length === 0 ? <p className="text-slate-400 font-medium">You haven't booked any vehicles yet.</p> : orders.map(o => {
                                const isCompleted = new Date() > new Date(o.endDate);
                                const existingRatingObject = o.vehicle?.ratings?.find(r => r.user === profile._id);
                                const existingRating = existingRatingObject ? existingRatingObject.rating : 0;

                                return (
                                    <div key={o._id} className="flex flex-col xl:flex-row justify-between items-start xl:items-center border border-slate-100 p-5 rounded-xl bg-slate-50 hover:bg-white transition hover:shadow-md">
                                        <div className="flex gap-5 items-center w-full">
                                            <img src={o.vehicle?.image || "https://placehold.co/100x100"} className="w-24 h-24 object-cover rounded-lg shadow-sm border border-slate-200" />
                                            <div className="flex-1">
                                                <p className="font-black text-xl text-slate-800">{o.vehicle?.brand} {o.vehicle?.name}</p>
                                                <p className="text-slate-600 font-medium mb-2 opacity-90"><span className="font-bold text-slate-400">PICKUP:</span> {o.pickupLocation || o.vehicle?.location}, {o.pickupDistrict || o.vehicle?.district}</p>
                                                <p className="text-xs font-bold text-emerald-700 bg-emerald-100 inline-block px-3 py-1 rounded-full border border-emerald-200 tracking-wider">
                                                    {new Date(o.startDate).toLocaleDateString()} &rarr; {new Date(o.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 xl:mt-0 xl:text-right w-full xl:w-auto flex flex-col items-start xl:items-end justify-center border-t xl:border-t-0 border-slate-200 pt-4 xl:pt-0">
                                            <span className={isCompleted
                                                ? "bg-slate-200 text-slate-600 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                                                : "bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm"}>
                                                {isCompleted ? "COMPLETED" : "RESERVED"}
                                            </span>
                                            <p className="font-black text-3xl mt-2 text-slate-800">₹{o.totalCost}</p>

                                            {isCompleted && (
                                                <div className="mt-3 flex items-center justify-center gap-1 bg-white px-3 py-1.5 border border-slate-200 rounded-full shadow-sm">
                                                    <span className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">Rate:</span>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button key={star} onClick={() => handleRate(o.vehicle._id, star)} className={`text-lg hover:scale-125 transition drop-shadow-sm ${star <= existingRating ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}>
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
