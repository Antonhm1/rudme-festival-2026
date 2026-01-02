#!/usr/bin/env node

/**
 * Done script - Commits and pushes changes with a dynamic commit message
 *
 * Usage: node done.js [commit_message]
 * If no commit message is provided, it will prompt for one or use a default
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

function getCommitMessage() {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        return args.join(' ');
    }

    // Default commit message if none provided
    return `Update website functionality

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;
}

async function promptForCommitMessage() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Enter commit message (or press Enter for default): ', (answer) => {
            rl.close();
            if (answer.trim()) {
                resolve(`${answer.trim()}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`);
            } else {
                resolve(getCommitMessage());
            }
        });
    });
}

async function main() {
    try {
        console.log('🔄 Running done script...');

        // Check if we're in a git repository
        try {
            execSync('git status', { stdio: 'pipe' });
        } catch (error) {
            console.log('❌ Not in a git repository. Initializing git...');
            execSync('git init');
            console.log('✅ Git repository initialized');
        }

        // Stage all changes
        console.log('📁 Staging all changes...');
        execSync('git add .');

        // Check if there are any changes to commit
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (!status.trim()) {
                console.log('ℹ️  No changes to commit');
                return;
            }
        } catch (error) {
            console.log('⚠️  Could not check git status, proceeding with commit...');
        }

        // Get commit message
        let commitMessage;
        if (process.argv.length > 2) {
            // Use command line arguments
            commitMessage = getCommitMessage();
        } else {
            // Prompt for commit message
            commitMessage = await promptForCommitMessage();
        }

        // Commit changes
        console.log('💾 Committing changes...');
        execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
        console.log('✅ Changes committed successfully');

        // Check if remote exists and push
        try {
            const remotes = execSync('git remote', { encoding: 'utf8' });
            if (remotes.trim()) {
                console.log('🚀 Pushing to remote repository...');
                execSync('git push', { stdio: 'inherit' });
                console.log('✅ Changes pushed to remote');
            } else {
                console.log('ℹ️  No remote repository configured');
            }
        } catch (error) {
            console.log('⚠️  Could not push to remote:', error.message);
        }

        console.log('🎉 Done! Changes committed and pushed');

    } catch (error) {
        console.error('❌ Error running done script:', error.message);
        process.exit(1);
    }
}

main();