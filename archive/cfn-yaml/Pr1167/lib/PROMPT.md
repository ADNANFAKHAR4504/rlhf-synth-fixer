## 1. AWS CloudFormation Template Requirements

- Role: Automate the deployment of a secure and scalable CI/CD pipeline for a Node.js application using AWS CloudFormation.
- Goal: Provision all necessary AWS resources to enable continuous integration and deployment, ensuring best practices for security and scalability.

## 2. Environment Setup

- Use AWS CodePipeline as the primary orchestrator for CI/CD.
- Integrate AWS Lambda functions to perform custom test actions during the build phase.
- Set up a manual approval step before deploying to production.
- Store application code in an Amazon S3 bucket (do not hardcode region).
- Create an Amazon SNS topic to send notifications about pipeline execution status.
- Define an IAM role granting only the minimum permissions required for all services (least privilege).
- Ensure EC2 instances (if any) in the pipeline have no direct internet access.

## 3. Constraints

- Template must pass AWS CloudFormation validation and cfn-lint.
- Do not hardcode the AWS region; treat it as an environment variable.
- Use dynamic references (not parameters) for secrets such as passwords.
- Do not use 'Fn::Sub' unless variables are present.
- Do not include additional properties not supported by CloudFormation (e.g., 'BackupPolicy').
- 'IsLogging' is a required property for AWS::CloudTrail::Trail (if used).
- Follow all constraints listed in the task description.

## 4. Output Expectations

- The template deploys all specified AWS resources without error.
- Uses descriptive and logical resource names.
- Follows AWS best practices and security guidelines.
- Automates the entire CI/CD pipeline setup as described.
- Ensures all components are compliant with requirements and pass test framework checks.
