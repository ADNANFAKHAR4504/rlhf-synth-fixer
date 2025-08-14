# IDEAL CDKTF Infrastructure Response

This solution implements a secure, multi-region, multi-environment AWS infrastructure using CDKTF.  
It covers all user requirements: strict security, least privilege IAM, logging/auditing, modularity, tagging, remote state, and automated tests.  
All modules are located in the `lib/` directory and are fully integrated in the stack.  
Integration and unit tests validate the stack, ensuring at least 70% coverage.

---

## Entrypoint: bin/tap.ts

````typescript
// filepath: [tap.ts]
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Define required regions
const regions = ['us-east-1', 'us-west-2'];

const app = new App();

// Get environment variables or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Default tags for all resources
const defaultTags = {
  tags: {
    Environment: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
  },
};

// Instantiate TapStack for each region
regions.forEach(awsRegion => {
  const stackName = `TapStack${environmentSuffix}-${awsRegion}`;
  new TapStack(app, stackName, {
    environmentSuffix: environmentSuffix,
    stateBucket: stateBucket,
    stateBucketRegion: stateBucketRegion,
    awsRegion: awsRegion,
    defaultTags: defaultTags,
  });
});

// Synthesize the app to generate the Terraform configuration
app.synth();
````