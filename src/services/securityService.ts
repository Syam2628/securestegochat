import axios from "axios";

const API_BASE = "https://securestegochat.onrender.com";

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
