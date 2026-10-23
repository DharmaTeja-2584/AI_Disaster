import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

/**
 * AppShell — the main authenticated layout
 * Structure:
 *   ┌──────────────────────────────────────────┐
 *   │  Sidebar  │  TopNav                      │
 *   │           │────────────────────────────  │
 *   │           │  Main Content (children)      │
 *   └──────────────────────────────────────────┘
 */
const AppShell = ({ children, title = 'AI Disaster Response', onRefresh }) => {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav title={title} onRefresh={onRefresh} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
