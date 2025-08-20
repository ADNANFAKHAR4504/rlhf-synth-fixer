# AWS CloudFormation Template Requirements

You are an infrastructure automation engineer. Your goal is to generate a production-ready AWS CloudFormation YAML template to migrate a multi-tier web application to AWS with zero downtime using a Blue-Green deployment strategy. The template must provision all required resources, enforce security best practices, and support high availability and resilience.

## Environment Setup

- Provision AWS RDS for the application's database, ensuring seamless and lossless data migration.
- Use AWS CodePipeline to manage continuous integration and continuous delivery (CI/CD) for the application during migration.
- Distribute the application across multiple availability zones for high availability.
- Implement IAM roles and policies for all compute resources, strictly following the principle of least privilege.
- Configure network security groups to maintain the same or higher security level as the existing environment.
- Use the default VPC for deployment.
- Follow the `<component>-env-migration` naming convention for all resources.

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
- Use dynamic references for secrets (e.g., passwords) instead of parameters.
- Do not use 'Fn::Sub' unless variables are required.
- Do not include additional properties not supported by resources (e.g., 'BackupPolicy' if not allowed).
- 'IsLogging' is a required property for AWS::CloudTrail::Trail if CloudTrail is used.

## Output Expectations

- Produce a YAML CloudFormation template that deploys all specified AWS resources without error.
- Use descriptive logical resource names following the `<component>-env-migration` format.
- Follow AWS best practices and security guidelines.
- Ensure the stack is fully deployable, meets all requirements and constraints, and passes validation and linting.
