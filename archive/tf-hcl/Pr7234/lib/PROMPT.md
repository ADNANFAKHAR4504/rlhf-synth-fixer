# Multi-Region Infrastructure Deployment

## Overview

This project provides a Terraform configuration for deploying consistent infrastructure across three AWS regions: us-east-1, eu-west-1, and ap-southeast-1. The design maintains strict environment isolation to meet data residency requirements.

## Background

Our financial services company operates trading platforms across three geographic regions. Regulatory requirements mandate that data remains within regional boundaries, while operational needs require identical infrastructure in each location to minimize configuration drift.

## Architecture

### Regional Deployment

Each of the three regions (us-east-1, eu-west-1, and ap-southeast-1) contains identical infrastructure:

- **Networking**: VPCs spanning 3 availability zones with non-overlapping CIDR blocks
  - us-east-1: 10.0.0.0/16
  - eu-west-1: 10.1.0.0/16
  - ap-southeast-1: 10.2.0.0/16

- **Compute**: Auto Scaling Groups with EC2 instances running the latest Amazon Linux 2 AMI, fronted by Application Load Balancers

- **Database**: RDS Aurora PostgreSQL clusters with read replicas and 7-day automated backup retention

- **Storage**: S3 buckets (cross-region replication disabled for compliance)

### State Management

Terraform workspaces manage environment separation, with each region having:
- Dedicated S3 bucket for state storage
- DynamoDB table for state locking
- Separate workspace (us-east-1, eu-west-1, ap-southeast-1)

### Security

- Security groups allow HTTPS traffic from the internet
- Database access is restricted to compute instances only
- Sensitive values are stored in AWS Secrets Manager with region-specific secrets
- Resources are tagged consistently with Environment, Region, and ManagedBy tags

## Project Structure

The project is organized into separate directories:
- Environment configurations
- Workspace-aware variable files
- Deployment scripts

## Outputs

Each environment provides the following outputs:
- ALB DNS names
- RDS endpoints
- VPC IDs

This allows easy integration with other systems and provides visibility into deployed resources.