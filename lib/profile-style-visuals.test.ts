import { formatHoldMsDaysAndHours } from "@/lib/profile-style-visuals"

describe("formatHoldMsDaysAndHours", () => {
  it("formats sub-hour holds as minutes", () => {
    expect(formatHoldMsDaysAndHours(45 * 60 * 1000)).toBe("45m")
  })

  it("formats sub-day holds as hours", () => {
    expect(formatHoldMsDaysAndHours(8 * 3_600_000)).toBe("8.0h")
  })

  it("formats multi-day holds as compact days plus remainder hours", () => {
    const thirtyPointThreeHoursMs = 30.3 * 3_600_000
    expect(formatHoldMsDaysAndHours(thirtyPointThreeHoursMs)).toBe("1d 6.3h")
  })

  it("formats fractional day example", () => {
    const twentySevenPointThreeHoursMs = 27.3 * 3_600_000
    expect(formatHoldMsDaysAndHours(twentySevenPointThreeHoursMs)).toBe("1d 3.3h")
  })
})
