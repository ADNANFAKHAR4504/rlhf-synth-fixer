Generate a production-ready, fully automated AWS CloudFormation YAML template that deploys a highly available web application infrastructure for a financial services portal. The template must follow all requirements, constraints, naming conventions, and cross-account guidelines listed below.

Functional Requirements

Networking

Define a VPC with 3 public and 3 private subnets across different Availability Zones, all created dynamically (no hardcoded AZ names).

Create public route tables and private route tables.

Deploy one NAT Gateway per public subnet (3 total).

Load Balancing

Create an Application Load Balancer (ALB) in public subnets.

Configure an ALB Target Group with a /health health check endpoint.

Create an HTTPS listener (certificate ARN must be a parameter).

Auto Scaling / Compute

Create a Launch Template using:

Amazon Linux 2023 AMI (resolve via SSM, not hardcoded)

Instance type parameter (default t3.large)

IMDSv2 enforced (HttpTokens: required)

Create an Auto Scaling Group in private subnets.

Attach ASG to ALB target group.

Maintain at least 3 instances during 6 AM – 10 PM EST via Auto Scaling Scheduled Actions (convert to UTC).

Include IAM instance profile with access to:

SSM Parameter Store (read-only)

CloudWatch Logs (write)

Database

Create an Amazon Aurora PostgreSQL 15.4 cluster:

1 writer instance (always)

1 reader instance (only when environment = production, using CloudFormation Conditions)

Use private subnets only.

Enable:

SSL/TLS enforcement (rds.force_ssl = 1)

CA certificate validation

Automated backups with 7-day retention

Point-in-time restore

Add DB Security Group allowing port 5432 from EC2 SG only.

CloudFront + S3 (Static Hosting)

Create an S3 bucket for static web assets:

Versioning enabled

Lifecycle rule: transition objects older than 90 days → Glacier

No public access

Create a CloudFront Distribution with:

Origin #1: S3 bucket using Origin Access Control (no public bucket)

Origin #2: ALB for API traffic

Cache behavior:

/api/* path pattern → ALB origin

Max TTL: 60 seconds

Security

Security groups must:

Allow HTTPS (443) from CloudFront → ALB

Allow Postgres (5432) from EC2 instances → RDS cluster

All EC2 instances must enforce IMDSv2.

ALB must use AWS WAF with rate-limiting rules (e.g., AWS::WAFv2::WebACL + WebACLAssociation).

Monitoring / Alarms

CloudWatch alarms for:

ALB Target Group unhealthy or healthy host count < 3

RDS CPU > 80%

ASG InService instance count < 3

Outputs

CloudFront Domain Name

ALB DNS Name

RDS Cluster Endpoint

Mandatory Template Rules
No Hardcoded Values

Absolutely no hardcoded:

Account IDs

ARNs

Region names

Availability zones

IP ranges (except RFC1918 CIDR blocks provided via parameters)

Everything must be parameterized or dynamically resolved.

Mandatory Parameters

Include the following parameter exactly as written:

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)"
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"


Also include parameters for:

EnvironmentName (dev/staging/prod)

InstanceType

DBPassword (NoEcho, SecureString)

CertificateArn

VpcCIDR

PublicSubnetCIDRs (list)

PrivateSubnetCIDRs (list)

Mandatory Naming Convention

Every resource must follow this naming format:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

ALB → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb

Launch Template → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lt

RDS Cluster → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-aurora-cluster

Additional Constraints

Use CloudFormation Conditions to deploy Aurora reader only in production.

Apply DeletionPolicy: Retain or Snapshot for RDS and S3.

Apply consistent tagging:

Environment

CostCenter

Application

Owner

StackName

CloudFront cache behavior for /api/* must have MaxTTL = 60 seconds.

Expected Output

Provide:

A single CloudFormation YAML template

Fully validated (no syntax errors)

Production-grade best practices

No inline comments that break YAML

Proper resource dependencies using DependsOn when required

Must be fully executable across AWS accounts with no modifications