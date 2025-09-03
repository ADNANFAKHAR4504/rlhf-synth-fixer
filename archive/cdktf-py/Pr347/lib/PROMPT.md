Generate a Terraform configuration for AWS that is fully driven by variables and designed to be easily extended across multiple regions and environments. The initial target region should be us-east-1. The configuration must:

1. Create a VPC, with its CIDR block defined as a Terraform variable (e.g. var.vpc_cidr).
2. Define two public subnets in different availability zones, each with its own variable for CIDR blocks (e.g. var.public_subnet_cidrs), and place them in us-east-1.
3. Attach an Internet Gateway to the VPC and create a public route table that routes 0.0.0.0/0 to the IGW; associate this route table with both public subnets.
4. Define a Security Group (using var.allowed_ssh_cidr and var.allowed_http_cidr, defaulting to 0.0.0.0/0) that allows inbound SSH (TCP 22) and HTTP (TCP 80) from any IP, and apply it to EC2 instances.
5. Launch two EC2 instances in the two separate public subnets. The instance type (e.g. var.instance_type) and AMI ID (e.g. var.ami_id) must be variables. Reference the security group created above.
6. Tag every resource (VPC, subnets, IGW, route table, security group, EC2 instances) with a consistent naming convention and a Environment tag (e.g. var.environment), plus Project or Name tags for cost allocation.
7. Expose top-level variables in variables.tf for: aws_region, vpc_cidr, public_subnet_cidrs (list of two), instance_type, ami_id, allowed_ssh_cidr, allowed_http_cidr, environment, and project_name.
8. Output the VPC ID, public subnet IDs, and EC2 instance public IPs.

Ensure the code is formatted into proper Terraform modules or files (main.tf, variables.tf, outputs.tf), uses locals or maps where appropriate for naming, and includes comments explaining each section. 