"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import Image from "next/image"
import Swal from "sweetalert2"

const loginSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(5, "Password minimal 5 karakter"),
})

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({})
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      const fieldErrors: { username?: string; password?: string } = {}
      result.error.issues.forEach(issue => {
        if (issue.path[0] === "username") fieldErrors.username = issue.message
        if (issue.path[0] === "password") fieldErrors.password = issue.message
      })
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    const signInResult = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      setErrors({ form: signInResult.error })
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: signInResult.error,
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#f1f5f9",
      })
    } else {
      router.push("/admin")
      router.refresh()
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow: hidden;
          background: #0f172a;
        }

        /* Gradient blobs – match the warm/cool gradient in the reference image */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
          pointer-events: none;
        }
        .blob-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #e0845c 0%, #c05e3a 60%, transparent 100%);
          bottom: -80px; right: -60px;
        }
        .blob-2 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, #6fa8dc 0%, #3a6ea8 60%, transparent 100%);
          top: -60px; left: -80px;
        }
        .blob-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, #a78bfa 0%, transparent 100%);
          top: 40%; left: 30%;
          opacity: 0.25;
        }

        /* Card */
        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 400px;
          margin: 24px;
          padding: 36px 32px 32px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.13);
          box-shadow:
            0 8px 40px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Logo */
        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .logo-box {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .logo-box img {
          width: 40px; height: 40px;
          object-fit: contain;
        }

        /* Title */
        .title {
          text-align: center;
          color: #f1f5f9;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }
        .subtitle {
          text-align: center;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          font-weight: 400;
          margin-bottom: 28px;
        }

        /* Error banner */
        .error-banner {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: none; } }
        .error-banner svg { flex-shrink:0; margin-top:1px; }
        .error-banner p { color: #fca5a5; font-size: 13px; line-height: 1.4; }

        /* Fields */
        .field { margin-bottom: 16px; }
        .field label {
          display: block;
          color: rgba(255,255,255,0.65);
          font-size: 12.5px;
          font-weight: 500;
          margin-bottom: 7px;
          letter-spacing: 0.2px;
        }

        .input-wrap {
          position: relative;
        }
        .input-wrap input {
          width: 100%;
          padding: 12px 44px 12px 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          color: #f1f5f9;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #f1f5f9;
        }
        .input-wrap input::placeholder { color: rgba(255,255,255,0.28); }
        .input-wrap input:focus {
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.15);
        }
        .input-wrap input.err {
          border-color: rgba(239, 68, 68, 0.5);
        }
        .input-wrap input.err:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        /* Eye toggle */
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.7); }

        .field-error {
          margin-top: 5px;
          color: #f87171;
          font-size: 12px;
        }

        /* Forgot password */
        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -8px;
          margin-bottom: 22px;
        }
        .forgot-link {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: rgba(255,255,255,0.8); }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 13px;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Sora', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          letter-spacing: 0.1px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #e2e8f0;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.35);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Loading spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(15,23,42,0.3);
          border-top-color: #0f172a;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer note */
        .footer-note {
          margin-top: 20px;
          text-align: center;
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          line-height: 1.5;
        }
        .footer-note a {
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .footer-note a:hover { color: #f1f5f9; }
      `}</style>

      <div className="login-root">
        {/* Background blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="card">
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-box">
              <Image
                src="/images/logo-markaz.png"
                alt="Logo Markaz"
                width={40}
                height={40}
                priority
              />
            </div>
          </div>

          <h1 className="title">Masuk ke Akun Anda</h1>
          <p className="subtitle">Sistem Informasi Markaz</p>

          <form onSubmit={handleLogin} noValidate>
            {/* Form error banner */}
            {errors.form && (
              <div className="error-banner">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="#f87171" strokeWidth="1.5" />
                  <path d="M10 6v4M10 14h.01" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p>{errors.form}</p>
              </div>
            )}

            {/* Username */}
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="input-wrap">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={errors.username ? "err" : ""}
                  required
                />
              </div>
              {errors.username && <p className="field-error">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "err" : ""}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            {/* Forgot password */}
            <div className="forgot-row">
              <a
                href={`https://wa.me/6281227225453?text=Halo%20Admin%2C%20saya%20lupa%20password%20akun%20Sistem%20Informasi%20Markaz.`}
                target="_blank"
                rel="noopener noreferrer"
                className="forgot-link"
              >
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span className="spinner" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="footer-note">
            Lupa sandi? Hubungi admin via{" "}
            <a
              href="https://wa.me/6281227225453"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </>
  )
}