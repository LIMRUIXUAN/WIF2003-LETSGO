const tls = require('tls');

function requireMailConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!user || !pass || !from) {
    throw new Error('Missing email setup. Add SMTP_USER, SMTP_PASS, and SMTP_FROM to .env.');
  }

  return { host, port, user, pass, from };
}

function encodeBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function normalizeAddress(address) {
  return String(address || '').replace(/[<>\r\n]/g, '').trim();
}

function createMessage({ from, to, subject, text }) {
  const safeFrom = normalizeAddress(from);
  const safeTo = normalizeAddress(to);
  const safeSubject = String(subject || '').replace(/[\r\n]/g, ' ').trim();
  const body = String(text || '').replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');

  return [
    `From: EcoPlanner <${safeFrom}>`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    `Date: ${new Date().toUTCString()}`,
    '',
    body
  ].join('\r\n');
}

function waitForResponse(socket, expectedCode) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
    };

    const onError = error => {
      cleanup();
      reject(error);
    };

    const onData = chunk => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1] || '';

      if (!/^\d{3}\s/.test(lastLine)) return;

      cleanup();
      const code = Number(lastLine.slice(0, 3));
      if (code !== expectedCode) {
        reject(new Error(`SMTP expected ${expectedCode}, got ${lastLine}`));
        return;
      }
      resolve(buffer);
    };

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function sendCommand(socket, command, expectedCode) {
  socket.write(`${command}\r\n`);
  return waitForResponse(socket, expectedCode);
}

async function sendMail({ to, subject, text }) {
  const config = requireMailConfig();
  const safeTo = normalizeAddress(to);
  const safeFrom = normalizeAddress(config.from);
  const message = createMessage({ from: safeFrom, to: safeTo, subject, text });

  const socket = tls.connect({
    host: config.host,
    port: config.port,
    servername: config.host,
    rejectUnauthorized: true
  });

  try {
    await waitForResponse(socket, 220);
    await sendCommand(socket, 'EHLO ecoplanner.local', 250);
    await sendCommand(socket, 'AUTH LOGIN', 334);
    await sendCommand(socket, encodeBase64(config.user), 334);
    await sendCommand(socket, encodeBase64(config.pass), 235);
    await sendCommand(socket, `MAIL FROM:<${safeFrom}>`, 250);
    await sendCommand(socket, `RCPT TO:<${safeTo}>`, 250);
    await sendCommand(socket, 'DATA', 354);
    socket.write(`${message}\r\n.\r\n`);
    await waitForResponse(socket, 250);
    await sendCommand(socket, 'QUIT', 221);
  } finally {
    socket.end();
  }
}

module.exports = { sendMail };
