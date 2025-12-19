# Unified CloudFormation YAML Template

## Overview
Create a unified CloudFormation YAML template (`infra.yaml`) that provisions AWS infrastructure for three environments: **development**, **testing**, and **production**.

The template must dynamically adapt its resource configuration using parameters, mappings, and conditions, such that a single template can be deployed in any AWS account or region without modification.

## Functional Requirements

### VPC per Environment
- Each environment gets its own isolated VPC with unique CIDR blocks.
- CIDRs must be parameterized or defined via mappings.
- Include:
  - Public/private subnets
  - Route tables
  - Internet gateway

### EC2 Instances
- Provision EC2 instances in each environment.
- Requirements:
  - AMI IDs must be environment-specific and provided via parameters or mappings.
  - Use appropriate instance types per environment.
  - Attach IAM roles that follow the principle of least privilege.

### IAM Roles
- Create environment-specific IAM roles for EC2 instances.
- Restrict actions to only those necessary for the instance (e.g., read Parameter Store, publish CloudWatch metrics).
- Avoid attaching AWS managed policies with wide access.

### S3 Buckets
- Create separate S3 buckets per environment.
- Enforce:
  - Encryption (SSE-S3 or KMS).
  - Explicitly block all forms of public access.
- Attach restrictive bucket policies.

### Parameter Store Integration
- Define AWS Systems Manager (SSM) Parameters for each environment to store configuration values such as DB credentials, environment settings, etc.
- Ensure values are securely stored (e.g., use SecureString for secrets).

### CloudWatch Alarms
- Monitor EC2 instance health status.
- Trigger alarms and send notifications (SNS topic) on failures.

### Auto Scaling Group (Production Only)
- Automatically scale EC2 instances based on CPU or network load.
- Use conditions so Auto Scaling is created only when `Environment=prod`.

### RDS Instances
- Create an RDS instance per environment with varying configurations (e.g., size, storage, backup retention).
- Ensure:
  - Encryption
  - Private subnet placement

### Tagging
- Apply consistent tags to all resources.
- Every resource must include cost tracking tags:
  - `Environment`, `Project`, `Owner`, and `CostCenter`.
- Tags must be generated dynamically and consistently applied.

### Region & Cross-Account Compliance
- No hardcoded regions, account IDs, or ARNs.
- All values must be parameterized or derived dynamically (`!Sub`, `!Ref`, `!GetAtt`, etc.).
- The template must work in any AWS account and region without modification.


## Validation & Documentation
- Include comments explaining assumptions, default values, and environment logic.
- The final YAML must pass:
  ```bash
  aws cloudformation validate-template --template-body file://infra.yaml
  ```
- Conform to AWS CloudFormation best practices.

## Mandatory Parameters

### Parameters
```yaml
Parameters:
  Environment:
    Type: String
    Description: 'Deployment environment (development, testing, or production)'
    AllowedValues:
      - dev
      - testing
      - prod
    Default: dev

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
```

## Naming Convention (Mandatory)

All resources must follow this strict Name pattern:

```yaml
Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"
```

### Examples
- **VPC** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- **Subnet** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1`
- **EC2** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance`
- **ALB** → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb`

Every `Name` property in the template must use this naming convention.


## Cross-Account & No Hardcoding Rules

### Prohibited Hardcoding
- AWS Account IDs
- Region names (e.g., `us-east-1`, `us-west-2`)
- ARNs for resources

### Dynamic Alternatives
- Use `!Sub` for dynamic ARNs:
  ```yaml
  !Sub "arn:aws:iam::${AWS::AccountId}:role/${RoleName}"
  ```
- Use `!Ref` or `!GetAtt` for dynamic linking between resources.
- Parameterize anything environment-specific.
- Any hardcoded value will be considered a critical issue.