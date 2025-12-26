Functional scope - build everything new:
Design and generate a single AWS CloudFormation template file named `TapStack.yml` in YAML, not JSON. The template must fully define a brand-new, production-grade, multi-AZ infrastructure stack and must not reference or depend on any pre-existing VPCs, subnets, security groups, IAM roles, S3 buckets, or logging resources.

The stack must include:
- One VPC in `us-west-2` with DNS hostnames and DNS support enabled.
- Six subnets total:
 - 3 public subnets across AZs `us-west-2a`, `us-west-2b`, and `us-west-2c`.
 - 3 private subnets across the same AZs.
 - Subnet naming pattern:
 - `myapp-subnet-public-az-a-<EnvironmentSuffix>`
 - `myapp-subnet-public-az-b-<EnvironmentSuffix>`
 - `myapp-subnet-public-az-c-<EnvironmentSuffix>`
 - `myapp-subnet-private-az-a-<EnvironmentSuffix>`
 - `myapp-subnet-private-az-b-<EnvironmentSuffix>`
 - `myapp-subnet-private-az-c-<EnvironmentSuffix>`
- One Internet Gateway attached to the VPC.
- One NAT Gateway per AZ for private subnets in each public subnet, with proper Elastic IPs.
- Route tables:
 - Each subnet public and private must have its own route table.
 - Public route tables route `0.0.0.0/0` to the Internet Gateway.
 - Private route tables route `0.0.0.0/0` to the NAT Gateway in the same AZ.
- An Application Load Balancer ALB in the public subnets, with:
 - A dedicated security group allowing HTTP 80 and HTTPS 443 from `0.0.0.0/0`.
 - At least one target group for EC2 instances.
 - A listener on port 80 .
- An Auto Scaling group ASG of EC2 instances in the public subnets:
 - Launch template or launch configuration with a secure, minimal Linux AMI reference for example Amazon Linux 2 parameterized by SSM.
 - ASG spanning the three public subnets.
 - Desired capacity = 2, MinSize = 2, MaxSize = 5.
 - EC2 security group that only allows inbound traffic from the ALB security group, plus SSH restricted to a small CIDR placeholder for example `203.0.113.0/24` instead of `0.0.0.0/0`.
- An RDS instance in the private subnets:
 - Use a DB subnet group referencing the three private subnets.
 - Enable Multi-AZ for high availability.
 - Place RDS in private subnets only.
 - RDS security group only allows inbound traffic from the EC2 security group with no public access.
- An S3 bucket used for application storage with:
 - Server-side encryption enabled using SSE-S3 or SSE-KMS.
 - Bucket policy and configuration for cross-region replication to a destination bucket in another region . Assume fictional account ID `123456789012`.
- IAM roles and instance profiles:
 - EC2 role and instance profile granting least-privilege access to:
 - Read/write to the primary S3 bucket.
 - Access RDS via appropriate policies if needed .
 - Any additional IAM roles needed for S3 replication, CloudWatch logging, and load balancer access logs, following least-privilege principles.
- CloudWatch monitoring:
 - CloudWatch alarms on EC2 Auto Scaling group based on average CPU utilization for example scale out when CPU > 70%, scale in when CPU < 30% for a defined period.
 - Scaling policies wired to those alarms.
 - Basic logging configuration for ALB, EC2 , and RDS where appropriate for example enabling enhanced monitoring/CloudWatch logs where it makes sense, even if partially parameterized.

Environment, naming, and parameter constraints:
- The template must define a top-level `EnvironmentSuffix` parameter .
- Do not use hard `AllowedValues` like `prod-us`, `production`, `qa` for `EnvironmentSuffix`.
- Instead, enforce a safe naming regex using AllowedPattern and include example environment names in the parameter Description only.
- All user-facing resource names must include `EnvironmentSuffix` to avoid conflicts between multiple deployments. For example:
 - `Name` tag for VPC could be `myapp-vpc-!Ref EnvironmentSuffix`.
 - S3 bucket name must concatenate a base name plus `EnvironmentSuffix`.
- Region is fixed to `us-west-2` in the template for all regional resources .

Security and tagging requirements:
- Use security groups rather than network ACLs for primary access control, and configure them with least privilege.
 - Public-facing access: ALB security group allows inbound 80/443 from the internet.
 - EC2 instances: allow inbound only from ALB security group .
 - RDS: allow inbound only from EC2 security group and no public access.
- No security group should open database ports for example 5432/3306 to `0.0.0.0/0`.
- Every resource that supports tagging must be tagged with at least:
 - `Project: CloudFormationChallenge`
 - `Environment: !Ref EnvironmentSuffix`
- Use IAM policies that are as narrow as possible. Avoid overly broad permissions and follow least privilege principles.

Template structure and best practices:
- The template must be written in valid YAML syntax and must pass `cfn-lint` expectations for basic structural correctness.
- The file should be structured with the standard CloudFormation sections:
 - `AWSTemplateFormatVersion`
 - `Description`
 - `Metadata`
 - `Parameters`
 - `Mappings`
 - `Conditions`
 - `Resources`
 - `Outputs`
- Do not generate JSON; only YAML is acceptable.
- Do not reference any existing resource identifiers; the stack must be fully self-contained and usable to create a brand-new environment in a new AWS account.
- Use comments sparingly to clarify non-obvious design choices for example why a particular IAM permission is required.

Deliverable:
- Output only the final `TapStack.yml` CloudFormation template as a single YAML document, with no extra explanation, commentary, or markdown code fences.
- Ensure that all parameters, resource properties, security groups, route tables, IAM roles, Auto Scaling policies, ALB configuration, RDS configuration, S3 replication configuration, and CloudWatch alarms are fully defined and wired together so that the stack is deployable as-is in `us-west-2` for account `123456789012`.