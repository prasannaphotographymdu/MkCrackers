import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  FileCheck2,
  MapPin,
  CreditCard,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  IndianRupee,
  Receipt
} from 'lucide-react';
import { ShopDetails } from '../../types';
import { SHOP_INFO } from '../../data/seed';

interface CompanyProfileSettingsProps {
  shopDetails: ShopDetails;
  onSaveShopDetails: (updated: ShopDetails) => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const CompanyProfileSettings: React.FC<CompanyProfileSettingsProps> = ({
  shopDetails,
  onSaveShopDetails,
  onShowToast
}) => {
  const [formData, setFormData] = useState<ShopDetails>({ ...shopDetails });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData({ ...shopDetails });
  }, [shopDetails]);

  const handleChange = (field: keyof ShopDetails, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(shopDetails));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      onShowToast('error', 'Validation Error', 'Company Name is required.');
      return;
    }

    if (!formData.phone.trim()) {
      onShowToast('error', 'Validation Error', 'Primary Phone number is required.');
      return;
    }

    if (!formData.gstin.trim()) {
      onShowToast('error', 'Validation Error', 'GSTIN Number is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveShopDetails({
        ...formData,
        minimumOrderAmount: Math.max(0, Number(formData.minimumOrderAmount) || 0)
      });
      setHasChanges(false);
      onShowToast(
        'success',
        'Profile Updated Successfully',
        'Company settings have been saved and applied across the entire store.'
      );
    } catch (err: any) {
      onShowToast('error', 'Save Failed', err.message || 'Could not save company profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData({ ...SHOP_INFO });
    setHasChanges(true);
    onShowToast('info', 'Reset to Defaults', 'Click "Save Changes" to confirm resetting settings.');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-red-100 text-red-700">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Company & Business Profile Settings
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customize company name, contact info, GSTIN, minimum order amount, bank details, and invoice footers.
            Changes update live across the public shop header, checkout modal, success messages, admin portal, and tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-4 py-1.5 rounded font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all ${
              hasChanges
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Profile Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-slate-900 text-white rounded-md p-3.5 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
          <span className="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> Live Company Header Preview
          </span>
          <span className="text-[10px] text-slate-400 font-mono">GSTIN: {formData.gstin || 'N/A'}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-sm font-extrabold text-white uppercase tracking-tight">
              {formData.name || 'Company Name'}
            </div>
            <p className="text-[11px] text-amber-300 font-medium">
              {formData.tagline || 'Tagline'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {formData.address}, {formData.cityState}
            </p>
          </div>
          <div className="text-left sm:text-right text-[11px] space-y-0.5">
            <div className="text-slate-300">
              Helpline: <b className="text-white font-mono">{formData.phone}</b>
            </div>
            <div className="text-slate-300">
              Email: <b className="text-slate-200">{formData.email}</b>
            </div>
            <div className="text-emerald-400 font-bold font-mono">
              Min Order Limit: ₹{formData.minimumOrderAmount}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Basic Identity & Branding */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Company Identity & Branding
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Company / Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Sri Laxmi Fireworks Wholesale"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tagline / Business Subtitle *
              </label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="e.g. Direct Sivakasi Factory Rates | B2B Wholesale Firecracker Supplier"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Helpline Numbers */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Phone className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Contact Information & B2B Helplines
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Primary Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98421 99887"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Secondary Phone
              </label>
              <input
                type="text"
                value={formData.secondaryPhone || ''}
                onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                placeholder="+91 94431 22334"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="+91 98421 99887"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="sales@srilaxmifireworks.com"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Factory Address & Tax GSTIN */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <MapPin className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Factory Address & Tax Registration (GSTIN)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Street / Factory Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="124 Factory Bypass Road, Sivakasi - 626123"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                City & State *
              </label>
              <input
                type="text"
                required
                value={formData.cityState}
                onChange={(e) => handleChange('cityState', e.target.value)}
                placeholder="Sivakasi, Tamil Nadu, India"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                GSTIN Number (15 Digits) *
              </label>
              <input
                type="text"
                required
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                placeholder="33AAAAA0000A1Z5"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Minimum Wholesale Order Amount (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.minimumOrderAmount}
                  onChange={(e) => handleChange('minimumOrderAmount', e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Bank Details (For Invoice Printing) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <CreditCard className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              4. Bank Account Details (Appears on GST Tax Invoices)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="State Bank of India"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={formData.accountName || ''}
                onChange={(e) => handleChange('accountName', e.target.value)}
                placeholder="Sri Laxmi Fireworks Wholesale"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber || ''}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                placeholder="38920192831"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifscCode || ''}
                onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                placeholder="SBIN0001234"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                UPI ID (For Instant QR / Payment)
              </label>
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="srilaxmifireworks@sbi"
                className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Terms & Conditions */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Receipt className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5. Invoice Terms & Conditions / Footer Notes
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Standard Invoice Footnote Terms (Appears on printed PDFs)
            </label>
            <textarea
              rows={3}
              value={formData.terms || ''}
              onChange={(e) => handleChange('terms', e.target.value)}
              placeholder="1. Goods once sold will not be taken back or exchanged.&#10;2. Transport & freight extra at actuals during dispatch.&#10;3. Subject to Sivakasi Jurisdiction."
              className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-red-500 font-sans resize-y"
            />
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-between bg-slate-100 p-3 rounded border border-slate-200">
          <span className="text-xs text-slate-500">
            {hasChanges ? (
              <b className="text-amber-700">Unsaved changes pending. Click "Save Profile Settings"</b>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All profile details synchronized
              </span>
            )}
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Profile Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
