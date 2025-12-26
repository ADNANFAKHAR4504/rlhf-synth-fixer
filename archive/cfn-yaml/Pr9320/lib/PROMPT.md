# AWS CloudFormation Template Requirements

You are an infrastructure automation engineer. Your goal is to generate a production-ready AWS CloudFormation YAML template to migrate a multi-tier web application to AWS with zero downtime using a Blue-Green deployment strategy. The template must provision all required resources, enforce security best practices, and support high availability and resilience.

## Environment Setup

Need a multi-tier web app infrastructure with Blue-Green deployment for zero downtime migration:

- VPC with public and private subnets across multiple AZs
- Application Load Balancer in public subnets to route traffic
- EC2 Auto Scaling Groups in private subnets for the web tier
- RDS database in private subnets with encrypted storage
- S3 bucket for CodePipeline artifacts
- Secrets Manager to store database credentials

The ALB should forward traffic to target groups that connect to the Auto Scaling Groups. Application servers need access to RDS via security group rules. IAM roles grant EC2 instances access to S3 and Secrets Manager.

CodePipeline orchestrates the deployment: fetch source from S3, build with CodeBuild, deploy to EC2 using CodeDeploy with Blue-Green strategy.

Follow the `<component>-env-migration` naming convention for all resources.

## Constraints

- Migrate the existing multi-tier web application to AWS using CloudFormation.
- Ensure zero-downtime during the migration process.
- Use a Blue-Green deployment strategy for the application.
- Use AWS RDS for the database and ensure smooth data transition without loss.
- Implement AWS CodePipeline for CI/CD during migration.
- Distribute the application across multiple availability zones for high availability.
- Incorporate IAM roles that follow the principle of least privilege for all compute resources.
- Template must pass AWS CloudFormation validation and cfn-lint checks.
- Do not hard code the AWS region; use environment variables instead.
- Use dynamic references for secrets like passwords instead of parameters.
- Do not use 'Fn::Sub' unless variables are required.
- Do not include additional properties not supported by resources. For example, BackupPolicy is not allowed in some resources.
- 'IsLogging' is a required property for AWS::CloudTrail::Trail if CloudTrail is used.

## Output Expectations

- Produce a YAML CloudFormation template that deploys all specified AWS resources without error.
- Use descriptive logical resource names following the `<component>-env-migration` format.
- Follow AWS best practices and security guidelines.
- Ensure the stack is fully deployable, meets all requirements and constraints, and passes validation and linting.
