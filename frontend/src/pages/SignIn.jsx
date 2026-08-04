import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignIn() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const [role, setRole] = useState('user');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleAuthResult = (res, data) => {
        if (res.ok) {
            const sessionRole = role === 'vendor' ? 'vendor' : 'user';
            localStorage.setItem('user', JSON.stringify({ ...data.user, role: sessionRole }));
            localStorage.setItem('token', data.token);
            window.location.href = sessionRole === 'vendor' ? '/vendor/dashboard' : '/user/dashboard';
        } else {
            setError(data.message || 'Unknown Server Error');
        }
    }

    const handleStandardAuth = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isLogin ? '/login' : '/register';
            const bodyPayload = isLogin ? { email, password, role } : { name, email, password, role };

            const res = await fetch(`${apiUrl}api/auth${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            if (!res.ok) {
                try {
                    const data = await res.json();
                    setError(data.message);
                } catch (e) {
                    const text = await res.text();
                    setError(`Server HTML Error ${res.status}: ${text.substring(0, 80)}`);
                }
                return;
            }
            const data = await res.json();
            handleAuthResult(res, data);
        } catch (err) {
            setError(`Network Error: ${err.message}. Backend offline?`);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await fetch(`${apiUrl}api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential, role })
            });

            if (!res.ok) {
                try {
                    const data = await res.json();
                    setError(data.message);
                } catch (e) {
                    const text = await res.text();
                    setError(`Google Server Error: ${text.substring(0, 80)}`);
                }
                return;
            }
            const data = await res.json();
            handleAuthResult(res, data);
        } catch (err) {
            setError(`Network Error: ${err.message}. Backend offline?`);
        }
    };

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
            <div className="p-8 shadow-2xl rounded-xl w-full max-w-[400px] border border-gray-100 flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-gray-500 mb-8">{isLogin ? 'Sign in to CarConnectPortal' : 'Join CarConnectPortal today'}</p>

                <div className="flex gap-4 mb-6 w-full">
                    <button
                        type="button"
                        onClick={() => setRole('user')}
                        className={`flex-1 py-2 rounded-md font-semibold transition ${role === 'user' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        User
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('vendor')}
                        className={`flex-1 py-2 rounded-md font-semibold transition ${role === 'vendor' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        Vendor
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm mb-4 font-bold border border-red-500 p-2 rounded bg-red-50 w-full">{error}</p>}

                <form onSubmit={handleStandardAuth} className="w-full flex flex-col gap-4 mb-6">
                    {!isLogin && (
                        <input type="text" placeholder="Full Name" required={!isLogin}
                            value={name} onChange={e => setName(e.target.value)}
                            className="w-full p-3 border rounded-md"
                        />
                    )}
                    <input type="email" placeholder="Email Address" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full p-3 border rounded-md"
                    />
                    <input type="password" placeholder="Password" required
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 border rounded-md"
                    />
                    <button type="submit" className="w-full bg-black text-white font-bold py-3 rounded-md hover:bg-gray-800 transition">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="w-full flex items-center justify-between mb-6">
                    <hr className="w-full border-gray-300" />
                    <span className="px-3 text-gray-400 font-semibold text-sm">OR</span>
                    <hr className="w-full border-gray-300" />
                </div>

                <div className="w-full flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Widget Error')}
                        useOneTap
                    />
                </div>

                <p className="text-sm text-gray-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 font-bold text-green-600 hover:underline">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default SignIn;
