import { navLinks } from "../constants";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Header() {
    const [nav, setNav] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const location = useLocation();

    // Read the auth tokens out of local storage immediately on paint
    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
            setCurrentUser(JSON.parse(rawUser));
        }
    }, []);

    const isVendor = currentUser?.role === 'vendor';
    const dashboardPath = isVendor ? '/vendor/dashboard' : '/user/dashboard';
    const isDashboardActive = location.pathname === dashboardPath;
    const activeHoverColor = isVendor ? 'hover:text-blue-600 hover:border-blue-600' : 'hover:text-green-600 hover:border-green-600';
    const activeTextColor = isVendor ? 'hover:text-blue-600' : 'hover:text-green-600';

    return (
        <div className={`w-full flex justify-between items-center px-6 sm:px-12 md:px-18 lg:py-6 lg:px-28 pt-10 mt-5 md:mt-10 sm:max-w-[900px] lg:max-w-[1500px] mx-auto`}>
            <Link to="/">
                <div className={`text-[16px] md:text-[18px] lg:text-[20px] font-poppins font-bold`}>
                    CarConnectPortal
                </div>
            </Link>
            <div className="hidden lg:block">
                <ul className="flex list-none items-center gap-8">
                    {navLinks.map((navlink) => {
                        let finalPath = navlink.path;
                        let finalTitle = navlink.title;
                        if (isVendor && navlink.path === '/vehicles') {
                            finalPath = '/vendor/fleet';
                            finalTitle = 'Your Fleet';
                        }
                        const isActive = location.pathname === finalPath;
                        return (
                            <li key={navlink.id}>
                                <Link to={finalPath} className={`text-black font-poppins cursor-pointer font-semibold transition ${activeTextColor} ${isActive ? 'border-b-2 border-black pb-1' : ''}`}>
                                    {finalTitle}
                                </Link>
                            </li>
                        )
                    })}
                    {currentUser && (
                        <li>
                            <Link to={dashboardPath} className={`text-black font-poppins cursor-pointer font-black transition ${activeHoverColor} ${isDashboardActive ? 'border-b-[3px] border-black pb-1' : ''}`}>
                                Dashboard
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
            <div className="flex gap-2 relative z-50">
                <div className="hidden md:inline-flex">
                    {currentUser ? (
                        <Link to={dashboardPath}>
                            <button className={`bg-black text-white hidden lg:inline-flex py-1 text-[12px] md:text-[14px] sm:py-[7px] px-3 sm:px-6 font-normal sm:font-bold rounded-md hover:bg-gray-800 transition`}>
                                Account
                            </button>
                        </Link>
                    ) : (
                        <Link to={"/signIn"}>
                            <button className={`border-[1px] hidden lg:inline-flex border-green-500 py-1 text-[12px] md:text-[14px] sm:py-[7px] px-3 sm:px-6 font-normal sm:font-bold rounded-md hover:bg-green-50 text-green-700 transition`}>
                                Sign In / Up
                            </button>
                        </Link>
                    )}
                </div>
                {/* Mobile Menu Toggle */}
                <div className="relative lg:hidden flex justify-center items-center z-50">
                    <button onClick={() => setNav(!nav)} className="text-2xl font-bold p-2 z-50 relative">
                        {nav ? '✕' : '☰'}
                    </button>

                    {/* Mobile Dropdown Menu without AntD */}
                    {nav && (
                        <div className="absolute top-12 right-0 bg-white shadow-2xl p-8 rounded-xl flex flex-col items-start gap-y-6 z-50 w-64 border border-gray-100">
                            {navLinks.map((navlink, index) => {
                                let finalPath = navlink.path;
                                let finalTitle = navlink.title;
                                if (isVendor && navlink.path === '/vehicles') {
                                    finalPath = '/vendor/fleet';
                                    finalTitle = 'Your Fleet';
                                }
                                return (
                                    <Link key={index} to={finalPath} className={`text-xl font-bold ${activeTextColor}`} onClick={() => setNav(false)}>
                                        {finalTitle}
                                    </Link>
                                )
                            })}
                            {currentUser && (
                                <Link to={dashboardPath} className={`text-xl font-black text-black ${activeTextColor} border-t border-gray-100 pt-3 w-full`} onClick={() => setNav(false)}>
                                    My Dashboard
                                </Link>
                            )}
                            <div className="w-full mt-2 pt-4 border-t border-gray-100">
                                {currentUser ? (
                                    <Link to={dashboardPath}>
                                        <button className={`bg-black text-white py-3 px-4 rounded-md text-lg font-bold w-full hover:bg-gray-800 transition shadow-lg`} onClick={() => setNav(false)}>
                                            My Account
                                        </button>
                                    </Link>
                                ) : (
                                    <Link to={"/signIn"}>
                                        <button className={`bg-green-500 text-white py-3 px-4 rounded-md text-lg font-bold w-full hover:bg-green-600 transition shadow-lg`} onClick={() => setNav(false)}>
                                            Sign In
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Header;
