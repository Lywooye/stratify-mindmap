import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
const releaseTag = process.env.RELEASE_TAG;

if (manifest.version !== packageJson.version) {
  throw new Error(`manifest.json (${manifest.version}) and package.json (${packageJson.version}) versions differ.`);
}

if (versions[manifest.version] !== manifest.minAppVersion) {
  throw new Error(`versions.json does not map ${manifest.version} to ${manifest.minAppVersion}.`);
}

if (releaseTag && releaseTag !== manifest.version) {
  throw new Error(`Release tag ${releaseTag} must exactly match manifest version ${manifest.version}.`);
}
