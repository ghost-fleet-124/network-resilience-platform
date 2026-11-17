"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  UserCheck,
  AlertTriangle,
  Flame,
  Activity,
  ChevronDown,
} from "lucide-react";
import { SOCUser, UserRole } from "@/lib/types";
import { SOC_OPERATORS } from "@/lib/auth";

interface HeaderHUDProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeOperator: SOCUser;
  onOperatorChange: (role: UserRole) => void;
  threatLevel: 1 | 2 | 3 | 4 | 5;
  mitigationActive: boolean;
  onToggleMitigation: () => void;
}

export default function HeaderHUD({
  currentTab,
  onTabChange,
  activeOperator,
  onOperatorChange,
  threatLevel,
  mitigationActive,
  onToggleMitigation,
}: HeaderHUDProps) {
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false);

  const tabs = [
    { id: "soc-dashboard", label: "SOC Dashboard", badge: null },
    { id: "load-testing", label: "Controlled Load Testing", badge: "k6" },
    { id: "repo-intel", label: "Repository Intelligence", badge: "ZxCDDoS" },
    { id: "threat-detection", label: "Threat Detection", badge: "ALERT" },
    { id: "defense-center", label: "Defense Center", badge: "WAF" },
    { id: "forensics", label: "Forensics & Reports", badge: "PDF" },
  ];

  // DEFCON color mapping
  const defconColors = {
    1: "bg-soc-crimson text-black border-red-500 shadow-cyber-red animate-pulse-fast",
    2: "bg-orange-600 text-white border-orange-400",
    3: "bg-soc-amber text-black border-amber-300",
    4: "bg-blue-600 text-white border-blue-400",
    5: "bg-soc-emerald text-black border-emerald-300",
  };

  return (
    <header className="sticky top-0 z-50 bg-soc-bg/95 backdrop-blur-md border-b border-soc-border shadow-soc-panel">
      {/* Top Telemetry & Status HUD Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-soc-border/40 text-xs">
        {/* Organization Brand & Agency Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-soc-card border border-soc-cyan/40 shadow-cyber-cyan">
            <Radio className="w-5 h-5 text-soc-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-sm tracking-widest text-soc-cyan">
                BLACKSHIELD
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-soc-card border border-soc-cyan/30 text-soc-cyan">
                v2.6-CRITICAL-INFRA
              </span>
            </div>
            <p className="text-[10px] text-soc-muted tracking-wide uppercase">
              National Emergency SOC & Resilience Platform
            </p>
          </div>
        </div>

        {/* Global DEFCON Threat Level & Mitigation Shield */}
        <div className="flex items-center space-x-3">
          {/* DEFCON Badge */}
          <div className="flex items-center space-x-1.5 bg-soc-card px-2.5 py-1 rounded border border-soc-border">
            <Flame className="w-3.5 h-3.5 text-soc-crimson" />
            <span className="text-[10px] font-mono text-soc-muted uppercase">THREAT LEVEL:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                defconColors[threatLevel] || defconColors[2]
              }`}
            >
              DEFCON {threatLevel} - {threatLevel === 1 ? "CRITICAL EMERGENCY" : threatLevel === 2 ? "ACTIVE UNDER ATTACK" : "ELEVATED"}
            </span>
          </div>

          {/* Master Emergency Defense Shield Toggle */}
          <button
            onClick={onToggleMitigation}
            className={`flex items-center space-x-2 px-3 py-1 rounded font-mono text-xs font-semibold tracking-wider transition-all duration-200 border ${
              mitigationActive
                ? "bg-soc-emerald/20 text-soc-emerald border-soc-emerald shadow-cyber-emerald hover:bg-soc-emerald/30"
                : "bg-soc-crimson/20 text-soc-crimson border-soc-crimson hover:bg-soc-crimson/30 animate-pulse"
            }`}
            title="Toggle Global Emergency Mitigation Shield"
          >
            {mitigationActive ? (
              <>
                <ShieldCheck className="w-4 h-4 text-soc-emerald" />
                <span>DEFENSE SHIELD: ACTIVE</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-soc-crimson" />
                <span>SHIELD: STANDBY (UNDER-ATTACK RISK)</span>
              </>
            )}
          </button>
        </div>

        {/* Operator Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOperatorDropdownOpen(!operatorDropdownOpen)}
            className="flex items-center space-x-2 bg-soc-card hover:bg-soc-cardHover border border-soc-border px-3 py-1.5 rounded transition-colors text-left"
          >
            <UserCheck className="w-3.5 h-3.5 text-soc-cyan" />
            <div>
              <span className="font-medium text-soc-text text-[11px] block">{activeOperator.name}</span>
              <span className="text-[9px] font-mono text-soc-cyan block">
                [{activeOperator.role}] {activeOperator.badgeNumber}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-soc-muted ml-1" />
          </button>

          {operatorDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-soc-card border border-soc-border rounded-lg shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-mono text-soc-muted border-b border-soc-border mb-1">
                Switch SOC Operator Role
              </div>
              {SOC_OPERATORS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    onOperatorChange(op.role);
                    setOperatorDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-soc-cardHover text-xs ${
                    activeOperator.role === op.role ? "bg-soc-border/50 text-soc-cyan font-bold" : "text-soc-text"
                  }`}
                >
                  <div>
                    <div className="font-medium">{op.name}</div>
                    <div className="text-[10px] text-soc-muted font-mono">{op.badgeNumber}</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-soc-void border border-soc-border">
                    {op.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded text-xs font-mono tracking-wider transition-all duration-150 whitespace-nowrap border ${
                  isActive
                    ? "bg-soc-card text-soc-cyan border-soc-cyan shadow-cyber-cyan font-semibold"
                    : "bg-transparent text-soc-muted border-transparent hover:text-soc-text hover:bg-soc-card/50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold ${
                      isActive
                        ? "bg-soc-cyan text-soc-void"
                        : "bg-soc-border text-soc-muted"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
