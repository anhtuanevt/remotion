interface Props {
  value: number // 0 to 1
  label?: string
}
export function ProgressBar({ value, label }: Props) {
  return (
    <div className="w-full">
      {label && <p className="text-sm text-gray-600 mb-1">{label}</p>}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(value * 100)}%</p>
    </div>
  )
}
