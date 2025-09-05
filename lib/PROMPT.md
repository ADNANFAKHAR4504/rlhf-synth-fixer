SYSTEM: You are a professional AWS CloudFormation author and security engineer. Produce only a single file: a **valid AWS CloudFormation template in JSON**. The template must be ready to deploy in us-east-1 (region note in Description). Strictly adhere to the Requirements and Constraints sections below. Do not include explanation text, only the JSON template.

GOAL:
Create a secure, auditable CloudFormation JSON template that:

- Provides a VPC with both public and private subnets across multiple AZs.
- Provides NAT Gateway(s) so private-subnet EC2 can access the internet.
- Creates a security group that allows SSH (port 22) **only** from the supplied IP CIDR ranges (parameter AllowedSSHRanges).
- Deploys an EC2 instance in a private subnet with an IAM role using least privilege.
- Creates an S3 bucket that denies all public access, enforces encryption at rest with AWS KMS, and enforces HTTPS only (encryption in transit).
- Configures S3 access logging to deliver logs to a CloudWatch Log Group.
- Creates a KMS Customer Managed Key (CMK) with automatic rotation enabled and an appropriate least-privilege key policy permitting usage by S3 and relevant roles.
- Includes CloudWatch Alarms for critical security events (e.g., S3 public ACL change, unauthorized API calls, excessive failed SSH attempts).
- Tags all created resources with required tags for cost tracking.

INPUT PARAMETERS:
- Environment (String) - e.g., dev|staging|prod
- Owner (String)
- Project (String)
- AllowedSSHRanges (CommaDelimitedList) - CIDR(s) allowed for SSH
- KeyName (AWS::EC2::KeyPair::KeyName)
- InstanceType (String, Default t3.micro)
- AMIId (AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>)
- VPCCidr (String, default "10.0.0.0/16")

REQUIREMENTS & CONSTRAINTS:
- Template must be pure JSON and valid for AWS CloudFormation (no YAML).
- Use at least 2 Availability Zones; create at least 2 private and 2 public subnets.
- At least one NAT Gateway in a public subnet.
- Security groups must not allow 0.0.0.0/0 SSH.
- S3 bucket: BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets set.
- Add BucketPolicy to deny non-TLS requests and public principals.
- KMS Key: EnableKeyRotation true. Key policy must allow S3, CloudFormation role, and EC2 IAM role to use the key.
- EC2 IAM Role policy must be least privilege (CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents; scoped S3 actions if required).
- All resources must include Tags: Environment, Owner, Project.
- Outputs must include VpcId, PublicSubnetIds, PrivateSubnetIds, S3BucketName, KmsKeyId, InstanceId, IAMRoleName.

VALIDATION & ACCEPTANCE CRITERIA:
- CloudFormation validate-template must succeed.
- cfn-lint should not show critical issues.
- S3 bucket must block public access and have KMS encryption.
- Security groups must reference AllowedSSHRanges parameter for SSH.
- IAM role must avoid wildcard (*) on Resources.
- Alarms must have reasonable thresholds.

OUTPUT FORMAT:
- Return only the JSON CloudFormation template (full template with AWSTemplateFormatVersion, Description, Parameters, Resources, Outputs).
- Do not return explanations, markdown, or commentary.