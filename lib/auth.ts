import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { checkRateLimit, resetRateLimit } from "./rateLimit"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        // Dapatkan IP dari headers
        // req di NextAuth v4 authorize callback kadang memiliki .headers object (jika di-pass dari route handler)
        // Alternatif fallback jika undefined
        let ip = "127.0.0.1"
        if (req && req.headers && typeof req.headers === "object") {
          const authHeaders = req.headers as Record<string, string>
          ip = authHeaders['x-forwarded-for'] || authHeaders['x-real-ip'] || '127.0.0.1'
        }

        const rateLimitResult = checkRateLimit(ip)

        if (!rateLimitResult.allowed) {
          throw new Error("Terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam 5 menit.")
        }

        // Jika loginType SANTRI, hanya cek tabel Santri
        if (credentials.loginType === "SANTRI") {
          const santri = await prisma.santri.findUnique({
            where: { nis: credentials.username }
          })

          if (!santri) {
            throw new Error("NIS tidak ditemukan di database")
          }
          if (credentials.password !== santri.nis) {
            throw new Error("Password tidak cocok dengan NIS")
          }

          resetRateLimit(ip)
          
          return {
            id: santri.id,
            name: santri.nama,
            username: santri.nis,
            role: "SANTRI",
            permissions: []
          } as any
        }

        // Jika bukan SANTRI (misal Admin/Staff), cek tabel User
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        })

        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Username atau password salah")
        }

        // Login sukses, reset rate limit untuk IP ini
        resetRateLimit(ip)

        const permissions = user.role.permissions.map(p => p.permission.namaAksi)

        // Return object akan disimpan di token JWT
        return {
          id: user.id,
          name: user.nama,
          username: user.username,
          role: user.role.nama,
          permissions: permissions
        } as any
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.id = u.id
        token.role = u.role
        token.permissions = u.permissions
        token.username = u.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.id = token.id || token.sub
        u.role = token.role
        u.permissions = token.permissions
        u.username = token.username
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_super_secret_key_123_development_only"
}
