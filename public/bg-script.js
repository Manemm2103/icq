window.bgMode = localStorage.getItem('icq_bg_mode') || 'none'; 
let bgColor = localStorage.getItem('icq_bg_color') || '#330867';
let bgImage = null;

const savedImage = localStorage.getItem('icq_bg_image');
if (savedImage) {
    bgImage = new Image();
    bgImage.src = savedImage;
}

let selfieSegmentation = null;
window.segmentCanvas = null;
let segmentCtx = null;
let camHelper = null;
let isSegmenting = false;

function toggleBgMenu() {
    const menu = document.getElementById('bg-menu');
    if (!menu) return;
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex';
    } else {
        menu.style.display = 'none';
    }
}

function setBg(mode, value) {
    window.bgMode = mode;
    localStorage.setItem('icq_bg_mode', mode);

    if (mode === 'color' && value) {
        bgColor = value;
        localStorage.setItem('icq_bg_color', value);
    }
    
    const menu = document.getElementById('bg-menu');
    if (menu) menu.style.display = 'none';
    
    if (mode !== 'none') {
        if (!isSegmenting) {
            startSegmentation();
        }
    } else {
        if (isSegmenting) {
            stopSegmentation();
        }
    }
}

function uploadBg(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const tempImg = new Image();
            tempImg.onload = () => {
                const tempCanvas = document.createElement('canvas');
                const MAX_WIDTH = 1280;
                let width = tempImg.width;
                let height = tempImg.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                tempCanvas.width = width;
                tempCanvas.height = height;
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0, width, height);
                const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
                
                try {
                    localStorage.setItem('icq_bg_image', compressedDataUrl);
                } catch (err) {
                    console.warn("Storage quota exceeded", err);
                }
                
                bgImage = new Image();
                bgImage.src = compressedDataUrl;
                setBg('image');
            };
            tempImg.src = e.target.result;
        }
        reader.readAsDataURL(file);
        input.value = ''; // Reset input so same file can be selected again
    }
}

async function startSegmentation() {
    if (isSegmenting || typeof localStream === 'undefined' || !localStream) return;
    const video = document.getElementById('local-video');
    if (!video) return;
    
    isSegmenting = true;
    window.segmentCanvas = document.getElementById('bg-canvas');
    if (!window.segmentCanvas) return;
    segmentCtx = window.segmentCanvas.getContext('2d');
    
    const hiddenVideo = document.createElement('video');
    hiddenVideo.srcObject = localStream;
    hiddenVideo.autoplay = true;
    hiddenVideo.playsInline = true;
    hiddenVideo.muted = true;
    hiddenVideo.play().catch(e => console.log(e));
    
    selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }});
    
    selfieSegmentation.setOptions({
        modelSelection: 0,
    });
    
    selfieSegmentation.onResults(onResults);
    
    const videoTrack = localStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    
    window.segmentCanvas.width = settings.width || 1280;
    window.segmentCanvas.height = settings.height || 720;

    camHelper = new Camera(hiddenVideo, {
        onFrame: async () => {
            if (window.bgMode !== 'none') {
                try {
                    await selfieSegmentation.send({image: hiddenVideo});
                } catch(e) {
                    console.error("Segmentation error", e);
                }
            } else {
                segmentCtx.drawImage(hiddenVideo, 0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
            }
        },
        width: window.segmentCanvas.width,
        height: window.segmentCanvas.height
    });
    camHelper.start();
    
    const processedStream = window.segmentCanvas.captureStream(30);
    video.srcObject = processedStream;
    video.play().catch(e => console.log(e));
    
    if (typeof peerConnection !== 'undefined' && peerConnection) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
            videoSender.replaceTrack(processedStream.getVideoTracks()[0]);
        }
    }
}

function stopSegmentation() {
    isSegmenting = false;
    if (camHelper) {
        camHelper.stop();
        camHelper = null;
    }
    const video = document.getElementById('local-video');
    if (video && typeof localStream !== 'undefined') {
        video.srcObject = localStream; 
    }
    
    if (typeof peerConnection !== 'undefined' && peerConnection && typeof localStream !== 'undefined') {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
            videoSender.replaceTrack(localStream.getVideoTracks()[0]);
        }
    }
}

function onResults(results) {
    if (!segmentCtx) return;
    segmentCtx.save();
    segmentCtx.clearRect(0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
    
    try {
        segmentCtx.drawImage(results.image, 0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
        
        segmentCtx.globalCompositeOperation = 'destination-in';
        segmentCtx.drawImage(results.segmentationMask, 0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
        
        segmentCtx.globalCompositeOperation = 'destination-over';
        
        if (window.bgMode === 'blur') {
            segmentCtx.filter = 'blur(15px)';
            segmentCtx.drawImage(results.image, 0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
            segmentCtx.filter = 'none';
        } else if (window.bgMode === 'color') {
            segmentCtx.fillStyle = bgColor || '#330867';
            segmentCtx.fillRect(0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
        } else if (window.bgMode === 'image' && bgImage && bgImage.width > 0) {
            const imgRatio = bgImage.width / bgImage.height;
            const canvasRatio = window.segmentCanvas.width / window.segmentCanvas.height;
            let drawWidth = window.segmentCanvas.width;
            let drawHeight = window.segmentCanvas.height;
            let x = 0;
            let y = 0;

            if (imgRatio > canvasRatio) {
                drawWidth = window.segmentCanvas.height * imgRatio;
                x = (window.segmentCanvas.width - drawWidth) / 2;
            } else {
                drawHeight = window.segmentCanvas.width / imgRatio;
                y = (window.segmentCanvas.height - drawHeight) / 2;
            }

            segmentCtx.drawImage(bgImage, x, y, drawWidth, drawHeight);
        } else if (window.bgMode === 'image') {
            // Fallback to black if image not loaded yet
            segmentCtx.fillStyle = '#000000';
            segmentCtx.fillRect(0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
        } else {
            segmentCtx.drawImage(results.image, 0, 0, window.segmentCanvas.width, window.segmentCanvas.height);
        }
    } catch(e) {
        console.error("Drawing error", e);
    }
    
    segmentCtx.restore();
}
