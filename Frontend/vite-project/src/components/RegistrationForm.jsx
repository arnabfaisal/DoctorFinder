import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function RegistrationForm() {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const accountType = watch("account_type");

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Registration failed');

      // Auto login
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const loginResult = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginResult.message || 'Auto-login failed');

      login(loginResult.accessToken, loginResult.refreshToken, loginResult.user);

      // Navigate based on role
      if (loginResult.user.account_type === 'patient') navigate('/patient-dashboard');
      else if (loginResult.user.account_type === 'doctor') navigate('/doctor-dashboard');
      else navigate('/admin-dashboard');

      setSuccess(true);
      reset();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Doctor Finder
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              Registration successful!
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  {...register("first_name", { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Pollock"
                />
                {errors.first_name && <p className="text-red-600 text-sm mt-1">First name is required</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  {...register("last_name", { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nag"
                />
                {errors.last_name && <p className="text-red-600 text-sm mt-1">Last name is required</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register("email", { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="FEK@example.com"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">Email is required</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                {...register("phone_number", { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+880123456789"
              />
              {errors.phone_number && <p className="text-red-600 text-sm mt-1">Phone number is required</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...register("password", { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">Password is required</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <select
                {...register("account_type", { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {accountType === "doctor" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input
                  {...register("specialization", { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Cardiologist"
                />
                {errors.specialization && <p className="text-red-600 text-sm mt-1">Specialization is required for doctors</p>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  {...register("date_of_birth", { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  {...register("gender", { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input {...register("city", { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Division</label>
                <input {...register("division", { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Street</label>
              <input {...register("street", { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Processing..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;


