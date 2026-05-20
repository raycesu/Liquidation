export const RoomHeroBackground = () => {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 animate-room-hero-glow bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgb(23_201_255/0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgb(138_194_244/0.22)_1px,transparent_1px),linear-gradient(90deg,rgb(138_194_244/0.22)_1px,transparent_1px)] [background-size:54px_54px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(23_201_255/0.2),transparent_40%),radial-gradient(circle_at_88%_20%,rgb(10_140_255/0.14),transparent_35%)]"
        aria-hidden
      />
    </>
  )
}
