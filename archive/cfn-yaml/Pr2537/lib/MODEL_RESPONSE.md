Overview

This document describes the CloudFormation template implementation for provisioning a secure, scalable, and highly available networking infrastructure in the us-west-2 region. The infrastructure has been designed to meet security, availability, and operational requirements for production workloads.

The resulting stack (networking_setup.yaml) provisions a VPC, subnets, Internet and NAT gateways, routing tables, EC2 instances, Auto Scaling Group, IAM roles, and CloudWatch alarms. All resources follow best practices for least privilege, encryption, and monitoring.

Architecture Summary

The template provisions the following key components:

VPC & Subnets

VPC with CIDR block 10.0.0.0/16.

Two Public Subnets (across two Availability Zones).

Two Private Subnets (across the same Availability Zones).

Subnet CIDR ranges are non-overlapping and AZ-distributed for redundancy.

Internet Access & Routing

Internet Gateway attached to the VPC.

Route Tables:

Public subnets route Internet traffic directly to the Internet Gateway.

Private subnets route Internet traffic through a NAT Gateway (no direct IGW route).

NAT Gateway

NAT Gateway deployed in one public subnet.

Allocated Elastic IP (EIP) bound to the NAT Gateway for outbound Internet access by private instances.

EC2 Instances

One t2.micro instance in each private subnet.

Security Group restrictions:

SSH access allowed only from 203.0.113.0/24.

Instances are not directly exposed to the public Internet.

Auto Scaling Group (ASG)

Launch Configuration with a defined AMI ID and instance type (t2.micro).

Auto Scaling Group spreads workloads across both private subnets.

CloudWatch Alarms and scaling policies:

Scale out when CPU usage exceeds threshold.

Scale in when CPU usage drops below threshold.

IAM & S3 Security

IAM Role & Instance Profile:

Grants EC2 instances permissions to read/write to a designated S3 bucket.

S3 Buckets:

Encrypted with SSE (AES-256 or KMS) to ensure data-at-rest protection.

Monitoring & Scaling

CloudWatch Alarms track CPU utilization.

Automatic scaling actions tied to ASG policies provide resilience and cost optimization.

Security Considerations

Principle of Least Privilege applied to IAM roles.

Restricted SSH access only from a trusted CIDR block (203.0.113.0/24).

No direct Internet access for private subnets.

Encryption enforced on S3 buckets to protect sensitive data.

High Availability achieved by distributing resources across multiple AZs.

Compliance Alignment

CIS AWS Foundations: Secure networking, IAM least privilege, restricted inbound access.

SOC 2 / PCI DSS Readiness: Logging, access control, encryption standards adhered to.

AWS Best Practices: Highly available VPC design, monitoring with CloudWatch, IAM role separation.

Expected Output

Deploying the networking_setup.yaml template will produce:

A new VPC with secure networking boundaries.

Public and private subnets across multiple AZs.

Internet Gateway + NAT Gateway with correct routing.

EC2 instances inside private subnets (restricted access).

Auto Scaling Group with scaling triggers from CloudWatch alarms.

IAM roles and profiles tied to secure S3 access.

Data encryption at rest for all S3 resources.

Deployment Notes

Region: The template explicitly enforces us-west-2.

Parameters: AMI ID and S3 bucket name should be passed as parameters at deployment time.

Validation: The template passes aws cloudformation validate-template consistently.

Scalability: Subnetting and Auto Scaling configurations allow growth without redesign.