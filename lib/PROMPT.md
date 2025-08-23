Task Description:
Using Terraform, design and deploy a highly available and secure AWS environment that meets the following specifications:

Requirements:

Virtual Private Cloud (VPC)

Create a VPC that spans at least two availability zones (AZs).

Implement one public subnet and one private subnet in each AZ.

Networking and Load Balancing

Deploy an Application Load Balancer (ALB) in the public subnets to distribute incoming traffic.

Ensure security groups allow only necessary inbound and outbound traffic.

Compute

Create an Auto Scaling Group (ASG) for EC2 instances in the private subnets.

Configure the ASG to maintain a minimum of two instances at all times.

Attach IAM roles to EC2 instances for secure access to necessary S3 buckets.

Database

Deploy a managed RDS instance in a private subnet.

Ensure it is isolated from external traffic and fully managed by AWS.

Security & Encryption

Encrypt all data at rest for both EC2 volumes and RDS using AWS KMS customer-managed keys (CMK).

Ensure security configurations follow best practices and only necessary ports are exposed to the internet.

Output Requirements:

Define the Terraform configuration using HCL.

The environment must be deployable using a single terraform apply command.

Adhere strictly to AWS best practices for high availability, security, and scalability.

Constraints:

Cloud Provider: AWS

Multi-AZ: Yes, at least two AZs

Subnets: Public + Private per AZ

ALB: Public subnets only

ASG: Private subnets, minimum 2 EC2 instances

IAM: Roles attached to EC2 for S3 access

RDS: Private subnet only

Encryption: AWS KMS CMK

Security: Restrict inbound/outbound access to only what is necessary

Deliverables:

Fully functional Terraform configuration files (.tf) for the entire environment.

Documentation or comments in HCL explaining each resource and its purpose.

The solution must be idempotent, regionally redundant, and production-ready.
Use random generated Names and variables . 
Create main.tf with all infrastructure in single file.