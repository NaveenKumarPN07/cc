import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { productAPI } from '../../services/api';
import { Spinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search, page }],
    queryFn: () => productAPI.getAll({ search: search || undefined, page, limit: 15 }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productAPI.delete(id),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries(['admin-products']);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action is irreversible.`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-xl font-bold">Products ({data?.total || 0})</h1>
        <Link to="/admin/products/new" className="btn-primary text-sm">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="input pl-9 max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.products?.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.url}
                          alt={product.name}
                          className="w-10 h-12 object-cover rounded-lg bg-gray-100"
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-gray-100 text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                      {product.discountPrice && (
                        <p className="text-xs text-muted line-through">₹{product.price.toLocaleString('en-IN')}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      ⭐ {product.rating} ({product.numReviews})
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleteMutation.isLoading}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                ${p === page ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
