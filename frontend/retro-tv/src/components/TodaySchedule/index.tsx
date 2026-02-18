import "./styles.css";
import ProgramCard from "../ProgramCard";
import ProgramGuide from "../ProgramGuide";
import { useEffect, useState, useCallback, useRef } from "react";
import IconSet from "../IconsSet";
import IconsSet from "../IconsSet";
import YouTube, { type YouTubeEvent } from "react-youtube";
import { fetchNowPlaying, type NowPlayingResponse } from "../../services/api";

const CHANNEL_ID = "DEFAULT_CHANNEL_ID"; // TODO: substituir por seleção dinâmica de canal

function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

export default function TodayScheduleView() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nowPlaying, setNowPlaying] = useState<NowPlayingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const lastProgramIdRef = useRef<string | null>(null);

  // Atualiza relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca now-playing a cada 30 segundos
  const loadNowPlaying = useCallback(async () => {
    try {
      const data = await fetchNowPlaying(CHANNEL_ID);
      setNowPlaying(data);
      setError(null);

      // Se o programa mudou, faz seek para a posição correta
      if (data && data.program.id !== lastProgramIdRef.current) {
        lastProgramIdRef.current = data.program.id;
        if (playerRef.current) {
          playerRef.current.seekTo(data.playback.seek_to_seconds, true);
        }
      }
    } catch {
      setError("Sem conexão com o servidor");
    }
  }, []);

  useEffect(() => {
    loadNowPlaying();
    const interval = setInterval(loadNowPlaying, 30_000);
    return () => clearInterval(interval);
  }, [loadNowPlaying]);

  const videoId = nowPlaying?.program.source_url
    ? extractYoutubeVideoId(nowPlaying.program.source_url)
    : null;

  const handlePlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    if (nowPlaying) {
      event.target.seekTo(nowPlaying.playback.seek_to_seconds, true);
    }
  };

  const progressPercent = nowPlaying?.playback.progress_percent ?? 0;

  return (
    <div>
      <div className="header">
        <div className="logo-container">
          <IconSet name="tv" color="#777" size={32} />
          <div className="header-content">
            <h1 className="title">Future TV</h1>
            <p>Sua experiência de TV em um só lugar</p>
          </div>
        </div>
        <div className="time-container">
          <p className="time"><span><IconsSet name="clock" color="#777" size={12} /></span>{currentTime.toLocaleTimeString()}</p>
          <p className="date"><span><IconsSet name="calendar" color="#777" size={12} /></span>{currentTime.toLocaleDateString()}</p>
        </div>
      </div>

      <div className="cards-container">
        <ProgramCard
          title="Programação"
          description={nowPlaying ? "No ar agora" : "Fora do ar"}
          icon={<IconSet name="clock" color="#777" size={24} />}
        />
        <ProgramCard
          title="Programa"
          description={nowPlaying?.program.title ?? "Nenhum"}
          icon={<IconSet name="category" color="#777" size={24} />}
        />
        <ProgramCard
          title="Progresso"
          description={nowPlaying ? `${nowPlaying.playback.elapsed_minutes}m / ${nowPlaying.playback.elapsed_minutes + nowPlaying.playback.remaining_minutes}m (${progressPercent}%)` : "--"}
          icon={<IconSet name="duration" color="#777" size={24} />}
        />
        <ProgramCard
          title="Status"
          description={nowPlaying ? "Transmitindo" : "Fora do ar"}
          icon={<div className={nowPlaying ? "status-circle-live" : "status-circle-not-live"}></div>}
        />
      </div>

      <div className="main-content">
        <div className="today-schedule-container">
          <div className="media-player-container">
            {error && (
              <div className="player-message">{error}</div>
            )}
            {!error && !nowPlaying && (
              <div className="player-message">Nenhum programa no ar agora</div>
            )}
            {!error && nowPlaying && videoId && (
              <YouTube
                videoId={videoId}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    start: nowPlaying.playback.seek_to_seconds,
                  },
                }}
                onReady={handlePlayerReady}
                className="youtube-player"
                iframeClassName="youtube-iframe"
              />
            )}
          </div>

          {nowPlaying && (
            <div className="now-playing-info">
              <div className="now-playing-details">
                <span className="now-playing-badge">AO VIVO</span>
                <p className="now-playing-title">{nowPlaying.program.title}</p>
                <p className="now-playing-time">
                  {nowPlaying.schedule.start_time.slice(0, 5)} - {nowPlaying.schedule.end_time.slice(0, 5)}
                </p>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          <div className="media-player-menu">
            <div className="profile-info">
              <div className="profile-image">
                <img src="https://placehold.co/40/orange/white" alt="Profile" />
              </div>
              <div className="profile-info-content">
                <p className="profile-name">João da Silva</p>
                <p className="profile-email">joao@gmail.com</p>
              </div>
            </div>
            <div className="media-player-controls">
              <button className="control-button">
                <IconSet name="settings" color="#777" size={24} />
                Configurar grade
              </button>
            </div>
          </div>
        </div>
        <ProgramGuide channelId={CHANNEL_ID} currentProgramId={nowPlaying?.program.id} />
      </div>
    </div>
  );
}
