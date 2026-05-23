import { fireEvent, render, screen } from "@testing-library/react"
import { OrderEntry } from "@/components/order-entry"
import { TooltipProvider } from "@/components/ui/tooltip"

jest.mock("@/actions/place-order", () => ({
  placeOrder: jest.fn(),
}))

jest.mock("@/actions/place-limit-order", () => ({
  placeLimitOrder: jest.fn(),
}))

const renderOrderEntry = () =>
  render(
    <TooltipProvider>
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
      />
    </TooltipProvider>,
  )

describe("OrderEntry", () => {
  it("renders Buy/Long, Sell/Short and the action button", () => {
    renderOrderEntry()

    expect(screen.getByRole("button", { name: "Buy long" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sell short" })).toBeInTheDocument()
  })

  it("hides order preview until size is entered", () => {
    renderOrderEntry()

    expect(screen.queryByText(/Margin Required/)).not.toBeInTheDocument()
  })

  it("shows order preview when size is greater than zero", () => {
    renderOrderEntry()

    const sizeInput = screen.getByLabelText("Size")
    fireEvent.change(sizeInput, { target: { value: "1000" } })

    expect(screen.getByText(/Margin Required/)).toBeInTheDocument()
    expect(screen.getByText(/Position Margin/)).toBeInTheDocument()
  })
})
