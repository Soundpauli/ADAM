import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { requestLogger, RequestLog } from '../../services/requestLogger';

const RequestLogsSettings = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState(requestLogger.getStats());
  const [selectedFilter, setSelectedFilter] = useState({
    type: '',
    dateFrom: '',
    dateTo: '',
    success: ''
  });
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [selectedFilter]);

  const loadLogs = () => {
    const filter: any = {};
    
    if (selectedFilter.type) filter.type = selectedFilter.type;
    if (selectedFilter.dateFrom) filter.dateFrom = new Date(selectedFilter.dateFrom);
    if (selectedFilter.dateTo) filter.dateTo = new Date(selectedFilter.dateTo);
    if (selectedFilter.success !== '') filter.success = selectedFilter.success === 'true';
    
    const filteredLogs = requestLogger.getLogs(filter);
    setLogs(filteredLogs);
    setStats(requestLogger.getStats());
  };

  const handleExportLogs = () => {
    requestLogger.exportLogs();
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all request logs? This action cannot be undone.')) {
      requestLogger.clearLogs();
      loadLogs();
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enhancement': return 'bg-blue-100 text-blue-800';
      case 'validation': return 'bg-green-100 text-green-800';
      case 'group_validation': return 'bg-purple-100 text-purple-800';
      case 'group_enhancement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Request Logs & Analytics</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={handleExportLogs}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download size={16} className="mr-2" />
            Export Logs
          </button>
          <button
            onClick={handleClearLogs}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 size={16} className="mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">{stats.totalRequests}</div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">{stats.successRate}%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">{stats.averageDuration}ms</div>
              <div className="text-sm text-gray-500">Avg Duration</div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">{Object.keys(stats.requestsByUser).length}</div>
              <div className="text-sm text-gray-500">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-base font-medium text-gray-900 mb-3">Requests by Type</h4>
          <div className="space-y-2">
            {Object.entries(stats.requestsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(type)}`}>
                  {type.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-base font-medium text-gray-900 mb-3">Top Users</h4>
          <div className="space-y-2">
            {Object.entries(stats.requestsByUser)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([userName, count]) => (
                <div key={userName} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{userName}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-base font-medium text-gray-900 mb-3">Filter Logs</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type-filter"
              value={selectedFilter.type}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, type: e.target.value })}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="enhancement">Enhancement</option>
              <option value="validation">Validation</option>
              <option value="group_validation">Group Validation</option>
              <option value="group_enhancement">Group Enhancement</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="success-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="success-filter"
              value={selectedFilter.success}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, success: e.target.value })}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="date-from"
              value={selectedFilter.dateFrom}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, dateFrom: e.target.value })}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="date-to"
              value={selectedFilter.dateTo}
              onChange={(e) => setSelectedFilter({ ...selectedFilter, dateTo: e.target.value })}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-base font-medium text-gray-900">
            Recent Requests ({logs.length} found)
          </h4>
          <button
            onClick={() => setShowDetailedLogs(!showDetailedLogs)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetailedLogs ? 'Show Less' : 'Show Details'}
          </button>
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                {showDetailedLogs && (
                  <>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Command
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.slice(0, 100).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(log.type)}`}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {log.user.name}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={log.product.name}>
                    {log.product.name}
                  </td>
                  {showDetailedLogs && (
                    <>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {log.field || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {log.source?.component || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={log.source?.effect}>
                        {log.source?.command || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(log.duration)}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Detailed Log View */}
      {showDetailedLogs && logs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="text-base font-medium text-gray-900">Request Details</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="border-b border-gray-100 last:border-b-0 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(log.type)}`}>
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{log.user.name}</span>
                    <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {log.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Source</div>
                    <div className="text-gray-600">Component: {log.source?.component}</div>
                    <div className="text-gray-600">Command: {log.source?.command}</div>
                    <div className="text-gray-600 text-xs mt-1">{log.source?.effect}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-700">Product & Field</div>
                    <div className="text-gray-600">{log.product.name}</div>
                    <div className="text-gray-600">Field: {log.field || 'Multiple'}</div>
                    <div className="text-gray-600">Duration: {formatDuration(log.duration)}</div>
                  </div>
                </div>
                
                {log.results && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="font-medium text-gray-700 mb-2">Results</div>
                    {log.results.qualityBefore !== undefined && (
                      <div className="text-sm text-gray-600">Quality Before: {log.results.qualityBefore}%</div>
                    )}
                    {log.results.qualityAfter !== undefined && (
                      <div className="text-sm text-gray-600">Quality After: {log.results.qualityAfter}%</div>
                    )}
                    {log.results.validationPassed !== undefined && (
                      <div className="text-sm text-gray-600">Validation: {log.results.validationPassed ? 'Passed' : 'Failed'}</div>
                    )}
                    {log.results.contentLength && (
                      <div className="text-sm text-gray-600">Content Length: {log.results.contentLength} chars</div>
                    )}
                    {log.results.issuesFound && log.results.issuesFound.length > 0 && (
                      <div className="text-sm text-gray-600">Issues: {log.results.issuesFound.join(', ')}</div>
                    )}
                    {log.results.answer && (
                      <div className="text-sm text-gray-600 mt-2">
                        <div className="font-medium">Answer:</div>
                        <div className="text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                          {log.results.answer.length > 200 ? `${log.results.answer.substring(0, 200)}...` : log.results.answer}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {log.error && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md">
                    <div className="font-medium text-red-700 mb-1">Error</div>
                    <div className="text-sm text-red-600">{log.error}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestLogsSettings;