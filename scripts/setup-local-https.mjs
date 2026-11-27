import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function isPrivateIPv4(address) {
  const octets = address.split(".").map(Number);
  return (
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
    (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168))
  );
}

function findLanAddress() {
  const interfaces = networkInterfaces();
  const addresses = Object.entries(interfaces).flatMap(([name, entries]) =>
    (entries || [])
      .filter((entry) => (entry.family === "IPv4" || entry.family === 4) && !entry.internal && isPrivateIPv4(entry.address))
      .map((entry) => ({ name, address: entry.address }))
  );
  const preferred = addresses.find(({ name }) => /wlan|wifi|wi-fi|^wl/i.test(name));
  return preferred || addresses[0] || null;
}

function runOpenSSL(args) {
  const result = spawnSync("openssl", args, { stdio: "inherit" });
  if (result.error) {
    throw new Error(`OpenSSL ishga tushmadi: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`OpenSSL buyrug‘i muvaffaqiyatsiz tugadi (${result.status}).`);
  }
}

const requestedAddress = process.argv[2];
const lan = requestedAddress
  ? { address: requestedAddress, name: "qo‘lda berilgan" }
  : findLanAddress();

if (!lan || !isPrivateIPv4(lan.address)) {
  throw new Error("WLAN IPv4 topilmadi. IP manzilni buyruqqa argument qilib bering: npm run setup:local-https -- 192.168.1.25");
}

const certDirectory = resolve(".local-https");
mkdirSync(certDirectory, { recursive: true, mode: 0o700 });
const caKey = resolve(certDirectory, "local-ca.key");
const caCert = resolve(certDirectory, "local-ca.crt");
const serverKey = resolve(certDirectory, "server.key");
const serverCsr = resolve(certDirectory, "server.csr");
const serverCert = resolve(certDirectory, "server.pem");
const extensionsFile = resolve(certDirectory, "server.ext");

if (!existsSync(caKey) || !existsSync(caCert)) {
  runOpenSSL([
    "req", "-x509", "-newkey", "rsa:3072", "-sha256", "-days", "3650", "-nodes",
    "-keyout", caKey, "-out", caCert,
    "-subj", "/CN=VimiS Local Development CA",
    "-addext", "basicConstraints=critical,CA:TRUE",
    "-addext", "keyUsage=critical,keyCertSign,cRLSign",
  ]);
  chmodSync(caKey, 0o600);
}

runOpenSSL([
  "req", "-new", "-newkey", "rsa:2048", "-nodes",
  "-keyout", serverKey, "-out", serverCsr,
  "-subj", `/CN=${lan.address}`,
]);
chmodSync(serverKey, 0o600);
writeFileSync(
  extensionsFile,
  [
    "basicConstraints=critical,CA:FALSE",
    "keyUsage=critical,digitalSignature,keyEncipherment",
    "extendedKeyUsage=serverAuth",
    `subjectAltName=IP:${lan.address},IP:127.0.0.1,DNS:localhost`,
    "",
  ].join("\n"),
  { mode: 0o600 }
);
runOpenSSL([
  "x509", "-req", "-in", serverCsr,
  "-CA", caCert, "-CAkey", caKey, "-CAcreateserial",
  "-out", serverCert, "-days", "825", "-sha256",
  "-extfile", extensionsFile,
]);

console.log(`\nLokal HTTPS sertifikat tayyor (${lan.name}: ${lan.address}).`);
console.log(`Telefonga o‘rnatiladigan CA sertifikati: ${caCert}`);
console.log(`Sertifikatdagi URL: https://${lan.address}:5173`);
console.log("Telefon va kompyuter bir xil Wi-Fi tarmog‘ida bo‘lishi kerak.");
