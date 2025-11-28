import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const CameraFeed = forwardRef(({ isActive, onDevicesLoaded }, ref) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [currentDeviceId, setCurrentDeviceId] = useState(null);

    useImperativeHandle(ref, () => ({
        captureFrame: () => {
            if (!videoRef.current) return null;
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            return canvas.toDataURL('image/jpeg');
        },
        switchCamera: async () => {
            if (devices.length < 2) return;
            const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
            const nextIndex = (currentIndex + 1) % devices.length;
            const nextDeviceId = devices[nextIndex].deviceId;
            setCurrentDeviceId(nextDeviceId);
        }
    }));

    // Enumerate devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                if (onDevicesLoaded) onDevicesLoaded(videoDevices);
            } catch (err) {
                console.error("Error listing devices:", err);
            }
        };

        // Request permission first to get device labels
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(s => {
                s.getTracks().forEach(t => t.stop()); // Stop immediately, just needed permission
                getDevices();
            })
            .catch(err => setError("Camera permission denied"));
    }, []);

    useEffect(() => {
        if (!isActive) {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            return;
        }

        const startCamera = async () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            try {
                const constraints = {
                    video: {
                        deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
                        facingMode: currentDeviceId ? undefined : 'environment' // Default to back camera
                    }
                };

                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(newStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }

                // If we didn't have a device ID (first run), set it to the active one
                if (!currentDeviceId) {
                    const track = newStream.getVideoTracks()[0];
                    const settings = track.getSettings();
                    setCurrentDeviceId(settings.deviceId);
                }

            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera.");
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isActive, currentDeviceId]);

    if (error) {
        return <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">{error}</div>;
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
        />
    );
});

export default CameraFeed;
