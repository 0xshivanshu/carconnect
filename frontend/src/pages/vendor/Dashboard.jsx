import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { resolveVehicleImage } from "../../utils/vehicleImage";
import VehicleSilhouette from "../../components/VehicleSilhouette";

function VendorDashboard() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [vehicles, setVehicles] = useState([]);
    const [orders, setOrders] = useState([]);
    const [imageUrls, setImageUrls] = useState({});

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

    const getOrderImage = (o) => (o.vehicle ? imageUrls[o.vehicle._id] || null : null);

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

    const StatCard = ({ title, value, accent, onClick }) => (
        <div onClick={onClick} className={`p-6 rounded-2xl transform hover:-translate-y-1 transition duration-300 ${accent ? 'bg-blue-50/70 border border-blue-100' : 'bg-white border border-slate-200 shadow-sm'} ${onClick ? 'cursor-pointer' : ''}`}>
            <h3 className={`font-bold mb-2 uppercase tracking-wider text-sm ${accent ? 'text-blue-700' : 'text-slate-500'}`}>{title}</h3>
            <p className={`text-4xl font-black ${accent ? 'text-blue-900' : 'text-slate-800'}`}>
                {value}
                {onClick && <span className="text-sm font-medium tracking-normal text-blue-600 underline ml-2">Manage &rarr;</span>}
            </p>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            <div className="container mx-auto px-5 md:px-10 py-12 max-w-[1500px]">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Vendor Portal</p>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Analytics</h1>
                        <p className="text-slate-500 font-medium mt-4">Track your earnings, bookings, and fleet performance at a glance.</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="self-start lg:self-auto shrink-0 border border-slate-300 text-slate-700 hover:bg-white bg-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2">
                        Logout
                    </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard title="Total Earnings" value={`₹${totalEarnings.toLocaleString()}`} accent />
                    <StatCard title="Total Bookings" value={totalBookings} />
                    <StatCard title="Active Fleet" value={activeVehicles} onClick={() => navigate('/vendor/fleet')} />
                </div>

                {/* Graph Section */}
                <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm mb-16 h-[380px]">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                        <h2 className="text-2xl font-bold text-slate-800">Revenue Analytics</h2>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">Monthly</span>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="Earnings" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Incoming Alerts */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                        Incoming Bookings <span className="text-slate-400 font-bold text-lg">({orders.length})</span>
                    </h2>
                </div>
                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center py-20 px-6 text-center">
                        <p className="text-lg font-bold text-slate-700">No bookings yet</p>
                        <p className="text-slate-400 font-medium mt-2 max-w-sm">When customers rent your vehicles, their bookings will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orders.map(o => (
                            <div key={o._id} className="p-6 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white hover:border-slate-300 transition flex flex-col justify-between shadow-sm">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-28 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                                        {getOrderImage(o) ? (
                                            <img src={getOrderImage(o)} alt={`${o.vehicle?.brand} ${o.vehicle?.name}`} loading="lazy" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <VehicleSilhouette type={o.vehicle?.type} className="w-full h-full p-2 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-lg text-slate-800 truncate">{o.vehicle?.brand} {o.vehicle?.name}</p>
                                        <p className="text-slate-500 font-medium text-sm mt-1">Client: {o.user?.name}</p>
                                        <p className="text-[11px] text-blue-700 mt-2 font-bold bg-blue-100/60 inline-block px-3 py-1 rounded-full border border-blue-200">
                                            {new Date(o.startDate).toLocaleDateString()} &rarr; {new Date(o.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-200 pt-4 mt-2">
                                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm tracking-wider">CONFIRMED</span>
                                    <p className="font-black text-2xl text-slate-800">₹{o.totalCost.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
export default VendorDashboard;
