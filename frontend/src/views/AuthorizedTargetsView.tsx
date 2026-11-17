import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  PlayCircle, 
  Trash2, 
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Building,
  UserCheck
} from 'lucide-react';
import { ApprovedScope } from '../types';

interface AuthorizedTargetsViewProps {
  scopes: ApprovedScope[];
  onRefreshScopes: () => Promise<void>;
  onSelectTargetForTest: (scope: ApprovedScope) => void;
}

export const AuthorizedTargetsView: React.FC<AuthorizedTargetsViewProps> = ({
  scopes,
  onRefreshScopes,
  onSelectTargetForTest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [targetPattern, setTargetPattern] = useState('');
  const [organization, setOrganization] = useState('Enterprise Private Testing');
  const [authorizedBy, setAuthorizedBy] = useState('Security Lead');
  const [allowedPorts, setAllowedPorts] = useState('80, 443, 9003');
  const [maxRps, setMaxRps] = useState(500000);
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState('Authorized infrastructure resilience evaluation');
  const [termsAcknowledged, setTermsAcknowledged] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  } | null>(null);

  // Filter scopes
  const filteredScopes = scopes.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.target_pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.organization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetPattern) {
      setVerificationFeedback({
        status: 'error',
        message: 'Please provide both Target Name and Target Domain / Pattern.'
      });
      return;
    }

    setSubmitting(true);
    setVerificationFeedback(null);

    const parsedPorts = allowedPorts
      .split(',')
      .map(p => parseInt(p.trim()))
      .filter(p => !isNaN(p) && p > 0);

    const payload = {
      name,
      organization,
      authorized_by: authorizedBy,
      target_pattern: targetPattern.trim(),
      allowed_ports: parsedPorts.length > 0 ? parsedPorts : [80, 443, 9003],
      max_rps_allowed: Number(maxRps),
      valid_days: Number(validDays),
      notes,
      terms_acknowledged: termsAcknowledged
    };

    try {
      // 1. Register target on backend
      const res = await fetch('/api/targets/scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Target registration failed');
      }

      // 2. Perform explicit server-side verification check immediately
      let verifMessage = 'Target successfully registered in persistent database.';
      try {
        const verifRes = await fetch('/api/targets/scopes/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_id: data.scope_id,
            host: targetPattern.trim(),
            port: parsedPorts[0] || 80,
            protocol: 'HTTP'
          })
        });
        const verifData = await verifRes.json();
        if (verifData.is_authorized) {
          verifMessage = `Target successfully verified by server-side Safety Governor for scope: "${verifData.scope_name || name}".`;
        }
      } catch (vErr) {
        console.warn('Verification check warning:', vErr);
      }

      setVerificationFeedback({
        status: 'success',
        message: verifMessage,
        details: data
      });

      // Refresh parent scopes list
      await onRefreshScopes();

      // Reset form
      setName('');
      setTargetPattern('');
    } catch (err: any) {
      setVerificationFeedback({
        status: 'error',
        message: err.message || 'Failed to authorize target'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeScope = async (scopeId: string) => {
    if (!window.confirm('Are you sure you want to revoke authorization for this target?')) return;
    try {
      const res = await fetch(`/api/targets/scopes/${scopeId}`, { method: 'DELETE' });
      if (res.ok) {
        await onRefreshScopes();
      }
    } catch (err) {
      console.error('Revocation error:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Authorized Target Registry</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strict destination authorization and governance scopes. Workloads can only be dispatched against approved targets.
          </p>
        </div>
        <button
          onClick={() => {
            setVerificationFeedback(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Target</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search targets, domains, organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
            {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => onRefreshScopes()}
            title="Refresh scopes from server"
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Targets Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Target Name</th>
                <th className="py-3 px-3">Domain / IP Pattern</th>
                <th className="py-3 px-3">Approved Ports</th>
                <th className="py-3 px-3">Max Workload</th>
                <th className="py-3 px-3">Expiration</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScopes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No approved targets found matching your search. Click "Register New Target" to add one.
                  </td>
                </tr>
              ) : (
                filteredScopes.map(scope => {
                  const isExpired = scope.valid_until * 1000 < Date.now();
                  const effectiveStatus = isExpired ? 'EXPIRED' : scope.status;
                  const expiryDate = new Date(scope.valid_until * 1000).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={scope.scope_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{scope.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{scope.organization}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-blue-700">
                        {scope.target_pattern}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {scope.allowed_ports && scope.allowed_ports.length > 0 
                          ? scope.allowed_ports.join(', ')
                          : 'Standard (80, 443, 9003)'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-900">
                        {scope.max_rps_allowed.toLocaleString()} RPS
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{expiryDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold inline-flex items-center gap-1 ${
                          effectiveStatus === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : effectiveStatus === 'EXPIRED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            effectiveStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectTargetForTest(scope)}
                            disabled={effectiveStatus !== 'ACTIVE'}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Test Now</span>
                          </button>
                          <button
                            onClick={() => handleRevokeScope(scope.scope_id)}
                            title="Revoke scope"
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Registration Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Register Authorized Target Scope</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {verificationFeedback && (
              <div className={`p-3 rounded-md text-xs border ${
                verificationFeedback.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2 font-medium">
                  {verificationFeedback.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{verificationFeedback.message}</span>
                </div>
                {verificationFeedback.status === 'success' && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700">Target is verified in backend storage.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        if (verificationFeedback.details) {
                          onSelectTargetForTest(verificationFeedback.details);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 cursor-pointer"
                    >
                      Start Test on This Target &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAddScope} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Staging Web Cluster, Corporate Portal, Mock Target"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Target Domain, IP, URL, or Pattern *
                </label>
                <input
                  type="text"
                  placeholder="e.g. www.abes.ac.in, 127.0.0.1, staging.internal.com, or *.local"
                  value={targetPattern}
                  onChange={(e) => setTargetPattern(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Accepts hostnames, full URLs, IP addresses, or wildcards. The backend normalizes schemes and paths automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Organization</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Authorized By</label>
                  <input
                    type="text"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Allowed Ports</label>
                  <input
                    type="text"
                    value={allowedPorts}
                    onChange={(e) => setAllowedPorts(e.target.value)}
                    placeholder="80, 443, 9003"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Max Cap (RPS)</label>
                  <input
                    type="number"
                    value={maxRps}
                    onChange={(e) => setMaxRps(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Authorization Notes / Reference</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ticket reference, maintenance window ID, SLA testing scope..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAcknowledged}
                    onChange={(e) => setTermsAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    I confirm that our organization has authorized explicit load and resilience testing against this target, in compliance with the Acceptable Use Policy.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !termsAcknowledged}
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? 'Registering & Verifying...' : 'Authorize Target'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
