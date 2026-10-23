import React from 'react';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import AlertCenter from '../../components/alerts/AlertCenter';

const ResponderAlerts = () => {
  return (
    <AppShell title="Tactical Alerts">
      <PageHeader
        title="Field Operations Broadcasts & Alerts"
        subtitle="Priority tactical dispatches, weather warnings, and emergency perimeter notifications"
        breadcrumb="Responder / Tactical Alerts"
      />

      <div className="p-6 max-w-6xl mx-auto">
        <AlertCenter canCreate={false} />
      </div>
    </AppShell>
  );
};

export default ResponderAlerts;
