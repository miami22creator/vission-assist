import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const CameraFeed = forwardRef(({ isActive }, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    useImperativeHandle(ref, () => ({
        captureFrame: () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (video.videoWidth === 0 || video.videoHeight === 0) return null;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                return canvas.toDataURL('image/jpeg', 0.8);
            }
            return null;
        }
    }));

    useEffect(() => {
        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isActive]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center z-10 bg-black/80">
                    {error}
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
});

export default CameraFeed;
