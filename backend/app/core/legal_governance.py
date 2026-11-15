"""
Legal Governance, Acceptable Use Policy (AUP) and Privacy Policy Specifications.
Provides policy documents, structured legal clauses, and privacy compliance handlers.
"""

import time
from typing import Dict, Any, List

LEGAL_METADATA = {
    "version": "2.4.0",
    "effective_date": "2026-01-01",
    "last_updated": "2026-11-16",
    "compliance_frameworks": ["ISO/IEC 27001", "SOC 2 Type II", "GDPR", "CCPA/CPRA"]
}

ACCEPTABLE_USE_POLICY: Dict[str, Any] = {
    "title": "Acceptable Use Policy & Platform Terms of Service",
    "summary": "This platform is strictly engineered for lawful resilience, capacity, and performance testing of systems you own or have explicit authorization to evaluate.",
    "effective_date": LEGAL_METADATA["effective_date"],
    "version": LEGAL_METADATA["version"],
    "prohibition_notice": "UNAUTHORIZED DISRUPTION, DENIAL-OF-SERVICE (DoS) ATTACKS, AND TESTING WITHOUT EXPLICIT PERMISSION ARE STRICTLY PROHIBITED AND UNLAWFUL.",
    "non_authorization_disclaimer": "IMPORTANT: Acknowledging these Terms and Conditions confirms your legal commitments, but does NOT by itself grant technical permission to test an external target. External targets require an active, validated organization testing scope.",
    "clauses": [
        {
            "id": "AUP-01",
            "section": "1. Purpose and Authorized Scope",
            "summary": "Lawful Resilience and Capacity Verification Only",
            "content": (
                "The Antigravity Network Resilience Platform is provided exclusively for bona fide "
                "performance benchmarking, capacity planning, stress testing, and infrastructure resilience verification. "
                "All testing conducted via this platform must serve legitimate engineering objectives, such as validating "
                "gaming netcode, load-balancer limits, or API capacity under simulated peak traffic."
            )
        },
        {
            "id": "AUP-02",
            "section": "2. Target Ownership and Explicit Permission",
            "summary": "Ownership or Written Authorization is Mandatory",
            "content": (
                "You represent and warrant that you either: (a) legally own, operate, and control the target servers, "
                "endpoints, websites, and networks submitted for testing; or (b) possess explicit, current, and verifiable "
                "written authorization from the legitimate infrastructure owner permitting stress testing up to the "
                "specified request-per-second (RPS) and bandwidth limits."
            )
        },
        {
            "id": "AUP-03",
            "section": "3. Operator Responsibilities and Approvals",
            "summary": "Upstream Cloud, ISP, and Stakeholder Coordination",
            "content": (
                "The operator is solely responsible for coordinating and obtaining all necessary approvals from cloud providers, "
                "data center facilities, upstream internet service providers (ISPs), and content delivery networks (CDNs). "
                "The operator must ensure testing schedules comply with relevant Acceptable Use Policies of third-party hosting "
                "environments (such as AWS, Google Cloud, Microsoft Azure, or dedicated game server providers)."
            )
        },
        {
            "id": "AUP-04",
            "section": "4. Strictly Prohibited Activities",
            "summary": "Denial-of-Service and Malicious Testing Forbidden",
            "content": (
                "You are strictly prohibited from using the platform to: (a) conduct unauthorized denial-of-service (DoS) or "
                "distributed denial-of-service (DDoS) attacks; (b) degrade, disrupt, or impair systems without explicit permission; "
                "(c) test public third-party services, critical infrastructure, financial institutions, or emergency services; "
                "(d) bypass security controls, rate limiters, or firewalls maliciously; or (e) obfuscate operator identity to evade attribution."
            )
        },
        {
            "id": "AUP-05",
            "section": "5. Enforcement, Suspension, and Termination",
            "summary": "Zero-Tolerance Policy for Violations",
            "content": (
                "Any suspected violation of this policy will result in immediate termination of the active test session, "
                "revocation of all authorized testing scopes, and permanent suspension or termination of operator credentials. "
                "The platform maintains tamper-evident audit logs and reserves the right to cooperate fully with law enforcement "
                "and affected infrastructure operators in investigating unauthorized disruption."
            )
        }
    ]
}

PRIVACY_POLICY: Dict[str, Any] = {
    "title": "Platform Privacy Policy & Data Retention Schedule",
    "summary": "Explains how target metadata, test parameters, telemetry records, and audit logs are collected, stored, retained, and protected.",
    "effective_date": LEGAL_METADATA["effective_date"],
    "version": LEGAL_METADATA["version"],
    "clauses": [
        {
            "id": "PRIV-01",
            "section": "1. Information and Metadata Collected",
            "summary": "Technical Testing and Telemetry Data",
            "content": (
                "The platform collects technical metadata necessary for load generation, metrics reporting, and security accountability. "
                "Collected data includes: (a) Target identifiers: hostname, IP address, port, and URL path; "
                "(b) Workload specifications: intensity preset, target RPS, concurrency, protocol, payload sizes, and test duration; "
                "(c) Telemetry metrics: requests generated, responses received, status codes, latency percentiles (P50/P95/P99), "
                "jitter, packet loss, and error rates; and (d) Operator metadata: operator client IP address, authentication scope ID, "
                "and timestamp of execution."
            )
        },
        {
            "id": "PRIV-02",
            "section": "2. Storage and Cryptographic Security",
            "summary": "Local Encrypted Storage and Immutable Audit Trails",
            "content": (
                "All test reports and configuration files are stored locally in isolated platform data repositories. "
                "Audit logs are written to an append-only JSONL stream with timestamped event records. "
                "Target scopes and credentials are encrypted at rest using industry-standard AES-256 / SHA-256 hashing. "
                "No telemetry or target data is ever sold, monetized, or shared with third-party advertising networks."
            )
        },
        {
            "id": "PRIV-03",
            "section": "3. Data Retention Schedule",
            "summary": "Defined Retention and Purge Cycles",
            "content": (
                "The platform applies the following retention schedule: "
                "(a) Live Telemetry Snapshots: Maintained in memory during the test and summarized into reports upon completion; "
                "(b) Test Performance Reports: Retained in the active scorecard catalog for up to 90 days or until cleared by the operator; "
                "(c) Security & Audit Logs: Maintained for 365 days to satisfy compliance, legal defense, and accountability requirements; "
                "(d) Expired Testing Scopes: Automatically archived after expiration and permanently purged after 180 days."
            )
        },
        {
            "id": "PRIV-04",
            "section": "4. Data Subject Rights: Access, Export, and Deletion",
            "summary": "Self-Service Export and Purge Capabilities",
            "content": (
                "Operators can request access to, export of, or deletion of eligible test data at any time via the "
                "Platform API (`/api/legal/privacy/export` and `/api/legal/privacy/delete`). "
                "Upon verified deletion request, all historical test reports and associated telemetry records are permanently wiped. "
                "Statutory security audit logs required for abuse investigations are retained in accordance with applicable legal retention mandates."
            )
        },
        {
            "id": "PRIV-05",
            "section": "5. Protection of Authorization Records",
            "summary": "Integrity-Protected Scope Registrations",
            "content": (
                "Scope authorizations contain the name of the authorizing organization and approving security officer. "
                "These records are protected against unauthorized modification using role-based access control and cannot be "
                "altered once sealed without generating an administrative audit event."
            )
        }
    ]
}
