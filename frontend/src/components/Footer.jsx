import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="bg-black text-white pt-16 pb-8">
            <div className="container mx-auto px-4 sm:px-8 lg:px-20">
                <div className="flex flex-col md:flex-row justify-between mb-12">

                    <div className="mb-8 md:mb-0 md:w-1/3">
                        <h2 className="text-2xl font-bold mb-4">CarConnectPortal</h2>
                        <p className="text-gray-400 text-sm">Your premium car rental destination.</p>
                    </div>

                    <div className="flex gap-16">
                        <div>
                            <h3 className="font-semibold text-sm mb-4 text-gray-300">ABOUT</h3>
                            <ul className="flex flex-col gap-3 text-sm text-gray-400">
                                <li><Link to="/enterprise" className="hover:text-white transition">CarConnectPortal</Link></li>
                                <li><Link to="/vehicles" className="hover:text-white transition">Car rental</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-4 text-gray-300">FOLLOW US</h3>
                            <ul className="flex flex-col gap-3 text-sm text-gray-400">
                                <li><a href="https://www.github.com/0xShivanshu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Github</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-4 text-gray-300">LEGAL</h3>
                            <ul className="flex flex-col gap-3 text-sm text-gray-400">
                                <li><Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
                                <li><Link to="/terms-conditions" className="hover:text-white transition">Terms & Conditions</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© 2026 CarConnectPortal. All Rights Reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a href="https://www.linkedin.com/in/shivshekhar0" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">LinkedIn</a>
                        <a href="https://www.github.com/0xShivanshu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
