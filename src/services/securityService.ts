import axios from "axios";


const API_BASE = import.meta.env.VITE_API_URL;


export const getSecurityLogs = async () => {
    const token = localStorage.getItem("token");

    const response = await axios.get(
        `${API_BASE}/api/admin/security-logs`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};
