Hey team,

We need to build out a secure, highly available cloud environment for hosting our new web application. Originally the requirements came through as CloudFormation YAML, but we're going with Terraform instead and keeping everything in a single file to make it easier to manage.

The infrastructure needs to be solid - high availability, fault tolerant, and secure. We're deploying to us-west-2 and spanning two Availability Zones to make sure we don't have any single points of failure.

Here's what we need you to set up using Terraform in one file:

VPC Setup

Start with a VPC that spans both AZs. We need four subnets total - two public ones for the EC2 instances and load balancers, and two private ones for the RDS database and any backend components. Don't forget the Internet Gateway for the public subnets, and make sure the route tables are configured correctly.

Compute Layer

Launch EC2 instances in the public subnets. They need to accept HTTP traffic on port 80 and SSH on port 22 through their security groups. Also attach an IAM role that gives them read access to our S3 bucket.

Networking

This is important - create a NAT Gateway in each public subnet. This way instances in the private subnets can access the internet when they need to, but they stay protected.

Database

Deploy an RDS instance using either MySQL or PostgreSQL in the private subnets. Enable Multi-AZ deployment so we have automatic failover. Make absolutely sure RDS is not publicly accessible - it should only accept connections from the EC2 security group.

Monitoring

Set up CloudWatch monitoring for both EC2 and RDS. We need alarms for instance health checks and CPU utilization so we can catch issues before they become problems.

Storage

Create an S3 bucket for storing our templates and logs. Keep it private - no public access whatsoever.

IAM and Security

Set up an IAM role for the EC2 instances with S3 read permissions. For security groups, the EC2 group should allow HTTP and SSH from anywhere, but the RDS security group should only allow access from the EC2 security group.

A few constraints to keep in mind:

Use Terraform and put everything in a single file called main.tf. Region needs to be us-west-2. Follow AWS best practices for high availability and security. Tag all resources with Environment equals Production and Project equals WebApp. Use variables and outputs if needed but keep them in the same file. Make sure dependencies are handled properly using Terraform references.

What we're looking for is a complete, production-ready Terraform configuration that provisions this entire infrastructure when someone runs terraform apply. The file should have all the provider and terraform blocks, resource definitions for VPC, subnets, gateways, route tables, NAT gateways, EC2, RDS, CloudWatch, S3, IAM roles, and security groups. Add proper references and outputs, and include inline comments explaining the security best practices.

Generate the full Terraform configuration in one file - don't break it into sections or summarize. We need the complete working code formatted as valid HCL with comments throughout.
