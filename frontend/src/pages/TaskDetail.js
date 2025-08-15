import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tasks/${id}`);
      setTask(response.data.task);
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and count
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      alert('Only PDF files are allowed');
      return;
    }

    const currentDocsCount = task.documents ? task.documents.length : 0;
    if (currentDocsCount + files.length > 3) {
      alert('Maximum 3 documents allowed per task');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });

      await api.post(`/api/tasks/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh task data
      fetchTask();
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filename, originalName) => {
    try {
      const response = await api.get(`/api/tasks/${id}/download/${filename}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/api/tasks/${id}/documents/${docId}`);
      fetchTask(); // Refresh task data
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const deleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/api/tasks/${id}`);
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading task..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Link to="/tasks" className="text-blue-600 hover:text-blue-500">
          ← Back to tasks
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Task not found</div>
        <Link to="/tasks" className="text-blue-600 hover:text-blue-500">
          ← Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/tasks" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            ← Back to tasks
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{task.title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={deleteTask}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Task Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</h3>
                <div className="mt-2 text-gray-900">
                  {task.description ? (
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided</p>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Documents ({task.documents ? task.documents.length : 0}/3)
                  </h3>
                  {(!task.documents || task.documents.length < 3) && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        multiple
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : '📎 Upload'}
                      </label>
                    </div>
                  )}
                </div>

                {task.documents && task.documents.length > 0 ? (
                  <div className="space-y-2">
                    {task.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-red-600">📄</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doc.original_name}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownload(doc.filename, doc.original_name)}
                            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600 hover:text-red-500 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📎</div>
                    <div>No documents attached</div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Priority */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Status & Priority</h3>
                <div className="space-y-3">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority.toUpperCase()} PRIORITY
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Assignment</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Assigned to:</span>
                    <div className="text-gray-900">
                      {task.assigned_to_email || 'Unassigned'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Created by:</span>
                    <div className="text-gray-900">{task.created_by_email}</div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Dates</h3>
                <div className="space-y-2 text-sm">
                  {task.due_date && (
                    <div>
                      <span className="font-medium">Due date:</span>
                      <div className="text-gray-900">
                        {format(new Date(task.due_date), 'PPP')}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span>
                    <div className="text-gray-900">
                      {format(new Date(task.created_at), 'PPP')}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <div className="text-gray-900">
                      {format(new Date(task.updated_at), 'PPP')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;