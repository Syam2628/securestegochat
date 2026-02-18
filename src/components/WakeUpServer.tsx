
import { useEffect, useState } from "react";

const REQUEST_TIMEOUT = 120000; // 2 minutes max for cold start

export const WakeUpServer = ({ children }: { children: React.ReactNode }) => {
    const [isAwake, setIsAwake] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkServer = async () => {
            const API_URL = "https://securestegochat.onrender.com";
            console.log("Checking server status at:", API_URL);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

            try {
                // Simple health check or just hitting the root/docs
                const res = await fetch(`${API_URL}/docs`, {
                    method: 'HEAD',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (res.ok || res.status === 405) { // 405 mostly means method not allowed but server is up
                    console.log("Server is awake!");
                    setIsAwake(true);
                } else {
                    console.warn("Server responded but might be initializing status:", res.status);
                    // We assume it's up if we get a response
                    setIsAwake(true);
                }
            } catch (err) {
                console.error("Server wake-up failed or timed out", err);
                setIsAwake(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkServer();
    }, []);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-800">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mb-4"></div>
                <h2 className="text-xl font-semibold">Waking up the server...</h2>
                <p className="text-gray-500 mt-2 max-w-md text-center">
                    Since we are using free hosting, the server may sleep after inactivity.
                    This can take up to 60 seconds. Please wait.
                </p>
            </div>
        );
    }

    if (isAwake === false) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-800">
                <h2 className="text-xl font-bold">Server is unreachable</h2>
                <p className="mt-2">Please check your internet connection or try again later.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        )
    }

    return <>{children}</>;
};
