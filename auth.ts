import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const users = await sql`
          SELECT * FROM usuarios WHERE email = ${credentials.email}
        `

        const user = users[0]

        if (!user) {
          return null
        }

        if (credentials.password !== user.senha) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    }
  }
})