# Multi-Region Highly Available AWS Infrastructure with Terraform

## Solution Overview

This solution provides a complete, production-ready, multi-region AWS infrastructure deployment using Terraform (HCL). The infrastructure spans **us-east-1** and **us-west-2** regions, implementing high availability, security best practices, and cost optimization.

## Architecture Components

### 1. Multi-Region Networking

**VPC Configuration (Both Regions):**
- Dedicated VPC per region with appropriate CIDR blocks
  - us-east-1: 10.0.0.0/16
  - us-west-2: 10.1.0.0/16
- 2 public subnets per region (for load balancers and NAT gateways)
- 2 private subnets per region (for application servers and databases)
- Internet Gateway for public internet access
- 2 NAT Gateways per region (one per AZ for high availability)
- Route tables configured for proper traffic routing

**VPC Endpoints:**
- S3 Gateway Endpoint for private S3 access
- SSM Interface Endpoints for Systems Manager access
- SSM Messages and EC2 Messages endpoints for secure instance management

### 2. Compute Layer

**EC2 Auto Scaling:**
- Launch templates with Amazon Linux 2 AMI
- Instance type: t2.micro (free-tier eligible)
- Auto Scaling Groups in both regions:
  - Minimum: 2 instances
  - Maximum: 5 instances
  - Desired: 2 instances
- User data script installs and configures Apache web server
- IAM instance profile with SSM managed policy for remote access
- Instances deployed in private subnets
- Auto scaling policies for scale up/down based on CloudWatch alarms

### 3. Load Balancing

**Application Load Balancers (ALB):**
- One ALB per region in public subnets
- HTTP listener on port 80
- Target groups with health checks
- Health check configuration:
  - Path: /
  - Healthy threshold: 2
  - Unhealthy threshold: 2
  - Interval: 30 seconds
  - Timeout: 5 seconds

### 4. Database Layer

**RDS MySQL:**
- Single RDS instance in us-east-1 (primary region)
- Engine: MySQL 8.0
- Instance class: db.t3.micro
- Storage: 20GB gp3 with encryption enabled
- Multi-AZ deployment via subnet group
- Automated backups:
  - Retention period: 7 days
  - Backup window: 03:00-04:00 UTC
  - Maintenance window: Sunday 04:00-05:00 UTC
- CloudWatch logs exports enabled (error, general, slowquery)
- Security: Deployed in private subnets with restricted security group access

**AWS Backup:**
- Backup vault for centralized backup management
- Daily backup plan with cron schedule (5 AM UTC)
- 30-day retention policy
- Automated backup selection for RDS instance

### 5. Storage

**S3 Buckets:**
- Main data bucket with features:
  - Versioning enabled
  - Server-side encryption (AES256)
  - Access logging to separate log bucket
  - Public access blocked
  - Bucket name includes account ID for global uniqueness
- Log bucket for access logs with appropriate ACLs

### 6. Serverless Processing

**Lambda Function:**
- Runtime: Python 3.9
- Purpose: Process data from S3 and export to RDS
- VPC configuration: Deployed in private subnets
- Timeout: 60 seconds
- Environment variables:
  - DB_HOST: RDS endpoint
  - DB_NAME: Database name
  - BUCKET_NAME: S3 bucket name
- S3 event notification trigger:
  - Event: s3:ObjectCreated:*
  - Prefix filter: data/
  - Suffix filter: .json
- Deployment package created using archive_file data source

### 7. Security

**IAM Roles:**
- EC2 role with SSM managed policy for Systems Manager access
- Lambda role with permissions for:
  - CloudWatch Logs (logging)
  - S3 (read access)
  - RDS (describe instances)
  - VPC networking (ENI management)
- Backup role with AWS managed backup and restore policies

**Security Groups:**
- ALB security group: Allow HTTP/HTTPS from internet
- EC2 security group: Allow HTTP from ALB, SSH from specific IP
- RDS security group: Allow MySQL (3306) from EC2 and Lambda
- Lambda security group: Allow outbound traffic
- VPC endpoint security group: Allow HTTPS from VPC CIDR

### 8. Monitoring

**CloudWatch Alarms:**
- EC2 CPU utilization alarms (both regions)
  - Threshold: 80%
  - Evaluation periods: 2
  - Period: 5 minutes
  - Actions: Trigger auto scaling policies
