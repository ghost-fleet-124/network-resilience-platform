"use client";

import React, { useState, useEffect } from "react";
import HeaderHUD from "@/components/HeaderHUD";
import SOCDashboard from "@/components/SOCDashboard";
import ControlledLoadTesting from "@/components/ControlledLoadTesting";
import RepositoryIntelligence from "@/components/RepositoryIntelligence";
import ThreatDetection from "@/components/ThreatDetection";
import DefenseCenter from "@/components/DefenseCenter";
import Forensics from "@/components/Forensics";
import { SOCUser, UserRole } from "@/lib/types";
import { getOperatorByRole } from "@/lib/auth";

export default function BlackshieldPlatformPage() {
  const [currentTab, setCurrentTab] = useState("soc-dashboard");
  const [activeOperator, setActiveOperator] = useState<SOCUser>(getOperatorByRole("SOC_LEAD"));
  const [threatLevel, setThreatLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [mitigationActive, setMitigationActive] = useState<boolean>(true);

  // Sync session and initial status
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setActiveOperator(data.operator);
      }
    } catch (err) {
      console.error("Error fetching session:", err);
    }
  };

  const handleOperatorChange = async (role: UserRole) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOperator(data.operator);
      }
    } catch (err) {
      console.error("Error switching operator:", err);
    }
  };

  const handleToggleMitigation = async () => {
    try {
      const res = await fetch("/api/defense/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_MITIGATION_MODE",
          enabled: !mitigationActive,
          operatorName: activeOperator.name,
          operatorRole: activeOperator.role,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMitigationActive(data.activeMitigationMode);
        setThreatLevel(data.activeMitigationMode ? 2 : 1);
      }
    } catch (err) {
      console.error("Error toggling mitigation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-soc-void text-soc-text flex flex-col">
      {/* Global SOC Header HUD */}
      <HeaderHUD
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeOperator={activeOperator}
        onOperatorChange={handleOperatorChange}
        threatLevel={threatLevel}
        mitigationActive={mitigationActive}
        onToggleMitigation={handleToggleMitigation}
      />

      {/* Main Tactical Operations Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === "soc-dashboard" && <SOCDashboard />}
        {currentTab === "load-testing" && <ControlledLoadTesting />}
        {currentTab === "repo-intel" && <RepositoryIntelligence />}
        {currentTab === "threat-detection" && <ThreatDetection />}
        {currentTab === "defense-center" && <DefenseCenter />}
        {currentTab === "forensics" && <Forensics />}
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-soc-border/60 bg-soc-bg py-3 px-4 sm:px-8 text-[11px] font-mono text-soc-muted flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-soc-emerald animate-pulse" />
            <span className="text-soc-text font-bold">BLACKSHIELD SOC CLUSTER ONLINE</span>
          </span>
          <span>|</span>
          <span>Target Architecture: National Emergency Infrastructure</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Active Operator: <strong className="text-soc-cyan">{activeOperator.name}</strong></span>
          <span>Encrypted Session: TLS 1.3 / AES-256-GCM</span>
        </div>
      </footer>
    </div>
  );
}
