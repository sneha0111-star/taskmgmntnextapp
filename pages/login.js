'use client'; // Ensure you're using client-side features

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Clear any previous error messages
    setErrorMsg('');

    // Validate if both email and password are filled
    if (!email || !password) {
      setErrorMsg('Both email and password are required.');
      return;
    }

    const loginPayload = { email, password };

    try {
      const response = await fetch('https://apinodetaskmgmnt.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      const result = await response.json();

      if (result.isSuccess) {
        // Store in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(result.data));

        if (result.data.role === 'admin') {
        
          router.push('/admin/Dashboard');
        } else if (result.data.role === 'member') {
        
          router.push('/user/Dashboard');
        } else {
          setErrorMsg('Role not recognized.');
        }
      } else {
        setErrorMsg(result.message || 'Login failed');
      }
    } catch (error) {
      setErrorMsg('Something went wrong. Please try again.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div className="row  overflow-hidden" style={{ maxWidth: '900px', width: '100%' }}>
      

        <div className="col-md-6 bg-white p-5">
          <h2 className="mb-4 text-center">Login</h2>
          <form onSubmit={handleLogin}>
  <div className="mb-3">
    <div className="input-group">
    
      <input
        type="email"
        className="form-control"
        id="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
  </div>

  <div className="mb-4">
    <div className="input-group">
    
      <input
        type="password"
        className="form-control"
        id="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>
  </div>

  {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

  <button type="submit" className="btn btn-primary w-100">Login</button>
 
</form>
<p className="text-center mt-3">
  New user?{" "}
  <Link href="/signin" className="text-decoration-none">
    <strong>Sign up here</strong>
  </Link>
</p>

        </div>
      </div>
    </div>
  );
}
