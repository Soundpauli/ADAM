import React from 'react';
import UserList from '../components/users/UserList';
import DataOriginSettings from '../components/settings/DataOriginSettings';
import FieldConfigSettings from '../components/settings/FieldConfigSettings';
import RequestLogsSettings from '../components/settings/RequestLogsSettings';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  
  // Only admins can access settings
  if (user?.role !== 'admin') {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Access Restricted
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You do not have permission to access this page. Only administrators can manage users.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="mt-2 text-sm text-gray-500">
          Manage users and system settings.
        </p>
      </div>
      
      <UserList />
      
      <div className="mt-10">
        <FieldConfigSettings />
      </div>
      
      <div className="mt-10">
        <DataOriginSettings />
      </div>
      
      <div className="mt-10">
        <RequestLogsSettings />
      </div>
    </div>
  );
};

export default SettingsPage;