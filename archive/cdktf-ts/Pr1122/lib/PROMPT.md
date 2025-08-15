You are an expert DevOps engineer specializing in Infrastructure as Code (IaC) with the CDK for Terraform (CDKTF).

Objective: Generate a complete and production-ready CDKTF project written in TypeScript. This project will define a secure and modular AWS infrastructure based on the requirements below. The code must be organized into two specific files: one for reusable modules and one for the main stack composition.

Core Infrastructure Requirements:

AWS Provider: All resources must be configured for the us-east-1 region.

VPC:

Create a custom VPC with the CIDR block 10.0.0.0/16.

Include at least one public subnet and one private subnet.

EC2 Instance:

Deploy a t3.micro EC2 instance within the private subnet of the VPC.

Use the latest Amazon Linux 2 AMI.

S3 Bucket:

Create a private S3 bucket.

Server-Side Encryption must be enabled using AWS-managed keys (SSE-S3).

All forms of public access must be explicitly blocked.

Security:

IAM Role for EC2: Create an IAM role for the EC2 instance that adheres to the principle of least privilege. For this exercise, the role only needs permissions to be managed by AWS Systems Manager (SSM).

Security Groups:

Create a security group for the EC2 instance.

It should have no inbound rules by default (to ensure it's not accessible from the internet).

It must have an explicit outbound rule allowing all traffic (0.0.0.0/0) to the internet (necessary for updates and patches).

Code Structure and Organization:

You must structure the entire codebase into exactly two files as described here:

lib/modules.ts

This file must contain all the reusable infrastructure components, defined as separate TypeScript classes (Constructs).

Create modular classes for:

VpcModule

S3BucketModule

Ec2InstanceModule (this should include the IAM role and security group logic)

Each module should accept configuration properties (props) for customization.

lib/tap-stack.ts

This file will contain the main stack definition (TapStack).

It must import the constructs from lib/modules.ts.

It will instantiate the imported modules to compose the final infrastructure, wiring them together as needed (e.g., placing the EC2 instance inside the VPC's private subnet).

Final Output:

Provide the complete, runnable TypeScript code in two separate code blocks, clearly labeled with their respective file paths: lib/modules.ts and lib/tap-stack.ts. Ensure the code is well-commented to explain the purpose of each resource and configuration choice.