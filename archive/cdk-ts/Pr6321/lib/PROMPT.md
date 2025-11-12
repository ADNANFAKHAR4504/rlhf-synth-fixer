We need to build a three-stage CI/CD pipeline for our containerized microservices using AWS CDK in TypeScript. The goal is to have a fully automated flow from source to production that supports testing, security scanning, and blue/green deployments, with clear visibility and approval points along the way.

The pipeline should use CodeCommit as the source repository and automatically trigger when changes are pushed to the main branch. Artifacts will be stored in an S3 bucket with versioning and KMS encryption, and should be kept for 30 days. Each stage in the pipeline—build, test, and deploy—should have its own CodeBuild project, using different compute types and separate buildspec files for unit tests, integration tests, and security scans.

Before anything goes live, we’ll have a manual approval step between staging and production, with SNS notifications sent out for review. Deployments should go out to ECS using blue/green deployment through CodeDeploy. We’ll need CloudWatch dashboards to keep track of pipeline metrics and failure rates, plus alarms for any failed builds or deployments.

Every pipeline component should follow the least privilege principle for IAM roles. Use CloudFormation change sets for any infrastructure updates that are part of the pipeline. The pipeline will operate across three AWS accounts—dev, staging, and prod—so set up cross-account IAM roles to handle deployments securely.

You only need to generate code for the following files:

bin/tap.ts — the CDK entry file that sets up the app and defines the region (us-east-1).

lib/tap-stack.ts — where the entire CI/CD stack is implemented, including CodePipeline, CodeCommit, CodeBuild, CodeDeploy, ECS integration, IAM roles, artifact storage, SNS notifications, and monitoring setup.

cdk.json — no edits needed here.

Return only the code, nothing else.