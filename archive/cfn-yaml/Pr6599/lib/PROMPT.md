I need you to generate a complete AWS CloudFormation template in YAML that fully satisfies the following requirements.

Task Requirements

Create a CloudFormation template that builds a basic web application environment with the following components:

Amazon S3 bucket

Must be configured for static website hosting

Will store and serve website content

Amazon EC2 instance

AMI must be passed as a parameter (no hardcoding)

Must have an IAM role that allows EC2 → S3/EC2 API access

Must have an Elastic IP associated

Security Group

Allow inbound HTTP (80) and SSH (22)

RDS PostgreSQL database

DB instance type must be a parameter

VPC Flow Logs

Must capture ALL traffic

Logs delivered to CloudWatch Logs (log group created in this template)

CloudFront distribution

Must use the S3 bucket as its origin

No S3 content is required during deployment

Tagging
Every resource must include the following tags:

Environment

Owner

Project

Region Requirement

All resources must support deployment in us-east-1, but do not hardcode region inside resources.

Use intrinsic functions instead.

Template must pass CloudFormation validation.

Cross-Account & No-Hardcoding Requirements

The template must:

Be fully executable across different AWS accounts without modification

No hardcoded ARNs, account IDs, or region names

Every value that could vary between accounts must be a parameter

Only the required identifiers (like AMI ID, DB instance class, CIDR blocks, key pair, etc.) should be provided via parameters

Mandatory Parameter Requirement

The template must include this parameter:

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support parallel deployments (e.g., PR number)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Mandatory Naming Convention

Every resource that supports the Name tag or a resource-level name property must use this format:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

Security Group → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-sg

EC2 → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2

CloudFront → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudfront

Follow this convention for every resource that supports naming.

Expected Output

Produce a single, complete, production-ready CloudFormation YAML file that:

Creates all resources
Uses parameters for anything account-specific
Has no hardcoded ARNs or account IDs
Follows the naming convention
Includes required tags
Validates successfully in CloudFormation
Works even with an empty S3 bucket
Deploys S3, EC2, IAM Role, Security Group, RDS, VPC Flow Logs, Elastic IP, CloudFront

Important Notes

The CloudFormation must NOT attempt to upload files to S3.

The CloudFront distribution must reference the S3 website endpoint.

All IAM policies should use "*" only where appropriate, otherwise least-privilege.

Use Intrinsic functions (e.g., !Sub, !Ref, !GetAtt) to avoid hardcoding.