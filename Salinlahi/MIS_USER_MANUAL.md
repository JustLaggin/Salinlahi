# Salinlahi MIS: Administrator & User Guide

## 1. System Overview
Salinlahi MIS is a high-integrity distribution management platform designed for Local Government Units (LGUs). The system optimizes social service delivery through two primary architectural pillars:

*   **Offline-First QR Strategy:** To ensure inclusive access for citizens without consistent internet or smartphones, the system generates secure, 6-character alphanumeric **Citizen Codes** (e.g., `H8J2KL`). These codes are optimized for high-contrast QR generation, allowing citizens to carry their "Digital ID" as a printed card or a mobile screenshot. Scanning these codes instantly retrieves the citizen's record from the secure cloud vault.
*   **Dual-Format Distribution Engine:** The system supports two distinct operational modes:
    *   **ONE_TIME Distribution:** Designed for rapid response relief (e.g., food packs, cash aid). Logic is focused on "Single-Claim" verification to prevent double-dipping.
    *   **SERVICE (TUPAD) Program:** Designed for labor-based assistance. It tracks multi-day attendance requirements (e.g., 10 days of community service) before marking a beneficiary as eligible for final payout.

## 2. Role-Based Access Control (RBAC)
To maintain strict **Data Segregation** and security, Salinlahi employs a two-tier access model:

| Feature                     | Administrator (Kapitan)   | Staff Member |
| :---                        | :---:                     | :---:        |
| **Ayuda Event Creation**    | Full Access               | View Only    |
| **Staff Management**        | Full Access               | No Access    |
| **Citizen Onboarding**      | Full Access               | Full Access  |
| **Bulk CSV Data Import**    | Full Access               | No Access    |
| **QR Scanning & Claims**    | Full Access               | Full Access  |
| **Analytics & Data Export** | Full Access               | View Only    |

*Staff members are empowered to assist in ground-level registration and distribution but cannot modify system-level configurations or manage other personnel.*

## 3. Core Workflows

### 3.1 Citizen Onboarding
Building the master registry is the first step in ensuring equitable distribution.

1.  **Manual Registration:** In the "Manage Citizens" module, input the citizen's primary data (Name, Birth Date, Address).
2.  **Bulk CSV Upload:** For large-scale data migration, Administrators can use the **CSV Bulk Upload** feature. The system performs automatic normalization of headers (e.g., mapping "First Name" or "FirstName" to the correct field).
3.  **Secure Code Generation:** Upon registration, the system executes an **Atomic Transaction** to generate a unique 6-character Citizen Code. This code excludes confusing characters (like `0`, `O`, `1`, and `I`) to ensure 100% human-readability during manual fallback scenarios.

### 3.2 Ayuda Creation & Iteration
1.  **Define Scope:** Navigate to "Create Ayuda." Select the **Program Type**.
    *   If **SERVICE**, define the **Required Days** of attendance.
    *   If **ONE_TIME**, select the **Aid Selection** (Cash or Relief Goods).
2.  **Geographical Targeting:** Set the specific Barangay and City to filter the target demographic.
3.  **The "Clone Event" Feature:** For recurring programs (e.g., monthly senior citizen allowance), Administrators can use the **Start Next Iteration** button on an existing event. This clones the event details and automatically migrates the **Approved Beneficiary List** to the new iteration, drastically reducing clerical overhead for recurring programs.

### 3.3 The Scanner Protocol (Standard Operating Procedure)
The scanner is the "Front Gate" of the distribution. To maintain a high **Audit Trail** standard, follow these steps:

1.  **Initialize Scanner:** Select the active Ayuda event and open the QR Scanner.
2.  **Digital Verification:** Scan the citizen's QR. If the scanner fails (due to lighting or damaged printouts), use the **Manual ID** entry.
3.  **Manual Fallback Audit Trail:** If entering a code manually, the system **requires** selecting a reason (e.g., "Damaged QR", "Sunlight Glare"). This ensures MIS auditors can track why digital protocols were bypassed.
4.  **Physical ID Verification:** Once the record appears, the system displays a high-visibility panel with the citizen's details. **The Staff MUST check the "Physical ID Verified" box.** This confirms they have manually verified that the person's face matches the registered record.
5.  **Atomic Transaction:** Clicking "Record Claim" or "Record Attendance" triggers a backend transaction that updates both the Ayuda record and the User's personal history simultaneously, ensuring no data is lost even during high-traffic distribution events.

## 4. Dashboard & Analytics
Administrators and Staff can monitor operations through the **Command Center** (Ayuda Details):

*   **Claimed vs. Pending:** A real-time visual breakdown of how many approved beneficiaries have received their aid versus those remaining.
*   **TUPAD Progress Tracking:** For Service programs, the system displays a "Quota" progress bar (e.g., `7/10 days`). This allows Staff to identify workers who are falling behind on their required service days.
*   **Audit History:** Every claim is timestamped and logged with the method of entry (QR vs Manual), providing a robust paperless audit trail for government compliance.
