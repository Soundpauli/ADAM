import React, { useState } from 'react';
import { Trash2, Edit, Plus, User as UserIcon } from 'lucide-react';
import { useUsers } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import UserModal from './UserModal';

const UserList = () => {
  const { users, deleteUser } = useUsers();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const handleAddUser = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };
  
  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        <button
          disabled={currentUser?.role !== 'admin'}
          onClick={handleAddUser}
          className={`flex items-center rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150 ${
            currentUser?.role === 'admin'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus size={16} className="mr-2" />
          Add User
        </button>
      </div>
      
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <UserIcon size={48} className="text-gray-300" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddUser}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={16} className="-ml-1 mr-2" />
              Add User
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th scope="col" className="relative px-4 sm:px-6 py-3 w-20">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="whitespace-nowrap px-4 sm:px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 sm:px-6 py-4">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 sm:px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : user.role === 'manager' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        disabled={currentUser?.role !== 'admin'}
                        onClick={() => handleEditUser(user)}
                        className={`rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          currentUser?.role === 'admin'
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        disabled={currentUser?.role !== 'admin' || user.role === 'admin'}
                        onClick={() => handleDeleteUser(user.id)}
                        className={`rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          currentUser?.role === 'admin' && user.role !== 'admin'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <UserModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        mode={modalMode} 
        user={selectedUser} 
      />
    </div>
  );
};

export default UserList;