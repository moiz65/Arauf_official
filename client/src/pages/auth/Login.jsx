import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from "lucide-react";
import LoginImage from "../../assets/Signup/signin.png";
import { API_ENDPOINTS } from '../../config/api';

// Button component
const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`rounded-md px-4 py-2 font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input component
const Input = ({ className = "", ...props }) => {
  return (
    <input
      className={`rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
};

// Main component
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password length validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST", // <-- Change GET to POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        // Use AuthContext to store user and redirect to intended destination
        const userObj = {
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          role_id: data.user.role_id,
          modules: data.user.modules || []  // Store accessible modules from login response
        };
        auth.login(userObj);
        setIsLoading(false);
        navigate(from, { replace: true });
      } else {
        setIsLoading(false);
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setIsLoading(false);
      setError("Server error");
    }
  };

  return (
    <div className="flex min-h-screen w-full p-2 sm:p-4">
      {/* Left Side - Get Started Section with Background Image */}
      <div 
        className="relative hidden w-full bg-gradient-to-br from-blue-600 to-blue-900 md:block md:w-1/2 lg:w-2/3"
        style={{
          backgroundImage: `url(${LoginImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "20px",
        }}
      >
        <div className="absolute inset-0">
          <div className="flex h-full flex-col justify-end p-6 text-white sm:p-8 md:p-10 lg:p-12">
            <div className="flex flex-col gap-4 pt-12 pb-12 md:flex-row">
              <h1 className="text-3xl font-bold text-left sm:text-4xl lg:text-5xl lg:pr-12">
                Get Started
                <br />
                With Us
              </h1>
              <p className="text-base text-left sm:text-lg">
                Complete these easy
                <br />
                steps to register your
                <br />
                account.
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:gap-6 md:mb-8">
              {["Sign in your account", "Set up your workspace", "Set up your profile"].map((step, idx) => (
                <div
                  key={idx}
                  className={`flex h-24 w-full flex-col items-left justify-center rounded-lg p-3 sm:h-28 sm:w-32 md:h-32 md:w-40 ${
                    idx === 0 ? "bg-[#1976D2]" : "bg-[#1976D2] rounded-2xl shadow-lg backdrop-blur-sm"
                  } text-left`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7 md:h-8 md:w-8 ${
                      idx === 0 ? "bg-white text-blue-500" : "bg-white text-blue-500"
                    }`}
                  >
                    <span className="text-sm font-light sm:text-base md:px-2 md:text-lg">{idx + 1}</span>
                  </div>
                  <p className="mt-2 text-sm font-light text-white sm:mt-3 sm:text-base md:mt-4">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-8 md:w-1/2 md:px-6 lg:w-1/3">
        <div className="w-full max-w-md space-y-6 p-4 sm:space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Sign in Account</h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Enter your personal data to create your account.</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 sm:text-base">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                className="mt-1 h-10 w-full sm:h-12"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 sm:text-base">
                Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-10 w-full pr-10 sm:h-12"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">Must be at least 8 characters.</p>
            </div>

            <Button 
              type="submit"
              className="w-full bg-blue-500 py-2 text-white hover:bg-blue-600 sm:py-3"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            {/* <p className="text-center text-xs text-gray-600 sm:text-sm">
              Don't have an account?{" "}
              <a href="/signup" className="font-medium text-[#1976D2] hover:text-blue-500">
                Sign up
              </a>
            </p> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;