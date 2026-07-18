import { createHmac, timingSafeEqual } from 'crypto';

export const ADMIN_SESSION_COOKIE = 'kidsquiz_admin_session';

function getAdminPassword() {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  if (configuredPassword) return configuredPassword;

  // Keep local development usable, but fail closed in deployed builds.
  return process.env.NODE_ENV === 'production' ? null : 'admin123';
}

function getSessionToken() {
  const password = getAdminPassword();
  if (!password) return null;

  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || password;
  return createHmac('sha256', secret)
    .update('kidsquiz-admin-session-v1')
    .digest('hex');
}

function safelyEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const item of cookieHeader.split(';')) {
    const separatorIndex = item.indexOf('=');
    if (separatorIndex < 0) continue;
    if (item.slice(0, separatorIndex).trim() !== name) continue;

    try {
      return decodeURIComponent(item.slice(separatorIndex + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminPassword());
}

export function verifyAdminPassword(candidate: string) {
  const password = getAdminPassword();
  return Boolean(password && safelyEqual(candidate, password));
}

export function createAdminSessionToken() {
  return getSessionToken();
}

export function isAdminRequest(request: Request) {
  const expectedToken = getSessionToken();
  const suppliedToken = readCookie(request, ADMIN_SESSION_COOKIE);
  return Boolean(expectedToken && suppliedToken && safelyEqual(suppliedToken, expectedToken));
}