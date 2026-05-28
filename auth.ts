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
        if (!credentials?.email || !credentials?.password) return null
        
        const users = await sql`
          SELECT * FROM usuarios WHERE email = ${credentials.email}
        `
        const user = users[0]
        
        if (!user) return null
        
        // Verifica senha
        if (credentials.password !== user.senha) return null
        
        // NÃO BLOQUEIA MAIS O LOGIN SE NÃO FOR APROVADO
        // Apenas retorna o usuário com a flag aprovado
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
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      // Adicionar flag aprovado na sessão
      session.user.aprovado = token.aprovado as boolean
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.aprovado = user.aprovado
      }
      return token
    }
  }
})