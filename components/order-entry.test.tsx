import { render, screen } from "@testing-library/react"
import { OrderEntry } from "@/components/order-entry"

jest.mock("@/actions/place-order", () => ({
  placeOrder: jest.fn(),
}))

describe("OrderEntry", () => {
  it("shows required margin and action buttons", () => {
    render(
      <OrderEntry
        participantId="00000000-0000-0000-0000-000000000000"
        roomId="00000000-0000-0000-0000-000000000001"
        symbol="BTCUSDT"
        availableMargin={10000}
        livePrice={65000}
        onOptimisticPosition={jest.fn()}
        onOrderPlaced={jest.fn()}
        onOrderRejected={jest.fn()}
      />,
    )

    expect(screen.getByText("Required margin")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Long" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Short" })).toBeInTheDocument()
  })
})
