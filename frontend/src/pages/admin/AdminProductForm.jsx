import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, X, ChevronLeft } from 'lucide-react';
import { productAPI } from '../../services/api';
import { Spinner } from '../../components/common';
import toast from 'react-hot-toast';

const CATEGORIES = ['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Sports', 'Beauty', 'Home', 'Electronics'];
const DEFAULT_FORM = {
  name: '', description: '', price: '', discountPrice: '', category: '', subCategory: '',
  brand: '', stock: '', tags: '', isFeatured: false,
  images: [{ url: '', alt: '' }],
  sizes: [{ size: '', stock: '' }],
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(DEFAULT_FORM);

  // Load product data for editing
  const { data, isLoading: loadingProduct } = useQuery({
    queryKey: ['product-edit', id],
    queryFn: () => productAPI.getOne(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.product) {
      const p = data.product;
      setForm({
        name: p.name || '',
        description: p.description || '',
        price: p.price || '',
        discountPrice: p.discountPrice || '',
        category: p.category || '',
        subCategory: p.subCategory || '',
        brand: p.brand || '',
        stock: p.stock || '',
        tags: p.tags?.join(', ') || '',
        isFeatured: p.isFeatured || false,
        images: p.images?.length ? p.images : [{ url: '', alt: '' }],
        sizes: p.sizes?.length ? p.sizes : [{ size: '', stock: '' }],
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? productAPI.update(id, payload) : productAPI.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate('/admin/products');
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (key) => (e) => setForm((f) => ({
    ...f,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const setImage = (i, key, val) => {
    const imgs = [...form.images];
    imgs[i] = { ...imgs[i], [key]: val };
    setForm((f) => ({ ...f, images: imgs }));
  };

  const setSize = (i, key, val) => {
    const sizes = [...form.sizes];
    sizes[i] = { ...sizes[i], [key]: val };
    setForm((f) => ({ ...f, sizes }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: Number(form.stock),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: form.images.filter((img) => img.url),
      sizes: form.sizes.filter((s) => s.size).map((s) => ({ ...s, stock: Number(s.stock) })),
    };
    mutation.mutate(payload);
  };

  if (isEdit && loadingProduct) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

const Field = ({ label, name, type = 'text', placeholder, textarea, half, required, form, set }) => (
  <div className={half ? '' : 'md:col-span-2'}>
    <label className="label">{label}{required && ' *'}</label>
    {textarea ? (
      <textarea
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        rows={4}
        className="input resize-none"
        required={required}
      />
    ) : (
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        className="input"
        required={required}
      />
    )}
  </div>
);

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/products')} className="btn-ghost p-2">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-xl font-bold">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Product Name" name="name" form={form} set={set} required />
            <Field label="Description" name="description" placeholder="Detailed product description..." textarea required />
            <div>
              <label className="label">Category *</label>
              <select value={form.category} onChange={set('category')} className="input" required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Sub-Category" name="subCategory" placeholder="e.g. T-Shirts, Jeans" half />
            <Field label="Brand *" name="brand" placeholder="e.g. Levi's, Nike" half required />
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">MRP (₹) *</label>
              <input type="number" min="0" value={form.price} onChange={set('price')} className="input" required placeholder="1999" />
            </div>
            <div>
              <label className="label">Sale Price (₹)</label>
              <input type="number" min="0" value={form.discountPrice} onChange={set('discountPrice')} className="input" placeholder="1299" />
            </div>
            <div>
              <label className="label">Total Stock *</label>
              <input type="number" min="0" value={form.stock} onChange={set('stock')} className="input" required placeholder="50" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.isFeatured} onChange={set('isFeatured')}
              className="accent-brand-500 w-4 h-4" />
            <label htmlFor="featured" className="text-sm font-medium cursor-pointer">Mark as Featured Product</label>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Product Images</h2>
            <button type="button" onClick={() => setForm((f) => ({ ...f, images: [...f.images, { url: '', alt: '' }] }))}
              className="btn-ghost text-sm text-brand-500">
              <Plus size={14} /> Add Image
            </button>
          </div>
          <div className="space-y-3">
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input type="url" value={img.url} onChange={(e) => setImage(i, 'url', e.target.value)}
                    placeholder="Image URL (Cloudinary or direct URL)" className="input text-sm" />
                  <input type="text" value={img.alt} onChange={(e) => setImage(i, 'alt', e.target.value)}
                    placeholder="Alt text" className="input text-sm" />
                </div>
                {form.images.length > 1 && (
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                    <X size={15} />
                  </button>
                )}
                {img.url && (
                  <img src={img.url} alt="Preview" className="w-12 h-14 object-cover rounded-lg border" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Sizes & Stock</h2>
            <button type="button" onClick={() => setForm((f) => ({ ...f, sizes: [...f.sizes, { size: '', stock: '' }] }))}
              className="btn-ghost text-sm text-brand-500">
              <Plus size={14} /> Add Size
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {form.sizes.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={s.size} onChange={(e) => setSize(i, 'size', e.target.value)}
                  placeholder="S / M / 8" className="input text-sm flex-1" />
                <input type="number" min="0" value={s.stock} onChange={(e) => setSize(i, 'stock', e.target.value)}
                  placeholder="Qty" className="input text-sm w-16" />
                {form.sizes.length > 1 && (
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }))}
                    className="p-1 text-red-400"><X size={13} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <label className="label">Tags (comma-separated)</label>
          <input type="text" value={form.tags} onChange={set('tags')}
            placeholder="e.g. casual, cotton, men, summer" className="input" />
          <p className="text-xs text-muted mt-1">Tags improve product search visibility</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={mutation.isLoading} className="btn-primary">
            {mutation.isLoading ? <><Spinner size={16} /> Saving...</> : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
