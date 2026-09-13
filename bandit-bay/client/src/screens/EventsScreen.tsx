import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../game/GameContext';
import { api } from '../lib/api';
import { formatDuration } from '../lib/format';
import type { EventState, EventWindowInfo } from '../types';

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  return sameDay ? 'heute' : date.toLocaleDateString('de-DE', { weekday: 'short' });
}

export function EventsScreen(): JSX.Element {
  const { config, pushToast } = useGame();
  const [event, setEvent] = useState<EventState | null>(null);
  const [upcoming, setUpcoming] = useState<EventWindowInfo[]>([]);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.events();
      setEvent(data.event);
      setUpcoming(data.upcoming);
    } catch {
      pushToast('Events konnten nicht geladen werden', 'bad');
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div className="panel-dark p-3">
        <div className="font-display text-lg font-black">Events</div>
        <div className="text-xs text-white/70">
          Viermal täglich läuft eine Stunde lang ein Event. Der Typ wechselt reihum – die Boni
          rechnet der Server automatisch mit.
        </div>
        {event && (
          <div className="mt-2 rounded-2xl bg-black/30 px-3 py-2 text-sm font-bold">
            {event.active
              ? `${event.icon} ${event.name} läuft noch ${formatDuration(Math.max(0, event.secondsLeft - tick))}`
              : `Nächstes Event: ${event.nextName} in ${formatDuration(Math.max(0, event.secondsUntilNext - tick))}`}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {upcoming.map((window) => (
          <div
            key={`${window.kind}-${window.start}`}
            className={`flex items-center gap-2.5 rounded-2xl border-[3px] px-3 py-2 ${
              window.active
                ? 'border-[#f8c73c] bg-gradient-to-b from-[#fff6e2] to-[#eddbb2] text-[#3b2a14] shadow-glow'
                : 'border-black/30 bg-white/10 text-white'
            }`}
          >
            <span className="text-2xl">{window.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-black leading-tight">{window.name}</div>
              <div className="text-[11px] opacity-75">{window.short}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-sm font-black">
                {timeLabel(window.start)}–{timeLabel(window.end)}
              </div>
              <div className="text-[11px] opacity-70">
                {window.active ? 'läuft gerade' : dayLabel(window.start)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-3">
        <div className="mb-1 font-display text-base font-bold">Die Event-Typen</div>
        <div className="space-y-1.5">
          {(config?.eventTypes ?? []).map((type) => (
            <div key={type.kind} className="flex items-start gap-2 rounded-xl bg-black/5 px-2 py-1.5">
              <span className="text-xl">{type.icon}</span>
              <div>
                <div className="text-[13px] font-black">{type.name}</div>
                <div className="text-[11px] opacity-75">{type.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
