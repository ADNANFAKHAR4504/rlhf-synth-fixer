We want to set up a secure, production-ready CI/CD pipeline using AWS CodePipeline. The entire solution should be deployed in us-east-1, and everything must follow security best practices, least privilege IAM, and proper logging.

1. CodePipeline Orchestration

The main CI/CD workflow will be orchestrated through AWS CodePipeline.
It should have these stages:
• Source Stage: Fetch the application code.
• Build Stage: Compile, test, and package the application.
• Approval Stage: A mandatory manual checkpoint.
• Deploy Stage: Deploy the compiled artifacts.

2. Source Stage: GitHub Integration

The source stage should pull code directly from a GitHub repository.
• Connection: Use AWS CodeStar Connections for secure GitHub integration.
• Parameters: Accept the CodeStar Connection ARN, GitHub repository owner, name, and branch (e.g., main or develop).
• Webhook: Configure automatic triggers when code is pushed to the specified branch.

3. Build Stage: AWS CodeBuild Setup

The build process will be handled by AWS CodeBuild.

Build Environment
• Runtime: A suitable managed image (e.g., aws/codebuild/nodejs:20.0 or aws/codebuild/standard:7.0).
• Compute: Parameterized compute type (BUILD_GENERAL1_SMALL, BUILD_GENERAL1_MEDIUM, etc.).
• Env Variables: Define all required variables, pulling sensitive values from AWS Secrets Manager.

Buildspec.yml (inlined in template)
The build spec must include:
• install: Install dependencies.
• pre_build: Run linters, security scans, or other pre-build checks.
• build: Compile and run unit tests.
• post_build: Package deployable artifacts (e.g., .zip, Docker image, or CloudFormation template).
• Artifacts: Define output for the next pipeline stages.

IAM & Logging
• Allow CodeBuild to pull from CodePipeline, write logs to CloudWatch, upload artifacts to the S3 bucket, and retrieve secrets from Secrets Manager.
• Enable detailed logging in CloudWatch Logs.

4. Deploy Stage: Secure Artifact Storage (S3)

Artifacts will be deployed to a dedicated S3 bucket.
• Bucket Name: Dynamically generated with CloudFormation intrinsic functions.
• Security Settings:
• Versioning enabled.
• SSE-KMS encryption (AWS-managed or custom key).
• Block all public access.
• Lifecycle policy: move non-current versions to Glacier after 30 days, delete permanently after 365 days.
• Permissions: Ensure CodePipeline can upload and retrieve artifacts securely.

5. Manual Approval Stage

A manual approval gate must be placed between build and deploy.
• Notification: When the pipeline pauses, send an alert to an SNS Topic (email address passed as a parameter).
• Security: The SNS topic must use encryption.

6. Secure Secrets Management

Sensitive values (API keys, tokens, etc.) should be stored in AWS Secrets Manager.
• Secret Definition: Create a secret inside the template.
• Value Input: Accept the secret value via parameter (demo purposes only; in production, inject differently).
• Usage: Show how CodeBuild references the secret securely via environment variables.

7. Security & Best Practices
   • IAM Least Privilege: Grant only the minimum permissions needed.
   • Logging & Monitoring: Enable logs for both CodePipeline and CodeBuild.
   • Resource Naming: Use consistent naming with ProjectName and Environment parameters.
   • Tagging: Apply meaningful tags for cost tracking.

Expected Output

You should provide a CloudFormation YAML template that is:
• Well-commented.
• Fully deployable in us-east-1.
• Covers all the requirements above.

Testing Instructions

After deployment, test the pipeline as follows: 1. Trigger: Push code to the configured GitHub branch. 2. Build: Monitor CodeBuild logs in CloudWatch. 3. Approval: Approve the manual approval stage (check email/SNS notification). 4. Deploy: Confirm artifacts are stored in the secure S3 bucket with versioning and encryption.
