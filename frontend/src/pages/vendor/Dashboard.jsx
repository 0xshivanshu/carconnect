import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function VendorDashboard() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [vehicles, setVehicles] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) return navigate('/signIn');
        if (JSON.parse(rawUser).role !== 'vendor') return navigate('/user/dashboard');
        fetchVehicles();
        fetchOrders();
    }, [navigate]);

    const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` });

    const fetchVehicles = async () => {
        const res = await fetch(`${apiUrl}api/vendor/vehicles`, { headers: getHeaders() });
        if (res.ok) setVehicles(await res.json());
    };

    const fetchOrders = async () => {
        const res = await fetch(`${apiUrl}api/vendor/orders`, { headers: getHeaders() });
        if (res.ok) setOrders(await res.json());
    };

    const totalEarnings = orders.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalBookings = orders.length;
    const activeVehicles = vehicles.length;

    const earningsDataObj = {};
    orders.forEach(o => {
        const month = new Date(o.createdAt || o.startDate || new Date()).toLocaleString('default', { month: 'short' });
        if (!earningsDataObj[month]) earningsDataObj[month] = 0;
        earningsDataObj[month] += o.totalCost;
    });

    const chartData = Object.keys(earningsDataObj).map(key => ({ name: key, Earnings: earningsDataObj[key] }));
    if (chartData.length === 0) chartData.push({ name: 'No Data', Earnings: 0 });

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-slate-900 drop-shadow-sm">Vendor Analytics Portal</h1>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-600 transition">Logout</button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl text-white transform hover:-translate-y-1 transition duration-300">
                        <h3 className="text-blue-200 font-bold mb-1 uppercase tracking-wider text-sm">Total Earnings</h3>
                        <p className="text-5xl font-black">₹{totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transform hover:-translate-y-1 transition duration-300">
                        <h3 className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-sm">Total Bookings</h3>
                        <p className="text-5xl font-black text-slate-800">{totalBookings}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transform hover:-translate-y-1 transition duration-300 cursor-pointer" onClick={() => navigate('/vendor/fleet')}>
                        <h3 className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-sm">Active Fleet</h3>
                        <p className="text-5xl font-black text-slate-800">{activeVehicles} <span className="text-sm font-medium tracking-normal text-blue-500 underline ml-2">Manage &rarr;</span></p>
                    </div>
                </div>

                {/* Graph Section */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8 h-[400px]">
                    <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">Revenue Analytics</h2>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="Earnings" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <h2 className="text-3xl font-bold mt-16 mb-6 text-slate-800">Incoming Alerts</h2>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                    {orders.length === 0 ? <p className="text-slate-500 font-medium">No active bookings yet.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orders.map(o => (
                                <div key={o._id} className="p-6 border border-blue-100 rounded-xl bg-gradient-to-br from-blue-50 to-white flex flex-col justify-between shadow-sm hover:shadow-md transition">
                                    <div className="mb-4">
                                        <p className="font-black text-2xl text-slate-800">{o.vehicle?.brand} {o.vehicle?.name}</p>
                                        <p className="text-slate-600 font-medium mt-1">Client: {o.user?.name}</p>
                                        <p className="text-sm text-blue-700 mt-2 font-bold bg-blue-100/50 inline-block px-3 py-1 rounded-full border border-blue-200">
                                            {new Date(o.startDate).toLocaleDateString()} &rarr; {new Date(o.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-blue-100 pt-4 mt-2">
                                        <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm tracking-wider">CONFIRMED</span>
                                        <p className="font-black text-3xl text-slate-800">₹{o.totalCost}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default VendorDashboard;
