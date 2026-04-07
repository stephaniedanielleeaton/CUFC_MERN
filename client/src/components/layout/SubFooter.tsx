export function SubFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-navy text-white py-4 px-4">
      <div className="max-w-6xl mx-auto text-center text-sm">
        <p className="text-gray-300">
          © {currentYear} Columbus United Fencing Club. All rights reserved.
        </p>
      </div>
    </div>
  )
}
