export default function Page() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Console</h1>
        <p className="text-sm text-gray-700">See client activity, approvals, and consent at a glance.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Inbox</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-xl border p-2">
              New review from "Example School"<span className="text-xs text-gray-600">2m ago</span>
            </li>
            <li className="flex items-center justify-between rounded-xl border p-2">
              Content approved: "Open Day Poster"<span className="text-xs text-gray-600">12m ago</span>
            </li>
            <li className="flex items-center justify-between rounded-xl border p-2">
              Consent granted for social sharing<span className="text-xs text-gray-600">1h ago</span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Clients</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-xl border p-2">
              <span>Example School</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">Onboarding</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-2">
              <span>Northside Academy</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">Active</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
