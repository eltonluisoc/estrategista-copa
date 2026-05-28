import { neon } from '@neondatabase/serverless'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return new Response('Não autorizado', { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus = null
      
      const checkInterval = setInterval(async () => {
        const usuarios = await sql`
          SELECT aprovado, status FROM usuarios WHERE id = ${session.user.id}
        `
        
        const currentStatus = usuarios[0]
        
        if (JSON.stringify(currentStatus) !== JSON.stringify(lastStatus)) {
          lastStatus = currentStatus
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(currentStatus)}\n\n`))
        }
      }, 3000)
      
      // Limpar intervalo quando a conexão fechar
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ connected: true })}\n\n`))
      
      return () => clearInterval(checkInterval)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}