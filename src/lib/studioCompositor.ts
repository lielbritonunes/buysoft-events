"use client";

export interface CompositorState {
  layoutMode: "solo" | "split" | "pip" | "grid";
  isOnStage: boolean;
  isCamOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  presenterName: string;
  brandColor: string;
  lowerThird: {
    visible: boolean;
    name: string;
    role: string;
    company: string;
  };
  ticker: {
    visible: boolean;
    text: string;
  };
  banner: {
    visible: boolean;
    title: string;
    subtitle: string;
  };
}

// Canvas dimensions — 720p is the sweet spot for real-time browser compositing.
// 1920x1080 requires 2.07M pixels per frame; 1280x720 requires 0.92M — 56% less work.
// LiveKit upscales to viewer resolution automatically.
const W = 1280;
const H = 720;

function drawVideoFill(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!video.videoWidth || !video.videoHeight) return;
  const videoRatio = video.videoWidth / video.videoHeight;
  const targetRatio = w / h;
  let drawW = w;
  let drawH = h;
  let drawX = x;
  let drawY = y;

  if (videoRatio > targetRatio) {
    drawH = w / videoRatio;
    drawY = y + (h - drawH) / 2;
  } else {
    drawW = h * videoRatio;
    drawX = x + (w - drawW) / 2;
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, w, h);
  ctx.drawImage(video, drawX, drawY, drawW, drawH);
}

