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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawAspectFitVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 16
) {
  if (!video.videoWidth || !video.videoHeight) return;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();

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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(video, drawX, drawY, drawW, drawH);

  // Subtle border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawPresenterAvatar(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 16,
  brandColor = "#00b4fb"
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "#090d16";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = x + w / 2;
  const cy = y + h / 2 - 20;
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
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(name, cx, cy + avatarR + 36);

  ctx.fillStyle = "rgba(0, 180, 251, 0.2)";
  roundRect(ctx, cx - 65, cy + avatarR + 56, 130, 28, 14);
  ctx.fill();
  ctx.fillStyle = brandColor;
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("● NO PALCO", cx, cy + avatarR + 74);

  ctx.restore();
}

export class StudioCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private tickerOffset = 1920;
  private lastRenderTime = 0;
  private keepaliveInterval: any = null;

  // Pre-rendered static background cache (gradient + grid)
  private bgCanvas: HTMLCanvasElement | null = null;

  // Frame pacing for stable, fluid 30 FPS
  private lastFrameTime = 0;
  private readonly targetFps = 30;
  private readonly frameInterval = 1000 / 30; // ~33.33ms
  private bgIntervalId: any = null;
  private visibilityHandler: (() => void) | null = null;

  // Internal video elements to sample from
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

  // Current state
  private state: CompositorState;

  constructor(initialState: CompositorState) {
    this.state = initialState;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    const context = this.canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Could not create 2D canvas context");
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";

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

  // Pre-renders background gradient and grid once to eliminate heavy per-frame allocations
  private initBgCanvas() {
    if (typeof document === "undefined") return;
    try {
      this.bgCanvas = document.createElement("canvas");
      this.bgCanvas.width = 1920;
      this.bgCanvas.height = 1080;
      const bgCtx = this.bgCanvas.getContext("2d", { alpha: false });
      if (!bgCtx) return;

      const bgGrad = bgCtx.createRadialGradient(960, 540, 200, 960, 540, 1100);
      bgGrad.addColorStop(0, "#0b1329");
      bgGrad.addColorStop(1, "#020617");
      bgCtx.fillStyle = bgGrad;
      bgCtx.fillRect(0, 0, 1920, 1080);

      // Subtle studio grid accents
      bgCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      bgCtx.lineWidth = 1;
      for (let x = 0; x < 1920; x += 120) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, 1080);
        bgCtx.stroke();
      }
      for (let y = 0; y < 1080; y += 120) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(1920, y);
        bgCtx.stroke();
      }
    } catch (e) {
      console.warn("StudioCompositor background cache initialization warning:", e);
    }
  }

  // Ensures continuous 30fps frames when the presenter switches windows/tabs
  private setupVisibilityHeartbeat() {
    if (typeof document === "undefined") return;
    this.visibilityHandler = () => {
      if (document.hidden) {
        if (!this.bgIntervalId) {
          this.bgIntervalId = setInterval(() => {
            this.renderFrame();
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
      console.warn("StudioCompositor Web Audio initialization warning:", e);
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
    // Keep internal videos fed with streams
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

    // Microphone audio
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

    // Screen audio (if sharing browser tab or system sound)
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

  public getCompositeStream(): MediaStream {
    if (!this.outputStream) {
      const stream = this.canvas.captureStream(30);
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        vTrack.contentHint = "detail";
      }
      this.outputStream = stream;
    }
    const aTrack = this.getAudioTrack();
    if (aTrack && !this.outputStream.getAudioTracks().includes(aTrack)) {
      this.outputStream.addTrack(aTrack);
    }
    return this.outputStream;
  }

  private startRenderLoop() {
    const render = () => {
      this.renderFrame();
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);

    // Keepalive interval for background tabs (ensures canvas capture stream never freezes when host switches windows)
    if (typeof window !== "undefined") {
      this.keepaliveInterval = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) {
          this.renderFrame();
        }
      }, 33);
    }
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

    // 1. Background (fast pre-rendered drawImage avoiding per-frame radial gradient allocations)
    if (this.bgCanvas) {
      ctx.drawImage(this.bgCanvas, 0, 0);
    } else {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, 1920, 1080);
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

    // 2. Layouts
    if (hasScreen && hasPresenter) {
      if (layoutMode === "split") {
        // Split: Screen on Left (wide), Presenter on Right
        const sX = 36;
        const sY = banner.visible ? 96 : 72;
        const sW = 1240;
        const sH = ticker.visible ? 910 - sY : 960 - sY;
        drawAspectFitVideo(ctx, screenEl!, sX, sY, sW, sH, 20);

        const pX = 1300;
        const pY = sY;
        const pW = 584;
        const pH = sH;
        if (hasCamera) {
          drawAspectFitVideo(ctx, localEl!, pX, pY, pW, pH, 20);
        } else {
          drawPresenterAvatar(ctx, presenterName, pX, pY, pW, pH, 20, brandColor);
        }
      } else if (layoutMode === "pip") {
        // PiP: Screen full, Presenter in bottom-right corner
        const sX = 24;
        const sY = banner.visible ? 90 : 40;
        const sW = 1872;
        const sH = ticker.visible ? 980 - sY : 1020 - sY;
        drawAspectFitVideo(ctx, screenEl!, sX, sY, sW, sH, 20);

        const pipW = 440;
        const pipH = 270;
        const pipX = 1920 - pipW - 48;
        const pipY = ticker.visible ? 1020 - pipH - 40 : 1080 - pipH - 40;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        if (hasCamera) {
          drawAspectFitVideo(ctx, localEl!, pipX, pipY, pipW, pipH, 16);
        } else {
          drawPresenterAvatar(ctx, presenterName, pipX, pipY, pipW, pipH, 16, brandColor);
        }
        ctx.restore();
      } else {
        // Solo: Screen full
        const sX = 24;
        const sY = banner.visible ? 90 : 40;
        const sW = 1872;
        const sH = ticker.visible ? 980 - sY : 1020 - sY;
        drawAspectFitVideo(ctx, screenEl!, sX, sY, sW, sH, 20);
      }
    } else if (hasScreen) {
      // Only screen active
      const sX = 24;
      const sY = banner.visible ? 90 : 40;
      const sW = 1872;
      const sH = ticker.visible ? 980 - sY : 1020 - sY;
      drawAspectFitVideo(ctx, screenEl!, sX, sY, sW, sH, 20);
    } else if (hasPresenter) {
      // Only presenter active (Solo mode)
      const pX = 36;
      const pY = banner.visible ? 96 : 60;
      const pW = 1848;
      const pH = ticker.visible ? 980 - pY : 1020 - pY;
      if (hasCamera) {
        drawAspectFitVideo(ctx, localEl!, pX, pY, pW, pH, 20);
      } else {
        drawPresenterAvatar(ctx, presenterName, pX, pY, pW, pH, 20, brandColor);
      }
    } else {
      // Backstage placeholder
      ctx.save();
      ctx.fillStyle = "#0f172a";
      roundRect(ctx, 48, 80, 1824, 920, 24);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Buysoft Events • Estúdio Preparando Transmissão", 960, 520);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "20px sans-serif";
      ctx.fillText("A transmissão iniciará em instantes.", 960, 565);
      ctx.restore();
    }

    // 3. Overlays

    // Headline Banner (Top)
    if (banner.visible && banner.title) {
      ctx.save();
      const bW = 960;
      const bH = 68;
      const bX = (1920 - bW) / 2;
      const bY = 20;

      ctx.fillStyle = "rgba(10, 15, 29, 0.94)";
      roundRect(ctx, bX, bY, bW, bH, 20);
      ctx.fill();
      ctx.strokeStyle = brandColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Destaque Pill
      const pillW = 110;
      const pillH = 34;
      const pillX = bX + 20;
      const pillY = bY + (bH - pillH) / 2;
      ctx.fillStyle = brandColor;
      roundRect(ctx, pillX, pillY, pillW, pillH, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ DESTAQUE", pillX + pillW / 2, pillY + pillH / 2);

      // Title & Subtitle
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(banner.title, pillX + pillW + 20, bY + 28);

      if (banner.subtitle) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.fillText(banner.subtitle, pillX + pillW + 20, bY + 50);
      }
      ctx.restore();
    }

    // Lower Third (Bottom-Left)
    if (lowerThird.visible && lowerThird.name) {
      ctx.save();
      const ltW = 540;
      const ltH = 100;
      const ltX = 54;
      const ltY = ticker.visible ? 916 : 940;

      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "rgba(10, 15, 29, 0.95)";
      roundRect(ctx, ltX, ltY, ltW, ltH, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Colored vertical bar
      ctx.fillStyle = brandColor;
      roundRect(ctx, ltX, ltY, 10, ltH, 5);
      ctx.fill();

      // Name
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(lowerThird.name, ltX + 28, ltY + 42);

      // Company Badge
      if (lowerThird.company) {
        ctx.font = "bold 26px sans-serif";
        const nameWidth = ctx.measureText(lowerThird.name).width;
        const compX = ltX + 28 + nameWidth + 14;
        const compW = ctx.measureText(lowerThird.company.toUpperCase()).width + 20;
        ctx.fillStyle = "rgba(0, 180, 251, 0.25)";
        roundRect(ctx, compX, ltY + 18, compW, 30, 8);
        ctx.fill();
        ctx.fillStyle = brandColor;
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(lowerThird.company.toUpperCase(), compX + 10, ltY + 38);
      }

      // Role
      if (lowerThird.role) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "17px sans-serif";
        ctx.fillText(lowerThird.role, ltX + 28, ltY + 76);
      }
      ctx.restore();
    }

    // Ticker Tape (Scrolling News at Bottom)
    if (ticker.visible && ticker.text) {
      ctx.save();
      const tH = 46;
      const tY = 1080 - tH;

      ctx.fillStyle = "rgba(3, 7, 18, 0.96)";
      ctx.fillRect(0, tY, 1920, tH);

      // Top accent line
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, tY, 1920, 2);

      // Static Badge at Left
      ctx.fillStyle = brandColor;
      ctx.fillRect(0, tY, 140, tH);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚡ AVISO", 70, tY + tH / 2);

      // Scrolling Text
      ctx.save();
      ctx.beginPath();
      ctx.rect(150, tY, 1920 - 150, tH);
      ctx.clip();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const textWidth = ctx.measureText(ticker.text).width;
      const spacing = 180;
      const fullSpan = textWidth + spacing;

      ctx.fillText(ticker.text, this.tickerOffset, tY + tH / 2);
      ctx.fillText(ticker.text, this.tickerOffset + fullSpan, tY + tH / 2);
      if (this.tickerOffset + fullSpan < 1920) {
        ctx.fillText(ticker.text, this.tickerOffset + fullSpan * 2, tY + tH / 2);
      }

      this.tickerOffset -= 2.2;
      if (this.tickerOffset < -fullSpan) {
        this.tickerOffset += fullSpan;
      }
      ctx.restore();

      ctx.restore();
    }
  }

  public destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
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
  }
}
