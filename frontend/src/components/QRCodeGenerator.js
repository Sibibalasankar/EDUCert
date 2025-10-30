import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ data, size = 120 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [data, size]);

  if (!data) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded" style={{ width: size, height: size }}>
        <span className="text-gray-400 text-xs">No data</span>
      </div>
    );
  }

  return (
    <div className="inline-block">
      <canvas
        ref={canvasRef}
        style={{ 
          width: size, 
          height: size,
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}
      />
    </div>
  );
};

export default QRCodeGenerator;