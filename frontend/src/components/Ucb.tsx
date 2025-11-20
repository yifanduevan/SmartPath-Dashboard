interface UcbProps {
    best_backend: string | null;
    exploration_constant: number;
    total_pulls: number;
}

export function Ucb({ best_backend, exploration_constant, total_pulls }: UcbProps) {
    return (
        <div className="card mini">
            <h3>UCB Information</h3>
            <p><strong>Best Backend:</strong> {best_backend ?? 'Loading...'}</p>
            <p><strong>Exploration Constant:</strong> {exploration_constant}</p>
            <p><strong>Total Pulls:</strong> {total_pulls}</p>
        </div>
    );
}