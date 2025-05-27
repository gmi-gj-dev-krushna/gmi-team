function GMITeamPage() {
  return (
    <div className="h-full bg-gray-50 rounded-lg p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-4">GMI Team Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add your dashboard cards/widgets here */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Overview</h2>
          <p className="text-gray-600">Dashboard content goes here</p>
        </div>
      </div>
    </div>
  );
}
export default GMITeamPage;
