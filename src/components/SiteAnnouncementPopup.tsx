'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Modal } from './Modal';
import { Button } from './Button';

export function SiteAnnouncementPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  if (pathname.startsWith('/admin')) return null;
  if (pathname === '/signin' || pathname === '/signup' || pathname === '/reset-password') return null;

  return (
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Leaderboard Prize Draw Update" size="lg">
      <div className="space-y-4 text-slate-700">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-slate-800">
            Please start with any activity to start earning points on leaderboard.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            You must have done 5 activies everyweek to enter prize draw by every Friday.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            To get a star and to enter prize draw stay active and get 300 points weekly.
          </p>
        </div>

        <Button variant="primary" className="w-full" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </Modal>
  );
}