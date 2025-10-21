You are required to design a secure and scalable AWS Virtual Private Cloud (VPC) infrastructure  this implementation must be done entirely in Terraform, using a single file (main.tf). The setup must follow Infrastructure-as-Code best practices, enabling reusability and modularity where possible, while fulfilling all listed specifications.

Core Implementation Requirements

VPC Configuration

Create a VPC with CIDR block 10.0.0.0/16 in region us-west-2.

Enable DNS hostnames and DNS support for better service discovery.

Subnets

Create three public subnets and three private subnets.

Distribute them across three Availability Zones (e.g., us-west-2a, us-west-2b, us-west-2c).

Tag subnets appropriately (PublicSubnet1, PrivateSubnet1, etc.).

Internet Gateway and NAT Gateways

Create and attach an Internet Gateway to the VPC.

Provision NAT Gateways (one per public subnet) with corresponding Elastic IPs.

Ensure each private subnet routes outbound internet traffic via its respective NAT Gateway.

Routing

Create route tables:

One for public subnets, routing to the Internet Gateway.

Separate ones for private subnets, routing to NAT Gateways.

Associate subnets with the appropriate route tables.

S3 Bucket

Create an S3 bucket with:

Versioning enabled.

All public access blocked.

Server-side encryption enabled using AES256.

Bucket policy restricting access only from the VPC or IAM role.

IAM Role & Policy

Define an IAM Role and Policy allowing EC2 instances in private subnets to:

Read/write objects in the S3 bucket.

Assume necessary permissions for S3 access.

Attach this IAM role to an IAM Instance Profile.

EC2 Instances

Launch t2.micro EC2 instances (one in each private subnet).

Attach IAM Instance Profile for S3 access.

Create a Security Group:

Allow SSH access only from a specified IP address (parameterized).

Allow internal traffic within the VPC as needed.

Use Amazon Linux 2 AMI (latest) from the region.

Parameters (Terraform variables)

Parameterize:

region

vpc_cidr

public_subnet_cidrs

private_subnet_cidrs

allowed_ssh_ip

instance_type

bucket_name

Use descriptive variable names and defaults for reusability.

Outputs

Output the following:

vpc_id

public_subnet_ids

private_subnet_ids

nat_gateway_ids

ec2_instance_ids

s3_bucket_name

Constraints

All resources must be deployed within the us-west-2 region.

Must use the CIDR 10.0.0.0/16 for the VPC.

Exactly 3 public and 3 private subnets across 3 Availability Zones.

NAT Gateways must be provisioned in public subnets only.

Private subnets must not have direct Internet Gateway routes.

S3 bucket must block all public access and enable versioning.

EC2 instances must use IAM roles to access the S3 bucket, not access keys.

Use Terraform AWS Provider (≥ 5.0.0).

All code must be in a single Terraform file (main.tf).

The file must be self-contained — no external modules or files.

Expected Output

you should generate a single Terraform file named main.tf, implementing:

Complete resource definitions (VPC, subnets, NATs, route tables, EC2, S3, IAM, etc.).

Proper variable definitions and outputs within the same file.

Correct Terraform syntax .

Readable structure with descriptive comments for each major block.

Fully deployable code — running terraform init && terraform apply should create all infrastructure successfully.

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.