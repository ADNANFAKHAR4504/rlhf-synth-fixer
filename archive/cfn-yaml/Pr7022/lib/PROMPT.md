I need you to generate a fully production-grade AWS CloudFormation template in YAML named web-app-infrastructure.yaml. This template must be fully deployable in any AWS account and region without modification, meaning:

No hardcoded ARNs

No hardcoded account IDs

No hardcoded region names

No hardcoded resource names

All variable values must use CloudFormation Parameters, intrinsic functions, or dynamic references.

Task Requirements

The CloudFormation template must provision a complete, highly available web application infrastructure including:

Elastic Load Balancer (ALB)

Public subnets

Multi-AZ

Target group

Listener

Access logging enabled to S3

Auto Scaling Group + Launch Template

EC2 instances in at least two AZs

UserData to bootstrap the application

Instances automatically registered with the ALB target group

Health checks via ALB

Scaling policies included

EC2 application instances

Deployed across at least two private subnets

Use proper IAM instance profile

Must NOT be publicly accessible

Must include required Security Groups

Multi-AZ RDS instance

Private subnets only

Multi-AZ enabled

No public access

Access restricted only to EC2 instance security group

DB Subnet Group included

Password must NOT be hardcoded (use a Parameter or Secrets Manager reference)

Security Groups

ALB Security Group: allow inbound HTTP/HTTPS from the Internet

EC2 Security Group: allow inbound web traffic only from the ALB

RDS Security Group: allow inbound DB traffic only from EC2 Security Group

S3 Bucket for application logs

Versioning enabled

Server-side encryption enabled

Block public access

ALB access logs + application logs stored here

IAM roles & policies

EC2 instance role and instance profile

Permissions for S3 log uploads, CloudWatch Logs, CloudWatch Metrics

Least privilege only

CloudWatch alarms

EC2 CPU utilization

ALB latency and 5xx errors

RDS CPU utilization / free storage / connections

All alarms must publish to an SNS topic

Mandatory Template Constraints
Cross-Account Executability

Must work in any AWS account

No environment-specific assumptions

Must rely on parameters, dynamic references, or intrinsic functions

Mandatory Parameter

Include this parameter exactly:

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Suffix for resource names to support parallel deployments (e.g., PR number)"
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"

Mandatory Naming Convention

Every resource Name property must follow this pattern:

!Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Private subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

ALB → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alb

RDS → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds

You must apply this naming convention consistently across all resources that support a Name tag or Name property.

Expected Output

Output only the full YAML CloudFormation template, no explanations.

The file must be ready for deployment using:

aws cloudformation deploy --template-file web-app-infrastructure.yaml --stack-name my-stack --capabilities CAPABILITY_NAMED_IAM


Ensure that:

The template is valid YAML

All required components (ALB, ASG, EC2, RDS, IAM, S3, CloudWatch) are included

Multi-AZ is implemented where required

Resource dependencies are properly defined