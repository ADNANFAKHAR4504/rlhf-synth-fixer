You are tasked with creating a Terraform file (.tf) that provisions AWS infrastructure across three environments: Dev, Staging, and Production. Each environment must be fully isolated but identical in functionality, ensuring strict consistency and scalability.

Requirements

Networking & Compute:

Each environment must include a VPC, subnets, routing, and a primary EC2 instance.

Use the same AMI for EC2 across environments, with the AMI ID passed as a parameter.

Attach an Elastic Load Balancer in front of the EC2 instance.

Database Layer:

Deploy RDS instances with encryption, Multi-AZ setup, and consistent automated backup configurations.

IAM roles must restrict EC2 access to RDS by environment only.

Lambda functions should automate regular RDS snapshots.

Security & Compliance:

Define Security Groups identically across environments: SSH access from a specified IP range and HTTP open to the world.

Enable CloudTrail with logs sent to a designated S3 bucket.

Configure CloudWatch Alarms for EC2 CPU usage > 75%.

Storage & Parameters:

Each environment should have a separate S3 bucket with a uniform naming convention prefixed by environment name.

Store AMI IDs and DB credentials in Parameter Store for secure management.

Operational & Cost Best Practices:

Apply Reserved Instances for both EC2 and RDS consistently across environments.

Tag all resources following company tagging policies for cost allocation.

Ensure no direct peering or resource sharing across environments.

Constraints

Regions: Dev and Staging in us-east-1, Production in us-west-2.

Three distinct environments (Dev, Staging, Production) must be defined.

Consistent VPC, EC2, RDS, and Security Group configurations across all environments.

Expected Output

A complete Terraform .tf file that, once deployed, creates all required AWS resources in Dev, Staging, and Production without manual steps. all the files should be in tap_stack.tf and provider.tf

Verified consistency across environments with successful deployment tests.