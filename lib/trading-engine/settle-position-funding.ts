import { settleFundingOnPositionMargin } from "@/lib/perpetuals"
import type { PositionSide } from "@/lib/types"

export { settleFundingOnPositionMargin }

export type PositionFundingInput = {
  marginAllocated: number
  size: number
  entryPrice: number
  side: PositionSide
  payment: number
}

export const buildPositionFundingSettlement = (input: PositionFundingInput) =>
  settleFundingOnPositionMargin(input)
