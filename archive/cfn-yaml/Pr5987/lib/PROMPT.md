# AWS CloudFormation Template Design Challenge

## Objective

Design a CloudFormation YAML template that deploys a highly available web application stack consisting of:

- Application Load Balancer (ALB)
- Auto Scaling Group (ASG) with EC2 instances
- Multi-AZ Amazon RDS database
- S3 bucket with encryption
- CloudWatch logging
- Secure networking (VPC, subnets, NACLs, SGs)
- IAM roles with least-privilege access to S3, RDS, and CloudWatch

The infrastructure must handle variable traffic, maintain security best practices, and comply with AWS architecture standards.

## Technical and Compliance Requirements

### 1. Cross-Account Executability

- The template must run unchanged across any AWS account.
- No hardcoded values — all dynamic values (like account IDs, ARNs, regions) must use pseudo parameters, functions (!Ref, !Sub, !GetAtt), or stack parameters.
- Never assume a specific account or region setup.

### 2. Region and Availability

- The stack must deploy successfully in any region, but defaults should target `us-east-1`.
- Must include at least two Availability Zones for high availability.

### 3. Mandatory Parameters

Include this exact parameter block:

```yaml
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
```

Additional parameters should include (but are not limited to):

- `ProjectName`
- `Environment` (dev, test, prod)
- `AllowedCidr`
- `InstanceType`
- `DBName`, `DBUsername`, `DBPassword` (use `NoEcho: true`)
- `VpcCidrBlock`

### 4. Naming Convention (Mandatory)

Every resource must follow this strict naming rule for the `Name` property:

```yaml
Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"
```

**Examples:**

- VPC → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- Subnet → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1`
- EC2 → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance`
- ALB → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb`

This rule is non-negotiable — all resources must adhere to it.

### 5. Security and Logging

- All S3 buckets must use SSE-S3 encryption (AES256).
- CloudWatch Logs must be configured for application, system, and database logging.
- Security Groups and NACLs must restrict access to only the `AllowedCidr` range.
- IAM roles must grant only the minimal necessary permissions for EC2 instances to access S3, RDS, and CloudWatch.

## Core Architecture Components

### Networking Layer

- VPC, public/private subnets across 2 AZs.
- Internet Gateway, NAT Gateway(s), route tables.
- Security groups and NACLs for each tier.

### Compute Layer

- Launch Template or Launch Configuration.
- Auto Scaling Group with health checks.
- Application Load Balancer for traffic distribution.

### Database Layer

- Multi-AZ RDS instance (MySQL or PostgreSQL).
- Encrypted storage and CloudWatch log exports.

### Storage and Logging

- Encrypted S3 bucket (SSE-S3).
- CloudWatch Log Groups with retention policies.
- Optional: S3 access logs or ALB access logs.

### IAM and Monitoring

- Instance role and profile.
- Policies for S3, RDS, CloudWatch.
- CloudWatch alarms (optional but preferred).

## Output Requirements

- Output a single valid YAML CloudFormation template.
- Include comments for major sections.
- Use logical IDs and references clearly.
- The template must be fully deployable and self-contained — no manual configuration needed.
- Validate that the syntax is 100% YAML-compliant and passes `aws cloudformation validate-template`.