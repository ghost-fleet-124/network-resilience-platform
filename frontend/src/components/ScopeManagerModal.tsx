import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Plus, Trash2, Globe, Clock, AlertTriangle, CheckCircle2, ChevronRight, Info, ShieldAlert } from 'lucide-react';
import { ApprovedScope } from '../types';

interface ScopeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTarget?: (hostOrUrl: string) => void;
}

export const ScopeManagerModal: React.FC<ScopeManagerModalProps> = ({
  isOpen,
  onClose,
  onApplyTarget
}) => {
  const [scopes, setScopes] = useState<ApprovedScope[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [authorizedBy, setAuthorizedBy] = useState<string>('');
  const [targetPattern, setTargetPattern] = useState<string>('');
  const [allowedPortsStr, setAllowedPortsStr] = useState<string>('');
  const [validDays, setValidDays] = useState<number>(90);
  const [maxRps, setMaxRps] = useState<number>(1000000);
  const [termsConfirmed, setTermsConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchScopes = () => {
    setLoading(true);
    fetch('/api/targets/scopes')
      .then((res) => res.json())
      .then((data) => {
        setScopes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load scopes:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchScopes();
      setNotification(null);
    }
  }, [isOpen]);

  const handleRegisterScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organization.trim() || !authorizedBy.trim() || !targetPattern.trim()) {
      setNotification({ type: 'error', message: 'Please fill in all required scope fields.' });
      return;
    }
    if (!termsConfirmed) {
      setNotification({ type: 'error', message: 'You must confirm legal authorization under the Acceptable Use Policy.' });
      return;
    }

    let parsedPorts: number[] | undefined = undefined;
    if (allowedPortsStr.trim()) {
      parsedPorts = allowedPortsStr
        .split(',')
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p) && p > 0 && p <= 65535);
    }

    setIsSubmitting(true);
    setNotification(null);
    try {
      const res = await fetch('/api/targets/scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          organization: organization.trim(),
          authorized_by: authorizedBy.trim(),
          target_pattern: targetPattern.trim(),
          allowed_ports: parsedPorts,
          valid_days: validDays,
          max_rps_allowed: maxRps,
          terms_acknowledged: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to register scope');
      }

      setNotification({
        type: 'success',
        message: `Approved Scope '${data.name}' registered successfully! Targets matching '${data.target_pattern}' are now authorized.`
      });

      // Reset form
      setName('');
      setOrganization('');
      setAuthorizedBy('');
      setTargetPattern('');
      setAllowedPortsStr('');
      setShowAddForm(false);
      fetchScopes();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error registering scope' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeScope = async (scopeId: string) => {
    try {
      const res = await fetch(`/api/targets/scopes/${scopeId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Scope successfully revoked.' });
        fetchScopes();
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Failed to revoke scope: ' + e.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0e1526] border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-[#0a0f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Authorized Organization Testing Scopes</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {scopes.length} Registered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pre-approved domains, wildcard subdomains, and IP subnets authorized for high-volume testing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-300">
          
          {/* Notification Banner */}
          {notification && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${
              notification.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                : 'bg-rose-950/60 border-rose-700 text-rose-300'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Quick Notice: No Challenge Files Needed */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-cyan-200">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                Targets covered by an approved scope can be tested immediately with <strong>no individual challenge files required</strong>.
              </span>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Approved Scope</span>
              </button>
            )}
          </div>

          {/* Add Scope Form */}
          {showAddForm && (
            <form onSubmit={handleRegisterScope} className="p-4 rounded-xl bg-slate-900 border border-cyan-700/60 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Register New Approved Testing Scope
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs underline font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Scope Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Production Ingress US-East"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Organization / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Apex Interactive Corp"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Approving Security Officer / Admin *</label>
                  <input
                    type="text"
                    required
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    placeholder="e.g. ciso@apexgaming.net"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Target Pattern * (Domain wildcard, domain, CIDR, or IP)
                  </label>
                  <input
                    type="text"
                    required
                    value={targetPattern}
                    onChange={(e) => setTargetPattern(e.target.value)}
                    placeholder="e.g. *.staging.apexgaming.net, api.example.com, or 198.51.100.0/24"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Allowed Ports (Optional, comma-separated)</label>
                  <input
                    type="text"
                    value={allowedPortsStr}
                    onChange={(e) => setAllowedPortsStr(e.target.value)}
                    placeholder="e.g. 80, 443, 9003 (leave empty for any port)"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Validity (Days)</label>
                    <select
                      value={validDays}
                      onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                    >
                      <option value={30}>30 Days</option>
                      <option value={90}>90 Days</option>
                      <option value={180}>180 Days</option>
                      <option value={365}>1 Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Max RPS Budget</label>
                    <select
                      value={maxRps}
                      onChange={(e) => setMaxRps(parseInt(e.target.value) || 1000000)}
                      className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
                    >
                      <option value={200000}>200K RPS</option>
                      <option value={500000}>500K RPS</option>
                      <option value={1000000}>1.0M RPS</option>
                      <option value={3000000}>3.0M RPS</option>
                      <option value={5000000}>5.0M RPS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Legal Confirmation Checkbox */}
              <label className="flex items-start gap-2 pt-1 text-slate-300 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsConfirmed}
                  onChange={(e) => setTermsConfirmed(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 mt-0.5 accent-cyan-500"
                />
                <span>
                  I confirm under the <strong>Acceptable Use Policy</strong> that our organization legally owns or has explicit written authorization to test infrastructure matching this target pattern.
                </span>
              </label>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Authorize Scope'}
                </button>
              </div>
            </form>
          )}

          {/* Scopes List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono">
              Loading active organization scopes...
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {scopes.map((scope) => {
                const isExpired = scope.status === 'EXPIRED' || Date.now() / 1000 > scope.valid_until;
                const isRevoked = scope.status === 'REVOKED';
                const isActive = scope.status === 'ACTIVE' && !isExpired;

                return (
                  <div
                    key={scope.scope_id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-slate-900/70 border-emerald-800/40 hover:border-emerald-700'
                        : isExpired
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-rose-950/20 border-rose-800/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : isExpired
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-rose-950 text-rose-300 border border-rose-700'
                        }`}>
                          {isActive ? 'ACTIVE SCOPE' : isExpired ? 'EXPIRED' : 'REVOKED'}
                        </span>
                        <h3 className="font-bold text-slate-100 text-xs font-mono">{scope.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive && onApplyTarget && (
                          <button
                            onClick={() => {
                              const pattern = scope.target_pattern.replace('*.', 'api.');
                              onApplyTarget(pattern);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Use Target</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {scope.status !== 'REVOKED' && (
                          <button
                            onClick={() => handleRevokeScope(scope.scope_id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Revoke Scope"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Target Pattern:</span>
                        <span className="text-cyan-300 font-bold">{scope.target_pattern}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Organization:</span>
                        <span className="text-slate-200">{scope.organization}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Authorized By:</span>
                        <span className="text-slate-200">{scope.authorized_by}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Valid Until:</span>
                        <span className={isActive ? 'text-emerald-300' : 'text-amber-400'}>
                          {new Date(scope.valid_until * 1000).toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>

                    {scope.notes && (
                      <p className="mt-2 text-[11px] text-slate-400 italic">
                        "{scope.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyber-border bg-[#0a0f1d] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Scopes persist across server instances and govern live load tests.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
