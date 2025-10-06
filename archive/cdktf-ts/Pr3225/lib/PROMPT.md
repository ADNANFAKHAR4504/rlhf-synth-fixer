Write production-ready code in CDKTF TypeScript to design a secure and scalable AWS environment for a web application.
Requirements:
Use us-east-1 as the region.
Split the code into two files only:
lib/modules.ts → Define all reusable infrastructure modules/resources.
lib/tap-stack.ts → Root stack where all modules are called.
Infrastructure specifications:
VPC with 2 public and 2 private subnets across multiple AZs.
Internet Gateway + 1 NAT Gateway.
Route tables correctly attached to subnets.
S3 bucket with server-side encryption for log storage.
EC2 instance in a private subnet with restricted SSH access.
Elastic Load Balancer (ALB) in public subnets routing to EC2.
IAM role & policies for EC2 → access S3 logs.
CloudWatch monitoring for EC2 and ELB.
Automated EBS snapshots for EC2 volumes.
RDS instance in private subnets (not publicly accessible).
Rolling AMI update mechanism (ASG/Launch template) for zero downtime.
Tagging: Every resource must have Name and Environment tags in the format <project>-<env>-<resource>.
Code must follow AWS best practices and be well-documented.

Expected Output:
A CDKTF project with only two TypeScript files:
modules.ts → contains VPC, subnets, IGW, NAT, route tables, EC2, ALB, IAM, S3, RDS, CloudWatch, EBS snapshot setup, AMI update logic.
tap-stack.ts → imports and instantiates all modules.