- RDS CPU utilization alarm
  - Threshold: 75%
  - Evaluation periods: 2
  - Period: 5 minutes

### 9. DNS and Failover

**Route 53:**
- Hosted zone for domain management
- Health checks for both regional ALBs
  - Type: HTTP
  - Port: 80
  - Path: /
  - Failure threshold: 3
  - Request interval: 30 seconds
- Alias records with failover routing:
  - PRIMARY: us-east-1 ALB
  - SECONDARY: us-west-2 ALB
- Automatic failover on health check failure

### 10. Tagging Strategy

All resources tagged with:
- Environment: Production
- Team: DevOps
- ManagedBy: Terraform

## Implementation Details

### File Structure

```
lib/
└── tap_stack.tf          # Complete Terraform configuration (1609 lines)
```

### Terraform Configuration

**File: lib/tap_stack.tf**

The complete infrastructure is defined in a single Terraform file as required. Key sections include:

1. **Provider Configuration** (lines 1-28)
   - Terraform version constraint: >= 1.0
   - AWS provider version: ~> 5.0
   - Archive provider version: ~> 2.0
   - Multiple provider aliases for multi-region deployment

2. **Local Variables** (lines 30-46)
   - Common tags
   - CIDR blocks for VPCs
   - SSH allowed IP (configurable)
   - Domain name (configurable)

3. **Data Sources** (lines 48-82)
   - Latest Amazon Linux 2 AMI for both regions
   - Availability zones for subnet creation

4. **VPC Resources** (lines 84-373)
   - VPCs, subnets, internet gateways, NAT gateways
   - Route tables and associations
   - VPC endpoints

5. **Security Groups** (lines 375-561)
   - Separate security groups for each component
   - Least privilege access rules

6. **IAM Resources** (lines 563-700)
   - Roles and policies for EC2, Lambda, and Backup

7. **Compute Resources** (lines 702-903)
   - Launch templates with user data
   - Auto Scaling Groups and policies

8. **Load Balancers** (lines 905-1010)
   - ALBs, target groups, and listeners

9. **Database** (lines 1012-1081)
   - RDS instance with encryption and backups

10. **AWS Backup** (lines 1083-1147)
    - Backup vault, plan, and selection

11. **S3 Storage** (lines 1149-1232)
    - Buckets with versioning, encryption, and logging

12. **Lambda Function** (lines 1234-1362)
    - Function with VPC configuration and S3 trigger

13. **CloudWatch Monitoring** (lines 1364-1451)
    - CPU alarms for auto scaling

14. **Route 53** (lines 1453-1557)
    - Hosted zone, health checks, and failover records

15. **Outputs** (lines 1559-1609)
    - ALB DNS names, RDS endpoint, S3 bucket, Lambda function, Route 53 nameservers

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. Sufficient AWS permissions to create resources

### Configuration

Before deployment, update the following variables in `tap_stack.tf`:

```hcl
locals {
  ssh_allowed_ip = "YOUR_IP/32"  # Line 42
  domain_name = "your-domain.com"  # Line 45
}
```

### Deployment Steps

1. **Initialize Terraform:**
   ```bash
   cd lib
   terraform init
   ```

2. **Format and Validate:**
   ```bash
   terraform fmt
   terraform validate
   ```

3. **Plan Deployment:**
   ```bash
   terraform plan -out=tfplan
   ```

4. **Apply Infrastructure:**
   ```bash
   terraform apply tfplan
   ```

5. **Save Outputs:**
   ```bash
   terraform output -json > ../cfn-outputs/flat-outputs.json
   ```

### Post-Deployment

1. **Update Route 53 Domain:**
   - If using a registered domain, update nameservers with the values from `route53_nameservers` output
   - Wait for DNS propagation (up to 48 hours)

2. **Test Application:**
   - Access ALB endpoints using the DNS names from outputs
   - Verify web servers are responding
   - Test failover by simulating failure in primary region

3. **Verify RDS Connection:**
   - Connect to RDS using the endpoint from outputs
   - Use credentials specified in the configuration

## Cost Optimization

The infrastructure uses free-tier and low-cost services where possible:

