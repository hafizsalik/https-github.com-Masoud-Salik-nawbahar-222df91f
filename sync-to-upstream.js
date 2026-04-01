#!/usr/bin/env node

const { execSync } = require('child_process');
const https = require('https');

// GitHub token (you'll need to set this as environment variable)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const UPSTREAM_OWNER = 'hafizsalik';
const REPO_NAME = 'nawbahar-222df91f';
const YOUR_FORK = 'Masoud-Salik';

async function createPullRequest() {
  try {
    // Get current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    // Get latest commit hash
    const latestCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    
    console.log(`Creating PR from ${YOUR_FORK}:${currentBranch} to ${UPSTREAM_OWNER}:main`);
    console.log(`Latest commit: ${latestCommit}`);
    
    const data = JSON.stringify({
      title: `Sync changes from ${currentBranch}`,
      body: `Automated sync of latest changes from fork branch: ${currentBranch}\n\nCommit: ${latestCommit}\n\nThis PR includes:\n- Modern reaction system with animations\n- Professional icon pack\n- Smart notifications system\n- Build fixes and optimizations`,
      head: `${YOUR_FORK}:${currentBranch}`,
      base: 'main',
      head_repo: `${YOUR_FORK}/${REPO_NAME}`
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${UPSTREAM_OWNER}/${REPO_NAME}/pulls`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Sync-Script'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        const response = JSON.parse(responseData);
        if (res.statusCode === 201) {
          console.log(`✅ PR Created: ${response.html_url}`);
          console.log(`🔗 PR URL: https://github.com/${UPSTREAM_OWNER}/${REPO_NAME}/pull/${response.number}`);
        } else {
          console.error(`❌ Failed to create PR: ${responseData}`);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Request failed: ${error.message}`);
    });
    
    req.write(data);
    req.end();
    
  } catch (error) {
    console.error(`❌ Script error: ${error.message}`);
  }
}

console.log('🚀 Starting GitHub sync...');
createPullRequest();
