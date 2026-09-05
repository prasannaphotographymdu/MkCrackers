import React, { useState } from 'react';
import { Plus, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { Category } from '../../types';
import { saveCategoryToFirestore } from '../../lib/firebase';
import { cleanImageUrl } from '../../lib/utils';
import { ImageUploadCompressor } from '../common/ImageUploadCompressor';

interface CategoryManagementProps {
  categories: Category[];
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Category>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Toggle state for Add New Category Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatData, setNewCatData] = useState<Partial<Category>>({
    id: '',
    name: '',
    description: '',
    image: '',
    displayOrder: categories.length + 1,
    icon: 'Package'
  });

  // Fallback images matching LandingPage.tsx
  const fallbackImages: Record<string, string> = {
    'cat-1': 'https://images.unsplash.com/photo-1541256942802-7b29531f0df8?w=500&auto=format&fit=crop&q=80',
    'cat-2': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80',
    'cat-3': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    'cat-4': 'https://images.unsplash.com/photo-1533234427049-9e9bb093186d?w=500&auto=format&fit=crop&q=80',
    'cat-5': 'https://images.unsplash.com/photo-1498931290022-91a53b3a159e?w=500&auto=format&fit=crop&q=80',
    'cat-6': 'https://images.unsplash.com/photo-1507508019881-3edd12850e2a?w=500&auto=format&fit=crop&q=80',
    'cat-7': 'https://images.unsplash.com/photo-1489641493513-ba4ee84ccea9?w=500&auto=format&fit=crop&q=80',
    'cat-8': 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=500&auto=format&fit=crop&q=80',
    'cat-9': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80'
  };

  const handleEditClick = (cat: Category) => {
    setEditingId(cat.id);
    setEditFormData({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      displayOrder: cat.displayOrder,
      icon: cat.icon || ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSave = async (id: string) => {
    try {
      setIsSaving(true);
      const originalCat = categories.find((c) => c.id === id);
      if (!originalCat) return;

      const cleanedImage = cleanImageUrl(editFormData.image || '');
      const updatedCategory: Category = {
        ...originalCat,
        name: editFormData.name || originalCat.name,
        description: editFormData.description,
        image: cleanedImage,
        displayOrder: Number(editFormData.displayOrder) || originalCat.displayOrder,
        icon: editFormData.icon
      };

      await saveCategoryToFirestore(updatedCategory);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatData.id || !newCatData.id.trim()) {
      alert('Category ID is required.');
      return;
    }
    if (!newCatData.name || !newCatData.name.trim()) {
      alert('Category Name is required.');
      return;
    }

    const cleanId = newCatData.id.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Check if ID already exists
    if (categories.some((c) => c.id === cleanId)) {
      alert(`Category ID "${cleanId}" already exists. Please choose a unique ID.`);
      return;
    }

    try {
      setIsSaving(true);
      const cleanedImage = cleanImageUrl(newCatData.image || '');
      const newCategory: Category = {
        id: cleanId,
        name: newCatData.name.trim(),
        description: newCatData.description?.trim() || '',
        image: cleanedImage,
        displayOrder: Number(newCatData.displayOrder) || categories.length + 1,
        icon: newCatData.icon || 'Package'
      };

      await saveCategoryToFirestore(newCategory);
      setShowAddForm(false);
      
      // Reset Form State
      setNewCatData({
        id: '',
        name: '',
        description: '',
        image: '',
        displayOrder: categories.length + 2,
        icon: 'Package'
      });
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Category Catalog Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Update product category names, descriptions, and cover images shown on the public landing page.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setNewCatData((prev) => ({
              ...prev,
              displayOrder: categories.length + 1
            }));
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors shadow-sm"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Close' : 'Add Category'}
        </button>
      </div>

      {/* Add New Category Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddCategory} className="p-4 bg-slate-50 border-b border-slate-200 space-y-4 animate-fade-in">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Create New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fountains"
                value={newCatData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  // Auto-generate safe slug ID if ID is empty or matches previous auto-slug
                  const prevSlug = 'cat-' + (newCatData.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  const currentId = newCatData.id;
                  const autoSlug = 'cat-' + name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  
                  setNewCatData((prev) => ({
                    ...prev,
                    name,
                    id: (!currentId || currentId === prevSlug) ? autoSlug : currentId
                  }));
                }}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category ID (System Key) *</label>
              <input
                type="text"
                required
                placeholder="e.g. cat-fountains"
                value={newCatData.id}
                onChange={(e) => setNewCatData({ ...newCatData, id: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white font-mono focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Order *</label>
              <input
                type="number"
                required
                min="1"
                value={newCatData.displayOrder}
                onChange={(e) => setNewCatData({ ...newCatData, displayOrder: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="md:col-span-2">
              <ImageUploadCompressor
                value={newCatData.image || ''}
                onChange={(val) => setNewCatData({ ...newCatData, image: val })}
                label="Category Image (Upload / Camera / URL)"
                maxKb={50}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Brief tagline or description"
                value={newCatData.description}
                onChange={(e) => setNewCatData({ ...newCatData, description: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4 w-16">Order</th>
              <th className="py-3 px-4 w-24">ID</th>
              <th className="py-3 px-4 w-32">Image</th>
              <th className="py-3 px-4 w-48">Name</th>
              <th className="py-3 px-4">Image URL (Unsplash/Direct Link)</th>
              <th className="py-3 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {sortedCategories.map((cat) => {
              const isEditing = editingId === cat.id;
              const displayImage = cat.image || fallbackImages[cat.id] || fallbackImages['cat-1'];

              return (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Order */}
                  <td className="py-3 px-4 align-top">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-16 p-1.5 border border-slate-300 rounded text-sm text-center"
                        value={editFormData.displayOrder ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, displayOrder: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {cat.displayOrder}
                      </span>
                    )}
                  </td>

                  {/* ID */}
                  <td className="py-3 px-4 align-top">
                    <span className="font-mono text-xs text-slate-500 font-bold">{cat.id}</span>
                  </td>

                  {/* Image Preview */}
                  <td className="py-3 px-4 align-top">
                    <div className="w-16 h-12 rounded overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center relative group">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="py-3 px-4 align-top font-semibold text-slate-800">
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full p-1.5 border border-slate-300 rounded text-sm"
                        value={editFormData.name ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        placeholder="Category Name"
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span>{cat.name}</span>
                        {cat.description && (
                          <span className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2">
                            {cat.description}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Image URL / Compressor Input */}
                  <td className="py-3 px-4 align-top">
                    {isEditing ? (
                      <div className="w-64">
                        <ImageUploadCompressor
                          value={editFormData.image ?? ''}
                          onChange={(val) => setEditFormData({ ...editFormData, image: val })}
                          label="Category Image"
                          maxKb={50}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-xs block">
                          {cat.image ? (
                            cat.image.startsWith('data:image') ? '✓ Compressed JPEG' : cat.image
                          ) : (
                            <span className="italic text-slate-400">Using default system fallback</span>
                          )}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 align-top text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSave(cat.id)}
                          disabled={isSaving}
                          className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          title="Save Changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(cat)}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
