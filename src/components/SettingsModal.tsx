import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, X, RefreshCw, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetAllData } = useApp();
  const [formData, setFormData] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset all inventory, shifts, clients, maintenance, and quotes to demo defaults?')) {
      resetAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Company Profile & Operational Defaults</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-neutral-300 mb-1 font-medium">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-neutral-300 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-neutral-300 mb-1">Warehouse & Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultTaxRate}
                onChange={(e) =>
                  setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Default Damage Waiver (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.defaultDamageWaiver}
                onChange={(e) =>
                  setFormData({ ...formData, defaultDamageWaiver: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-neutral-300 mb-1">Standard Rental Agreement Terms & Conditions</label>
              <textarea
                rows={5}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-rose-900/60 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Data</span>
            </button>

            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
