
export type SaveStatus = "idle" | "saving" | "saved" | "error"

function getButtonStyles(status: SaveStatus) {
  const styles: Record<SaveStatus, string> = {
    idle:   "bg-blue-600 text-white hover:bg-blue-700",
    saving: "bg-blue-400 text-white cursor-not-allowed",
    saved:  "bg-green-600 text-white hover:bg-green-700",
    error:  "bg-red-500 text-white hover:bg-red-600"
  }
  return styles[status]
}

type Props = {
  saveStatus?: SaveStatus
  label?: string
  type?: "submit" | "button"
  onClick?: () => void
}

export default function SaveButton({ saveStatus = "idle", label = "Save Changes", type = "submit", onClick }: Readonly<Props>) {
  const textMap: Record<SaveStatus, string> = {
    idle: label,
    saving: "Saving…",
    saved: "Saved!",
    error: "Failed",
  }
  const text = textMap[saveStatus]

  const colorClass = getButtonStyles(saveStatus)

  return (
    <div className="flex items-center gap-3">
      {saveStatus === "saved" && (
        <span className="text-sm text-green-600 font-medium">Changes saved</span>
      )}
      {saveStatus === "error" && (
        <span className="text-sm text-red-500 font-medium">Save failed — please try again</span>
      )}
      <button
        type={type}
        disabled={saveStatus === "saving"}
        onClick={onClick}
        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${colorClass}`}
      >
        {text}
      </button>
    </div>
  )
}
