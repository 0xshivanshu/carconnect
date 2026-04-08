import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const navigate = useNavigate();
    const routerLocation = useLocation();

    // Checkout form
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [pickupDistrict, setPickupDistrict] = useState('');

    useEffect(() => {
        if (routerLocation.state?.searchResults) {
            setVehicles(routerLocation.state.searchResults);
            if (routerLocation.state?.searchDates) {
                // Ensure date format extraction
                if (routerLocation.state.searchDates.start) setStartDate(routerLocation.state.searchDates.start.split('T')[0]);
                if (routerLocation.state.searchDates.end) setEndDate(routerLocation.state.searchDates.end.split('T')[0]);
            }
        } else {
            fetch('http://localhost:5000/api/user/vehicles')
                .then(res => res.json())
                .then(data => setVehicles(data))
                .catch(err => console.error(err));
        }
    }, [routerLocation.state]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const getBookingPayload = (totalCost) => {
        return {
            vehicleId: selectedVehicle._id,
            startDate,
            endDate,
            pickupLocation,
            pickupDistrict,
            totalCost
        };
    };

    const finalizeBooking = async (payload, token) => {
        try {
            const res = await fetch('http://localhost:5000/api/user/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Payment verified. Booking Confirmed Successfully!");
                navigate('/user/dashboard');
            } else {
                const error = await res.json().catch(() => ({ message: 'Server crashed' }));
                alert(`Booking Finalization Failed: ${error.message}`);
            }
        } catch (err) {
            alert(`Network Error: ${err.message}`);
        }
    };

    const getCostAndValidate = () => {
        if (!startDate || !endDate || !pickupDistrict || !pickupLocation) {
            alert("Please fill out all booking fields completely.");
            return null;
        }
        const token = localStorage.getItem('token');
        const rawUser = localStorage.getItem('user');

        if (!token || !rawUser) {
            alert("Please log in first to proceed with booking!");
            navigate('/signIn');
            return null;
        }

        if (JSON.parse(rawUser).role === 'vendor') {
            alert("Vendors cannot book cars. Please Sign In with a 'User' account.");
            return null;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            alert("Validation Error: You cannot book a pickup date in the past.");
            return null;
        }
        if (end < start) {
            alert("Validation Error: Your return date cannot be before your pickup date.");
            return null;
        }

        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const finalDays = days > 0 ? days : 1;
        return { token, totalCost: finalDays * selectedVehicle.pricePerDay };
    };

    const handleSimulatedPayment = async () => {
        const valid = getCostAndValidate();
        if (!valid) return;
        const { token, totalCost } = valid;

        try {
            const rpRes = await fetch('http://localhost:5000/api/user/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: totalCost })
            });
            const orderData = await rpRes.json();

            const isConfirmed = window.confirm(`Simulating Razorpay Payment UI Checkout\n\nGateway: Razorpay\nAmount: ₹${totalCost}\nOrder ID: ${orderData.id}\n\nClick OK to simulate a successful payment authorization.`);
            if (!isConfirmed) {
                alert("Simulated Payment cancelled.");
                return;
            }

            await finalizeBooking(getBookingPayload(totalCost), token);
        } catch (err) {
            alert(`Simulation Error: ${err.message}`);
        }
    };

    const handleRazorpayPayment = async () => {
        const valid = getCostAndValidate();
        if (!valid) return;
        const { token, totalCost } = valid;

        const res = await loadRazorpayScript();
        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            const rpRes = await fetch('http://localhost:5000/api/user/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: totalCost })
            });
            const orderData = await rpRes.json();

            if (orderData.id && orderData.id.startsWith("simulated_order_")) {
                alert("Razorpay is not fully configured in your .env backend. Attempting to fall back to Simulated Checkout logic. Please provide RAZORPAY_KEY_ID to the backend and VITE_RAZORPAY_KEY_ID to the frontend completely.");
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkeyonly', // Enter the Key ID generated from the Dashboard
                amount: orderData.amount, // Amount is in currency subunits. Default currency is INR.
                currency: orderData.currency || "INR",
                name: "CarConnectPortal",
                description: `Booking: ${selectedVehicle.brand} ${selectedVehicle.name}`,
                image: selectedVehicle.image || "https://placehold.co/100x100",
                order_id: orderData.id,
                handler: async function (response) {
                    // Payment succeeded!
                    const payload = getBookingPayload(totalCost);
                    Object.assign(payload, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    await finalizeBooking(payload, token);
                },
                prefill: {
                    name: JSON.parse(localStorage.getItem('user')).name,
                    email: JSON.parse(localStorage.getItem('user')).email,
                    contact: "9999999999"
                },
                theme: {
                    color: "#16a34a"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response) {
                alert(`Payment Failed: ${response.error.description}`);
            });
            paymentObject.open();

        } catch (err) {
            alert(`Razorpay Session Error: ${err.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-bold mb-8">Available Vehicles</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vehicles.length === 0 ? <p className="text-gray-500">No vehicles available at the moment.</p> : vehicles.map(vehicle => {

                    const ratingArr = vehicle.ratings || [];
                    const avgRating = ratingArr.length ? (ratingArr.reduce((a, b) => a + b.rating, 0) / ratingArr.length).toFixed(1) : 'New';

                    return (
                        <div key={vehicle._id} className="border p-4 rounded-xl shadow-sm hover:shadow-lg transition flex flex-col bg-white">
                            <img src={vehicle.image || "https://placehold.co/600x400?text=No+Image"} alt={vehicle.name} className="w-full h-56 object-cover rounded-md mb-4" />
                            <div className="flex justify-between items-start mb-1">
                                <h2 className="text-2xl font-bold">{vehicle.brand} {vehicle.name}</h2>
                                <div className="bg-yellow-50 text-yellow-600 font-bold px-2 py-1 rounded text-sm flex items-center gap-1 border border-yellow-100">
                                    ⭐ {avgRating}
                                </div>
                            </div>

                            <p className="text-gray-600 font-medium mb-1">{vehicle.type} • {vehicle.transmission} • {vehicle.fuelType}</p>
                            <p className="text-gray-500 text-sm mb-2">Location: {vehicle.location}, {vehicle.district}</p>
                            {vehicle.availableFrom && vehicle.availableUntil && (
                                <p className="text-[11px] font-black text-blue-700 bg-blue-100 inline-block px-2 py-1 rounded border border-blue-200 uppercase tracking-widest mb-1 mt-1">
                                    Available: {new Date(vehicle.availableFrom).toLocaleDateString()} to {new Date(vehicle.availableUntil).toLocaleDateString()}
                                </p>
                            )}
                            <p className="text-2xl font-black mb-4 mt-2">₹{vehicle.pricePerDay} <span className="text-sm font-normal text-gray-500">/ day</span></p>
                            <button onClick={() => {
                                setSelectedVehicle(vehicle);
                                setPickupLocation(vehicle.location || '');
                                setPickupDistrict(vehicle.district || '');
                            }} className="bg-black text-white font-bold px-4 py-3 rounded-md mt-auto hover:bg-gray-800 transition shadow-md">Book Now</button>
                        </div>
                    )
                })}
            </div>

            {selectedVehicle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/20 transform transition-all">
                        {/* Immersive Dark Image Header */}
                        <div className="h-32 w-full relative bg-slate-800">
                            <img src={selectedVehicle.image || "https://placehold.co/600x400"} className="w-full h-full object-cover opacity-70" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                            <button onClick={() => setSelectedVehicle(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full w-8 h-8 flex items-center justify-center transition font-bold">✕</button>
                            <div className="absolute bottom-4 left-6">
                                <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1 shadow-sm">Checkout Booking</p>
                                <h2 className="text-3xl font-black text-white drop-shadow-md">{selectedVehicle.brand} {selectedVehicle.name}</h2>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50">
                            <form className="flex flex-col gap-5">
                                <div className="flex gap-4">
                                    <div className="w-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Date</label>
                                        <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-slate-200 p-3 rounded-lg w-full mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition shadow-sm bg-white" />
                                    </div>
                                    <div className="w-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return Date</label>
                                        <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-slate-200 p-3 rounded-lg w-full mt-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition shadow-sm bg-white" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">District</label>
                                        <input type="text" required placeholder="e.g. Mumbai" value={pickupDistrict} onChange={e => setPickupDistrict(e.target.value)} className="border border-slate-200 p-3 rounded-lg w-full mt-1 bg-slate-100 text-slate-600 font-medium" readOnly />
                                    </div>
                                    <div className="w-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specific Area</label>
                                        <input type="text" required placeholder="e.g. Bandra West" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="border border-slate-200 p-3 rounded-lg w-full mt-1 bg-slate-100 text-slate-600 font-medium" readOnly />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center text-lg shadow-sm mt-2">
                                    <span className="font-bold text-slate-600">Total Estimate:</span>
                                    <span className="font-black text-emerald-600 text-3xl">
                                        ₹{startDate && endDate ? (selectedVehicle.pricePerDay * Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)))).toLocaleString() : 0}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3 mt-4">
                                    <button type="button" onClick={handleRazorpayPayment} className="w-full bg-slate-900 border border-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg text-lg flex justify-center items-center gap-2">
                                        <span className="text-blue-400">⚡</span> Pay Securely with Razorpay
                                    </button>
                                    <button type="button" onClick={handleSimulatedPayment} className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-4 rounded-xl hover:bg-emerald-100 transition shadow-sm text-md">
                                        Simulate Dev Checkout
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Vehicles;
