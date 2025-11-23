# Task: Multi-AZ Application with Automatic Failover

## Platform and Language
**CRITICAL**: This infrastructure MUST be implemented using **Pulumi with TypeScript**. Do not use any other platform or language.

## Business Context
A financial services company needs to ensure their payment processing application remains available during AWS zone failures. They require automatic failover capabilities with health monitoring to maintain 99.9% uptime SLA.

## Infrastructure Requirements

Create a Pulumi TypeScript program to deploy a multi-AZ application with automatic failover capabilities. The configuration must:

1. Deploy EC2 instances across 3 availability zones with an Auto Scaling Group
2. Configure an Application Load Balancer with health checks every 30 seconds
3. Set up Route53 health checks with failover routing policy
4. Create CloudWatch alarms for unhealthy target detection
5. Implement automatic instance replacement when health checks fail
6. Configure cross-zone load balancing for traffic distribution
7. Set up SNS notifications for failover events
8. Tag all resources with Environment=Production and FailoverEnabled=true
9. Use t3.small instances with Amazon Linux 2 AMI
10. Configure security groups to allow HTTPS (443) and health check traffic

## Technical Specifications

### Region and Availability Zones
- **Region**: eu-central-1
- **Availability Zones**: eu-central-1a, eu-central-1b, eu-central-1c
- AWS multi-AZ deployment across all 3 zones

### Architecture Components
- **EC2 Auto Scaling Groups**: For automatic instance management
- **Application Load Balancer**: For traffic distribution across zones
- **Route53**: For DNS failover configuration
- **VPC**: With public subnets in each AZ for ALB and private subnets for EC2 instances
- **CloudWatch**: For monitoring and alarming
- **SNS**: For failover event notifications

### Prerequisites
- Pulumi CLI 3.x with TypeScript
- Node.js 16+
- AWS CLI configured with appropriate permissions

## Critical Constraints

1. **Auto Scaling Group must maintain exactly 2 instances per availability zone**
2. **Health check grace period must be set to 300 seconds for new instances**
3. **Route53 health checks must use HTTPS endpoint with /health path**
4. **CloudWatch alarms must trigger when any AZ has less than 2 healthy targets**
5. **All EC2 instances must use IMDSv2 for metadata service**

## Expected Output

A Pulumi stack that automatically handles AZ failures by:
- Redirecting traffic to healthy zones
- Replacing failed instances within 2 minutes
- Sending notifications when failover occurs

## Resource Naming
All resource names MUST include the `environmentSuffix` parameter to ensure uniqueness across parallel deployments.

Pattern: `resource-name-${environmentSuffix}`

## Security Requirements
- Security groups must allow HTTPS (443) traffic
- Security groups must allow health check traffic
- IMDSv2 must be enabled for all EC2 instances
- Follow AWS security best practices

## Monitoring and Alerting
- CloudWatch alarms for unhealthy target detection
- SNS notifications for failover events
- Health checks configured for all critical components

## Tags
All resources must be tagged with:
- Environment=Production
- FailoverEnabled=true
