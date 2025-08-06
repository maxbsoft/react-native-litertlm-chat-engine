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
    // Try to download from GitHub Releases first
    console.log('🔍 Attempting to download framework from GitHub Releases...');

    const releaseUrl = await getLatestReleaseDownloadUrl();
    console.log('📦 Found release URL:', releaseUrl);
    
    const archivePath = frameworkPath + '.tar.gz';
    await downloadFromUrl(releaseUrl, archivePath);
    
    console.log('📦 Extracting framework...');
    await extractFramework(archivePath, path.dirname(frameworkPath));
    
    // Clean up archive
    fs.unlinkSync(archivePath);

    console.log('✅ Framework downloaded and extracted successfully!');
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

async function getLatestReleaseDownloadUrl() {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    
    https.get(apiUrl, {
      headers: {
        'User-Agent': 'npm-postinstall-script'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const release = JSON.parse(data);
          const asset = release.assets.find(asset => 
            asset.name === 'ChatEngineWrapper.xcframework.tar.gz'
          );
          
          if (!asset) {
            reject(new Error('Framework asset not found in latest release'));
            return;
          }
          
          resolve(asset.browser_download_url);
        } catch (parseError) {
          reject(new Error('Failed to parse GitHub API response: ' + parseError.message));
        }
      });
    }).on('error', reject);
  });
}

async function extractFramework(archivePath, outputDir) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    
    const tar = spawn('tar', ['-xzf', archivePath, '-C', outputDir]);
    
    tar.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tar extraction failed with code ${code}`));
      }
    });
    
    tar.on('error', reject);
  });
}

function downloadFromUrl(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    const request = https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        file.close();
        fs.unlinkSync(outputPath);
        return downloadFromUrl(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        reject(
          new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
        );
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(outputPath, () => {});
      reject(err);
    });
    
    request.setTimeout(60000, () => {
      request.destroy();
      file.close();
      fs.unlink(outputPath, () => {});
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
