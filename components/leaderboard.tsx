import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatUsd } from "@/lib/format"
import type { ParticipantWithUser } from "@/lib/types"

type LeaderboardProps = {
  participants: ParticipantWithUser[]
}

export const Leaderboard = ({ participants }: LeaderboardProps) => {
  const rankedParticipants = [...participants].sort((a, b) => b.total_equity - a.total_equity)

  return (
    <Card className="border-border bg-surface">
      <CardHeader>
        <CardTitle className="text-text-primary">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead>Total equity</TableHead>
              <TableHead>Available margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedParticipants.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <Badge variant="outline" className="border-border">
                    #{index + 1}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-text-primary">
                  {participant.users?.username ?? "Anonymous"}
                </TableCell>
                <TableCell className="font-mono">{formatUsd(participant.total_equity)}</TableCell>
                <TableCell className="font-mono">{formatUsd(participant.available_margin)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
