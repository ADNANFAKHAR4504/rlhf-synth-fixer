# Ideal CloudFormation Implementation for Secure Infrastructure

This document outlines the ideal implementation approach for the secure AWS infrastructure requirements.

## Core Architecture Decisions

The solution implements a three-tier architecture with proper network segmentation:

1. Public tier: Application Load Balancer
2. Application tier: EC2 instances in private subnets
3. Data tier: RDS MySQL in isolated database subnets

## Network Design

VPC Setup:
- CIDR: 10.0.0.0/16 provides sufficient IP space
- DNS support enabled for proper resolution
- Two availability zones for high availability

Subnet Strategy:
- Public subnets: /24 blocks (256 IPs each) for ALB
- Private subnets: /24 blocks for EC2 instances
- Database subnets: /24 blocks for RDS

Internet Gateway and NAT:
- Single IGW for VPC-level internet access
- NAT Gateway per AZ for redundancy
- Private instances route through NAT for updates

Network ACLs:
- Additional security layer beyond security groups
- Allows HTTP/HTTPS inbound
- Stateless filtering for defense in depth

## Security Implementation

KMS Encryption:
- Single customer-managed key for all services
- Automatic key rotation enabled
- Key policy allows CloudTrail, Config, and RDS access
- Alias for easier reference

Security Groups:
- ALB SG: Port 80 from 0.0.0.0/0
- EC2 SG: Port 80 from ALB SG only
- RDS SG: Port 3306 from EC2 SG only
- No outbound restrictions (allow all)

IAM Roles:
- EC2 instance role with SSM permissions
- CloudTrail role with CloudWatch Logs write access
- Config role with S3 and SNS permissions
- Service-specific trust policies

CloudTrail Configuration:
- Multi-region trail for complete visibility
- Log file validation enabled
- KMS encryption for logs at rest
- CloudWatch Logs integration for real-time analysis

AWS Config:
- Global resource recording enabled
- Continuous monitoring of configuration changes
- Managed config rules for common compliance checks
- Delivery to S3 with daily snapshots

## Compute and Scaling

Launch Template:
- Amazon Linux 2 AMI (region-specific mapping)
- User data installs and starts Apache httpd
- CloudWatch agent for detailed monitoring
- Instance profile attached for SSM access

Auto Scaling:
- Environment-based sizing (Dev: 1-2, Test: 1-3, Prod: 2-4)
- Distributed across two AZs
- Health checks from ALB and EC2
- Cooldown periods to prevent flapping

Application Load Balancer:
- Internet-facing with public subnets
- HTTP listener (port 80)
- Target group health checks on /health
- Cross-zone load balancing enabled
- Connection draining (5 minute timeout)
- Access logs to S3

## Database

RDS Configuration:
- MySQL 8.0 engine
- Multi-AZ for automatic failover
- Storage encrypted with KMS
- Automated backups (7-day retention)
- Backup window during off-peak hours
- Maintenance window scheduled
- Enhanced monitoring enabled
- Parameter group for MySQL optimization
- Subnet group spans two AZs

Secrets Manager:
- Master password stored securely
- Automatic rotation not enabled (requires Lambda)
- Accessed by application via SDK

## Storage

S3 Buckets:

CloudTrail Bucket:
- Versioning enabled
- KMS encryption
- Bucket policy restricts access to CloudTrail service
- No public access
- Lifecycle policy for log retention

Config Bucket:
- Server-side encryption
- Lifecycle policy to transition old configs to IA/Glacier
- No public access
- Bucket policy for Config service

## Monitoring and Alarms

CloudWatch Logs:
- Log groups for CloudTrail and application logs
- Retention policies to manage costs
- Metric filters for security events

CloudWatch Alarms:
- IAM policy changes alarm
- Can be extended for other security events
- SNS integration for notifications

VPC Flow Logs:
- Captures network traffic metadata
- Sent to CloudWatch Logs
- IAM role for Flow Logs service

## Parameters and Flexibility

Parameters allow environment-specific configuration:
- EnvironmentSuffix: Unique identifier per deployment
- Environment: Development/Test/Production
- Tags: Owner and CostCenter for cost tracking
- KeyPairName: SSH access (emergency use only)
- DB credentials: Configurable username and password

## Mappings for Environment Variability

RegionMap:
- AMI IDs per region
- Supports us-east-1 and us-west-2
- Easy to extend to other regions

EnvironmentMap:
- Instance types scale with environment
- Auto Scaling limits appropriate for load
- Allows single template for all environments

## Resource Naming and Tagging

All resources use consistent naming:
- Pattern: {ResourceType}{EnvironmentSuffix}
- Examples: VPCdev, ALBprod, DatabaseSubnetGroup-test

Standard tags applied to all resources:
- Environment: Tracks deployment environment
- Owner: Team or individual responsible
- CostCenter: For chargeback and budgeting
- ManagedBy: CloudFormation for automation tracking

## Outputs for Integration

Comprehensive outputs enable:
- Network information for other stacks
- Load balancer endpoint for DNS configuration
- Database connection details for applications
- Security group IDs for additional resources
- KMS key for encryption requirements

## Deployment Process

Stack creation order:
1. Network resources (VPC, subnets, gateways)
2. Security resources (KMS, IAM roles)
3. Monitoring (CloudTrail, Config, Flow Logs)
4. Storage (S3 buckets)
5. Compute (Launch Template, ASG, ALB)
6. Database (RDS instance)

Stack is fully declarative and idempotent. Updates use CloudFormation change sets for safe modifications.

## LocalStack Compatibility

For LocalStack deployment:
- All services used are supported in LocalStack Community
- No dependencies on unsupported services
- Endpoint configuration in tests handles LocalStack URLs
- Resource names avoid special characters that might cause issues
- KMS, CloudTrail, and Config work in LocalStack with limitations
- Tests validate resource creation, not production behavior

## Testing Strategy

Unit Tests:
- Validate template structure and syntax
- Check parameter constraints
- Verify resource properties
- Ensure required sections present

Integration Tests:
- Deploy stack to LocalStack or AWS
- Verify all resources created successfully
- Check security group rules
- Validate encryption settings
- Test ALB endpoint accessibility
- Confirm database connectivity
- Verify CloudTrail logging
- Check Config rules execution

## Production Considerations

Before production deployment:
- Replace HTTP with HTTPS (requires ACM certificate)
- Enable ALB access logging
- Configure RDS automated backups to longer retention
- Set up CloudWatch dashboards
- Create runbooks for common operations
- Implement secret rotation for RDS password
- Add monitoring for application-specific metrics
- Configure Auto Scaling policies based on metrics
- Set up disaster recovery procedures
- Document incident response procedures

This implementation follows AWS best practices for security, reliability, and cost optimization while remaining deployable to LocalStack for testing and development.
