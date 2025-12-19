# CloudFormation Template for Secure RDS PostgreSQL Database Infrastructure

## Implementation Overview

This CloudFormation template creates a secure, production-ready RDS PostgreSQL database infrastructure for a retail company's inventory management system. The solution implements AWS best practices for security, monitoring, data protection, and high availability while ensuring complete resource cleanup capability.

## Architecture Components

### 1. Network Infrastructure
- **VPC**: Custom VPC with CIDR 10.60.0.0/16 enabling DNS hostnames and support
- **Private Subnets**: Two private subnets (10.60.10.0/24 and 10.60.20.0/24) across different availability zones (us-west-2a and us-west-2b)
- **VPC Endpoint**: Gateway endpoint for S3 to keep backup traffic within AWS network
- **Route Tables**: Dedicated route tables for private subnets with S3 endpoint routing

### 2. Database Infrastructure
- **RDS PostgreSQL**: Version 16.8 on db.t3.micro instance class
- **DB Subnet Group**: Multi-AZ deployment across private subnets for high availability
- **Security Group**: Restricted PostgreSQL access (port 5432) from VPC CIDR only
- **Parameter Group**: Custom PostgreSQL 16 parameters optimized for performance monitoring
- **Key Features**:
  - Performance Insights enabled with 7-day retention
  - Enhanced monitoring with 60-second granularity
  - Automatic backups with 7-day retention period
  - CloudWatch Logs export for postgresql logs
  - GP3 storage type with autoscaling from 20GB to 100GB
  - Deletion protection disabled for clean teardown

### 3. Security Components
- **KMS Key**: Customer-managed key for encrypting RDS storage and S3 backups
- **IAM Roles**:
  - RDS Enhanced Monitoring Role with CloudWatch permissions
  - S3 Backup Role with specific bucket access permissions
- **Encryption**: At-rest encryption for database storage and S3 bucket
- **Network Security**: Database isolated in private subnets with no internet access

### 4. Backup and Recovery
- **S3 Bucket**: Encrypted bucket for manual database backups with:
  - Server-side encryption using KMS
  - Versioning enabled for data protection
  - Lifecycle policies for cost optimization:
    - Delete old versions after 30 days
    - Transition to Standard-IA after 30 days
    - Transition to Glacier after 90 days
  - Public access completely blocked
  - SSL-only access enforced via bucket policy

### 5. Monitoring and Alerting
- **CloudWatch Alarms** with SNS notifications:
  - CPU utilization (threshold: 80%)
  - Database connections (threshold: 15)
  - Free storage space (threshold: 2GB)
  - Read latency (threshold: 200ms)
  - Write latency (threshold: 200ms)
- **SNS Topic**: Email notifications for all alarm states
- **Performance Insights**: Query-level performance analysis

## CloudFormation Template

The complete CloudFormation template is available in `lib/TapStack.json`.

### Template Structure

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure RDS PostgreSQL database infrastructure for retail inventory management",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [...]
    }
  },
  "Parameters": {
    "EnvironmentName": {...},
    "ProjectName": {...},
    "EnvironmentSuffix": {...},
    "DBUsername": {...},
    "DBPassword": {...},
    "DBAllocatedStorage": {...},
    "DBMaxAllocatedStorage": {...},
    "AlarmEmail": {...}
  },
  "Mappings": {
    "RegionConfig": {...}
  },
  "Resources": {
    "VPC": {...},
    "PrivateSubnet1": {...},
    "PrivateSubnet2": {...},
    "PrivateRouteTable1": {...},
    "PrivateRouteTable2": {...},
    "S3VPCEndpoint": {...},
    "DatabaseSecurityGroup": {...},
    "DBSubnetGroup": {...},
    "KMSKey": {...},
    "KMSKeyAlias": {...},
    "RDSEnhancedMonitoringRole": {...},
    "S3BackupRole": {...},
    "DBParameterGroup": {...},
    "DBInstance": {...},
    "BackupBucket": {...},
    "BackupBucketPolicy": {...},
    "SNSTopic": {...},
    "CPUAlarm": {...},
    "DatabaseConnectionsAlarm": {...},
    "FreeStorageSpaceAlarm": {...},
    "ReadLatencyAlarm": {...},
    "WriteLatencyAlarm": {...}
  },
  "Outputs": {
    "VPCId": {...},
    "PrivateSubnet1Id": {...},
    "PrivateSubnet2Id": {...},
    "DatabaseSecurityGroupId": {...},
    "DBInstanceId": {...},
    "DBEndpoint": {...},
    "DBPort": {...},
    "BackupBucketName": {...},
    "BackupBucketArn": {...},
    "KMSKeyId": {...},
    "KMSKeyArn": {...},
    "SNSTopicArn": {...},
    "RDSMonitoringRoleArn": {...},
    "S3BackupRoleArn": {...},
    "S3VPCEndpointId": {...}
  }
}
```

## Key Implementation Details

### Security Best Practices
1. **Network Isolation**: Database deployed in private subnets with no internet access
2. **Encryption**: KMS encryption for both database storage and S3 backups
3. **Access Control**: Security group restricts database access to VPC CIDR only
4. **SSL Enforcement**: S3 bucket policy denies non-SSL connections
5. **Public Access Prevention**: S3 bucket blocks all public access

### High Availability and Reliability
1. **Multi-AZ Deployment**: Database subnet group spans two availability zones
2. **Automated Backups**: 7-day retention with point-in-time recovery
3. **Storage Autoscaling**: Automatic expansion from 20GB to 100GB
4. **Performance Monitoring**: Performance Insights and enhanced monitoring enabled

### Cost Optimization
1. **Lifecycle Policies**: Automatic transition to cheaper storage classes
2. **VPC Endpoint**: Reduces data transfer costs for S3 backup operations
3. **GP3 Storage**: Better price-performance than GP2
4. **Old Version Cleanup**: Automatic deletion of old S3 object versions

### Operational Excellence
1. **Comprehensive Monitoring**: Five CloudWatch alarms for critical metrics
2. **Email Notifications**: SNS topic for real-time alerts
3. **CloudWatch Logs Export**: PostgreSQL logs available for analysis
4. **Resource Tagging**: Consistent tagging for resource management
5. **Clean Teardown**: DeletionPolicy set to Delete for all resources

### Critical Improvements Made for Production Deployment

1. **Environment Suffix Parameter**: Added to ensure unique resource names across deployments
2. **Deletion Policies**: Changed from "Snapshot" to "Delete" to enable complete resource cleanup
3. **Resource Naming**: Updated to use environment suffix for globally unique names (S3 buckets, KMS aliases, RDS instances, SNS topics, CloudWatch alarms)
4. **S3 Bucket Name**: Changed to lowercase to comply with S3 naming requirements
5. **CloudWatch Alarms**: Fixed naming to use environment suffix for proper deployment isolation

### Deployment Considerations
1. **Environment Suffix**: Unique suffix prevents resource naming conflicts
2. **Parameter Validation**: Input constraints ensure valid configurations
3. **Cross-Stack References**: All outputs exported for potential stack dependencies
4. **Region Flexibility**: Mappings support deployment in different regions

This solution provides a secure, scalable, and maintainable database infrastructure suitable for production workloads while maintaining the ability to completely tear down all resources when needed.