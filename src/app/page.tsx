"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import EventsTable from "@/components/EventsTable";
import CreateEventWizard from "@/components/CreateEventWizard";
import OrganizationSettingsModal from "@/components/OrganizationSettingsModal";
import EventWorkspace from "@/components/EventWorkspace";
import { StaticGradientBg } from "@/components/ui/shader-gradient";
import { FadeIn, Skeleton } from "@/components/ui/motion-primitives";
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
    <StaticGradientBg className="min-h-screen flex flex-col font-sans">
      {/* Glass Header */}
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
          <DashboardSkeleton />
        ) : (
          <FadeIn direction="up" distance={20}>
            <EventsTable
              events={events}
              seriesList={seriesList}
              organizationMembers={organization.members || []}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
              onRefreshData={loadData}
            />
          </FadeIn>
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
    </StaticGradientBg>
  );
}

/* ─── Skeleton Loader — matches dashboard layout ─── */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header row skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-48 h-8" />
        <div className="flex gap-3">
          <Skeleton className="w-28 h-10" variant="rectangular" />
          <Skeleton className="w-36 h-10" variant="rectangular" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="w-64 h-10" variant="rectangular" />

      {/* Event cards skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-4 flex items-center gap-4"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <Skeleton className="w-12 h-12" variant="rectangular" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="w-3/4 h-5" />
              <Skeleton className="w-1/2 h-3" />
            </div>
            <Skeleton className="w-20 h-6" variant="rectangular" />
          </div>
        ))}
      </div>
    </div>
  );
}
