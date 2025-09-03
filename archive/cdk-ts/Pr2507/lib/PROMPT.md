
You are an AWS CDK (TypeScript) generator.
My project structure is:

tap-infrastructure/
├── bin/
│   └── tap.ts
├── lib/
│   └── tapstack.ts
├── test/
│   └── ...


I want you to generate TypeScript AWS CDK code in this structure that implements a full CI/CD pipeline for a web application, with the following requirements:

AWS CodePipeline

Define a continuous integration and deployment pipeline.

Include both manual and automatic approval stages before production deployment.

AWS CodeBuild

Compile & test the application.

Store build artifacts securely in an S3 bucket with encryption enabled.

AWS CodeDeploy

Deploy the application to EC2 instances.

Include configuration for rollback on failure.

EC2 instances must be secured with Security Groups following best practices.

Pipeline Stages

Source stage (from a repository like CodeCommit or GitHub).

Build & test stage (CodeBuild).

Deploy stage (CodeDeploy to EC2).

Manual/automatic approvals included where appropriate.

Notifications

Integrate Amazon SNS to send notifications for pipeline events & errors.

Integration with Boto3

Demonstrate usage of Boto3 to interact with AWS resources not natively supported by CloudFormation, if applicable.

Best Practices

Enable detailed logging for CodePipeline, CodeBuild, and CodeDeploy.

Secure all resources (S3 buckets encrypted, IAM roles least privilege, EC2 secured).

Output important ARNs (pipeline, build project, deploy app, SNS topic) for auditing.

Project Structure Expectations

lib/tapstack.ts: Define the stack and all constructs for pipeline, build, deploy, and related resources.

bin/tap.ts: Instantiate the stack with environment details.

test/: Add CDK unit tests validating pipeline stages, S3 encryption, IAM role restrictions, and notification integration.

Ensure cdk synth produces a valid CloudFormation template with all resources defined.

Documentation

Include inline comments in the generated code explaining each resource and its role in the CI/CD pipeline.

Provide outputs so a future auditor can easily identify all key resources.