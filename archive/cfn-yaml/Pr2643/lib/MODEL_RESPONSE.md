The request is to generate a CloudFormation template that provisions a complete, secure, and scalable web application infrastructure on AWS in the us-east-1 region. The infrastructure must include networking, compute, scaling, monitoring, logging, and security configurations while following AWS best practices.

Approach

Networking Setup

Define a VPC with a /16 CIDR range.

Create two public subnets and two private subnets, each spread across different Availability Zones for high availability.

Attach an Internet Gateway to the VPC and configure route tables to enable internet access for the public subnets.

Provision NAT Gateways in each public subnet to allow outbound internet traffic from the private subnets.

Security Groups

Create a security group for the Application Load Balancer that allows inbound HTTP (80) and HTTPS (443) traffic from anywhere.

Create a security group for EC2 instances in the private subnets that only allows traffic from the load balancer’s security group.

Restrict all other inbound traffic on the private subnet instances.

Compute and Scaling

Define a Launch Template that references the latest Amazon Linux 2 AMI and includes secure configurations (key pair, user data for updates, IAM role attachment).

Deploy an Auto Scaling Group that uses the private subnets for EC2 placement.

Configure scaling policies triggered by CloudWatch Alarms monitoring CPU utilization.

Load Balancing

Create an Application Load Balancer placed in the public subnets.

Associate the load balancer with the security group permitting inbound HTTP/HTTPS traffic.

Attach an AWS-managed ACM certificate to enable HTTPS.

Define target groups and listeners to forward traffic from the ALB to the private EC2 instances.

Monitoring and Alarms

Add CloudWatch Alarms to monitor CPU utilization of the EC2 Auto Scaling Group.

Link alarms with scaling policies to automatically increase or decrease instance counts as required.

Logging and Storage

Provision an Amazon S3 bucket dedicated for centralized log storage.

Enable versioning on the bucket to preserve object history.

Configure bucket policies for least-privilege access.

Tagging Strategy

Apply consistent tagging across all resources with Environment, Owner, and Project keys for cost tracking and management.

Deliverable

The output will be a YAML-based CloudFormation template that includes:

Parameters for environment naming and VPC CIDR configuration.

Conditions for handling region-specific deployments.

Resource definitions for VPC, subnets, IGW, NAT gateways, route tables, security groups, launch template, Auto Scaling Group, Application Load Balancer, ACM certificate, CloudWatch Alarms, and S3 bucket.

Outputs for critical resource identifiers (VPC ID, Subnet IDs, ALB DNS, S3 bucket name) to simplify integration with other stacks.