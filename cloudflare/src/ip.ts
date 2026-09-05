import { isIP } from 'node:net';

export function ipKey(ip: string): string {
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6) throw new Error('INVALID_CLIENT_IP');
  let normalized = ip.toLowerCase();
  if (normalized.includes('.')) {
    const lastColon = normalized.lastIndexOf(':');
    const octets = normalized.slice(lastColon + 1).split('.').map(Number);
    normalized = normalized.slice(0, lastColon + 1) + ((octets[0] << 8) | octets[1]).toString(16) + ':' + ((octets[2] << 8) | octets[3]).toString(16);
  }
  const [left, right] = normalized.split('::');
  const head = left ? left.split(':') : [];
  const tail = right ? right.split(':') : [];
  const groups = right !== undefined ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail] : head;
  if (groups.slice(0, 5).every(g => parseInt(g, 16) === 0) && parseInt(groups[5], 16) === 65535) {
    const a = parseInt(groups[6], 16), b = parseInt(groups[7], 16);
    return `${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`;
  }
  return groups.slice(0, 4).map(g => parseInt(g, 16).toString(16)).join(':') + '::/64';
}
