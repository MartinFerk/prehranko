import React from 'react';

const Login = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Prijava</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="email">E-pošta</label>
          <input
            type="email"
            id="email"
            className="w-full p-2 border rounded"
            placeholder="Vnesite e-pošto"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="password">Geslo</label>
          <input
            type="password"
            id="password"
            className="w-full p-2 border rounded"
            placeholder="Vnesite geslo"
          />
        </div>
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Prijavi se
        </button>
      </div>
    </div>
  );
};

export default Login;