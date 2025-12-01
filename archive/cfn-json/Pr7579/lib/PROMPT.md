# Secure Payment Processing Infrastructure

Hey team,

We're working with a fintech startup that's building out their payment processing platform, and they need a rock-solid infrastructure that can handle real money. They're projecting about 50,000 transactions daily with sub-second response requirements, and everything needs to be PCI-DSS compliant from day one.

The challenge here is building something that balances high availability, security, and performance. They're processing actual payments, so there's zero tolerance for data breaches or downtime. We need multi-AZ redundancy, encrypted everything, and proper network segmentation. The security team has been pretty clear that all access needs to be tightly controlled with least-privilege IAM policies.

Performance-wise, they're expecting traffic to come in bursts during business hours, so we need auto-scaling that can handle sudden spikes. The database layer needs to be fast and reliable with automatic failover. They also want comprehensive monitoring so their ops team can catch issues before they impact customers.

## What we need to build

Create a production-ready payment processing environment using **CloudFormation with JSON** syntax. This needs to be a complete infrastructure stack that their DevOps team can deploy to us-east-1 and start using immediately.

## Core Infrastructure Requirements

**Network Architecture**
- VPC spanning 3 availability zones for high availability
- 3 public subnets for internet-facing load balancer
- 3 private subnets for application tier and database
- NAT Gateways in each AZ for outbound connectivity from private subnets
- VPC Flow Logs enabled and stored in S3 for security auditing

**Database Layer**
- RDS Aurora PostgreSQL cluster with Multi-AZ deployment
- Encrypted storage using customer-managed KMS keys
- Database connection monitoring via CloudWatch
- Automatic failover between availability zones

**Application Layer**
- Auto Scaling Group with Launch Template using t3.large instances
- Minimum 6 instances maintained during business hours
- IMDSv2 required for all EC2 metadata access
- Least-privilege IAM roles for accessing S3 and RDS

**Load Balancing**
- Application Load Balancer with HTTPS listener
- SSL termination using ACM certificate
- Target group configuration for health checks
- Distribution across all 3 availability zones

**Storage**
- S3 bucket for static assets with versioning
- S3 bucket for VPC Flow Logs with encryption
- Lifecycle policies for cost optimization
- Server-side encryption enabled on all buckets

**Security Controls**
- Security groups with specific port rules (no wildcard access)
- No inbound rules allowing 0.0.0.0/0
- IAM roles following least-privilege principle
- All data encrypted at rest and in transit

**Monitoring and Alerting**
- CloudWatch Log Groups with 30-day retention
- CPU utilization alarms (threshold: 80% for 5 minutes)
- Memory monitoring
- Database connection count tracking
- Application logs centralized for troubleshooting

## Technical Constraints

The infrastructure must meet these specific requirements:

- Deploy all resources across exactly 3 availability zones
- RDS storage encryption with customer-managed KMS keys
- ALB must terminate SSL using ACM certificate
- Auto Scaling Group maintains minimum 6 instances during peak hours
- All EC2 instances configured for IMDSv2 only
- VPC Flow Logs delivered to S3 bucket
- Security Groups configured with least-privilege access
- S3 buckets have both versioning and lifecycle policies
- CloudWatch alarms trigger when CPU exceeds 80% for 5 minutes
- All resource names must include **environmentSuffix** parameter for uniqueness

## Deployment Requirements (CRITICAL)

**Resource Naming Convention**
- ALL named resources must include the environmentSuffix parameter
- Use pattern: `!Sub 'resource-name-${EnvironmentSuffix}'`
- Example: `!Sub 'payment-vpc-${EnvironmentSuffix}'`

**Destroyability for Testing**
- Do NOT use `DeletionPolicy: Retain` (this is a synthetic test environment)
- Do NOT enable `DeletionProtection` on RDS clusters
- Set `SkipFinalSnapshot: true` for RDS to allow cleanup
- All resources must be completely removable after testing

**Known Service Issues to Avoid**
- GuardDuty: Do not create detectors (these are account-level resources)
- AWS Config: If used, reference correct managed policy `service-role/AWS_ConfigRole`
- NAT Gateways: Already included per requirements, but keep to minimum necessary

## Success Criteria

The delivered CloudFormation template should:
- Deploy successfully to us-east-1 without errors
- Create all resources with proper encryption enabled
- Establish network connectivity between all layers
- Configure security groups with no overly permissive rules
- Include all CloudWatch alarms and log groups
- Use environmentSuffix in all resource names
- Be fully destroyable (no Retain policies or deletion protection)

## What to deliver

A single CloudFormation JSON template that creates:
- Complete VPC with public and private subnets across 3 AZs
- RDS Aurora PostgreSQL cluster with Multi-AZ replicas
- Auto Scaling Group with Launch Template for EC2 instances
- Application Load Balancer with HTTPS configuration
- IAM roles and policies for EC2 to access S3 and RDS
- S3 buckets for static assets and flow logs
- All required security groups
- CloudWatch Log Groups and alarms
- KMS keys for encryption
- NAT Gateways for private subnet connectivity

The template should be production-ready with all security controls and monitoring configured according to the requirements above.
