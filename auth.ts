import NextAuth, { DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { neon } from '@neondatabase/serverless'

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      aprovado: boolean
    } & DefaultSession["user"]
  }
  
  interface User {
    aprovado: boolean
  }
}

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
        if (!credentials?.email || !credentials?.password) return null
        
        const users = await sql`
          SELECT * FROM usuarios WHERE email = ${credentials.email}
        `
        const user = users[0]
        
        if (!user) return null
        
        if (credentials.password !== user.senha) return null
        
        return { 
          id: user.id, 
          email: user.email, 
          name: user.nome,
          aprovado: user.aprovado
        }
      }
    })
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.aprovado = user.aprovado
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      session.user.aprovado = token.aprovado as boolean
      return session
    }
  }
})