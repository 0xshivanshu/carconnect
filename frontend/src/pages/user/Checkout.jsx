import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { resolveVehicleImage } from '../../utils/vehicleImage';
import VehicleSilhouette from '../../components/VehicleSilhouette';

const DELIVERY_FEE = 200;
const COUPONS = {
    SAVE10: { type: 'percent', value: 10 },
    FLAT200: { type: 'flat', value: 200 }
};

const toDateInput = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toDateInput(d);
};

const Row = ({ label, value }) => (
    <div className="flex items-center justify-between px-5 py-3.5">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
);

const ScheduleField = ({ label, value, onChange, type = 'text' }) => (
    <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {onChange ? (
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 border-b border-slate-200 focus:outline-none focus:border-emerald-500 pb-1"
            />
        ) : (
            <p className="mt-1 text-sm font-semibold text-slate-800">{value || '—'}</p>
        )}
    </div>
);

const FloatingInput = ({ label, type, value, onChange, textarea }) => {
    const base = "peer w-full border border-slate-200 rounded-xl bg-white px-4 pb-2.5 pt-6 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
    return (
        <div className="relative">
            {textarea ? (
                <textarea rows={3} value={value} onChange={onChange} placeholder=" " className={`${base} resize-none`} />
            ) : (
                <input type={type} value={value} onChange={onChange} placeholder=" " className={base} />
            )}
            <label className="absolute left-4 top-4 text-sm text-slate-400 transition-all pointer-events-none peer-focus:top-2 peer-focus:text-xs peer-focus:text-emerald-600 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
                {label}
            </label>
        </div>
    );
};

