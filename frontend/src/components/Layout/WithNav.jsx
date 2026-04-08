import Header from "../Header";
import Footer from "../Footer";
import { Outlet } from "react-router-dom";
const With_nav = () => {
    return (
        <>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </>
    );
};
export default With_nav;
