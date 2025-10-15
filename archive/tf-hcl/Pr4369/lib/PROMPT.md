You are a senior Terraform and AWS Infrastructure Security Architect.
Generate a complete, production-grade Terraform configuration implementing the described secure AWS environment in a single Terraform file named main.tf.

The Terraform code must:

Pass both terraform validate and terraform fmt.

Follow AWS Well-Architected Framework and Terraform best practices.

Include inline comments explaining each section.

Use realistic and consistent naming conventions.

Contain no placeholders (use practical sample values).

Apply the Environment = "Production" tag to every resource.

Be deployable as-is for demonstration or production simulation.

Problem Definition:

Design a secure, compliant AWS infrastructure using Terraform, meeting the following detailed requirements (originally CloudFormation-based but implemented here in Terraform).

1. Identity & Access Management (IAM)

Create IAM users with minimal privileges (principle of least privilege).

Define IAM roles for EC2 and Lambda:

EC2 → S3 read-only permissions.

Lambda → CloudWatch log permissions only.

Use IAM instance profiles for EC2.

Include inline IAM policies with clear comments and logical structure.

Example names:

aws_iam_user.devops_user

aws_iam_role.ec2_access_role

aws_iam_role.lambda_exec_role

2. Tagging & Environment Structure

Tag all resources with:

tags = {
  Environment = "Production"
}


Design supports three environments (development, staging, production) but defaults to Production.

Ensure all resources use naming conventions like:

aws_vpc.main_vpc

aws_subnet.public_subnet_a

aws_subnet.private_subnet_b

aws_s3_bucket.logs_bucket

3. S3 Bucket Configuration

Create multiple S3 buckets:

One for general data storage.

One for CloudTrail logs.

Enable default encryption (SSE-KMS), versioning, and block all public access.

Add least-privilege bucket policies allowing only required AWS services (CloudTrail, RDS logs, etc.) to write.

4. VPC & Network Configuration

Create a VPC:

CIDR: 10.0.0.0/16

DNS support & hostnames enabled.

Create public and private subnets across two AZs (us-east-1a and us-east-1b):

Public: 10.0.1.0/24, 10.0.2.0/24

Private: 10.0.3.0/24, 10.0.4.0/24

Configure Internet Gateway, NAT Gateway, and Elastic IP.

Create and associate route tables:

Public routes → IGW.

Private routes → NAT GW.

Enable VPC Flow Logs to CloudWatch.

5. Security Groups

Public SG (ALB):

Inbound HTTPS (443) and HTTP (80) allowed from anywhere.

Private SG (EC2 & RDS):

Inbound SSH (22) allowed only from corporate IPs (e.g., 203.0.113.0/24).

RDS inbound access allowed only from EC2 SG.

Outbound allowed to all.

Use naming like aws_security_group.sg_alb_https and aws_security_group.sg_private_ec2.

6. Compute (EC2) Configuration

Launch EC2 instances only from approved AMIs using variable:

variable "approved_ami_id" {
  default = "ami-0abcdef1234567890"
}


Associate with:

Private subnet.

IAM role and instance profile.

Security group (sg_private_ec2).

Use instance type t3.micro.

Attach user data for baseline setup (e.g., system updates).

7. Application Load Balancer (ALB) with SSL

Deploy an Application Load Balancer in public subnets.

Integrate AWS Certificate Manager (ACM) SSL certificate (sample ARN).

Create target group and listener rules:

HTTPS (443) → target group.

HTTP (80) → redirect to HTTPS.

Tag all ALB components consistently.

8. Amazon RDS Configuration

Deploy an RDS instance (PostgreSQL or MySQL):

storage_encrypted = true

multi_az = true

Backups enabled (backup_retention_period = 7)

Place RDS in private subnets only.

Logs forwarded to CloudWatch.

Access controlled by dedicated SG allowing only EC2 SG.

9. Monitoring, Logging & Alerts

Enable AWS CloudTrail:

Store logs in dedicated S3 bucket (secure-cloudtrail-logs).

Encrypt logs with KMS.

Enable CloudWatch Logs, metrics, and alarms:

Monitor EC2 CPU utilization.

Detect unauthorized API calls.

Configure SNS Topic (security-alerts-topic) for alarm notifications.

10. Lambda Configuration

Create a simple Lambda function:

Runtime: python3.9

Handler: index.handler

Connected to VPC (private subnets).

IAM role → minimal CloudWatch logging.

Environment variables encrypted with KMS.

Constraints

Output Format

Claude must output only one Terraform file named main.tf.

Code must be formatted in fenced HCL block:

# main.tf


Each section clearly divided with comments (# IAM Configuration, # VPC Setup, etc.).

Technical Validation

Code must pass terraform fmt and terraform validate without modification.

Region: us-east-1

Security Compliance

Enforce encryption at rest and in transit for all data (S3, RDS, CloudTrail).

IAM policies must apply least privilege.

No public S3 buckets.

SSH limited strictly to 203.0.113.0/24.

Tagging

Every resource includes:

tags = {
  Environment = "Production"
}


Naming Conventions

Use snake_case for resource names and meaningful identifiers:

aws_vpc.secure_vpc

aws_subnet.public_subnet_a

aws_nat_gateway.main_nat_gw

aws_security_group.sg_private_ec2

aws_iam_role.ec2_instance_role

Deployment Integrity

Ensure dependencies (e.g., VPC → subnets → SG → EC2) resolve properly.

Avoid undefined references or missing dependencies.

Must be runnable with standard AWS credentials.

Expected Output

Generate a single file named main.tf containing the entire Terraform configuration implementing everything above.
A single self-contained Terraform file (main.tf) implementing everything above in valid HCL syntax.

Output only the Terraform code inside a fenced block:

# main.tf


Include inline comments explaining each section.

Code must be self-contained and deployable.