function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const apiUrl = import.meta.env.VITE_API_URL;
    const state = location.state || {};

    const vehicle = state.vehicle;
    const [imageUrl, setImageUrl] = useState(null);

    const [startDate, setStartDate] = useState(state.startDate || daysFromNow(1));
    const [endDate, setEndDate] = useState(state.endDate || daysFromNow(3));
    const [pickupTime, setPickupTime] = useState('10:00');
    const [dropoffTime, setDropoffTime] = useState('10:00');
    const [pickupDistrict, setPickupDistrict] = useState(state.pickupDistrict || vehicle?.district || '');
    const [pickupLocation, setPickupLocation] = useState(state.pickupLocation || vehicle?.location || '');

    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const [couponCode, setCouponCode] = useState('');
    const [coupon, setCoupon] = useState(null);
    const [couponMsg, setCouponMsg] = useState('');

    useEffect(() => {
        if (!vehicle) navigate('/vehicles', { replace: true });
    }, [vehicle, navigate]);

    useEffect(() => {
        if (vehicle) resolveVehicleImage(vehicle).then(setImageUrl);
    }, [vehicle]);

    const days = useMemo(() => {
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    }, [startDate, endDate]);

    const rentPerDay = vehicle?.pricePerDay || 0;
    const rentTotal = rentPerDay * days;

    const discount = useMemo(() => {
        if (!coupon) return 0;
        if (coupon.type === 'percent') return Math.round((rentTotal * coupon.value) / 100);
        return Math.min(coupon.value, rentTotal);
    }, [coupon, rentTotal]);

    const grandTotal = rentTotal + DELIVERY_FEE - discount;

    const applyCoupon = () => {
        const code = couponCode.trim().toUpperCase();
        if (!code) {
            setCoupon(null);
            setCouponMsg('Please enter a coupon code.');
            return;
        }
        if (COUPONS[code]) {
            setCoupon(COUPONS[code]);
            setCouponMsg(`Coupon ${code} applied!`);
        } else {
            setCoupon(null);
            setCouponMsg('Invalid coupon code.');
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const getBookingPayload = (totalCost) => ({
        vehicleId: vehicle._id,
        startDate,
        endDate,
        pickupLocation,
        pickupDistrict,
        totalCost
    });

    const finalizeBooking = async (payload, token) => {
        try {
            const res = await fetch(`${apiUrl}api/user/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

    const getValidated = () => {
        if (!vehicle) return null;
        const token = localStorage.getItem('token');
        if (!token || !rawUser) {
            alert("Please log in first to proceed with booking!");
            navigate('/signIn', { state: { from: '/checkout', vehicle, startDate, endDate, pickupDistrict, pickupLocation } });
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
        if (start < today) { alert("Validation Error: You cannot book a pickup date in the past."); return null; }
        if (end < start) { alert("Validation Error: Your return date cannot be before your pickup date."); return null; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { alert('Please enter a valid email address.'); return null; }
        if (!/^\d{10}$/.test(phone)) { alert('Please enter a valid 10-digit phone number.'); return null; }
        if (!address.trim()) { alert('Please enter your delivery address.'); return null; }

        return { token, totalCost: grandTotal };
    };

    const handleSimulatedPayment = async () => {
        const valid = getValidated();
        if (!valid) return;
        const { token, totalCost } = valid;

        try {
            const rpRes = await fetch(`${apiUrl}api/user/create-order`, {
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
        const valid = getValidated();
        if (!valid) return;
        const { token, totalCost } = valid;

        const loaded = await loadRazorpayScript();
        if (!loaded) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            const rpRes = await fetch(`${apiUrl}api/user/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: totalCost })
            });
            const orderData = await rpRes.json();

            if (orderData.id && orderData.id.startsWith("simulated_order_")) {
                alert("Razorpay is not fully configured in your .env backend. Please provide RAZORPAY_KEY_ID to the backend and VITE_RAZORPAY_KEY_ID to the frontend completely, or use Simulate Dev Checkout.");
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkeyonly',
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "CarConnectPortal",
                description: `Booking: ${vehicle.brand} ${vehicle.name}`,
                image: imageUrl || "https://placehold.co/100x100",
                order_id: orderData.id,
                handler: async function (response) {
                    const payload = getBookingPayload(totalCost);
                    Object.assign(payload, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    await finalizeBooking(payload, token);
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || email,
                    contact: phone
                },
                theme: { color: "#16a34a" }
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

    if (!vehicle) return null;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="w-full border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <Link to="/" className="text-lg font-black text-slate-900">CarConnectPortal</Link>
                    <Link to="/vehicles" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition">← Back to Vehicles</Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Left Column: Order Summary */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                            <h1 className="text-2xl font-black text-slate-900">Order Summary</h1>
                            <p className="text-sm text-slate-500 mt-1">Check your items. And select a suitable payment method.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Item Details */}
                            <div className="flex gap-6">
                                <div className="w-44 h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={`${vehicle.brand} ${vehicle.name}`} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <VehicleSilhouette type={vehicle.type} className="w-full h-full p-4 text-slate-300" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900">{vehicle.brand} {vehicle.name}</h3>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                                        <span className="text-slate-400">Package</span>
                                        <span className="font-semibold text-slate-700">Standard</span>
                                        <span className="text-slate-400">Fuel Type</span>
                                        <span className="font-semibold text-slate-700 capitalize">{vehicle.fuelType || '—'}</span>
                                        <span className="text-slate-400">Transmission</span>
                                        <span className="font-semibold text-slate-700 capitalize">{vehicle.transmission || '—'}</span>
                                        <span className="text-slate-400">Registration</span>
                                        <span className="font-semibold text-slate-700">Not Provided</span>
                                    </div>
                                    <p className="mt-4 text-base font-black text-slate-900">
                                        ₹{vehicle.pricePerDay} <span className="text-xs font-normal text-slate-400">/ per day</span>
                                    </p>
                                </div>
                            </div>

                            {/* Schedule Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Pick up</p>
                                    <ScheduleField label="City" value={pickupDistrict} onChange={setPickupDistrict} />
                                    <ScheduleField label="Pickup Spot" value={pickupLocation} onChange={setPickupLocation} />
                                    <ScheduleField label="Pickup Date" value={startDate} onChange={setStartDate} type="date" />
                                    <ScheduleField label="Pickup Time" value={pickupTime} onChange={setPickupTime} type="time" />
                                </div>
                                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Return</p>
                                    <ScheduleField label="Return Date" value={endDate} onChange={setEndDate} type="date" />
                                    <ScheduleField label="Return Time" value={dropoffTime} onChange={setDropoffTime} type="time" />
                                </div>
                            </div>

                            {/* Policy Banner */}
                            <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                                <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center mt-0.5">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 10.5l4 4 8-9" />
                                    </svg>
                                </span>
                                <p className="text-sm leading-relaxed text-emerald-800">
                                    Downtime charges apply if the vehicle is returned after the scheduled drop-off time. Early returns and same-day cancellations within 24 hours of pickup may incur a charge of up to one day's rental. Fuel is not included in the rental price.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Right Column: Payment Details */}
                    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                            <h2 className="text-2xl font-black text-slate-900">Payment Details</h2>
                            <p className="text-sm text-slate-500 mt-1">Complete your order by providing your payment details.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Contact Form */}
                            <div className="space-y-4">
                                <FloatingInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                <FloatingInput label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                                <FloatingInput label="Delivery Address" value={address} onChange={e => setAddress(e.target.value)} textarea />
                            </div>

                            {/* Coupon Code */}
                            <div>
                                <div className="flex gap-3">
                                    <input
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value)}
                                        placeholder="save10"
                                        className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    />
                                    <button
                                        onClick={applyCoupon}
                                        className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition shadow-md shrink-0"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponMsg && (
                                    <p className={`mt-2 text-xs font-semibold ${coupon ? 'text-emerald-600' : 'text-red-500'}`}>{couponMsg}</p>
                                )}
                            </div>

                            {/* Price Breakdown */}
                            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                                <Row label="Rent per day" value={`₹${rentPerDay.toLocaleString()}`} />
                                <Row label="Total Days" value={`${days} day${days > 1 ? 's' : ''}`} />
                                <Row label="Shipping / Delivery Fee" value={`₹${DELIVERY_FEE.toLocaleString()}`} />
                                <Row label="Coupon Discount" value={discount ? `− ₹${discount.toLocaleString()}` : '—'} />
                            </div>

                            {/* Grand Total */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="font-bold text-slate-700">Total</span>
                                <span className="text-3xl font-black text-emerald-600">₹{grandTotal.toLocaleString()}</span>
                            </div>

                            {/* Submit */}
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleRazorpayPayment}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition shadow-lg"
                                >
                                    Place Order
                                </button>
                                <button
                                    onClick={handleSimulatedPayment}
                                    className="w-full text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
                                >
                                    Simulate Dev Checkout
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Checkout;
