import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const qc = useQueryClient();
  const { data: stats } = useQuery('adminStats', () => api.get('/admin/stats').then(r => r.data));
  const { data: reviewsData } = useQuery('adminReviews', () => api.get('/admin/reviews').then(r => r.data));
  const { data: usersData } = useQuery('adminUsers', () => api.get('/admin/users').then(r => r.data));

  const toggleUser = useMutation(
    ({ id, isActive }) => api.patch(`/admin/users/${id}/status`, { isActive }),
    { onSuccess: () => { toast.success('User updated'); qc.invalidateQueries('adminUsers'); } }
  );

  const approveReview = useMutation(
    ({ id, approved }) => api.patch(`/admin/reviews/${id}/approve`, { approved }),
    { onSuccess: () => { toast.success('Review updated'); qc.invalidateQueries('adminReviews'); } }
  );

  return (
    <div>
      <h1 className="text-3xl font-black text-gray-900 mb-8">Admin Panel</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { val: stats.totalUsers, label: 'Total users' },
            { val: stats.totalProducts, label: 'Products' },
            { val: stats.totalReviews, label: 'Reviews' },
            { val: `${stats.avgRating}★`, label: 'Avg rating' }
          ].map(({ val, label }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-2xl font-black text-gray-900">{val}</p>
              <p className="text-sm text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {reviewsData?.reviews?.slice(0, 10).map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.author?.name} · {r.product?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {r.isApproved ? 'Live' : 'Hidden'}
                    </span>
                    <button onClick={() => approveReview.mutate({ id: r.id, approved: !r.isApproved })}
                      className="text-xs text-gray-400 hover:text-gray-600">Toggle</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-900 mb-4">Users</h2>
          <div className="space-y-3">
            {usersData?.users?.map(u => (
              <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email} · {u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleUser.mutate({ id: u.id, isActive: !u.isActive })}
                      className="text-xs text-gray-400 hover:text-gray-600">Toggle</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
