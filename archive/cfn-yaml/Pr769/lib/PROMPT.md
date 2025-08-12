# AWS CloudFormation Template Requirements

You are an infrastructure automation engineer. Your goal is to generate a production-ready AWS CloudFormation YAML template to deploy a secure and scalable web application environment. The template must provision all required resources, enforce security best practices, and support dynamic scaling and high availability.

## Environment Setup

- Provision infrastructure in an AWS region that supports Application Load Balancer (ALB), EC2, and RDS.
- Create an Auto Scaling group for EC2 instances to handle varying web traffic.
- Implement a rolling update deployment strategy for EC2 instances.
- Deploy an Application Load Balancer configured to accept only HTTPS traffic.
- Integrate an Amazon RDS PostgreSQL database for application data storage.
- Enable comprehensive logging for CloudFront, ALB, RDS, and EC2.
- Use resource logical names prefixed with 'ProdApp'.
- Configure security groups to restrict access to specific IP ranges and enforce HTTPS-only access.

## Constraints

- Use AWS CloudFormation for all resource provisioning.
- Do not hard code the AWS region; use environment variables instead.
- Use dynamic references for secrets (e.g., passwords) instead of parameters.
- The template must pass AWS CloudFormation validation and cfn-lint checks.
- Do not use 'Fn::Sub' unless variables are required.
- Do not include additional properties not supported by resources (e.g., 'BackupPolicy' if not allowed).
- 'IsLogging' is a required property for AWS::CloudTrail::Trail if CloudTrail is used.
- Ensure rolling update strategy is defined for Auto Scaling group.
- All security configurations must comply with AWS best practices.

## Output Expectations

- Produce a YAML CloudFormation template.
- The template must deploy all specified AWS resources without error.
- Use descriptive logical resource names.
- Follow AWS best practices and security guidelines.
- Ensure the stack is fully deployable and meets all requirements and constraints.
