#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const FRAMEWORK_NAME = 'ChatEngineWrapper.xcframework';
const GITHUB_REPO = 'maxbsoft/react-native-litertlm-chat-engine';
const PACKAGE_VERSION = require('../package.json').version;

// Skip download in development/source environments
const isDevEnvironment = fs.existsSync(path.join(__dirname, '..', '.git'));
if (isDevEnvironment) {
  console.log(
    '🔧 Development environment detected, skipping framework download'
  );
  process.exit(0);
}

// Skip if framework already exists
const frameworkPath = path.join(__dirname, '..', FRAMEWORK_NAME);
if (fs.existsSync(frameworkPath)) {
  console.log('✅ Framework already exists, skipping download');
  process.exit(0);
}

console.log('📦 Downloading ChatEngineWrapper.xcframework...');

async function downloadFramework() {
  try {
    // Try to download from GitHub LFS first
    console.log('🔍 Attempting to download framework from GitHub LFS...');

    const lfsUrl = `https://github.com/${GITHUB_REPO}/raw/main/${FRAMEWORK_NAME}`;
    await downloadFromUrl(lfsUrl, frameworkPath);

    console.log('✅ Framework downloaded successfully!');
  } catch (error) {
    console.error('❌ Failed to download framework:', error.message);
    console.log('');
    console.log('📝 Manual installation required:');
    console.log('1. Clone the repository with Git LFS:');
    console.log('   git clone https://github.com/' + GITHUB_REPO + '.git');
    console.log(
      '   cd react-native-litertlm-chat-engine/rn-litertlm-chat-engine'
    );
    console.log('   git lfs install && git lfs pull');
    console.log('');
    console.log('2. Copy the framework to your node_modules:');
    console.log(
      '   cp -r ChatEngineWrapper.xcframework /path/to/your/node_modules/react-native-rn-litertlm-chat-engine/'
    );
    console.log('');
    process.exit(1);
  }
}

function downloadFromUrl(url, outputPath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFromUrl(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(
          new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
        );
        return;
      }

      // Check if this is a Git LFS pointer file
      let data = '';
      response.on('data', (chunk) => {
        data += chunk.toString();
      });

      response.on('end', () => {
        if (data.startsWith('version https://git-lfs.github.com/spec/v1')) {
          reject(new Error('Received Git LFS pointer instead of actual file'));
          return;
        }

        // If we got here, we have actual binary data
        const file = fs.createWriteStream(outputPath);

        const newRequest = https.get(url, (newResponse) => {
          newResponse.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve();
          });

          file.on('error', (err) => {
            fs.unlink(outputPath, () => {}); // Delete partial file
            reject(err);
          });
        });

        newRequest.on('error', reject);
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Check if we're on a platform that needs the framework
const platform = process.platform;
if (platform !== 'darwin') {
  console.log(
    'ℹ️  iOS framework not needed on this platform (' + platform + ')'
  );
  process.exit(0);
}

downloadFramework();
