# Multi-AZ Failover for Payment Processing API

## Overview
Create infrastructure using **Pulumi with TypeScript** to implement multi-AZ failover for a payment processing API with automatic failover capabilities, monitoring, and alerting.

## Background
A financial services company needs to implement automatic failover for their payment processing API to meet strict SLA requirements. The system must detect failures within 30 seconds and automatically redirect traffic to healthy instances across multiple availability zones.

## Requirements

### Infrastructure Components
1. Deploy an Application Load Balancer with target groups across 3 availability zones
2. Configure Auto Scaling Groups with 2 instances per AZ (6 total) using t3.medium instances
3. Set up Route 53 health checks that monitor the ALB endpoints every 10 seconds
4. Create a primary and secondary Route 53 failover routing policy
5. Implement CloudWatch alarms that trigger when unhealthy target count exceeds 50%
6. Configure SNS topic for failover notifications with email subscription
7. Set up security groups allowing HTTPS (443) from anywhere and health checks from AWS
8. Enable EBS encryption on all instances with customer-managed KMS keys
9. Configure ALB access logs to an S3 bucket with lifecycle policies
10. Implement automatic instance replacement when health checks fail for 90 seconds

### Environment Details
Multi-AZ deployment across us-east-1a, us-east-1b, and us-east-1c for a payment processing API requiring 99.99% uptime. Infrastructure includes Application Load Balancers with health-check based routing, Auto Scaling Groups with custom scaling policies, Route 53 failover routing policies, and CloudWatch alarms for monitoring. Requires Pulumi 3.x with TypeScript, Node.js 16+, and AWS provider v6.x. VPC spans three availability zones with public subnets for ALBs and private subnets for EC2 instances running the API service.

### Constraints
- Health checks must run every 10 seconds with a 3-failure threshold
- Route 53 health checks must monitor both HTTP endpoints and TCP connectivity
- ALB target groups must use connection draining with a 30-second timeout
- Auto Scaling Groups must maintain exactly 2 instances per AZ during normal operations
- CloudWatch alarms must trigger SNS notifications for any failover events
- All instances must be tagged with Environment, CostCenter, and FailoverPriority
- Security groups must restrict health check traffic to AWS-owned IP ranges only
- Target group deregistration delay must not exceed 20 seconds
- Cross-zone load balancing must be explicitly enabled on all ALBs

## AWS Services Required
- Application Load Balancer (ALB)
- Auto Scaling Groups (ASG)
- EC2 Instances
- Route 53
- CloudWatch
- SNS
- Security Groups
- KMS
- S3
- VPC

## Region
us-east-1 (with deployment across us-east-1a, us-east-1b, and us-east-1c availability zones)

## Expected Output
A Pulumi program that creates a highly available payment API infrastructure with automatic failover capabilities, monitoring, and alerting that ensures minimal downtime during instance or AZ failures.
