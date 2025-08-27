# Project Infrastructure Notes

This document describes how we want to set up the AWS infrastructure for our web platform.  
The goal is to have a secure, reliable environment for development and testing.

## Network

We'll use a VPC with a 10.0.0.0/16 CIDR. There should be at least two public subnets in different AZs for redundancy.  
An internet gateway is needed for public access, and route tables should be set up so public subnets can reach the internet.

## Security

Security groups should allow HTTP (80) from anywhere and SSH (22) only from a specific IP range (make this configurable).  
We'll use a key pair for EC2 SSH access. If needed, we can add network ACLs for extra security.

## Compute

At least one EC2 instance should be launched in a public subnet, using Amazon Linux 2 or 2023.  
Keep the instance type small (t2.micro or t3.micro). Attach the right security group and IAM role.

## Storage

We need an S3 bucket with versioning and encryption enabled.  
Make sure the bucket name is unique and set up the right policies.

## IAM

Create an IAM role for EC2 with only the permissions it needs (especially for S3 access).  
Attach this role to the instance.

## Monitoring

Enable CloudWatch monitoring for the EC2 instance.  
Set up an alarm for high CPU usage (over 70% for 5 minutes).  
Consider sending notifications and enabling logs.

## Tagging and Naming

Tag everything with Environment: Development and other useful tags.  
Stick to a clear naming pattern, like VPC-Dev-001, EC2-Dev-Web, etc.

## Outputs

The template should output the VPC ID, subnet IDs, EC2 public IP, S3 bucket name, and security group ID.

## Validation

- The template must be valid YAML and pass CloudFormation validation.
- It should deploy without errors.
- All resources and references must be correct.

## Testing

- EC2 should be reachable via SSH and HTTP.
- S3 bucket should be accessible as expected.
- CloudWatch alarm should work.
- Security groups and tags should be correct.

## Region

Use us-east-1 unless we decide otherwise.  
Use dynamic AZ selection.

## Parameters

Allow configuration for SSH CIDR, resource names, instance type, environment, and key pair.

## Deliverables

- The CloudFormation YAML template
- Notes on parameters and dependencies
- Security notes
- Deployment instructions

## Success

We'll consider this done when everything works, is secure, and follows AWS best practices.