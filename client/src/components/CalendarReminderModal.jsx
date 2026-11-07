import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useToast } from './Toast';

export default function CalendarReminderModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const { addToast } = useToast();
  const results = order.results || [];

  const hasGlucose = results.some(r => /glucose|sugar|hba1c/i.test(r.parameter));
  const hasLipid = results.some(r => /cholesterol|triglyceride|ldl|hdl/i.test(r.parameter));
  const hasThyroid = results.some(r => /tsh|thyroid|t3|t4/i.test(r.parameter));

  const followUpIntervalDays = hasGlucose ? 90 : hasThyroid ? 90 : 180;
  const followUpTestName = hasGlucose
    ? 'Fasting Blood Sugar & HbA1c Retest'
    : hasLipid
    ? 'Follow-up Fasting Lipid Profile'
    : hasThyroid
    ? 'Thyroid (TSH) Function Follow-up'
    : 'Routine Annual Wellness Follow-up Panel';

  const baseDate = order.signedAt ? new Date(order.signedAt) : new Date();
  const nextDueDate = new Date(baseDate);
  nextDueDate.setDate(nextDueDate.getDate() + followUpIntervalDays);

  const formattedDueDate = nextDueDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const clinicalRationale = hasGlucose
    ? 'Clinical guidelines recommend monitoring HbA1c every 3 months to evaluate 90-day glycemic trends and adjust medical/dietary management.'
    : hasLipid
    ? 'Guidelines recommend repeating lipid profiles at 3-6 month intervals to verify therapeutic response and cardiovascular risk reduction.'
    : 'Periodic diagnostic follow-up verifies baseline organ function and ensures early detection of metabolic shifts.';

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${nextDueDate.getFullYear()}${pad(nextDueDate.getMonth() + 1)}${pad(nextDueDate.getDate())}T080000Z`;
    const endStr = `${nextDueDate.getFullYear()}${pad(nextDueDate.getMonth() + 1)}${pad(nextDueDate.getDate())}T090000Z`;
    const title = encodeURIComponent(`Pathology Follow-up: ${followUpTestName} (Company A Diagnostics)`);
    const details = encodeURIComponent(
      `Periodic follow-up test recommended following Lab Order #${order.orderNo || ''}.\n\n` +
      `Recommended Panel: ${followUpTestName}\n` +
      `Preparation: 10-12 hours overnight fasting required. Water is permitted.\n` +
      `Book home collection or walk-in: Company A Diagnostics.`
    );
    const location = encodeURIComponent('Company A Diagnostics, Central Laboratory');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  // Download .ics file
  const handleDownloadIcs = () => {
    try {
      const pad = (n) => String(n).padStart(2, '0');
      const startStr = `${nextDueDate.getFullYear()}${pad(nextDueDate.getMonth() + 1)}${pad(nextDueDate.getDate())}T080000Z`;
      const endStr = `${nextDueDate.getFullYear()}${pad(nextDueDate.getMonth() + 1)}${pad(nextDueDate.getDate())}T090000Z`;

      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Company A Diagnostics//Follow-up Health Reminder//EN',
        'BEGIN:VEVENT',
        `UID:${order.id || 'followup'}@companya.diagnostics`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:Follow-up Test: ${followUpTestName}`,
        `DESCRIPTION:${clinicalRationale} Overnight fasting required.`,
        'LOCATION:Company A Diagnostics Central Lab',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FollowUp_${order.orderNo || 'Test'}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Calendar event downloaded (.ics)', 'success');
    } catch (err) {
      console.warn('ICS generation error:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Follow-up Retest Reminder"
      description="Clinical Periodic Monitoring & Calendar Synchronization"
      size="md"
    >
      <div className="space-y-4 py-2">
        {/* Next Due Date Hero Banner */}
        <div className="p-4 bg-gradient-to-br from-[#0c1a24] to-[#07151f] border border-white/15 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              Next Due in {followUpIntervalDays} Days
            </span>
            <span className="text-xs text-slate-400 font-medium">Overnight Fasting</span>
          </div>

          <h3 className="text-base font-extrabold text-white tracking-tight">
            {followUpTestName}
          </h3>
          <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>{formattedDueDate}</span>
          </p>
        </div>

        {/* Clinical Rationale Box */}
        <div className="p-3.5 glass-card rounded-xl border border-white/10 text-xs text-slate-200 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono block">
            Why is periodic re-testing recommended?
          </span>
          <p className="leading-relaxed text-slate-300">
            {clinicalRationale}
          </p>
          <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            <span>Standard 10-12 hr fasting window before morning sample collection.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Add to Google Calendar</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Download Calendar Event (.ICS for Apple / Outlook)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
