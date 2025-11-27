import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: 'Production',
  DisasterRecovery: 'Enabled',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const stack = new TapStack('dr-infrastructure', {
  environmentSuffix,
  tags: defaultTags,
});

export const primaryVpcId = stack.primaryVpcId;
export const drVpcId = stack.drVpcId;
export const auroraGlobalClusterId = stack.auroraGlobalClusterId;
