import React, { useState } from 'react';
import { Send, FileJson, FileText, Code2, Sliders, ArrowRight } from 'lucide-react';

interface HttpMethodConfigProps {
  method: string;
  setMethod: (m: string) => void;
  path: string;
  setPath: (p: string) => void;
  payload: string;
  setPayload: (pl: string) => void;
  bodyType: 'json' | 'form' | 'raw';
  setBodyType: (bt: 'json' | 'form' | 'raw') => void;
  headers: string;
  setHeaders: (h: string) => void;
  queryParams: string;
  setQueryParams: (qp: string) => void;
  timeoutSec: number;
  setTimeoutSec: (t: number) => void;
  virtualUsers: number;
  setVirtualUsers: (vu: number) => void;
  disabled: boolean;
}

export const HttpMethodConfig: React.FC<HttpMethodConfigProps> = ({
  method,
  setMethod,
  path,
  setPath,
  payload,
  setPayload,
  bodyType,
  setBodyType,
  headers,
  setHeaders,
  queryParams,
  setQueryParams,
  timeoutSec,
  setTimeoutSec,
  virtualUsers,
  setVirtualUsers,
  disabled
}) => {
  const methods = ['GET', 'POST', 'PUT', 'HEAD'];

  const sampleJson = JSON.stringify({
    service: "resilience_test",
    timestamp: Date.now(),
    client_version: "2.5.0",
    workload: {
      type: "benchmark",
      items: [101, 102, 103]
    }
  }, null, 2);

  const sampleForm = "service=resilience_test&client_version=2.5.0&workload_type=benchmark&action=submit";

  const handleBodyTypeChange = (type: 'json' | 'form' | 'raw') => {
    setBodyType(type);
    if (type === 'json' && (!payload || payload.includes('='))) {
      setPayload(sampleJson);
    } else if (type === 'form' && (!payload || payload.startsWith('{'))) {
      setPayload(sampleForm);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">Step 3</span>
            <h2 className="text-sm font-semibold text-white">HTTP Request & Payload Specification</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure HTTP method, path, query parameters, request body, and concurrency limits.
          </p>
        </div>

        {/* Method Selector Pills */}
        <div className="inline-flex p-0.5 rounded-md bg-slate-800 border border-slate-700">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => setMethod(m)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                method === m
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              } disabled:opacity-50`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Path & Query Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Endpoint Path
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            disabled={disabled}
            placeholder="/api/v1/resource or /search"
            className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-white rounded-md placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Query String Parameters
          </label>
          <input
            type="text"
            value={queryParams}
            onChange={(e) => setQueryParams(e.target.value)}
            disabled={disabled}
            placeholder="query=benchmark&limit=100&offset=0"
            className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-white rounded-md placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Method Specific Payload Configuration */}
      {(method === 'POST' || method === 'PUT') && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-300">Request Body & Content-Type</label>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                {bodyType === 'json' ? 'application/json' : bodyType === 'form' ? 'application/x-www-form-urlencoded' : 'text/plain'}
              </span>
            </div>

            {/* Body Type Toggle */}
            <div className="inline-flex p-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleBodyTypeChange('json')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  bodyType === 'json' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleBodyTypeChange('form')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  bodyType === 'form' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Form-Encoded
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleBodyTypeChange('raw')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  bodyType === 'raw' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw / Plain
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              disabled={disabled}
              placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'key=value&foo=bar'}
              className="w-full bg-slate-950 border border-slate-700 p-2.5 text-xs font-mono text-slate-200 rounded-md placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Quick Templates:</span>
            <button
              type="button"
              onClick={() => { setBodyType('json'); setPayload(sampleJson); }}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Sample JSON Body
            </button>
            <span className="text-slate-600">&bull;</span>
            <button
              type="button"
              onClick={() => { setBodyType('form'); setPayload(sampleForm); }}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Sample Form Body
            </button>
          </div>
        </div>
      )}

      {/* Custom Headers & Client Timing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Custom HTTP Headers <span className="text-slate-500 font-normal">(One per line: Key: Value)</span>
          </label>
          <textarea
            rows={2}
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            disabled={disabled}
            placeholder="X-Custom-Auth: token_abc123&#10;Authorization: Bearer test_secret"
            className="w-full bg-slate-950 border border-slate-700 p-2 text-xs font-mono text-slate-200 rounded-md placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Timeout <span className="text-slate-400 font-mono">({timeoutSec}s)</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="60"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(parseFloat(e.target.value) || 5.0)}
              disabled={disabled}
              className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded-md focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Virtual Users <span className="text-slate-400 font-mono">({virtualUsers})</span>
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={virtualUsers}
              onChange={(e) => setVirtualUsers(parseInt(e.target.value) || 50)}
              disabled={disabled}
              className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded-md focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
