I need you to generate a fully valid, production-ready AWS CloudFormation template in YAML, named secure-environment-setup.yaml, that satisfies all requirements listed below.
The template must be fully executable across different AWS accounts and regions without modification, meaning:

No hardcoded ARN, account ID, region, zone, bucket name, or IP

All configurable values must use Parameters, Mappings, or intrinsic functions

Must work in any account or region

Mandatory Parameter 
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Mandatory naming convention for ALL resources

Every resource must use this exact naming format:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Example resources using the naming convention:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

Launch Template → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template

Lambda → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda

Etc.

This naming rule is mandatory for every resource capable of having a name.

Required Architecture

You must build the following inside one CloudFormation template:

VPC with:

Public subnets (at least 1)

Private subnets (at least 1)

Internet Gateway

NAT Gateway for private subnet egress

Route tables for public & private subnets

EC2 instance inside an Auto Scaling Group

Use a Launch Template

IAM Instance Profile must include an IAM Role with an S3ReadAccess policy (least privilege)

RDS instance

Must use a KMS CMK (customer-managed key) created in this template

Deployed in private subnets only

Encrypted at rest

S3 bucket

Versioning must be enabled

IAM Role must have read-only access to this bucket only

No wildcard permissions (* is forbidden)

Security Group for EC2

Only inbound port 443 (HTTPS) is allowed

No other inbound ports permitted

CloudWatch Logs & CloudTrail

Must capture all API calls

Must log to a CloudWatch Log Group created in this template

IAM Requirements

No wildcard (*) permissions allowed anywhere

Must attach a policy named S3ReadAccess to the EC2 IAM role

Follow least-privilege principles

Additional Constraints

You must enforce all of the following:

All resources must use parameters, Refs, Sub, and Fn::GetAtt instead of hardcoding.

Template must pass cfn-lint with zero errors.

Ensure logical ordering of dependencies (e.g., dependsOn where required)

Conform to YAML best practices and CloudFormation schema

Output logical resource names and subnet IDs

Include unit-test-friendly Outputs

Expected Output

Provide the final answer as:

The complete secure-environment-setup.yaml CloudFormation template

No explanation — only the YAML

It must be fully valid and ready to deploy through CloudFormation

Must pass cfn-lint with no errors