ROLE: You are a senior Terraform engineer.

CONTEXT:
We must migrate an AWS application from region us-west-1 to us-west-2 using Terraform HCL.

CONSTRAINTS:
- Preserve logical identity: keep the same names/tags/topology.
- Resource IDs are region-scoped; provide an old→new ID mapping plan using terraform import (do NOT recreate).
- Migrate Terraform state to the new region/workspace without data loss.
- Preserve all SG rules and network configuration semantics.
- Minimize downtime; propose DNS cutover steps and TTL strategy.

1. There is requirement to have resources deployed in region  us-west-2. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary .
2. VPCs should have 2  private and 2 public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Set up an Internet Gateway for public subnets and NAT Gateway for private subnets. 
3.  Implement Individual MySql RDS with version 8.0 or later but with multiple AZ support for respective regions ensuring it is not internet accessible and that the storage is encrypted with AWS-managed KMS keys. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS.  Ensure that all RDS instances are set to not be publicly accessible .Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability. and automatic backups enabled.  Use 8.0.43 DB Version.
4.Implement AWS Config to manage and report compliance with internal security benchmarks. 
5.  Ensure IAM roles are designed with MFA requirements for sensitive operations.
6. Create t3.micro EC2 instance in private subnet behind auto scaler with security group restricting SSH to CIDR only.  Setting up an EC2 Auto Scaling group distributed across two Availability Zones with an Elastic Load Balancer to handle incoming traffic. Secure EC2 instances with IAM instance profiles for controlled access.
7. Use AWS CloudTrail to monitor AWS API calls and configure an alarm for unauthorized access attempts
8. Create non public s3 bucket  Limit access to S3 buckets to specific IP ranges and enforce AES-256 encryption for data at rest. 
9.  Set up AWS WAF with rules against web exploits. 
10. Create security group for ec2 and RDS that block public access except for designated ports and IPs.  Limit RDS access to known IP addresses. 
11. Automate security assessments utilizing AWS Inspector. 1
12. Enable VPC flow logs for for anomaly detection.
13. Store RDS secrets using AWS Secrets Manage. I dont need Lambda rotation.
