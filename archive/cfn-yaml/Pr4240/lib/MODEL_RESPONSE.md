model_response.md
Title

TapStack.yml — Production-Ready Network Stack (VPC, NAT, EC2, ASG) — us-west-2

Summary

The TapStack.yml template defines a complete, production-ready AWS network environment designed for workloads running in us-west-2. It focuses on security, scalability, and maintainability while keeping the structure simple and clear.

Here’s what the stack sets up:

A new VPC (10.0.0.0/16) with DNS support and hostnames enabled.

Two public and two private subnets, spread across different Availability Zones for redundancy.

An Internet Gateway attached to the VPC, with public route tables sending all internet traffic (0.0.0.0/0) through it.

A NAT Gateway with an Elastic IP in one public subnet so private subnets can access the internet without exposing instances directly.

Private route tables that route outbound traffic through the NAT Gateway instead of the IGW.

Two t2.micro EC2 instances deployed in the private subnets.

A Security Group that allows SSH only from the CIDR range 203.0.113.0/24 (for restricted access).

An IAM Role and Instance Profile with minimal S3 permissions — just enough for the instances to read and write to a secure application bucket. The bucket itself is encrypted and fully blocks public access.

An Auto Scaling Group built on a Launch Template (not the deprecated Launch Configuration). It runs across both private subnets, with capacity set to:

Minimum: 2

Desired: 2

Maximum: 4

CloudWatch alarms that automatically trigger scale-out when average CPU ≥ 70% and scale-in when CPU ≤ 30%.

Well-structured Outputs that expose the key resources — VPC ID, subnet IDs, NAT Gateway ID, ASG name, and S3 bucket name.

The template is organized and commented to make it easy to extend — for example, adding RDS or additional private tiers later.