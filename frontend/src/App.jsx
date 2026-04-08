import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/user/Home";
import With_nav from "./components/Layout/WithNav";
import SignIn from "./pages/SignIn";
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorFleet from "./pages/vendor/Fleet";
import UserDashboard from "./pages/user/Dashboard";
import Vehicles from "./pages/user/Vehicles";
import Enterprise from "./pages/Enterprise";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<With_nav />}>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/enterprise" element={<Enterprise />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/fleet" element={<VendorFleet />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/signIn" element={<SignIn />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
