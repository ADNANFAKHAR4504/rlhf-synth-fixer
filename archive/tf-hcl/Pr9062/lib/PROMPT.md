# Terraform Multi-Environment Web Application Infrastructure

## Overview

Create a Terraform infrastructure for a highly scalable web application on AWS. The Application Load Balancer connects to EC2 instances running in an Auto Scaling group across multiple availability zones. EC2 instances retrieve database credentials from AWS Secrets Manager and connect to RDS for data persistence.

## Architecture

The infrastructure spans staging and production environments with the following components:

- VPC with public and private subnets that isolates application tiers
- Application Load Balancer in public subnets that routes traffic to EC2 instances
- EC2 Auto Scaling group in private subnets that scales based on demand
- RDS database in private subnets that stores application data
- Secrets Manager integrated with EC2 to securely retrieve database credentials
- IAM roles attached to EC2 instances for least-privilege access

## Environment Configuration

### Staging Environment
- Uses t3.small instances for cost optimization
- Runs with minimum 1 and maximum 2 instances in the Auto Scaling group
- Connects to a db.t3.small RDS instance

### Production Environment
- Uses t3.large instances for better performance
- Runs with minimum 2 and maximum 6 instances in the Auto Scaling group
- Connects to a db.t3.medium RDS instance with Multi-AZ enabled

## Module Structure

Create reusable Terraform modules for:

- VPC module that provisions networking components with public and private subnets
- EC2 module that configures Auto Scaling groups attached to the load balancer
- ALB module that sets up listeners and target groups routing to EC2
- RDS module that deploys the database with security groups allowing EC2 access
- Secrets module that creates database credentials retrieved by EC2 at runtime

## State Management

Configure Terraform Cloud workspaces for remote state management. Each environment uses a separate workspace to isolate state files. Workspaces connect to version control for automated plan and apply workflows.

## Security Requirements

- EC2 instances assume IAM roles that grant access to Secrets Manager
- Security groups restrict traffic flow between ALB, EC2, and RDS
- RDS credentials stored in Secrets Manager are never hardcoded
- All resources tagged with Environment, Project, Owner, and CostCenter
