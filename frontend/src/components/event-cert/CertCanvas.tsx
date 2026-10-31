'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import styles from './CertCanvas.module.css';

export interface CertContent {
  topText: string;
  topColor: string;
  topFontSize: number;
  nameColor: string;
  nameFontSize: number;
  nameYPercent: number;
  bodyText: string;
  bodyColor: string;
  bodyFontSize: number;
}

interface Props {
  templateImageUrl: string;
  content: CertContent;
  participantName: string;
  qrValue: string;
  onReady?: (canvas: HTMLCanvasElement) => void;
}

// Canvas dimensions — A4 landscape at 96 dpi
const W = 1123;
const H = 794;

export default function CertCanvas({
  templateImageUrl,
  content,
  participantName,
  qrValue,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = W;
    canvas.height = H;

    // Background image
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = templateImageUrl;
    await new Promise<void>((res, rej) => {
      img.onload  = () => res();
      img.onerror = () => rej(new Error('Image load failed'));
    });
    ctx.drawImage(img, 0, 0, W, H);

    // Helper — word-wrap centered text
    function drawCentred(
      text: string,
      centreY: number,
      color: string,
      fontSize: number,
      bold = false,
    ) {
      if (!text.trim()) return;
      if (!ctx) return;
      ctx.fillStyle  = color;
      ctx.font       = `${bold ? 'bold ' : ''}${fontSize}px 'Inter', Arial, sans-serif`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      const maxW   = W * 0.80;
      const words  = text.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      const lh    = fontSize * 1.45;
      const total = lines.length * lh;
      lines.forEach((l, i) => {
        ctx.fillText(l, W / 2, centreY - total / 2 + i * lh + lh / 2);
      });
    }

    // Top text — anchored at ~22% from top
    drawCentred(content.topText, H * 0.22, content.topColor, content.topFontSize);

    // Participant name
    const nameY = (content.nameYPercent / 100) * H;
    drawCentred(participantName, nameY, content.nameColor, content.nameFontSize, true);

    // Body text — anchored at ~76% from top
    drawCentred(content.bodyText, H * 0.76, content.bodyColor, content.bodyFontSize);

    // QR code — bottom-right corner
    const qrSize = 90;
    const qrPad  = 18;
    try {
      const qrDataUrl = await QRCode.toDataURL(qrValue, {
        width: qrSize,
        margin: 1,
        color: { dark: '#000000ff', light: '#ffffffff' },
      });
      const qrImg = new window.Image();
      qrImg.src   = qrDataUrl;
      await new Promise<void>(res => { qrImg.onload = () => res(); });
      ctx.drawImage(qrImg, W - qrSize - qrPad, H - qrSize - qrPad, qrSize, qrSize);
    } catch {
      // QR optional — silently skip
    }

    onReady?.(canvas);
  }, [templateImageUrl, content, participantName, qrValue, onReady]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