- **t2.micro** instances (free-tier eligible)
- **db.t3.micro** RDS instance
- **20GB gp3** storage
- NAT Gateways are the primary cost driver (~$32/month per NAT Gateway)
- Consider using NAT instances or VPC peering for cost reduction in non-production

## Security Best Practices

1. **Network Segmentation:** Resources in private subnets with controlled access
2. **Encryption:** RDS and S3 encryption at rest
3. **Access Control:** Security groups with least privilege rules
4. **SSH Access:** Restricted to specific IP addresses
5. **SSM Access:** No need to open SSH ports, use Systems Manager
6. **IAM Roles:** Instance profiles and Lambda execution roles with minimal permissions
7. **Secrets Management:** Database passwords should be moved to AWS Secrets Manager in production

## High Availability Features

1. **Multi-Region Deployment:** Resources in two AWS regions
2. **Multi-AZ:** RDS and resources span multiple availability zones
3. **Auto Scaling:** Automatic instance replacement and capacity adjustment
4. **Load Balancing:** Traffic distribution across healthy instances
5. **Health Checks:** Continuous monitoring with automatic failover
6. **Backups:** Automated daily backups with retention policies

## Monitoring and Alerting

- CloudWatch alarms for CPU utilization
- Route 53 health checks for endpoint availability
- RDS automated backups
- S3 access logging
- CloudWatch Logs for Lambda execution

## Cleanup Instructions

To destroy all resources:

```bash
cd lib
terraform destroy -auto-approve
```

**Important Notes:**
- Empty S3 buckets before destroying (Terraform cannot delete non-empty buckets)
- Verify all resources are deleted to avoid ongoing charges
- Check for any manually created resources that may have dependencies

## Design Decisions

1. **Single File Approach:** All resources in one file for simplicity and clarity
2. **No Retain Policies:** All resources can be destroyed cleanly for testing
3. **t2.micro Instances:** Free-tier eligible for cost optimization
4. **MySQL 8.0:** Latest stable version with improved performance
5. **Python 3.9 Lambda:** Balance between features and compatibility
6. **Archive Provider:** Clean Lambda deployment without external files
7. **Skip Final Snapshot:** RDS can be destroyed without manual intervention
8. **NAT Gateway per AZ:** High availability over cost optimization

## Troubleshooting

### Common Issues

1. **Terraform Init Fails:**
   - Ensure internet connectivity
   - Check provider versions compatibility

2. **Deployment Failures:**
   - Verify AWS credentials and permissions
   - Check for resource limits in your account
   - Ensure unique S3 bucket names

3. **Health Check Failures:**
   - Verify security group rules
   - Check user data script execution
   - Review CloudWatch Logs

4. **DNS Resolution:**
   - Ensure nameservers are updated
   - Allow time for DNS propagation
   - Use dig/nslookup to troubleshoot

## Outputs Reference

After deployment, the following outputs are available:

- **alb_dns_us_east_1:** Load balancer DNS in primary region
- **alb_dns_us_west_2:** Load balancer DNS in secondary region
- **rds_endpoint:** MySQL database endpoint (sensitive)
- **s3_bucket_name:** Main data bucket name
- **lambda_function_name:** Lambda function identifier
- **route53_nameservers:** DNS nameservers for domain delegation
- **website_url:** Full website URL

## Conclusion

This Terraform configuration provides a production-grade, multi-region, highly available AWS infrastructure that meets all specified requirements:

✅ Multi-region deployment (us-east-1, us-west-2)
✅ VPC with public and private subnets
✅ Auto Scaling EC2 instances (t2.micro, min=2, max=5)
✅ Application Load Balancers
✅ RDS MySQL 8.0 with encryption and backups
✅ S3 with versioning, encryption, and logging
✅ Lambda for serverless processing
✅ IAM roles with least privilege
✅ CloudWatch monitoring and alarms
✅ Route 53 DNS with health checks and failover
✅ Systems Manager integration
✅ Consistent tagging (Environment, Team)
✅ Cost-effective design
✅ High availability and redundancy
✅ No retain policies for clean teardown

The infrastructure is ready for deployment and can be easily modified for specific requirements while maintaining best practices for security, reliability, and cost optimization.