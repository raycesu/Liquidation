type AuthDividerProps = {
  label: string
}

export const AuthDivider = ({ label }: AuthDividerProps) => {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div
        className="absolute inset-x-0 border-t border-dashed border-white/15"
        aria-hidden
      />
      <span className="relative bg-transparent px-3 text-xs font-medium text-[#6e93b8]">
        {label}
      </span>
    </div>
  )
}
