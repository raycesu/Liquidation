import Link from "next/link"
import { redirect } from "next/navigation"
import { joinRoom } from "@/actions/rooms"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

type JoinRoomPageProps = {
  params: Promise<{
    room_id: string
  }>
}

export default async function JoinRoomPage({ params }: JoinRoomPageProps) {
  const { room_id: roomId } = await params
  const result = await joinRoom(roomId)

  if (result.ok) {
    redirect(`/room/${result.data.roomId}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Unable to join room</h1>
        <p className="mt-2 text-text-secondary">{result.error}</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
