"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import EventsTable from "@/components/EventsTable";
import CreateEventWizard from "@/components/CreateEventWizard";
import OrganizationSettingsModal from "@/components/OrganizationSettingsModal";
import EventWorkspace from "@/components/EventWorkspace";
import { getEvents, createEvent, getOrCreateOrganization, getSeries } from "@/lib/dbActions";
import { getCurrentUserAction } from "@/lib/authActions";
import { initialOrganization } from "@/lib/mockData";
import { Organization, WebinarEvent, UserSession } from "@/types";

export default function Home() {
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [events, setEvents] = useState<WebinarEvent[]>([]);
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeNavTab, setActiveNavTab] = useState<"home">("home");
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);

  // Load initial data from SQLite via Server Actions
  const loadData = async () => {
    try {
      const [org, evList, sList, user] = await Promise.all([
        getOrCreateOrganization(),
        getEvents(),
        getSeries(),
        getCurrentUserAction(),
      ]);
      if (org) setOrganization(org as unknown as Organization);
      if (user) setCurrentUser(user as UserSession);
      if (sList) setSeriesList(sList);
      if (evList) {
        // Map to WebinarEvent format
        const mapped: any[] = evList.map((e: any) => ({
          ...e,
          registeredCount: e.registrations?.length || 0,
          settings: {
            chatEnabled: e.chatEnabled ?? true,
            qaEnabled: e.qaEnabled ?? true,
            pollsEnabled: e.pollsEnabled ?? true,
            attendeeListVisible: e.attendeeListVisible ?? true,
            autoRecord: e.autoRecord ?? true,
            primaryColor: e.primaryColor ?? "#00b4fb",
            backgroundColor: e.backgroundColor ?? "#ffffff",
            textColor: e.textColor ?? "#0f172a",
          },
        }));
        setEvents(mapped);
      }
    } catch (err) {
      console.error("Error loading database events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Event creation handler
  const handleCreateEvent = async (newEventData: Partial<WebinarEvent>) => {
    try {
      const created = await createEvent({
        title: newEventData.title || "Novo Webinar",
        description: newEventData.description || "",
        startDate: newEventData.startDate || new Date().toISOString(),
        endDate: newEventData.endDate || new Date().toISOString(),
        timezone: newEventData.timezone || "(GMT-03:00) Horário de Brasília",
      });

      const formatted: any = {
        ...created,
        registeredCount: 0,
        settings: {
          chatEnabled: true,
          qaEnabled: true,
          pollsEnabled: true,
          attendeeListVisible: true,
          autoRecord: true,
          primaryColor: "#00b4fb",
          backgroundColor: "#ffffff",
          textColor: "#0f172a",
        },
      };

      setEvents([formatted, ...events]);
      setSelectedEvent(formatted);
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  // Event update handler
  const handleUpdateEvent = (updated: any) => {
    setEvents(events.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEvent(updated);
  };

  // If viewing a specific event's workspace
  if (selectedEvent) {
    return (
      <EventWorkspace
        event={selectedEvent}
        onBack={() => setSelectedEvent(null)}
        onUpdateEvent={handleUpdateEvent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f8fe] flex flex-col font-sans selection:bg-[#00b4fb] selection:text-white">
      {/* Top Header with Buysoft Events Branding */}
      <Header
        organization={organization}
        onOpenOrgSettings={() => setIsOrgSettingsOpen(true)}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
        currentUser={currentUser}
        hasLiveEvent={events.some((e) => e.status === "live")}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-10 py-4 sm:py-7">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#00b4fb] border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">Carregando painel...</p>
          </div>
        ) : (
          <EventsTable
            events={events}
            seriesList={seriesList}
            organizationMembers={organization.members || []}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
            onRefreshData={loadData}
          />
        )}
      </main>

      {/* Modals */}
      <CreateEventWizard
        isOpen={isCreateWizardOpen}
        onClose={() => setIsCreateWizardOpen(false)}
        onCreateEvent={handleCreateEvent}
        lastEvent={events[0]}
      />

      <OrganizationSettingsModal
        organization={organization}
        isOpen={isOrgSettingsOpen}
        onClose={() => setIsOrgSettingsOpen(false)}
        onUpdateOrg={setOrganization}
        currentUser={currentUser}
        onUpdateCurrentUser={setCurrentUser}
      />
    </div>
  );
}
