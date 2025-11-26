Generate a complete, production-grade, single CloudFormation YAML template that deploys a fully secure multi-tier AWS environment implementing industry security best practices. The template must be fully executable across AWS accounts and AWS regions without modification.

Critical Requirements

Cross-Account Executability:

No account-specific or region-specific assumptions.

The template must work in any AWS account and region.

No Hardcoding:

No hardcoded ARNs, account IDs, region names, IPs, AZ names, or environment-specific values.

Always use CloudFormation intrinsic functions (e.g., !Ref, !Sub, Fn::ImportValue, Fn::GetAZs, etc.).

Required Parameter:

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'


Mandatory Naming Convention:
Every Name or resource identifier MUST follow:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${StackName}-${Region}-${EnvironmentSuffix}-vpc

Subnet → ${StackName}-${Region}-${EnvironmentSuffix}-private-subnet-1

Lambda → ${StackName}-${Region}-${EnvironmentSuffix}-lambda

Required AWS Resources

The final CloudFormation template must deploy the following:

Networking

VPC with CIDR parameter

Two public subnets and two private subnets (dynamic AZ mapping using Fn::GetAZs)

Internet Gateway, NAT Gateway(s), elastic IP(s)

Route tables and associations

Security

IAM roles following least-privilege

KMS CMK(s) for:

EC2 encrypted storage

RDS

DynamoDB

S3

Lambda environment variables

Security groups for:

ALB (HTTP inbound only)

Application EC2 tier (only allow inbound from ALB SG)

RDS (only allow inbound from EC2 SG)

Compute Layer

EC2 instances placed ONLY in private subnets

Systems Manager (SSM Session Manager) access enabled
No SSH keys, no public IPs

Load Balancing

Application Load Balancer (ALB) using HTTP only on port 80 (no ACM certificate)

ALB target group + listener rules

Attach AWS WAF web ACL to ALB

Storage & Database

S3 bucket (private, encryption enabled, block public access, bucket policy).

DynamoDB table with KMS encryption.

RDS Multi-AZ deployment using encrypted storage and enforcing TLS.

Serverless

Lambda function with encrypted environment variables and least-privilege role

Monitoring & Compliance

AWS CloudTrail with encrypted logging to S3

AWS Config recorder + rules (e.g., encrypted volumes, restricted S3 access)

CloudWatch:

Log Groups (with retention)

Metrics

Alarms (CPU, RDS health, etc.)

SNS Topic for security/alert notifications (email subscription allowed to remain pending and must not block stack completion)

Additional Behavioral Rules

MUST use !Sub, !Ref, and dynamic values everywhere possible.

Must work as a single CloudFormation template (no nested stacks).

Must pass YAML validation and be deployable as-is.

Must follow AWS Well-Architected Framework security principles.

Output Format Requirements

Output the CloudFormation file ONLY.

Do NOT explain or add comments unless inside # in YAML.

File name: secure-aws-environment.yaml