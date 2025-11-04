# AWS CloudFormation Template for Scalable Cloud Environment

You are tasked with generating a fully automated, production-ready AWS CloudFormation YAML template that sets up a complete, scalable, and secure cloud environment.

## Functional Requirements

### Networking (VPC Setup)
- Create a VPC with at least two subnets across different Availability Zones for high availability.
- Include Internet Gateway, Route Tables, and Subnet associations.
- Allow parameterized CIDR blocks (no hardcoded CIDRs).

### Compute Layer
- Define a Launch Template or Launch Configuration.
- Configure an Auto Scaling Group (ASG) with Load Balancer (ALB) integration.
- Instances should have IAM roles with the least privileges necessary.
- Security Groups should allow only HTTP (80) and HTTPS (443) inbound.

### Database Layer
- Include an RDS instance (MySQL or PostgreSQL).
- Enable encryption at rest and in transit.
- Must support Multi-AZ for production and Single-AZ for development (controlled via environment conditions).

### Monitoring
- Integrate CloudWatch for monitoring EC2, ALB, and RDS.
- Include basic CloudWatch Alarms for CPU utilization and storage space.
- Enable CloudWatch Logs for application and infrastructure metrics.

### IAM & Security
- All IAM roles and policies must adhere to least privilege.
- No inline policies granting full access (e.g., no AdministratorAccess or `"Action": "*"`) unless justified by AWS service dependencies.
- Implement parameterized allowed CIDR blocks.

### Tagging & Outputs
- Every resource must include cost tracking tags:
  - `Environment`, `Project`, `Owner`, and `CostCenter`.
- Use CloudFormation Outputs to export key details:
  - VPC ID, Subnet IDs, ALB DNS Name, RDS Endpoint, ASG Name, and IAM Role ARN.

## Conditions & Environment Handling
- Use CloudFormation Conditions to handle environment-specific configurations (dev vs prod):
  - Example: Multi-AZ database only for prod.
  - Example: Smaller EC2 instance type for dev.
- Base all conditional logic on the `Environment` parameter.

## Parameterization Requirements
- No hardcoded values.
- Every configurable value must be parameterized, including:
  - Instance types
  - Database storage
  - Allowed CIDR blocks
  - RDS engine/version
  - Environment type
  - Environment suffix (for naming)
  - Lambda concurrency (if applicable)

### Mandatory Parameters
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

## Naming Convention (Mandatory)
All resource `Name` attributes must strictly follow this naming pattern:
```yaml
Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"
```

### Examples:
- VPC → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc`
- Subnet → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1`
- EC2 → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance`
- ALB → `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb`

## Compliance & Best Practices
- The template must pass `aws cloudformation validate-template` without modification.
- Must comply with AWS Well-Architected Framework pillars: security, reliability, performance, cost optimization, and operational excellence.
- All resources should include `DependsOn` where necessary to ensure correct creation order.
- Avoid deprecated CloudFormation resources (use `LaunchTemplate` over `LaunchConfiguration`).
- Avoid static ARNs or Region strings — use intrinsic functions like:
  - `!Sub`, `!Ref`, `!GetAtt`, `!FindInMap`, and `!Select` for dynamic references.
- Ensure compatibility with cross-account deployment (no hardcoded Account IDs or Region names).

