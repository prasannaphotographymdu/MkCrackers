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
  Receipt,
  Hash,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { ShopDetails, SequenceSettings } from '../../types';
import { SHOP_INFO } from '../../data/seed';
import { resetDataInFirestore } from '../../lib/firebase';

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

  const [seqSettings, setSeqSettings] = useState<SequenceSettings>({
    posPrefix: 'POS',
    posNextNumber: 9001,
    posUseYear: true,
    posPadding: 4,
    enquiryPrefix: 'ENQ',
    enquiryNextNumber: 1004,
    enquiryUseYear: true,
    enquiryPadding: 4,
    gstPrefix: 'GST',
    gstNextNumber: 1,
    gstUseYear: true,
    gstPadding: 4
  });
  const [isSeqSaving, setIsSeqSaving] = useState(false);
  const [isSeqLoading, setIsSeqLoading] = useState(true);

  // Data Reset State
  const [resetOnlineEnquiries, setResetOnlineEnquiries] = useState(false);
  const [resetOfflineOrders, setResetOfflineOrders] = useState(false);
  const [resetGstInvoices, setResetGstInvoices] = useState(false);
  const [resetSequences, setResetSequences] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleExecuteDataReset = async () => {
    if (!resetOnlineEnquiries && !resetOfflineOrders && !resetGstInvoices) {
      onShowToast('error', 'Select Data to Reset', 'Please select at least one transaction type to reset.');
      return;
    }
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      onShowToast('error', 'Confirmation Required', 'Please type RESET into the confirmation box to authorize data deletion.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetOnlineEnquiries,
          resetOfflineOrders,
          resetGstInvoices,
          resetSequences
        })
      });

      if (res.ok) {
        const data = await res.json();
        await resetDataInFirestore({
          resetOnlineEnquiries,
          resetOfflineOrders,
          resetGstInvoices
        });

        onShowToast(
          'success',
          'Data Reset Completed!',
          `Cleared ${data.report.enquiriesCleared} online enquiries, ${data.report.offlineOrdersCleared} offline bills, and ${data.report.invoicesCleared} GST bills.`
        );

        setResetOnlineEnquiries(false);
        setResetOfflineOrders(false);
        setResetGstInvoices(false);
        setConfirmText('');
        fetchSequenceSettings();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Reset failed');
      }
    } catch (err: any) {
      onShowToast('error', 'Reset Error', err.message || 'Failed to reset selected data.');
    } finally {
      setIsResetting(false);
    }
  };

  const fetchSequenceSettings = async () => {
    try {
      const res = await fetch('/api/settings/sequences');
      if (res.ok) {
        const data = await res.json();
        setSeqSettings(data);
      }
    } catch (err) {
      console.error('Error fetching sequence settings:', err);
    } finally {
      setIsSeqLoading(false);
    }
  };

  useEffect(() => {
    fetchSequenceSettings();
  }, []);

  const handleSaveSequenceSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSeqSaving(true);
    try {
      const res = await fetch('/api/settings/sequences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seqSettings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSeqSettings(updated);
        onShowToast('success', 'Sequence Settings Saved', 'Document numbering sequences updated successfully.');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err: any) {
      onShowToast('error', 'Error Saving Sequences', err.message || 'Could not save sequence settings.');
    } finally {
      setIsSeqSaving(false);
    }
  };

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  GSTIN Number (15 Digits) *
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-600">Enable GST Billing</span>
                  <input
                    type="checkbox"
                    checked={formData.gstEnabled || false}
                    onChange={(e) => handleChange('gstEnabled', e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                  />
                </label>
              </div>
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

      {/* Sequence Settings Card */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Document Sequence & Numbering Settings
            </h3>
          </div>
          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
            Active Real-time
          </span>
        </div>

        {isSeqLoading ? (
          <div className="py-6 flex justify-center items-center">
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 ml-2">Loading sequence settings...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* POS Billing Number Sequence */}
              <div className="p-3 border border-slate-100 rounded bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>POS Bill Sequence</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Preview: {seqSettings.posPrefix}-{seqSettings.posUseYear ? `${new Date().getFullYear()}-` : ''}{String(seqSettings.posNextNumber).padStart(seqSettings.posPadding, '0')}
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Prefix</label>
                    <input
                      type="text"
                      value={seqSettings.posPrefix}
                      onChange={(e) => setSeqSettings({ ...seqSettings, posPrefix: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Next Number</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        value={seqSettings.posNextNumber}
                        onChange={(e) => setSeqSettings({ ...seqSettings, posNextNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setSeqSettings({ ...seqSettings, posNextNumber: 1 })}
                        className="px-1.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-medium flex items-center gap-0.5"
                        title="Reset to 1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Zero Padding</label>
                    <select
                      value={seqSettings.posPadding}
                      onChange={(e) => setSeqSettings({ ...seqSettings, posPadding: parseInt(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500"
                    >
                      <option value="0">No Padding</option>
                      <option value="2">2 Digits (e.g. 01)</option>
                      <option value="4">4 Digits (e.g. 0001)</option>
                      <option value="6">6 Digits (e.g. 000001)</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={seqSettings.posUseYear}
                        onChange={(e) => setSeqSettings({ ...seqSettings, posUseYear: e.target.checked })}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                      <span>Include Year (-{new Date().getFullYear()}-)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Online Enquiry Sequence */}
              <div className="p-3 border border-slate-100 rounded bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Online Enquiry Sequence</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Preview: {seqSettings.enquiryPrefix}-{seqSettings.enquiryUseYear ? `${new Date().getFullYear()}-` : ''}{String(seqSettings.enquiryNextNumber).padStart(seqSettings.enquiryPadding, '0')}
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Prefix</label>
                    <input
                      type="text"
                      value={seqSettings.enquiryPrefix}
                      onChange={(e) => setSeqSettings({ ...seqSettings, enquiryPrefix: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Next Number</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        value={seqSettings.enquiryNextNumber}
                        onChange={(e) => setSeqSettings({ ...seqSettings, enquiryNextNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setSeqSettings({ ...seqSettings, enquiryNextNumber: 1 })}
                        className="px-1.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-medium flex items-center gap-0.5"
                        title="Reset to 1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Zero Padding</label>
                    <select
                      value={seqSettings.enquiryPadding}
                      onChange={(e) => setSeqSettings({ ...seqSettings, enquiryPadding: parseInt(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500"
                    >
                      <option value="0">No Padding</option>
                      <option value="2">2 Digits (e.g. 01)</option>
                      <option value="4">4 Digits (e.g. 0001)</option>
                      <option value="6">6 Digits (e.g. 000001)</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={seqSettings.enquiryUseYear}
                        onChange={(e) => setSeqSettings({ ...seqSettings, enquiryUseYear: e.target.checked })}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                      <span>Include Year (-{new Date().getFullYear()}-)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* GST Invoice Sequence */}
              <div className="p-3 border border-slate-100 rounded bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>GST Invoice Sequence</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Preview: {seqSettings.gstPrefix}-{seqSettings.gstUseYear ? `${new Date().getFullYear()}-` : ''}{String(seqSettings.gstNextNumber).padStart(seqSettings.gstPadding, '0')}
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Prefix</label>
                    <input
                      type="text"
                      value={seqSettings.gstPrefix}
                      onChange={(e) => setSeqSettings({ ...seqSettings, gstPrefix: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Next Number</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        value={seqSettings.gstNextNumber}
                        onChange={(e) => setSeqSettings({ ...seqSettings, gstNextNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setSeqSettings({ ...seqSettings, gstNextNumber: 1 })}
                        className="px-1.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-medium flex items-center gap-0.5"
                        title="Reset to 1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Zero Padding</label>
                    <select
                      value={seqSettings.gstPadding}
                      onChange={(e) => setSeqSettings({ ...seqSettings, gstPadding: parseInt(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500"
                    >
                      <option value="0">No Padding</option>
                      <option value="2">2 Digits (e.g. 01)</option>
                      <option value="4">4 Digits (e.g. 0001)</option>
                      <option value="6">6 Digits (e.g. 000001)</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={seqSettings.gstUseYear}
                        onChange={(e) => setSeqSettings({ ...seqSettings, gstUseYear: e.target.checked })}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                      />
                      <span>Include Year (-{new Date().getFullYear()}-)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Buttons & Reset to System Defaults */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all sequences to system defaults?')) {
                    setSeqSettings({
                      posPrefix: 'POS',
                      posNextNumber: 9001,
                      posUseYear: true,
                      posPadding: 4,
                      enquiryPrefix: 'ENQ',
                      enquiryNextNumber: 1004,
                      enquiryUseYear: true,
                      enquiryPadding: 4,
                      gstPrefix: 'GST',
                      gstNextNumber: 1,
                      gstUseYear: true,
                      gstPadding: 4
                    });
                    onShowToast('info', 'Reset to System Defaults', 'Document sequence configurations populated with defaults. Click "Save Sequence Settings" to apply.');
                  }
                }}
                className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to System Defaults
              </button>

              <button
                type="button"
                onClick={() => handleSaveSequenceSettings()}
                disabled={isSeqSaving}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSeqSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Sequence Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- DANGER ZONE / DATA RESET SETTINGS --- */}
        <div className="bg-white rounded-lg border border-red-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Business Transaction Data Reset
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-bold">
                    Admin Only
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Selectively reset online enquiries, offline POS counter bills, or tax GST invoices to clean up test data or start a new financial year.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Warning:</span> Data reset operations will permanently delete selected transaction records from both memory and Firestore database. Ensure you have backed up any required GST reports or invoice records beforehand.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Online Enquiries */}
              <label className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                resetOnlineEnquiries ? 'bg-red-50/70 border-red-300 ring-1 ring-red-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}>
                <input
                  type="checkbox"
                  checked={resetOnlineEnquiries}
                  onChange={(e) => setResetOnlineEnquiries(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                    Online Enquiries
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Clear all web catalog customer enquiries and quotation records.
                  </p>
                </div>
              </label>

              {/* Offline Bills */}
              <label className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                resetOfflineOrders ? 'bg-red-50/70 border-red-300 ring-1 ring-red-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}>
                <input
                  type="checkbox"
                  checked={resetOfflineOrders}
                  onChange={(e) => setResetOfflineOrders(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    Offline POS Bills
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Clear counter POS sales, cash receipts, and store billing history.
                  </p>
                </div>
              </label>

              {/* GST Invoices */}
              <label className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                resetGstInvoices ? 'bg-red-50/70 border-red-300 ring-1 ring-red-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              }`}>
                <input
                  type="checkbox"
                  checked={resetGstInvoices}
                  onChange={(e) => setResetGstInvoices(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                    GST Tax Invoices
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Clear official B2B GST tax invoice documents and tax sequence logs.
                  </p>
                </div>
              </label>
            </div>

            {/* Sequence Reset Option */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={resetSequences}
                  onChange={(e) => setResetSequences(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span>Also reset bill & invoice numbering sequences back to starting counters (e.g. POS-9001, GST-0001)</span>
              </label>
            </div>

            {/* Confirmation & Execute Button */}
            {(resetOnlineEnquiries || resetOfflineOrders || resetGstInvoices) && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3 mt-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-red-900">
                      Type <span className="underline font-mono bg-white px-1.5 py-0.5 rounded border border-red-300">RESET</span> to confirm:
                    </label>
                    <input
                      type="text"
                      placeholder="Type RESET"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded border border-red-300 text-slate-900 focus:outline-none focus:border-red-600 w-48 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteDataReset}
                    disabled={isResetting || confirmText.trim().toUpperCase() !== 'RESET'}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isResetting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Resetting Selected Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> Execute Data Reset
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
