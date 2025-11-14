# Task Prompt: Payment Processing Web Application Infrastructure

## Task ID: m54an1

## Description

Create a Terraform configuration to deploy a highly available web application infrastructure for payment processing.

## Requirements

The configuration must:

1. Set up a VPC with public and private subnets across 3 availability zones
2. Configure an Application Load Balancer with HTTPS listeners and health checks
3. Deploy an Auto Scaling Group with launch template for EC2 instances running the application
4. Create an RDS PostgreSQL instance with Multi-AZ deployment and automated backups
5. Set up S3 bucket for static content with CloudFront distribution
6. Implement WAF rules on the ALB to protect against common attacks
7. Configure CloudWatch alarms for CPU, memory, and disk utilization
8. Create IAM roles and policies following least privilege principles
9. Set up VPC Gateway endpoint for S3 to keep traffic private within AWS network
10. Configure scheduled scaling actions for the Auto Scaling Group

## Background Context

A fintech startup needs to deploy their payment processing application with strict compliance requirements. The application requires zero-downtime deployments, end-to-end encryption, and must handle variable traffic patterns while maintaining PCI DSS compliance standards.

## Environment Details

Production environment in us-east-2 region for a payment processing application. Infrastructure includes:

- Application Load Balancer with WAF integration
- Auto Scaling Group with EC2 instances in private subnets across 3 availability zones
- RDS PostgreSQL Multi-AZ deployment with encryption at rest
- S3 bucket for static content delivery with CloudFront CDN
- VPC with public and private subnets across 3 availability zones
- NAT Gateway for outbound traffic (cost-optimized single NAT Gateway)
- Comprehensive CloudWatch monitoring and alarms

Requires Terraform 1.5+ with AWS provider 5.x, proper IAM permissions for creating and managing all resources.

## Expected Output

A complete Terraform configuration with separate files for networking, compute, database, storage, monitoring, and security resources, using modules where appropriate and following Terraform best practices for state management and variable usage.

## Platform

CDKTF (Cloud Development Kit for Terraform)

## Language

Python

## Complexity

Expert

## Region

us-east-2
