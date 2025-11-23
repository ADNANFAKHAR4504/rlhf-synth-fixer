Hey team,

We need to build out a secure AWS infrastructure for our web application using Terraform. Everything needs to go in a single file called tap_stack.tf and follow modern security best practices while keeping things auditable and scalable.

We're deploying to us-west-1 and there's already a VPC (vpc-123456) set up that spans two Availability Zones. Make sure all resources are properly tagged, encrypted, and monitored.

Here's what we need to implement:

VPC & Networking

We have an existing VPC (vpc-123456) that you'll work with. Create public and private subnets across two availability zones - us-west-1a and us-west-1b. Set up proper routing so public subnets go through an Internet Gateway and private ones use a NAT Gateway.

Application Load Balancer

Deploy an ALB in the public subnets. Set it up to automatically redirect HTTP traffic to HTTPS. The security group should only allow inbound traffic from specific IP ranges.

IAM Roles and Policies

Create IAM roles following the principle of least privilege for EC2, RDS, and other components. No overly broad policies like "Action": "*" - keep permissions specific and minimal.

Security Groups

Allow inbound HTTP/HTTPS access from only the specified IP ranges.

Restrict all other inbound traffic.

Security groups should allow appropriate outbound access for the instances.

AWS Config & CloudWatch

Turn on AWS Config so we can track all configuration changes. Set up CloudWatch alarms that trigger whenever someone modifies security groups or IAM policies.

S3 Buckets

We need S3 buckets for logs and backups. Enable server-side encryption using either SSE-S3 or SSE-KMS. Lock down bucket policies so only resources in our VPC can access them. Make sure versioning and logging are turned on for audit purposes.

RDS Instance

Deploy the RDS database (MySQL or PostgreSQL) in the private subnets only. It absolutely cannot be publicly accessible - set publicly_accessible to false. Enable encryption both at rest and in transit.

Tagging

Tag everything consistently. Use these tags on all resources:
- Environment = "prod"
- Owner = "DevOps-Team"
- ManagedBy = "Terraform"

You can use locals or variables to keep this consistent across everything.

Terraform Best Practices

Make good use of Terraform functions like for_each, locals, count, and maps to keep things DRY and reusable. Use variable mappings for different environment configurations.

Important Constraints:

Region must be us-west-1

All S3 buckets must use server-side encryption.

Only allow inbound access to ALB from the specified IP CIDR (e.g., "203.0.113.0/24").

IAM roles must follow least privilege principle.

RDS must not be publicly accessible.

Enable AWS Config to monitor infrastructure changes.

CloudWatch alarms need to alert whenever security groups get changed.

Follow this naming pattern for resources:
prod-<resource-type>-<unique-id>

Every single resource needs Environment and Owner tags.

What We're Looking For:

Create a single Terraform file called tap_stack.tf that implements everything described above. The code should be ready to deploy without any syntax or dependency errors. Make sure to include variable definitions and outputs where needed. All the security, tagging, and monitoring requirements need to be fully implemented.

Final Notes:

Produce one complete Terraform file with all the infrastructure code. Format it as valid HCL. Add comments explaining the key security decisions and best practices. Don't break it into sections or summarize - we need the full working code in one file.