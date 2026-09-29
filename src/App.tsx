import React, { useState, useEffect } from 'react';
import { ComfyProvider } from './context/ComfyContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { GenerateImagePage } from './components/generate/GenerateImagePage';
import { GenerateVideoPage } from './components/generate/GenerateVideoPage';
import { QueuePage } from './components/queue/QueuePage';
import { GalleryPage } from './components/gallery/GalleryPage';
import { SettingsPage } from './components/settings/SettingsPage';

function AppContent() {
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem('comfy_remote_active_tab') || 'dashboard';
  });

  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('comfy_remote_active_tab', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMedia = (id: string) => {
    setSelectedMediaId(id);
    setActiveTab('gallery');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main layout container with desktop sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onSelectMedia={handleSelectMedia}
            />
          )}

          {activeTab === 'generate-image' && (
            <GenerateImagePage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'generate-video' && (
            <GenerateVideoPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'queue' && (
            <QueuePage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'gallery' && (
            <GalleryPage
              setActiveTab={setActiveTab}
              selectedMediaId={selectedMediaId}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ComfyProvider>
      <AppContent />
    </ComfyProvider>
  );
}
