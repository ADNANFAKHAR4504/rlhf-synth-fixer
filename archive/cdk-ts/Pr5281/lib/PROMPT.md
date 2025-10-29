Hey, I need help building a CI/CD pipeline using AWS CodePipeline and TypeScript. The goal is to automate deployments of a TypeScript app (packaged as Docker) to Elastic Beanstalk.

1. Pipeline Setup

- AWS CodePipeline with source, build, and deploy stages
- Source stage connected to s3 using webhooks (triggers on main branch pushes)
- Build stage using AWS CodeBuild with a buildspec file
- Test stage for running unit tests
- Deploy stage to AWS Elastic Beanstalk using Docker containers

2. Build Process

- CodeBuild should install dependencies, build the TypeScript app and a dockerfile, and run unit tests
- Tests must pass before deployment continues
- Package everything as a Docker container
- Store build artifacts in S3

3. Security & Configuration

- Use AWS Secrets Manager for sensitive data during builds
- Configure environment variables through Parameter Store
- Create IAM roles for cross-account deployments and S3 access
- Follow least privilege principle for all permissions

4. Approval & Notifications

- Add a manual approval step before deployment
- Use AWS Lambda to send Slack notifications for approvals
- Set up CloudWatch alarms to monitor pipeline failures

Requirements

- Use TypeScript with AWS SDK for JavaScript (v3) for app code, CDK Typescript for IAC
- Follow naming convention: company-division-environment-resource
- only environmentSuffix is provided, treat all variables as optional and use an approprite default value.
- if environmentSuffix does not contain prod, every resource should have removal policy of destroy (ensure proper cleanup)
- Tag all resources for cost tracking
- Support cross-account deployment
- Include comprehensive logging and monitoring
- The pipeline should be production-ready with proper error handling, monitoring, and security controls.
- code structure is like bib/tap.ts and lib/tap-stack.ts, all code that you create should be in lib/ folder
