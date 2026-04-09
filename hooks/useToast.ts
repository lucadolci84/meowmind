"use client";

import { useCallback, useEffect, useState } from "react";

type ToastType = "info" | "success" | "error";

export function useToast() {
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("info");
    const [visible, setVisible] = useState(false);

    const showToast = useCallback((nextMessage: string, nextType: ToastType = "info") => {
        setMessage(nextMessage);
        setType(nextType);
        setVisible(true);
    }, []);

    const hideToast = useCallback(() => {
        setVisible(false);
    }, []);

    useEffect(() => {
        if (!visible) return;
        const id = window.setTimeout(() => setVisible(false), 2200);
        return () => window.clearTimeout(id);
    }, [visible]);

    return {
        toast: {
            message,
            type,
            visible
        },
        showToast,
        hideToast
    };
}