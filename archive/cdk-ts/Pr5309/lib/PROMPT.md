Design and implement a CI/CD pipeline using AWS CDK TypeScript for a Hono TypeScript application. Create both the application infrastructure (Lambda function behind API Gateway) and the complete CI/CD pipeline. Source code artifacts are stored in S3, and the pipeline triggers automatically on new uploads.

Application Infrastructure:

- Create Lambda function with Node.js 20.x runtime for Hono TypeScript application
- Deploy Lambda behind API Gateway REST API or HTTP API with proper routing
- Configure IAM roles, environment variables, and Lambda execution permissions

Pipeline Orchestration:

- Implement AWS CodePipeline with S3 source action monitoring source artifacts bucket
- Support multi-stage execution: build, test, and deployment with artifact passing

Build and Testing:

- Use AWS CodeBuild with Node.js 20.x runtime for compilation and bundling
- Configure buildspec to compile TypeScript, install dependencies, and bundle application
- Execute unit tests post-build and block deployment on test failures or low coverage
- Store test reports in S3

Deployment:

- Deploy to us-east-1 using CDK deployment actions in pipeline
- Support zero-downtime using Lambda versioning and aliases
- Use environmentSuffix parameter for environment-specific configurations

Security:

- Enforce least-privilege IAM with separate roles for CodePipeline, CodeBuild (build/test stages), and deployment
- Use AWS Systems Manager Parameter Store with KMS encryption for sensitive credentials
- Secure S3 buckets with encryption and proper policies
- Implement code signing and artifact validation

Automated Rollback and Monitoring:

- Configure CloudFormation rollback capabilities with CloudWatch alarms for deployment health
- Enable CloudWatch logging for all stages, Lambda, and API Gateway
- Create dashboards for pipeline metrics and SNS notifications for status changes

Technical Specifications:

- Language: TypeScript, Framework: AWS CDK
- Entrypoint: bin/tap.ts, Stack File: lib/tap-stack.ts
- Lambda Runtime: Node.js 18.x, Build Runtime: Node.js 20.x
- Region: us-east-1, Naming: <team>-<project>-<environment>

Constraints:

- Only environmentSuffix is required (via CDK context), all other configs need defaults
- Do not modify files outside lib/ or bin/ directories
- Organize resources into modular constructs within lib/, keep TapStack in lib/tap-stack.ts

Acceptance Criteria:

- CDK synthesizes without errors, pipeline executes end-to-end successfully
- Lambda + API Gateway infrastructure created and integrated
- IAM roles pass least-privilege review, rollback works on failure
- CloudWatch captures all activities, Parameter Store integration verified
- All defaults work with only environmentSuffix provided

Best Practices: Use CDK constructs, implement error handling and retries, leverage Parameter Store and CDK context for configuration, enable resource tagging, follow AWS Well-Architected Framework principles. Solution must be production-ready and deployable with only environmentSuffix parameter required.
