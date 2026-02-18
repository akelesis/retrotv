import './styles.css';

type CategoryColors = 'news' | 'sports' | 'entertainment' | 'movies' | 'cartoon' | 'anime' | 'documentary' | 'series';

interface ScheduleCardProps {
    category: CategoryColors;
    title: string;
    description: string;
    duration: string;
    status: string;
    startTime?: string;
    endTime?: string;
}

function computeProgress(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0;
    const now = new Date();
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const total = endMinutes - startMinutes;
    if (total <= 0) return 0;
    const elapsed = currentMinutes - startMinutes;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

const ScheduleCard = (props: ScheduleCardProps) => {
    const categoryColor: Record<CategoryColors, string> = {
        news: "#4CAF50",
        sports: "#2196F3",
        entertainment: "#FF9800",
        movies: "#9C27B0",
        cartoon: "#7264eb",
        anime: "#FF5722",
        documentary: "#607D8B",
        series: "#795548",
    }

    const isLive = props.status === "Transmitindo agora";
    const isFinished = props.status === "Finalizado";
    const progress = isLive ? computeProgress(props.startTime, props.endTime) : isFinished ? 100 : 0;

    return (
        <div className={`schedule-card ${isLive ? "schedule-card-active" : ""}`}>
            <div className="card-header">
                <span className="category-circle" style={{ backgroundColor: categoryColor[props.category] }}></span>
                <span className="category-tag">{props.category}</span>
                <span className={isLive ? "card-status-live" : "card-status-not-live"}>{props.status}</span>
            </div>
            <div className="schedule-card-content">
                <p className="card-title">{props.title}</p>
                <p className="description">{props.description}</p>
            </div>
            {(isLive || isFinished) && (
                <div className="card-progress-container">
                    <div
                        className={`card-progress-bar ${isFinished ? "card-progress-finished" : ""}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
            <div className="card-footer">
                <p className="card-duration">{props.duration}</p>
                <p className="card-time">{props.startTime} - {props.endTime}</p>
            </div>
        </div>
    );
}

export default ScheduleCard;