function drawPresenterAvatar(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  brandColor = "#00b4fb"
) {
  ctx.fillStyle = "#090d16";
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2;
  const cy = y + h / 2 - 14;
  const avatarR = Math.min(w, h) * 0.14;

  ctx.beginPath();
  ctx.arc(cx, cy, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = brandColor;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(avatarR * 0.9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.charAt(0).toUpperCase() || "H", cx, cy);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(name, cx, cy + avatarR + 26);

  ctx.fillStyle = "rgba(0, 180, 251, 0.2)";
  ctx.fillRect(cx - 44, cy + avatarR + 38, 88, 20);
  ctx.fillStyle = brandColor;
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("● NO PALCO", cx, cy + avatarR + 50);
}

export class StudioCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderIntervalId: any = null;
  private tickerOffset = W;

  // Pre-rendered static background cache
  private bgCanvas: HTMLCanvasElement | null = null;

  // Frame pacing
  private readonly targetFps = 30;
  private readonly frameInterval = 1000 / 30;
  private bgIntervalId: any = null;
  private visibilityHandler: (() => void) | null = null;

  // Internal video elements
  private internalLocalVideo: HTMLVideoElement;
  private internalScreenVideo: HTMLVideoElement;
  private localVideoEl: HTMLVideoElement | null = null;
  private screenVideoEl: HTMLVideoElement | null = null;

  // Audio Context & Mixer
  private audioCtx: AudioContext | null = null;
  private audioDest: MediaStreamAudioDestinationNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private screenAudioSource: MediaStreamAudioSourceNode | null = null;
  private currentMicTrack: MediaStreamTrack | null = null;
  private currentScreenAudioTrack: MediaStreamTrack | null = null;

  // Stream output
  private outputStream: MediaStream | null = null;
  private capturedVideoTrack: CanvasCaptureMediaStreamTrack | null = null;

  // Current state
  private state: CompositorState;

  constructor(initialState: CompositorState) {
    this.state = initialState;
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    const context = this.canvas.getContext("2d", {
      alpha: false,
      desynchronized: true, // Enables low-latency canvas rendering (skips compositor)
    });
    if (!context) throw new Error("Could not create 2D canvas context");
    this.ctx = context;
    // Disable expensive image smoothing — raw pixel copy is fastest for real-time video
    this.ctx.imageSmoothingEnabled = false;

    this.internalLocalVideo = document.createElement("video");
    this.internalLocalVideo.autoplay = true;
    this.internalLocalVideo.muted = true;
    this.internalLocalVideo.playsInline = true;

    this.internalScreenVideo = document.createElement("video");
    this.internalScreenVideo.autoplay = true;
    this.internalScreenVideo.muted = true;
    this.internalScreenVideo.playsInline = true;

    this.initBgCanvas();
    this.initAudio();
    this.setupVisibilityHeartbeat();
    this.startRenderLoop();
  }

  private initBgCanvas() {
    if (typeof document === "undefined") return;
    try {
      this.bgCanvas = document.createElement("canvas");
      this.bgCanvas.width = W;
      this.bgCanvas.height = H;
      const bgCtx = this.bgCanvas.getContext("2d", { alpha: false });
      if (!bgCtx) return;

      const bgGrad = bgCtx.createRadialGradient(W / 2, H / 2, 130, W / 2, H / 2, 740);
      bgGrad.addColorStop(0, "#0b1329");
      bgGrad.addColorStop(1, "#020617");
      bgCtx.fillStyle = bgGrad;
      bgCtx.fillRect(0, 0, W, H);

      // Subtle studio grid
      bgCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      bgCtx.lineWidth = 1;
      for (let x = 0; x < W; x += 80) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, H);
        bgCtx.stroke();
      }
      for (let y = 0; y < H; y += 80) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(W, y);
        bgCtx.stroke();
      }
    } catch (e) {
      console.warn("StudioCompositor background cache init warning:", e);
    }
  }

  private setupVisibilityHeartbeat() {
    if (typeof document === "undefined") return;
    this.visibilityHandler = () => {
      if (document.hidden) {
        if (!this.bgIntervalId) {
          this.bgIntervalId = setInterval(() => {
            this.renderFrame();
            this.flushFrame();
          }, this.frameInterval);
        }
      } else {
        if (this.bgIntervalId) {
          clearInterval(this.bgIntervalId);
          this.bgIntervalId = null;
        }
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private initAudio() {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.audioDest = this.audioCtx.createMediaStreamDestination();
      }
    } catch (e) {
      console.warn("StudioCompositor Web Audio init warning:", e);
    }
  }

  public setVideoElements(localEl: HTMLVideoElement | null, screenEl: HTMLVideoElement | null) {
    this.localVideoEl = localEl;
    this.screenVideoEl = screenEl;
  }

  public updateState(newState: Partial<CompositorState>) {
    this.state = { ...this.state, ...newState };
  }

  public updateAudioSources(localStream: MediaStream | null, screenStream: MediaStream | null) {
    if (this.internalLocalVideo.srcObject !== localStream) {
      this.internalLocalVideo.srcObject = localStream;
      this.internalLocalVideo.play().catch(() => {});
    }
    if (this.internalScreenVideo.srcObject !== screenStream) {
      this.internalScreenVideo.srcObject = screenStream;
      this.internalScreenVideo.play().catch(() => {});
    }

    if (!this.audioCtx || !this.audioDest) return;

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    const micTrack = localStream?.getAudioTracks()[0] || null;
    if (micTrack !== this.currentMicTrack) {
      if (this.micSource) {
        try { this.micSource.disconnect(); } catch (_) {}
        this.micSource = null;
      }
      if (micTrack && micTrack.readyState === "live") {
        try {
          const micStream = new MediaStream([micTrack]);
          this.micSource = this.audioCtx.createMediaStreamSource(micStream);
          this.micSource.connect(this.audioDest);
          this.currentMicTrack = micTrack;
        } catch (err) {
          console.warn("Error connecting mic to compositor mixer:", err);
        }
      } else {
        this.currentMicTrack = null;
      }
    }

    const screenAudioTrack = screenStream?.getAudioTracks()[0] || null;
    if (screenAudioTrack !== this.currentScreenAudioTrack) {
      if (this.screenAudioSource) {
        try { this.screenAudioSource.disconnect(); } catch (_) {}
        this.screenAudioSource = null;
      }
      if (screenAudioTrack && screenAudioTrack.readyState === "live") {
        try {
          const sAudioStream = new MediaStream([screenAudioTrack]);
          this.screenAudioSource = this.audioCtx.createMediaStreamSource(sAudioStream);
          this.screenAudioSource.connect(this.audioDest);
          this.currentScreenAudioTrack = screenAudioTrack;
        } catch (err) {
          console.warn("Error connecting screen audio to compositor mixer:", err);
        }
      } else {
        this.currentScreenAudioTrack = null;
      }
    }
  }

  public getAudioTrack(): MediaStreamTrack | null {
    if (this.audioDest) {
      return this.audioDest.stream.getAudioTracks()[0] || null;
    }
    return null;
  }

  // Manually request a frame from the captured stream for precise timing control
  private flushFrame() {
    if (this.capturedVideoTrack && typeof this.capturedVideoTrack.requestFrame === "function") {
      this.capturedVideoTrack.requestFrame();
    }
  }

  public getCompositeStream(): MediaStream {
    if (!this.outputStream) {
      // captureStream(0) = no automatic capture; we call requestFrame() manually after each render
      // This is much more efficient than captureStream(30) which runs its own internal timer
      const stream = this.canvas.captureStream(0);
      const vTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
      if (vTrack) {
        vTrack.contentHint = "motion";
        this.capturedVideoTrack = vTrack;
      }
      this.outputStream = stream;
    }
    const aTrack = this.getAudioTrack();
    if (aTrack && !this.outputStream.getAudioTracks().includes(aTrack)) {
      this.outputStream.addTrack(aTrack);
    }
    return this.outputStream;
  }

  // Use setInterval for rock-solid 30fps timing independent of monitor refresh rate
  // requestAnimationFrame is unreliable: throttled in background tabs and tied to vsync
  private startRenderLoop() {
    this.renderIntervalId = setInterval(() => {
      this.renderFrame();
      this.flushFrame();
    }, this.frameInterval);
  }

  private renderFrame() {
    const ctx = this.ctx;
    const {
      layoutMode,
      isOnStage,
      isCamOn,
      isScreenSharing,
      presenterName,
      brandColor,
      lowerThird,
      ticker,
      banner,
    } = this.state;

    // 1. Background (fast pre-rendered blit)
    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, 0, 0);
    } else {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, W, H);
    }

    const screenEl =
      this.screenVideoEl && this.screenVideoEl.videoWidth > 0
        ? this.screenVideoEl
        : this.internalScreenVideo && this.internalScreenVideo.videoWidth > 0
        ? this.internalScreenVideo
        : null;

    const localEl =
      this.localVideoEl && this.localVideoEl.videoWidth > 0
        ? this.localVideoEl
        : this.internalLocalVideo && this.internalLocalVideo.videoWidth > 0
        ? this.internalLocalVideo
        : null;

    const hasScreen = isScreenSharing && !!screenEl;
    const hasPresenter = isOnStage;
    const hasCamera = hasPresenter && isCamOn && !!localEl;

    // 2. Layouts — all coordinates scaled to 1280x720
    const pad = 16;
    const topOffset = banner.visible ? 56 : 28;
    const bottomOffset = ticker.visible ? 34 : 0;
    const stageH = H - topOffset - pad - bottomOffset;

    if (hasScreen && hasPresenter) {
      if (layoutMode === "split") {
        const sW = Math.round(W * 0.65);
        drawVideoFill(ctx, screenEl!, pad, topOffset, sW, stageH);
        const pX = pad + sW + 8;
        const pW = W - pX - pad;
        if (hasCamera) {
          drawVideoFill(ctx, localEl!, pX, topOffset, pW, stageH);
        } else {
          drawPresenterAvatar(ctx, presenterName, pX, topOffset, pW, stageH, brandColor);
        }
      } else if (layoutMode === "pip") {
        drawVideoFill(ctx, screenEl!, pad, topOffset, W - pad * 2, stageH);
        const pipW = 280;
        const pipH = 170;
        const pipX = W - pipW - pad * 2;
        const pipY = topOffset + stageH - pipH - 8;
        if (hasCamera) {
          drawVideoFill(ctx, localEl!, pipX, pipY, pipW, pipH);
        } else {
          drawPresenterAvatar(ctx, presenterName, pipX, pipY, pipW, pipH, brandColor);
        }
      } else {
        drawVideoFill(ctx, screenEl!, pad, topOffset, W - pad * 2, stageH);
      }
    } else if (hasScreen) {
      drawVideoFill(ctx, screenEl!, pad, topOffset, W - pad * 2, stageH);
    } else if (hasPresenter) {
      if (hasCamera) {
        drawVideoFill(ctx, localEl!, pad, topOffset, W - pad * 2, stageH);
      } else {
        drawPresenterAvatar(ctx, presenterName, pad, topOffset, W - pad * 2, stageH, brandColor);
      }
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(32, 50, W - 64, H - 100);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Buysoft Events • Estúdio Preparando Transmissão", W / 2, H / 2 - 10);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("A transmissão iniciará em instantes.", W / 2, H / 2 + 20);
    }

    // 3. Overlays (lightweight — no shadow blur, no clipping paths)

    // Headline Banner (Top)
    if (banner.visible && banner.title) {
      const bW = 640;
      const bH = 46;
      const bX = (W - bW) / 2;
      const bY = 6;

      ctx.fillStyle = "rgba(10, 15, 29, 0.94)";
      ctx.fillRect(bX, bY, bW, bH);
      ctx.strokeStyle = brandColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bX, bY, bW, bH);

      // Badge
      ctx.fillStyle = brandColor;
      ctx.fillRect(bX + 8, bY + 8, 74, 24);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ DESTAQUE", bX + 8 + 37, bY + 20);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(banner.title, bX + 94, bY + 18);

      if (banner.subtitle) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px sans-serif";
        ctx.fillText(banner.subtitle, bX + 94, bY + 34);
      }
    }

    // Lower Third (Bottom-Left)
    if (lowerThird.visible && lowerThird.name) {
      const ltW = 360;
      const ltH = 66;
      const ltX = 36;
      const ltY = ticker.visible ? H - 34 - ltH - 6 : H - ltH - 12;

      ctx.fillStyle = "rgba(10, 15, 29, 0.95)";
      ctx.fillRect(ltX, ltY, ltW, ltH);

      // Colored bar
      ctx.fillStyle = brandColor;
      ctx.fillRect(ltX, ltY, 6, ltH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 17px sans-serif";
      ctx.fillText(lowerThird.name, ltX + 18, ltY + 28);

      if (lowerThird.company) {
        const nameW = ctx.measureText(lowerThird.name).width;
        ctx.fillStyle = "rgba(0, 180, 251, 0.25)";
        const compText = lowerThird.company.toUpperCase();
        const compW = ctx.measureText(compText).width + 14;
        ctx.fillRect(ltX + 18 + nameW + 8, ltY + 12, compW, 22);
        ctx.fillStyle = brandColor;
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(compText, ltX + 18 + nameW + 15, ltY + 26);
      }

      if (lowerThird.role) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "12px sans-serif";
        ctx.fillText(lowerThird.role, ltX + 18, ltY + 52);
      }
    }

    // Ticker Tape (Bottom)
    if (ticker.visible && ticker.text) {
      const tH = 32;
      const tY = H - tH;

      ctx.fillStyle = "rgba(3, 7, 18, 0.96)";
      ctx.fillRect(0, tY, W, tH);

      ctx.fillStyle = brandColor;
      ctx.fillRect(0, tY, W, 2);

      // Badge
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, tY, 94, tH);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚡ AVISO", 47, tY + tH / 2);

      // Scrolling text (simple fillText, no clipping path)
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";

      const textWidth = ctx.measureText(ticker.text).width;
      const spacing = 120;
      const fullSpan = textWidth + spacing;

      // Only draw text that's within visible range to avoid wasted draws
      const drawText = (xPos: number) => {
        if (xPos > -fullSpan && xPos < W) {
          ctx.fillText(ticker.text, Math.max(100, xPos), tY + tH / 2);
        }
      };
      drawText(this.tickerOffset);
      drawText(this.tickerOffset + fullSpan);
      if (this.tickerOffset + fullSpan < W) {
        drawText(this.tickerOffset + fullSpan * 2);
      }

      this.tickerOffset -= 1.5;
      if (this.tickerOffset < -fullSpan) {
        this.tickerOffset += fullSpan;
      }
    }
  }

  public destroy() {
    if (this.renderIntervalId) {
      clearInterval(this.renderIntervalId);
      this.renderIntervalId = null;
    }
    if (this.bgIntervalId) {
      clearInterval(this.bgIntervalId);
      this.bgIntervalId = null;
    }
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    if (this.outputStream) {
      this.outputStream.getTracks().forEach((t) => t.stop());
      this.outputStream = null;
    }
    this.capturedVideoTrack = null;
  }
}
