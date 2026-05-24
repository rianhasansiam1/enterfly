import StatCards from "./components/StatCards";
import SalesChart from "./components/SalesChart";
import RecentOrders from "./components/RecentOrders";
import TopProducts from "./components/TopProducts";
import ActivityFeed from "./components/ActivityFeed";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-5">
      <StatCards />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart />
        </div>
        <TopProducts />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentOrders />
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}
