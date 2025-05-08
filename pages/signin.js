'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";


export default function Signin() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email is invalid";
    if (!form.password.trim()) newErrors.password = "Password is required";
    if (!form.role) newErrors.role = "Role is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await fetch("https://apinodetaskmgmnt.onrender.com/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Registration successful!");
        setForm({ name: "", email: "", password: "", role: "member" });
        setErrors({});
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("An error occurred during registration");
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center ">
      <div className="row   overflow-hidden w-100" style={{ maxWidth: '900px' }}>
        
        {/* Image Section */}
        <div className="col-md-6 d-none d-md-block p-0">
          <Image
            src="/simg.jpg"
            alt="Signup"
            width={600}
            height={600}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Form Section */}
        <div className="col-md-6 bg-white p-4">
          <h3 className="text-center mb-4">Sign In</h3>

          {message && (
            <div className="alert alert-info text-center">{message}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="mb-3">
              <label className="form-label">Name</label>
              <div className="input-group">
               
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>
              {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <div className="input-group">
                
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
               
                <input
                  type="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className="form-label">Role</label>
              <div className="input-group">
               
                <select
                  className={`form-select ${errors.role ? "is-invalid" : ""}`}
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
              {errors.role && <div className="invalid-feedback d-block">{errors.role}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Sign In
            </button>
          </form>
          <p className="text-center mt-3">
  Already have an account?{" "}
  <Link href="/login" className="text-decoration-none">
    <strong>Login here</strong>
  </Link>
</p>
        </div>
      </div>
    </div>
  );
}
