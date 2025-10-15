// Jest setup for CDKTF tests
// This file runs before each test file

// Set test environment variables
process.env.ENVIRONMENT_SUFFIX = 'test';
process.env.AWS_REGION = 'eu-west-1';
process.env.TERRAFORM_STATE_BUCKET = 'test-bucket';
process.env.TERRAFORM_STATE_BUCKET_REGION = 'us-east-1';
process.env.REPOSITORY = 'test-repo';
process.env.COMMIT_AUTHOR = 'test-author';
