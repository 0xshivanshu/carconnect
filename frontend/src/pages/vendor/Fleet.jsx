import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VendorFleet() {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);

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
        const res = await fetch('http://localhost:5000/api/vendor/vehicles', { headers: getHeaders() });
        if (res.ok) setVehicles(await res.json());
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/vendor/vehicles', {
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

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-slate-900 drop-shadow-sm">Your Fleet Operations</h1>
                    <button onClick={() => navigate('/vendor/dashboard')} className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-slate-700 transition">&larr; Back to Dashboard</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ADD FORM HERE */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-slate-800">Add New Vehicle</h2>
                        <form onSubmit={handleAddVehicle} className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <input type="text" placeholder="Brand" required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="border p-3 rounded-lg w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                <input type="text" placeholder="Model Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-3 rounded-lg w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="flex gap-4">
                                <input type="text" placeholder="City / District" required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className="border p-3 rounded-lg w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                <input type="text" placeholder="Exact Location Area" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="border p-3 rounded-lg w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-4">
                                <div className="w-1/2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Available From</label>
                                    <input type="date" required value={formData.availableFrom} onChange={e => setFormData({ ...formData, availableFrom: e.target.value })} className="border p-2 rounded-lg w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                                <div className="w-1/2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Available Until</label>
                                    <input type="date" required value={formData.availableUntil} onChange={e => setFormData({ ...formData, availableUntil: e.target.value })} className="border p-2 rounded-lg w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="SUV">SUV</option>
                                    <option value="Sedan">Sedan</option>
                                    <option value="Hatchback">Hatchback</option>
                                </select>
                                <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })} className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="Automatic">Automatic</option>
                                    <option value="Manual">Manual</option>
                                </select>
                            </div>
                            <input type="number" placeholder="Price Per Day (₹)" required value={formData.pricePerDay} onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })} className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            <input type="url" placeholder="Image URL" required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            <button type="submit" className="bg-blue-600 text-white font-bold py-4 rounded-xl mt-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200">List Vehicle to Fleet</button>
                        </form>
                    </div>

                    {/* FLEET DISPLAY HERE */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-slate-800">Your Active Fleet</h2>
                        <div className="flex flex-col gap-5 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar pt-2 pl-2">
                            {vehicles.length === 0 ? <p className="text-slate-400 font-medium">You haven't listed any vehicles yet.</p> : vehicles.map(v => {
                                const ratingArr = v.ratings || [];
                                const avgRating = ratingArr.length ? (ratingArr.reduce((a, b) => a + b.rating, 0) / ratingArr.length).toFixed(1) : 'New';

                                return (
                                    <div key={v._id} className="flex gap-4 items-center border border-slate-100 p-3 rounded-xl bg-slate-50 hover:bg-white transition relative shadow-sm">
                                        <div className="absolute top-[-10px] left-[-10px] bg-yellow-100 border border-yellow-200 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm z-10 flex gap-1 items-center">⭐ {avgRating}</div>
                                        <img src={v.image || "https://placehold.co/100x100"} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 text-lg">{v.brand} {v.name}</p>
                                            <p className="text-xs text-slate-500 mb-2 font-medium">{v.location}, {v.district}</p>
                                            <p className="text-[11px] font-black text-blue-700 bg-blue-100 inline-block px-2 py-1 rounded border border-blue-200 uppercase tracking-widest">
                                                {new Date(v.availableFrom).toLocaleDateString()} to {new Date(v.availableUntil).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="font-black text-slate-900 text-lg">₹{v.pricePerDay}<span className="text-sm font-normal text-slate-400">/day</span></span>
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

export default VendorFleet;
