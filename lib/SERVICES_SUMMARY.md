# AWS Services Used in Application Deployment Infrastructure

## Compute & Networking (13 services)
1. **Amazon VPC** - Virtual Private Cloud for network isolation
2. **Amazon EC2** - Compute instances running the application
3. **EC2 Auto Scaling** - Automatic capacity management
4. **Elastic Load Balancing (ALB)** - Application Load Balancer for traffic distribution
5. **VPC Internet Gateway** - Internet connectivity for public subnets
6. **VPC Endpoints** - S3 Gateway endpoint for cost optimization
7. **EC2 Subnets** - Public and private subnets across 2 AZs
8. **EC2 Route Tables** - Network routing configuration
9. **EC2 Security Groups** - Network access control
10. **EC2 Launch Template** - Instance configuration template

## Storage & Encryption (5 services)
11. **Amazon S3** - Artifact and log storage
12. **AWS KMS** - Encryption key management with automatic rotation
13. **KMS Key Alias** - User-friendly key reference

## CI/CD Pipeline (3 services)
14. **AWS CodeDeploy** - Deployment automation with zero-downtime deployments
15. **AWS CodeBuild** - Build and test automation
16. **AWS CodePipeline** (Framework ready) - Continuous integration/deployment pipeline

## Identity & Access Management (3 services)
17. **AWS IAM Roles** - Service permissions (4 roles: Instance, CodeDeploy, CodeBuild, CodePipeline)
18. **AWS IAM Policies** - Granular permissions with least privilege
19. **IAM Instance Profile** - EC2 instance permissions

## Monitoring & Observability (3 services)
20. **Amazon CloudWatch Logs** - Centralized logging for application logs
21. **Amazon CloudWatch Metrics** - Custom metrics and performance monitoring
22. **Amazon CloudWatch Alarms** - Automated alerts for CPU and health

## Management & Governance (1 service)
23. **AWS Systems Manager (SSM)** - Session Manager for secure instance access

## Total: 23 AWS Services

## Key Features Implemented

### Security
- KMS encryption for all data at rest
- TLS/HTTPS enforced for all data in transit
- IAM roles with least privilege principle
- Security groups with restrictive rules
- IMDSv2 enforced on EC2 instances
- S3 buckets with public access blocked

### High Availability
- Multi-AZ deployment across 2 availability zones
- Auto Scaling with CPU-based target tracking (70%)
- Application Load Balancer with health checks
- Automatic unhealthy instance replacement

### CI/CD Support
- CodeDeploy integration with Auto Scaling Groups
- CodeBuild for automated builds
- CodePipeline framework ready
- Artifact storage with encryption and lifecycle policies

### Cost Optimization
- S3 VPC Gateway Endpoint (no NAT Gateway costs)
- Lifecycle policies for automatic cleanup
- Right-sized instances (t3.micro default)
- Auto Scaling to match demand
- CloudWatch Logs retention (7 days)

### Monitoring
- CloudWatch agent on all instances
- Application and error logs centralized
- CPU and health monitoring alarms
- Custom metrics for memory and disk usage

## Compliance
- ✅ All resources named with EnvironmentSuffix (53 occurrences)
- ✅ Encryption at rest (KMS)
- ✅ Encryption in transit (TLS/HTTPS enforced)
- ✅ Multi-AZ architecture
- ✅ CloudWatch logging enabled
- ✅ Auto Scaling configured
- ✅ Security groups follow least privilege
- ✅ IAM roles follow least privilege
- ✅ S3 public access blocked
- ✅ Lifecycle policies implemented
- ✅ Health checks configured
- ✅ CloudWatch alarms for critical metrics
