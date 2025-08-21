# AWS CloudFormation Template Requirements
Design a secure and scalable CI/CD pipeline using AWS CloudFormation. The goal is to automate application build, test, and deployment processes for an EC2 environment, ensuring least privilege access and robust notification mechanisms. The template must enforce security best practices and support production-grade scalability.

## Environment Setup
- **AWS CodePipeline**: Orchestrates the CI/CD workflow as the primary service.
- **AWS CodeBuild**: Compiles and packages application artifacts.
- **AWS CodeDeploy**: Automates deployments to EC2 instances.
- **Amazon S3**: Stores build artifacts from CodeBuild.
- **Amazon SNS**: Notifies stakeholders of build or deployment failures.
- **IAM Roles**: Enforce least privilege for all services and stages.
- **Manual Approval Step**: Required before deployment proceeds.
- **Resource Naming**: All production resources must be prefixed with `prod-`.
- **Single Template**: All resources must be defined in a single YAML CloudFormation template.

## Constraints
- Template must pass AWS CloudFormation validation and cfn-lint checks.
- Do not hard code AWS region; region is provided as an environment variable.
- Use dynamic references (not parameters) for secrets such as passwords.
- Do not use 'Fn::Sub' unless variables are present (not needed here).
- Do not include additional properties not supported by resource types (e.g., 'BackupPolicy' is not allowed).
- 'IsLogging' is a required property for `AWS::CloudTrail::Trail` (if used).
- All resources must comply with the 'prod-' prefix for production.
- All IAM roles must follow least privilege principles.

## Output Expectations
- The template must deploy all specified AWS resources without error.
- All logical resource names must be descriptive and meaningful.
- The template must follow AWS best practices and security guidelines.
- The output must be a valid YAML CloudFormation template that passes validation and linting.
