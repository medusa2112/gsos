// Placeholder: Example validator for Tray webhook signatures
export function validateTraySignature(rawBody: string, signature: string, secret: string) {
  // TODO: Implement HMAC verification per Tray's docs
  return Boolean(rawBody && signature && secret);
}
