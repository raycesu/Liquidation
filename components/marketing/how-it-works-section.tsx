const STEPS = [
  {
    n: "01",
    title: "Create or join a room",
    body: "Start a private competition or enter via an invite link.",
  },
  {
    n: "02",
    title: "Get your balance",
    body: "Everyone starts with the same virtual balance. No unfair edge.",
  },
  {
    n: "03",
    title: "Trade with leverage",
    body: "Open longs and shorts on crypto perps with up to 50× leverage.",
  },
  {
    n: "04",
    title: "Don't get liquidated",
    body: "The trader with the highest equity when the room ends wins.",
  },
] as const

export const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-border bg-background py-16 sm:py-20 lg:scroll-mt-28 lg:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="how-it-works-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl"
        >
          How it works
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
          Four steps from invite to podium. No deposits — it is all paper, all competition.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-3">
              <span className="font-mono text-sm font-medium text-accent-neon">{step.n}</span>
              <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
