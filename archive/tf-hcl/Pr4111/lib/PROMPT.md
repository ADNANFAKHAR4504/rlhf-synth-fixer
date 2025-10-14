You are a senior Terraform Infrastructure Engineer.
Your task is to produce a single, complete, deployable Terraform configuration file named main.tf implementing the full AWS infrastructure described below.

Respond only with the complete contents of that single Terraform file, written in valid HCL syntax, and nothing else (no explanations, comments, or markdown formatting).

 Objective

Build a production-grade, multi-region AWS infrastructure across the regions us-east-1 and us-west-2.
The infrastructure must include all core AWS services required for a real-world application environment — compute, networking, load balancing, databases, storage, and security — with secure best practices and consistent tagging.

Infrastructure Design Requirements

 1. VPC and Networking

Create one VPC per region (us-east-1 and us-west-2), each with:

Two public subnets and two private subnets in distinct availability zones.

Proper CIDR block assignment to avoid overlap.

Internet Gateway attached to the VPC in us-east-1.

Route Tables and Route Table Associations for public and private subnets.

 2. Compute (EC2)

Launch EC2 instances in the private subnets of both regions.

Instance type: t3.micro

Use Amazon Linux 2 AMI (latest).

Associate EC2 instances with appropriate security groups.

Add a key pair for SSH access (placeholder key name acceptable).

 3. Database (RDS MySQL)

Deploy an Amazon RDS MySQL instance in the private subnet of each region.

DB instance class: db.t3.micro

Use AWS Systems Manager Parameter Store to store:

Database username

Database password (secure string)

Reference these parameters in the RDS configuration.

 4. Storage (S3)

Create one S3 bucket per region with:

Versioning enabled

Server-side encryption (AES-256)

Public access blocked

 5. Load Balancing

Deploy an Application Load Balancer (ALB) in each region.

ALB must:

Listen on port 443 (HTTPS)

Use a dummy self-signed certificate ARN placeholder (to be replaced by the user)

Target EC2 instances in private subnets

Use security groups allowing only inbound HTTPS (443) from anywhere

 6. Security Groups

Create and attach security groups that:

Allow inbound HTTPS (443) from 0.0.0.0/0

Allow outbound traffic to all destinations

Restrict SSH access (only internal/private, if needed)

 7. Tagging

Every resource (VPC, Subnets, Gateways, EC2, RDS, S3, ALB, etc.) must include the tag:

Environment = "Production"

 Deployment Constraints

Must deploy resources to two regions: us-east-1 and us-west-2.

All resources must be defined within a single Terraform configuration file (main.tf).

Do not use external modules, locals, variable files, or remote backends.

Use inline values and references only.

Code must be directly deployable using:

terraform init  
terraform apply  

Include all required providers, region-specific configurations, and resource dependencies.

 Expected Output

A single self-contained Terraform file (main.tf) implementing everything above in valid HCL syntax.

The file should define all providers, networks, compute, storage, databases, load balancers, and IAM/security configurations.

No explanations, comments, or markdown formatting — only the Terraform code.
