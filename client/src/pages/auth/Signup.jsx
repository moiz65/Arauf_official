import { useState } from "react";
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
const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    // Basic validation
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      setMessage("All fields are required.");
      return;
    }
    
    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }
    
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage("Account created successfully!");
        setForm({ firstName: "", lastName: "", email: "", password: "" });
      } else {
        setMessage(data.message || data.error || "Signup failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen w-full p-2 sm:p-4">
      {/* Left Side - Hidden on mobile, appears on larger screens */}
      <div 
        className="relative hidden w-full bg-gradient-to-br from-blue-600 to-blue-900 md:block md:w-1/2 lg:w-7/12 xl:w-8/12"
        style={{
          backgroundImage: `url(${LoginImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "10px",
        }}
      >
        <div className="absolute inset-0">
          <div className="flex h-full flex-col justify-end p-6 text-white sm:p-8 md:p-10 lg:p-12">
            <div className="flex flex-col gap-4 pb-8 pt-4 md:flex-row md:pt-12 md:pb-12">
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

            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:gap-4 md:gap-6 md:mb-8">
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
                    <span className="text-sm font-light sm:text-base md:text-lg">{idx + 1}</span>
                  </div>
                  <p className="mt-2 text-sm font-light text-white sm:mt-3 sm:text-base md:mt-4">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Full width on mobile, adjusts on larger screens */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-8 md:w-1/2 md:px-6 lg:w-5/12 xl:w-4/12">
        <div className="w-full max-w-md space-y-6 p-4 sm:space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Enter your personal data to create your account.</p>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 sm:text-base">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className="mt-1 h-10 w-full sm:h-12"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 sm:text-base">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className="mt-1 h-10 w-full sm:h-12"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 sm:text-base">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                className="mt-1 h-10 w-full sm:h-12 "
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 sm:text-base">
                Password
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-10 w-full pr-10 sm:h-12"
                  value={form.password}
                  onChange={handleChange}
                  required
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

            <Button className="w-full bg-blue-500 py-2 text-white hover:bg-blue-600 sm:py-3" type="submit">
              Create Account
            </Button>

            {message && (
              <p className="text-center text-xs text-red-600 sm:text-sm">{message}</p>
            )}

            <p className="text-center text-xs text-gray-600 sm:text-sm">
              Already have an account?{" "}
              <a href="/" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;