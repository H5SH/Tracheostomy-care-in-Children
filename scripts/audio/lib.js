/** Shared helpers for the audio pipeline. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '../..');
const build = path.join(root, 'build');

/**
 * Languages whose narration already exists as a human recording in the shipped videos. These are
 * never transcribed, translated or synthesised — step 4 lifts their audio straight off the
 * original files so the human voices survive untouched.
 */
const HUMAN_NARRATION = new Set(['english', 'urdu']);

/**
 * Languages that borrow another language's narration instead of getting their own synthetic voice.
 *
 * Hindi takes the Urdu recording: spoken Urdu and Hindi are the same language for listening
 * purposes (Hindustani), so a Hindi-speaking parent understands the Urdu narration, and a real
 * human voice beats a synthetic one. Note the app text stays Devanagari Hindi — only the audio is
 * shared — and the Urdu narration does use some Perso-Arabic vocabulary, so this is a judgement
 * call worth confirming with a speaker of both.
 */
const SHARED_NARRATION = { hindi: 'urdu' };

/** Temporary home for audio handed to Speech-to-Text. Everything here is deleted afterwards. */
const GCS_BUCKET = 'staging.synoptix-ai-c4d27.appspot.com';
const GCS_PREFIX = 'tcic-audio-pipeline';

async function auth() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS.');
  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const input =
    `${b64({ alg: 'RS256', typ: 'JWT' })}.` +
    b64({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });
  const sig = crypto.createSign('RSA-SHA256').update(input).sign(key.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${input}.${sig}`,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Auth failed: ${JSON.stringify(json)}`);
  return { token: json.access_token, project: key.project_id };
}

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 1 << 28 });
const ffprobeJson = (args) =>
  JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-of', 'json', ...args], { maxBuffer: 1 << 28 }).toString()
  );

const duration = (file) =>
  Number(ffprobeJson(['-show_entries', 'format=duration', file]).format.duration);

async function gcsUpload({ token }, localPath, objectName) {
  const body = fs.readFileSync(localPath);
  const url =
    `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o` +
    `?uploadType=media&name=${encodeURIComponent(`${GCS_PREFIX}/${objectName}`)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    body,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return `gs://${GCS_BUCKET}/${GCS_PREFIX}/${objectName}`;
}

async function gcsDelete({ token }, objectName) {
  const url = `https://storage.googleapis.com/storage/v1/b/${GCS_BUCKET}/o/${encodeURIComponent(
    `${GCS_PREFIX}/${objectName}`
  )}`;
  await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = {
  root, build, auth, ff, ffprobeJson, duration, gcsUpload, gcsDelete, sleep,
  GCS_BUCKET, GCS_PREFIX, HUMAN_NARRATION, SHARED_NARRATION,
};
