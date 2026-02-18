import "./styles.css";

const ProgramCard = (props: {
    title: string;
    description: string;
    image?: string;
    icon?: React.ReactNode;
}) => {
    return (
        <div className="program-card">
            {props.icon && <div className="card-icon">{props.icon}</div>}
            {props.image && <img src={props.image} alt={props.title} className="card-image" />}
            <div className="card-content">
                <h3 className="card-title">{props.title}</h3>
                <p className="card-description">{props.description}</p>
            </div>
        </div>
    )
}

export default ProgramCard;