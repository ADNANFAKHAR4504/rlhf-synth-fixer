Design and implement a production-grade AWS CloudFormation YAML template that deploys a highly available, secure, and scalable multi-tier infrastructure in AWS us-west-2 region. The solution must be cross-account executable, parameterized (no hardcoding), and fully automated — no manual steps post-deployment.

Architecture Requirements:

VPC & Networking:

Create a new VPC with a configurable CIDR (default 10.0.0.0/16).

Two public subnets and two private subnets, distributed across different Availability Zones.

Each subnet should be parameterized for flexibility.

Attach an Internet Gateway for public access.

Provision NAT Gateways (with Elastic IPs) in public subnets for private subnet outbound Internet access.

Load Balancing (NLB):

Deploy a Network Load Balancer (NLB) in front of EC2 instances in public subnets.

Configure NLB to distribute inbound traffic (HTTP/HTTPS) evenly across multiple EC2 instances in different AZs.

Ensure the NLB automatically manages Elastic IPs (no manual allocation required).

EC2 instances should register with the NLB target group automatically using Auto Scaling.

Compute (EC2 + Auto Scaling):

Use Amazon Linux 2 AMI (resolved dynamically via SSM Parameter Store).

Create a new EC2 Key Pair programmatically within CloudFormation (no dependency on existing key pairs).

Deploy EC2 instances in both public subnets under an Auto Scaling Group for high availability.

Security Group: Allow inbound HTTP (80) and HTTPS (443) traffic only via the NLB.

Database (RDS):

Create an RDS instance (MySQL/PostgreSQL) with Multi-AZ enabled.

Deployed within private subnets.

No public access.

Security Group restricts access to EC2 instances only.

Storage (S3):

Create an S3 bucket with server-side encryption (SSE-S3 or SSE-KMS) enabled.

Enforce bucket policies for private access only.

Monitoring & Logging:

Enable VPC Flow Logs to an S3 bucket or CloudWatch Logs.

Apply comprehensive tagging (Project, Environment, Owner, etc.) to all resources.

Cross-Account Executability:

Avoid any hardcoded AWS Account IDs, ARNs, or Region names.

Use parameters, pseudo parameters (AWS::AccountId, AWS::Region, AWS::Partition), and dynamic references (SSM, Secrets Manager) wherever applicable.

Output Expectations:

A complete CloudFormation YAML template that can be deployed directly via the AWS Console or CLI.

No manual steps or modifications required.

The template must create:

VPC, Subnets, IGW, NAT, NLB

EC2 Auto Scaling Group with Launch Template

RDS (Multi-AZ)

S3 Bucket with SSE

VPC Flow Logs

All parameters should be clearly defined (CIDR ranges, key pair name, instance types, DB credentials, etc.).

Important Constraints:

Use SSM Parameter /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 for EC2 AMI.

No hardcoded region names, account IDs, or subnet AZs.

The template must pass cfn-lint and aws cloudformation validate-template checks without errors.

Deliverable: Provide the full CloudFormation YAML template that automatically provisions all the above components end-to-end, including dynamic parameter usage, NLB-based traffic routing, and complete tagging.