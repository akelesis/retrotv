import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export interface PlaybackInfo {
  program_start_time: string;
  current_time: string;
  elapsed_seconds: number;
  elapsed_minutes: number;
  remaining_seconds: number;
  remaining_minutes: number;
  progress_percent: number;
  seek_to_seconds: number;
}

export interface ProgramInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  source_type: 'youtube' | 'catalog';
  source_url: string;
  duration_minutes: number;
  category_id?: string;
}

export interface ScheduleEntryInfo {
  id: string;
  channel_id: string;
  program_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface NowPlayingResponse {
  program: ProgramInfo;
  schedule: ScheduleEntryInfo;
  playback: PlaybackInfo;
}

export async function fetchNowPlaying(channelId: string): Promise<NowPlayingResponse | null> {
  const { data } = await api.get<NowPlayingResponse | null>(
    `/channels/${channelId}/schedule/now-playing`,
  );
  return data;
}

export async function fetchSchedule(channelId: string, day?: number): Promise<ScheduleEntryInfo[]> {
  const params = day !== undefined ? { day } : {};
  const { data } = await api.get<ScheduleEntryInfo[]>(
    `/channels/${channelId}/schedule`,
    { params },
  );
  return data;
}

export default api;
