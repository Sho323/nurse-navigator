"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
    const {
        continuous = true,
        interimResults = true,
        lang = "ja-JP",
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = continuous;
                recognitionRef.current.interimResults = interimResults;
                recognitionRef.current.lang = lang;

                recognitionRef.current.onresult = (event: any) => {
                    let newTranscript = "";
                    let currentInterimTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            newTranscript += result[0].transcript;
                        } else {
                            currentInterimTranscript += result[0].transcript;
                        }
                    }

                    if (newTranscript) {
                        setTranscript((prev) => prev + newTranscript + " ");
                    }
                    setInterimTranscript(currentInterimTranscript);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error);
                    setError(event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            } else {
                setError("ブラウザが音声認識APIをサポートしていません。");
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [continuous, interimResults, lang]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        
        setError(null);
        setInterimTranscript("");
        
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err: any) {
            // Already started or other errors
            console.error("Failed to start listening:", err);
            if (err.name !== 'InvalidStateError') {
                setError(err.message || '開始に失敗しました');
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;

        try {
            recognitionRef.current.stop();
            setIsListening(false);
        } catch (err) {
            console.error("Failed to stop listening:", err);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        setTranscript,
    };
}
