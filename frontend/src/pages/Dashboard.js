import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const Dashboard = () => {
  const { api, user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent tasks
      const tasksResponse = await api.get('/api/tasks?limit=5&sort_by=created_at&sort_order=DESC');
      const tasks = tasksResponse.data.tasks;
      
      setRecentTasks(tasks);
      
      // Calculate stats
      const statsData = {
        total: tasks.length,
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        overdue: tasks.filter(task => 
          task.due_date && 
          new Date(task.due_date) < new Date() && 
          task.status !== 'completed'
        ).length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your tasks and progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">{stats?.pending || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-blue-600">In Progress</div>
          <div className="text-2xl font-bold text-blue-700">{stats?.inProgress || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-green-600">Completed</div>
          <div className="text-2xl font-bold text-green-700">{stats?.completed || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-red-600">Overdue</div>
          <div className="text-2xl font-bold text-red-700">{stats?.overdue || 0}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/tasks/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mr-3">➕</div>
            <div>
              <div className="font-medium text-gray-900">Create Task</div>
              <div className="text-sm text-gray-600">Add a new task</div>
            </div>
          </Link>
          <Link
            to="/tasks"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mr-3">📋</div>
            <div>
              <div className="font-medium text-gray-900">View All Tasks</div>
              <div className="text-sm text-gray-600">Manage your tasks</div>
            </div>
          </Link>
          {isAdmin && (
            <Link
              to="/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mr-3">👥</div>
              <div>
                <div className="font-medium text-gray-900">Manage Users</div>
                <div className="text-sm text-gray-600">Admin panel</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
            <Link
              to="/tasks"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {task.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {task.description || 'No description'}
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      {task.assigned_to_email && (
                        <span>Assigned to: {task.assigned_to_email}</span>
                      )}
                      {task.due_date && (
                        <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <div>No tasks found</div>
              <Link
                to="/tasks/new"
                className="inline-block mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Create your first task
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;