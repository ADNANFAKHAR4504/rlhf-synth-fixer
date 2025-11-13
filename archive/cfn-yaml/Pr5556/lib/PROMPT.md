# AWS CloudFormation Payment Processing Application

You are an expert AWS CloudFormation architect. Create a single, production-ready CloudFormation YAML template that can deploy a payment processing application to both development and production environments — automatically adapting configuration using parameters and conditions.

## Functional Goal

The template must:

- Deploy a payment processing application using one CloudFormation stack that dynamically configures itself for dev or prod based on a parameter
- Be fully cross-account and cross-region executable — no hardcoded account IDs, ARNs, or regions
- Follow strict naming, parameterization, and tagging conventions
- Require no manual post-deployment configuration

## Core Functional Requirements

### 1. Parameters for Environment-Specific Values

Must include Environment parameter (dev or prod) used for all environment-based conditions and logic.

Must include parameters for instance sizes, database storage, allowed CIDR blocks, Lambda concurrency, etc.

Must include an EnvironmentSuffix parameter used only for resource naming (e.g., PR numbers injected by CI/CD).

Example:

```yaml
Parameters:
  Environment:
    Type: String
    Description: 'Deployment environment (development or production)'
    AllowedValues:
      - dev
      - prod
    Default: dev

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
```

**Important:** All environment-specific logic (conditions, resource properties, thresholds, etc.) must be based on Environment, while naming must use EnvironmentSuffix.

## Technical Requirements

### RDS MySQL Instance

- StorageEncrypted: true
- Automated backups (BackupRetentionPeriod) enabled only for prod
- MultiAZ: true only in prod
- DeletionProtection: false in all environments
- Use !Sub for names following required pattern
- Conditionally adjust DB class/storage based on environment

### EC2 Instances

- Use t3.micro for dev and m5.large for prod
- AMI IDs resolved via Mappings (region map)
- Instance type set using Conditions based on Environment

### S3 Buckets

- Names must be unique and include EnvironmentSuffix
- Versioning enabled in both environments
- Lifecycle policies differ by environment (shorter retention for dev)
- No hardcoded bucket names

### Lambda Functions

- Configuration via environment variables only (no hardcoded values)
- Reserved concurrency defined only in prod
- Reference other stack resources (RDS, S3)
- IAM roles with least-privilege access, adjusted per environment

### CloudWatch Alarms

- Different thresholds per environment (70% for dev, 80% for prod)

### Security Groups

- CIDR ranges provided as parameters — no hardcoded CIDRs
- Stricter ingress for prod

### IAM Roles

- Define least-privilege roles and policies
- Use !Sub and Conditions to scope permissions dynamically
- No wildcard ("*") actions or hardcoded ARNs

### Tagging

All resources must include:

```yaml
Tags:
  - Key: Environment
    Value: !Ref Environment
  - Key: Application
    Value: !Ref AWS::StackName
```

## Cross-Account / Cross-Region Support

Must be deployable across any AWS account and region without modification.

- No hardcoded ARNs, account IDs, or region names
- Use intrinsic functions (!Sub, !Ref, !GetAtt, etc.) for all references

## Naming Convention (Mandatory)

All resources must follow this exact pattern:

```yaml
Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"
```

**Examples:**
- VPC → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- Subnet → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1`
- EC2 → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance`

EnvironmentSuffix is not the environment name; it is a unique identifier (e.g., PR number) injected by CI/CD.

## Architectural / Structural Requirements

- Use Mappings for AMI IDs by region
- Use Conditions for every environment-specific configuration
- Use !If and AWS::NoValue to omit properties where not applicable
- Use StorageEncrypted: true for all RDS instances
- Include CloudWatch alarms with environment-based thresholds
- The template must validate cleanly with cfn-lint and aws cloudformation validate-template
- No manual or console-based setup required post-deployment

## Outputs

Output key resource details such as:

- RDS endpoint
- S3 bucket name
- EC2 instance ID
- Lambda function name

Use !Sub for all dynamic output values.

## Final Deliverable

Produce a single, self-contained CloudFormation YAML file that:

- Implements all requirements above
- Has no hardcoded values
- Uses Environment for configuration logic
- Uses EnvironmentSuffix only for naming
- Follows AWS best practices for:
  - Parameterization
  - Tagging
  - Conditional logic
  - Cross-account / cross-region portability
  - Secure IAM (no wildcard or hardcoded ARNs)