import { render, screen } from "@testing-library/react"
import { OrderEntry } from "@/components/order-entry"

jest.mock("@/actions/place-order", () => ({
  placeOrder: jest.fn(),
}))

jest.mock("@/actions/place-limit-order", () => ({
  placeLimitOrder: jest.fn(),
}))

describe("OrderEntry", () => {
  it("renders Buy/Long, Sell/Short and the action button", () => {
    render(
      <OrderEntry
        participantId="00000000-0000-0000-0000-000000000000"
        roomId="00000000-0000-0000-0000-000000000001"
        symbol="BTCUSDT"
        availableMargin={10000}
        livePrice={65000}
        positions={[]}
        onOptimisticPosition={jest.fn()}
        onOrderPlaced={jest.fn()}
        onOrderRejected={jest.fn()}
        onLimitOrderPlaced={jest.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Buy long" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sell short" })).toBeInTheDocument()
    expect(screen.getByText(/Margin Required/)).toBeInTheDocument()
  })
})
