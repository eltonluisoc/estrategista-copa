import { neon } from '@neondatabase/serverless'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return new Response('Não autorizado', { status: 401 })
  }

  const encoder = new TextEncoder()
  let lastStatus = null
  let intervalId: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Enviar conexão estabelecida
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ connected: true })}\n\n`))
      
      intervalId = setInterval(async () => {
        try {
          const usuarios = await sql`
            SELECT aprovado, status FROM usuarios WHERE id = ${session.user.id}
          `
          
          const currentStatus = usuarios[0]
          
          if (JSON.stringify(currentStatus) !== JSON.stringify(lastStatus)) {
            lastStatus = currentStatus
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(currentStatus)}\n\n`))
          }
        } catch (error) {
          console.error('Erro no SSE:', error)
        }
      }, 3000)
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId)
      }
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