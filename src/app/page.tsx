import { Layout, Card, Button } from './components/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout title="Tool Tracker Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Scan Tools Card */}
        <Card title="Scan Tools">
          <div className="space-y-4">
            <p className="text-gray-600">
              Use the scanning interface to add new tools, assign tools to jobs, or return tools from jobs.
            </p>
            <Link href="/scan">
              <Button variant="primary" className="w-full">
                Go to Scanning
              </Button>
            </Link>
          </div>
        </Card>

        {/* Search & Query Card */}
        <Card title="Search & Query">
          <div className="space-y-4">
            <p className="text-gray-600">
              Search for tools, view missing tools, and run preset queries to track tool usage.
            </p>
            <Link href="/search">
              <Button variant="secondary" className="w-full">
                Search Tools
              </Button>
            </Link>
          </div>
        </Card>

        {/* Quick Stats Card */}
        <Card title="Quick Stats">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Jobs:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tools:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Missing Tools:</span>
              <span className="font-semibold text-red-600">-</span>
            </div>
          </div>
        </Card>

        {/* Jobs Management Card */}
        <Card title="Jobs Management">
          <div className="space-y-4">
            <p className="text-gray-600">
              View and manage all jobs, create new jobs, and track job completion.
            </p>
            <Link href="/jobs">
              <Button variant="secondary" className="w-full">
                Manage Jobs
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tools Management Card */}
        <Card title="Tools Management">
          <div className="space-y-4">
            <p className="text-gray-600">
              View all tools in the system and their current assignment status.
            </p>
            <Link href="/tools">
              <Button variant="secondary" className="w-full">
                View Tools
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity Card */}
        <Card title="Recent Activity">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              No recent activity to display.
            </p>
          </div>
        </Card>
        
      </div>
    </Layout>
  );
}
