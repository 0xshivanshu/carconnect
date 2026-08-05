export const HeroGrid = () => {
    return (
        <div className="w-full px-4 md:px-8 mb-20 mt-10">
            <div className="max-w-[1300px] mx-auto bg-slate-50 border border-slate-100 rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden">
                {/* Left Text */}
                <div className="w-full md:w-1/2 z-10 mb-12 md:mb-0 md:pl-6">
                    <p className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-3 block">The CarConnect Advantage</p>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight mb-5">
                        Fast, Reliable, and Secure.<br /><span className="text-slate-500 font-medium">Rent with Confidence.</span>
                    </h2>
                    <p className="text-slate-500 text-md mb-8 max-w-md">
                        Join thousands of verified drivers experiencing the apex of automotive logistics. We ensure every ride is smooth and safe.
                    </p>
                    <div className="flex gap-4">
                        <div className="bg-white border border-slate-200 p-4 min-w-[100px] rounded-xl text-center shadow-sm transition hover:shadow flex flex-col items-center">
                            <p className="text-emerald-600 font-black text-2xl">5.0</p>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Stars</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-4 min-w-[100px] rounded-xl text-center shadow-sm transition hover:shadow flex flex-col items-center">
                            <p className="text-slate-800 font-black text-2xl">24/7</p>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Support</p>
                        </div>
                    </div>
                </div>

                {/* Right Image Frame */}
                <div className="w-full md:w-1/2 relative flex justify-center items-center z-10">
                    <img
                        src="https://res.cloudinary.com/u3e9diev/image/upload/v1785889313/mohamed_hassan-car-9669401_1920_hecysw.png"
                        className="w-full max-w-[500px] object-contain drop-shadow-md md:ml-10 transition-transform hover:translate-y-[-5px]"
                        alt="Premium Fleet Selection"
                    />
                </div>
            </div>
        </div>
    );
};
