
# AWS CloudFormation Template Requirements

You are an infrastructure automation engineer. Your goal is to generate a production-ready AWS CloudFormation YAML template to implement a secure and scalable CI/CD pipeline for application deployment. The template must provision all required resources, enforce best practices, and ensure seamless integration and automation.

## Environment Setup

- Use AWS CodePipeline as the primary orchestration service for the CI/CD process.
- Employ AWS CodeBuild for compiling and packaging application artifacts.
- Implement AWS CodeDeploy to automate application deployments to an EC2 instance environment.
- Leverage IAM roles to ensure least privilege access is enforced throughout the process.
- Configure the pipeline to trigger based on changes to a specified branch in an AWS CodeCommit repository.
- Store build artifacts in an Amazon S3 bucket.
- Utilize Amazon SNS to notify stakeholders of any build or deployment failures.
- Include a manual approval step in the pipeline before deployment.
- Prefix all production resource names with 'prod-'.
- Author all configurations using YAML within a single CloudFormation template.

## Constraints

- The CI/CD pipeline must use AWS CodePipeline as the primary service.
- AWS CodeBuild should be used for building the application artifacts.
- Use AWS CodeDeploy for deploying the application to an EC2 environment.
- Ensure the environment uses an AWS IAM role with least privilege access policies.
- The pipeline should trigger on changes to a specific branch of a CodeCommit repository.
- Use Amazon S3 to store the output artifacts from the build stage.
- The build and deploy process should include notifications via Amazon SNS upon failures.
- Include a manual approval step before the deploy stage can proceed.
- All resources must be defined in a single CloudFormation template using YAML.
- Resource names must comply with a prefix 'prod-' for production resources.
- Template must pass AWS CloudFormation validation and cfn-lint checks.
- Do not hard code the AWS region; use environment variables instead.
- Use dynamic references for secrets (e.g., passwords) instead of parameters.
- Do not use 'Fn::Sub' unless variables are required.
- Do not include additional properties not supported by resources (e.g., 'BackupPolicy' if not allowed).
- 'IsLogging' is a required property for AWS::CloudTrail::Trail if CloudTrail is used.

## Output Expectations

- Produce a YAML CloudFormation template that deploys all specified CI/CD resources without error.
- Use descriptive logical resource names with the 'prod-' prefix for production resources.
- Follow AWS best practices and security guidelines.
- Ensure the stack is fully deployable, meets all requirements and constraints, and passes validation and linting.
