import Link from "next/link"
import { redirect } from "next/navigation"
import { joinRoomAction } from "@/actions/rooms"
import { Button } from "@/components/ui/button"
import { requireCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

type JoinRoomPageProps = {
  params: Promise<{
    room_id: string
  }>
  searchParams: Promise<{
    error?: string
  }>
}

export default async function JoinRoomPage({ params, searchParams }: JoinRoomPageProps) {
  const { room_id: roomId } = await params
  const { error } = await searchParams
  const user = await requireCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Join room</h1>
        <p className="mt-2 text-text-secondary">Confirm that you want to join this trading competition room.</p>
        {error ? <p className="mt-2 text-sm text-loss">{error}</p> : null}
        <form action={joinRoomAction} className="mt-6 space-y-3">
          <input type="hidden" name="roomId" value={roomId} />
          <Button type="submit" className="w-full">
            Join now
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </form>
      </div>
    </main>
  )
}
