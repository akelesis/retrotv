import { useEffect, useState } from "react";
import ScheduleCard from "../ScheduleCard";
import "./styles.css";
import { fetchSchedule, type ScheduleEntryInfo } from "../../services/api";

interface ScheduleWithProgram extends ScheduleEntryInfo {
  program?: {
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    category_id?: string;
  };
}

interface ProgramGuideProps {
  channelId: string;
  currentProgramId?: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${String(h).padStart(2, "0")}h`;
  return `${String(m).padStart(2, "0")}m`;
}

function getStatus(startTime: string, endTime: string, currentProgramId?: string, programId?: string): string {
  if (currentProgramId && programId && currentProgramId === programId) {
    return "Transmitindo agora";
  }

  const now = new Date();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (currentMinutes >= endMinutes) return "Finalizado";
  if (currentMinutes >= startMinutes) return "Transmitindo agora";
  return "Em breve";
}

const ProgramGuide = ({ channelId, currentProgramId }: ProgramGuideProps) => {
  const [entries, setEntries] = useState<ScheduleWithProgram[]>([]);

  useEffect(() => {
    const today = new Date().getDay();
    fetchSchedule(channelId, today)
      .then((data) => setEntries(data as ScheduleWithProgram[]))
      .catch(() => setEntries([]));
  }, [channelId]);

  if (entries.length === 0) {
    return (
      <div className="schedule-container">
        <p className="schedule-title">Guia de programação</p>
        <p className="schedule-empty">Nenhum programa agendado para hoje</p>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <p className="schedule-title">Guia de programação</p>
      {entries.map((entry) => {
        const start = entry.start_time.slice(0, 5);
        const end = entry.end_time.slice(0, 5);
        const status = getStatus(entry.start_time, entry.end_time, currentProgramId, entry.program?.id);
        const durationMin = entry.program?.duration_minutes ?? 0;

        return (
          <ScheduleCard
            key={entry.id}
            category="entertainment"
            title={entry.program?.title ?? "Sem título"}
            description={entry.program?.description ?? ""}
            duration={formatDuration(durationMin)}
            startTime={start}
            endTime={end}
            status={status}
          />
        );
      })}
    </div>
  );
};

export default ProgramGuide;
