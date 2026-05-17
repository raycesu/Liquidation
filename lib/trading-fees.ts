import type { OrderType } from "@/lib/types"

export const MAKER_FEE_BPS = 2
export const TAKER_FEE_BPS = 5

export type LiquidityRole = "MAKER" | "TAKER"

export const computeTradeFee = (notionalUsd: number, role: LiquidityRole) =>
  notionalUsd * (role === "MAKER" ? MAKER_FEE_BPS : TAKER_FEE_BPS) / 10_000

export const getLiquidityRoleForFill = ({
  orderType,
  isLiquidation = false,
}: {
  orderType?: OrderType | "MARKET"
  isLiquidation?: boolean
}): LiquidityRole | null => {
  if (isLiquidation) {
    return null
  }

  if (orderType === "LIMIT") {
    return "MAKER"
  }

  return "TAKER"
}

export const getTradeFeeForFill = ({
  notionalUsd,
  orderType,
  isLiquidation = false,
}: {
  notionalUsd: number
  orderType?: OrderType | "MARKET"
  isLiquidation?: boolean
}) => {
  const role = getLiquidityRoleForFill({ orderType, isLiquidation })

  if (!role) {
    return { fee: 0, liquidityRole: null as LiquidityRole | null }
  }

  return {
    fee: computeTradeFee(notionalUsd, role),
    liquidityRole: role,
  }
}
