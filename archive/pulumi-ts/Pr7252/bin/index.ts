import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Load configuration
const config = new pulumi.Config();
const environmentSuffix = pulumi.getStack();

// Configuration with defaults for deployment testing
// NOTE: For production use, configure these values via Pulumi config
const githubOwner = config.get('githubOwner') || 'example-owner';
const githubRepo = config.get('githubRepo') || 'example-repo';
const githubToken =
  config.getSecret('githubToken') ||
  pulumi.secret('placeholder-token-configure-before-use');
const ecrImageUri =
  config.get('ecrImageUri') || 'public.ecr.aws/pulumi/pulumi:latest';

// Optional configuration with defaults
const githubBranch = config.get('githubBranch') || 'main';
const devAccountId = config.get('devAccountId') || '123456789012';
const stagingAccountId = config.get('stagingAccountId') || '234567890123';
const prodAccountId = config.get('prodAccountId') || '345678901234';

// Create the main stack
const stack = new TapStack('pulumi-cicd-pipeline', {
  environmentSuffix: environmentSuffix,
  githubOwner: githubOwner,
  githubRepo: githubRepo,
  githubBranch: githubBranch,
  githubToken: githubToken,
  ecrImageUri: ecrImageUri,
  devAccountId: devAccountId,
  stagingAccountId: stagingAccountId,
  prodAccountId: prodAccountId,
  tags: {
    Project: 'PulumiCICD',
    ManagedBy: 'Pulumi',
    Environment: environmentSuffix,
  },
});

// Export pipeline ARNs and resource names
export const devPipelineArn = stack.devPipelineArn;
export const stagingPipelineArn = stack.stagingPipelineArn;
export const prodPipelineArn = stack.prodPipelineArn;
