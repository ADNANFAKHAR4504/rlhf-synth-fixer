ou are a Principal Cloud Security Architect. Your mission is to design a secure, scalable, and compliant AWS environment using a single, comprehensive AWS CloudFormation template in YAML. This template will serve as a foundational "gold standard" for new projects.

Core Task:

Develop a CloudFormation template named TapStack.yaml. The template must be designed for the us-west-2 region and adhere to the strict naming convention: <resource_type>-<project_name>-<environment>. Use CloudFormation Parameters for ProjectName and Environment to dynamically construct resource names.

1. Compliance and Auditing Foundation
AWS Config:

Provision an AWS::Config::ConfigurationRecorder to record all resource changes.

Implement at least one AWS::Config::ConfigRule using an AWS-managed rule to enforce a security policy (e.g., use s3-bucket-public-read-prohibited or rds-instance-public-access-check).

AWS CloudTrail:

Create an AWS::CloudTrail::Trail to capture all management events in the account.

The trail must log to a new, secure S3 bucket that is encrypted at rest. Ensure the trail itself has log file validation enabled.

2. Network Foundation
VPC: Provision an AWS::EC2::VPC with both public and private subnets across two Availability Zones.

Internet Access:

Create an AWS::EC2::InternetGateway and a public route table to provide internet access for the public subnets.

Create an AWS::EC2::NatGateway (with an associated EIP) in a public subnet.

Create a private route table that routes outbound internet traffic (0.0.0.0/0) from the private subnets through the NAT Gateway.

3. Secure Data Tier
S3 Bucket:

Provision an AWS::S3::Bucket for application data.

Encryption: It must have default server-side encryption enabled.

Access Control: It must be configured with Block Public Access settings enabled by default.

RDS Database:

Provision an AWS::RDS::DBInstance.

High Availability: It must be a Multi-AZ deployment (MultiAZ: true).

Security: It must be private (PubliclyAccessible: false) and deployed into a DBSubnetGroup that spans the private subnets.

4. Application and Delivery Tier
Lambda Function:

Create a simple "hello world" AWS::Lambda::Function (e.g., using Python or Node.js). Place this function in the private subnets.

CloudFront and WAF:

Provision an AWS::CloudFront::Distribution.

Create an AWS::WAFv2::WebACL and associate it with the CloudFront distribution. The WebACL must include the AWS Managed Rule Set AWSManagedRulesCommonRuleSet to protect against common web exploits.

5. Identity and Access Management (IAM)
Least Privilege for Lambda:

Create a dedicated AWS::IAM::Role for the Lambda function.

The attached policy must adhere to the principle of least privilege, granting only the permissions necessary for the function to run and write to CloudWatch Logs (e.g., logs:CreateLogStream and logs:PutLogEvents). Do not use wildcards (*) for actions.

Expected Output:

A single, valid secure_infrastructure_setup.yaml file. The template must be well-structured and parameterized, passing all CloudFormation validation checks and successfully deploying a secure, compliant, and interconnected infrastructure.