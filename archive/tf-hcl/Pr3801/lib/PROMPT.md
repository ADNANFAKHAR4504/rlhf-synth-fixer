You are an expert Terraform Infrastructure Engineer specializing in AWS architecture and security best practices. You write production-grade, error-free, optimized Terraform configurations that fully comply with AWS Well-Architected Framework principles.

Goal:
Generate a single, self-contained Terraform file (main.tf) that builds the complete AWS environment described below — no modules, no external files, no references to other templates.

The code must be ready to run with terraform init and terraform apply, and should deploy successfully without errors.

Infrastructure Overview:
You are tasked with setting up a multi-tier AWS web application environment using Terraform (not CloudFormation) in the us-west-2 region, ensuring high availability, security, and scalability.

Detailed Requirements:

1. Networking (VPC)

Create a new VPC with CIDR 10.0.0.0/16.

Include 2 public and 2 private subnets across at least two AZs in us-west-2.

Attach an Internet Gateway to the public subnets.

Create NAT Gateways for private subnets to access the internet.

Configure appropriate route tables for public and private subnets.

2. S3 for Logs

Create an S3 bucket to store logs.

Enable server-side encryption with KMS.

Add a lifecycle policy to transition objects to GLACIER after 30 days.

Block all public access.

Enable versioning and default encryption.

3. RDS

Deploy an RDS (PostgreSQL or MySQL) instance in Multi-AZ configuration.

Place it in the private subnets.

Encrypt storage with KMS.

Use least privilege IAM roles, no hardcoded credentials.

Allow inbound only from EC2’s security group.

4. Compute (EC2 + Auto Scaling)

Use the latest Amazon Linux 2 AMI via data "aws_ami".

Create a Launch Template and an Auto Scaling Group maintaining at least 2 instances.

All EBS volumes encrypted using KMS.

Configure user_data to:

Install CloudWatch agent.

Push CPU and memory metrics to CloudWatch.

Use IAM Instance Profile (no keys) granting:

CloudWatch:PutMetricData

S3:GetObject (for logs bucket)

ssm:* (for Session Manager access)

5. Load Balancer

Deploy an Application Load Balancer (ALB).

Attach to public subnets.

Forward HTTP/HTTPS traffic to the Auto Scaling group target group.

Security group must allow inbound from 0.0.0.0/0 (for web) and forward traffic only to EC2 SG.

6. CloudFront

Create a CloudFront distribution using the S3 logs bucket as origin.

Set default TTL = 24 hours (86400 seconds).

Use Origin Access Control (OAC) or OAI to keep the bucket private.

Enable access logging to the same S3 logs bucket.

7. Monitoring (CloudWatch)

Set up CloudWatch alarms:

CPUUtilization > 75% for 5 minutes.

MemoryUsage > 75% for 5 minutes.

Create an SNS topic for alarm notifications (email variable allowed).

Ensure CloudWatch agent sends custom memory metrics.

8. Security & Encryption

Use KMS keys for S3, RDS, and EBS encryption.

No hardcoded credentials; only IAM roles and instance profiles.

Apply least privilege policies.

All security groups must follow principle of least privilege.

9. Tagging

All resources must have:

tags = {
  Environment = "Production"
}

10. Outputs

Provide Terraform output values for:

ALB DNS name

CloudFront domain name

RDS endpoint

S3 bucket name

KMS Key ARNs

Implementation Notes:

Use data "aws_availability_zones" "available" for AZ selection.

Use random_id to generate unique resource names.

Use aws_iam_role, aws_iam_instance_profile, and aws_iam_policy.

Store DB password using random_password + aws_secretsmanager_secret.

Keep inline comments minimal but clear.

Everything must exist in one single file: main.tf.