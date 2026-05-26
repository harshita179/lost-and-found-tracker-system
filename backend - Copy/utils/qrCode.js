let qrCodeLib = null;

const getQRCodeLib = () => {
  if (qrCodeLib) {
    return qrCodeLib;
  }

  try {
    qrCodeLib = require('qrcode');
    return qrCodeLib;
  } catch (error) {
    console.warn('qrcode package not available, using hosted QR fallback');
    return null;
  }
};

const buildQRPayload = (itemData) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  return `${frontendUrl.replace(/\/$/, '')}/item/${itemData._id}`;
};

const buildHostedQRCodeUrl = (qrData) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

// Generate QR code as data URL (base64 image)
const generateQRCode = async (itemData) => {
  try {
    const qrData = buildQRPayload(itemData);
    const QRCode = getQRCodeLib();

    if (!QRCode) {
      return buildHostedQRCodeUrl(qrData);
    }

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error.message);
    return null;
  }
};

// Generate QR code as string (for PDF/print)
const generateQRCodeString = async (itemData) => {
  try {
    const qrData = buildQRPayload(itemData);
    const QRCode = getQRCodeLib();

    if (!QRCode) {
      return qrData;
    }

    return await QRCode.toString(qrData, { type: 'terminal' });
  } catch (error) {
    console.error('QR Code string generation error:', error.message);
    return null;
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeString
};
