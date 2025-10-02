You are an expert AWS CloudFormation engineer. Generate a production-ready CloudFormation YAML template that provisions infrastructure for a recipe blog expecting 4,000 daily visitors.

## Infrastructure Requirements:

### 1. Networking (VPC: 10.15.0.0/16)

- **VPC Configuration:**
  - CIDR: 10.15.0.0/16
  - Enable DNS hostnames and DNS resolution
  - Region: us-west-2

- **Subnets:**
  - Public Subnet: 10.15.1.0/24 (for EC2 WordPress instance)
  - Private Subnet 1: 10.15.2.0/24 (for RDS primary)
  - Private Subnet 2: 10.15.3.0/24 (for RDS Multi-AZ standby)
  - Deploy across 2 AZs for high availability

- **Internet Connectivity:**
  - Internet Gateway attached to VPC
  - NAT Gateway in public subnet (for private subnet outbound traffic)
  - Route tables configured appropriately:
    - Public route table: 0.0.0.0/0 → IGW
    - Private route table: 0.0.0.0/0 → NAT Gateway

### 2. Security Groups

- **WebServerSecurityGroup:**
  - Inbound: HTTP (80) from 0.0.0.0/0
  - Inbound: HTTPS (443) from 0.0.0.0/0 (for future SSL)
  - Inbound: SSH (22) from specific admin IP (parameterized)
  - Outbound: All traffic

- **DatabaseSecurityGroup:**
  - Inbound: MySQL (3306) only from WebServerSecurityGroup
  - Outbound: All traffic

### 3. Compute (EC2)

- **WordPress Instance:**
  - Instance Type: t3.micro
  - AMI: Latest Amazon Linux 2023 (use mappings for region-specific AMIs)
  - User Data script to install and configure WordPress:
    - Install Apache, PHP 8.1, MySQL client
    - Download and configure WordPress
    - Configure wp-config.php with RDS endpoint
    - Set up Apache virtual host
  - Elastic IP for consistent access
  - IAM role with S3 permissions for media uploads
  - CloudWatch agent for monitoring

### 4. Database (RDS MySQL)

- **Configuration:**
  - Engine: MySQL 8.0.35
  - Instance Class: db.t3.micro
  - Allocated Storage: 20 GB (General Purpose SSD)
  - Max Allocated Storage: 100 GB (autoscaling)
  - Multi-AZ: Yes (for high availability)
  - Automated Backups: 7 days retention
  - Backup Window: 03:00-04:00 UTC
  - Maintenance Window: Sunday 04:00-05:00 UTC
  - Encryption: Enabled (AWS managed KMS key)
  - DB Subnet Group: Private subnets only
  - Publicly Accessible: No
  - Deletion Protection: Enabled
  - Performance Insights: Enabled (7 days retention)

### 5. Storage (S3)

- **Media Bucket:**
  - Versioning: Enabled
  - Server-side encryption: AES256
  - Lifecycle policies:
    - Transition to IA after 90 days
    - Delete old versions after 365 days
  - CORS configuration for WordPress uploads
  - Bucket policy allowing CloudFront OAI access

### 6. Content Delivery (CloudFront)

- **Distribution Configuration:**
  - Origins:
    - Primary: EC2 instance (WordPress dynamic content)
    - Secondary: S3 bucket (static media)
  - Behaviors:
    - /wp-content/uploads/\* → S3 origin
    - /\* → EC2 origin
  - Cache policies:
    - Static content: 86400 seconds
    - Dynamic content: 0 seconds
  - Compress objects automatically
  - Price class: Use only North America and Europe
  - SSL: CloudFront default certificate
  - Security headers (via response headers policy)

### 7. Monitoring (CloudWatch)

- **Alarms:**
  - EC2 CPU Utilization > 80% for 5 minutes
  - RDS CPU Utilization > 75% for 10 minutes
  - RDS Free Storage Space < 2 GB
  - EC2 StatusCheckFailed
  - RDS DatabaseConnections > 15
- **Dashboard:**
  - Single dashboard showing all key metrics
- **SNS Topic:**
  - Email notifications for all alarms

## Template Structure Requirements:

### Parameters:

```yaml
- KeyPairName (EC2 SSH key)
- AdminIPAddress (for SSH access)
- DBUsername (default: admin)
- DBPassword (NoEcho, minimum 8 characters)
- BlogDomainName (optional, for CloudFront CNAME)
- NotificationEmail (for CloudWatch alarms)
- Environment (dev/staging/prod)
```

### Outputs:

```yaml
- WordPressURL (CloudFront distribution URL)
- EC2PublicIP
- RDSEndpoint
- S3BucketName
- CloudFrontDistributionId
- VPCId
- PublicSubnetId
- PrivateSubnetIds
```

### Best Practices to Follow:

1. **Use CloudFormation intrinsic functions:**
   - !Ref, !GetAtt, !Sub, !Join for dynamic values
   - !FindInMap for region-specific AMIs

2. **Resource Dependencies:**
   - Use DependsOn where necessary
   - Ensure proper creation order

3. **Security:**
   - No hardcoded passwords
   - Use Systems Manager Parameter Store for sensitive data
   - Enable encryption everywhere possible
   - Principle of least privilege for IAM roles

4. **Scalability Considerations:**
   - Use Auto Scaling Group (ASG) instead of single EC2 (optional enhancement)
   - RDS Read Replicas ready configuration
   - CloudFront for global content delivery

5. **Cost Optimization:**
   - Use appropriate instance types
   - S3 lifecycle policies
   - CloudWatch log retention limits

6. **Tags:**
   - Consistent tagging strategy on all resources:
     - Name, Environment, Project, CostCenter, ManagedBy

7. **Deletion Protection:**
   - Enable termination protection on critical resources
   - Retain S3 bucket on stack deletion
   - Final snapshot for RDS on deletion

## Additional Requirements:

1. **Template Validation:**
   - Must pass cfn-lint validation
   - Include metadata for CloudFormation Designer compatibility

2. **Documentation:**
   - Inline comments explaining complex configurations
   - Description for each resource
   - Prerequisites section in template description

3. **WordPress Specific:**
   - Configure WordPress salts automatically
   - Set up .htaccess for permalinks
   - Enable WordPress multisite ready configuration
   - Configure PHP upload limits for recipe images (minimum 10MB)

4. **Backup Strategy:**
   - Automated EBS snapshots for EC2
   - RDS automated backups
   - S3 cross-region replication (optional)

## Expected Traffic Patterns:

- 4,000 daily visitors
- Peak hours: 11 AM - 2 PM, 6 PM - 8 PM (local time)
- Average page size: 2-3 MB (including images)
- Expected storage growth: 5 GB/month

## Deliverables:

1. Complete CloudFormation YAML template (single file or nested stacks)
2. Parameters.json example file
3. Deployment instructions (AWS CLI commands)
4. Architecture diagram description
5. Estimated monthly cost breakdown

Please generate a production-ready, well-documented CloudFormation template following AWS best practices and optimized for the specified traffic patterns.
