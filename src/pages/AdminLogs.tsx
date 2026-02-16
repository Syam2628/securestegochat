import { useEffect, useState } from "react";
import axios from "axios";

interface SecurityLog {
    id: number;
    detection_type: string;
    extracted_payload: string;
    classification: string;
    confidence: number;
    action_taken: string;
    created_at: string;
}

export default function AdminLogs() {

    const [logs, setLogs] = useState<SecurityLog[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem("token");


            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await axios.get(
                `${API_URL}/api/admin/security-logs`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setLogs(res.data);
        } catch (err) {
            console.error("Error fetching logs", err);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>🛡 Security Logs Dashboard</h2>

            {logs.length === 0 ? (
                <p>No security events recorded.</p>
            ) : (
                logs.map(log => (
                    <div
                        key={log.id}
                        style={{
                            border: "1px solid #ccc",
                            padding: "15px",
                            marginBottom: "15px",
                            borderRadius: "8px",
                            backgroundColor: "#f9f9f9"
                        }}
                    >
                        <p><strong>Detection:</strong> {log.detection_type}</p>
                        <p><strong>Classification:</strong> {log.classification}</p>
                        <p><strong>Confidence:</strong> {log.confidence}%</p>
                        <p><strong>Action:</strong> {log.action_taken}</p>
                        <p><strong>Time:</strong> {log.created_at}</p>
                        <p><strong>Payload Preview:</strong></p>
                        <pre style={{ backgroundColor: "#eee", padding: "10px" }}>
                            {log.extracted_payload}
                        </pre>
                    </div>
                ))
            )}
        </div>
    );
}
