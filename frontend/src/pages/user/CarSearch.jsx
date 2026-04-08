import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const CarSearch = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        pickup_district: "",
        pickup_location: "",
        dropoff_location: "",
        pickuptime: "",
        dropofftime: "",
    });
    const [districtData, setDistrictData] = useState([]);
    const [wholeData, setWholeData] = useState([]);
    const [locationsOfDistrict, setLocationsOfDistrict] = useState([]);
    const [error, setError] = useState(null);

    const uniqueDistrict = [...new Set(districtData)];

    useEffect(() => {
        fetch('http://localhost:5000/api/user/vehicles')
            .then(res => res.json())
            .then(data => {
                const extracted = data.map(v => ({ district: v.district, location: v.location }));
                // filter duplicates
                const uniqueData = Array.from(new Set(extracted.map(a => JSON.stringify(a)))).map(a => JSON.parse(a));
                setWholeData(uniqueData);
                setDistrictData(uniqueData.map(d => d.district));
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (formData.pickup_district) {
            const showLocationInDistrict = wholeData
                .filter((cur) => cur.district === formData.pickup_district)
                .map((cur) => cur.location);
            setLocationsOfDistrict(showLocationInDistrict);
        }
    }, [formData.pickup_district, wholeData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleData = async (e) => {
        e.preventDefault();
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

            const res = await fetch("http://localhost:5000/api/user/showSingleofSameModel", {
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
            navigate("/vehicles", {
                state: {
                    searchResults: result,
                    searchDates: { start: formData.pickuptime, end: formData.dropofftime }
                }
            });
            setFormData({
                pickup_district: "",
                pickup_location: "",
                dropoff_location: "",
                pickuptime: "",
                dropofftime: "",
            });
        } catch (error) {
            console.log("Error: ", error);
        }
    };

    return (
        <section id="booking-section" className="mx-auto max-w-[1300px] px-4 md:px-8 relative z-20">
            <div className="bg-white/80 backdrop-blur-2xl border border-white p-8 md:p-10 shadow-2xl rounded-3xl w-full">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><span className="text-emerald-500">📍</span> Search Available Fleet</h2>

                {error && <p className="text-red-500 mb-4 font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
                <form onSubmit={handleData} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">

                    <div className="flex flex-col">
                        <label htmlFor="pickup_district" className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Pick-up District <span className="text-emerald-500">*</span></label>
                        <select
                            name="pickup_district"
                            required
                            value={formData.pickup_district}
                            onChange={handleChange}
                            className="p-4 border border-slate-200 rounded-xl shadow-sm capitalize bg-white/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition appearance-none"
                        >
                            <option value="">Select Region</option>
                            {uniqueDistrict?.map((cur, idx) => (
                                <option value={cur} key={idx}>{cur}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="pickup_location" className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Specific Area <span className="text-emerald-500">*</span></label>
                        <select
                            name="pickup_location"
                            required
                            value={formData.pickup_location}
                            onChange={handleChange}
                            className="p-4 border border-slate-200 rounded-xl shadow-sm capitalize bg-white/70 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition appearance-none"
                        >
                            <option value="">Exact Location</option>
                            {locationsOfDistrict?.map((loc, idx) => (
                                <option value={loc} key={idx}>{loc}</option>
                            ))}
                        </select>
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
