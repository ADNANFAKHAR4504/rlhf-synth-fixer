# PostgreSQL to Aurora Migration with DMS - CloudFormation Template

## Task Overview
Create a CloudFormation template to orchestrate migration of on-premises PostgreSQL databases to Aurora using Database Migration Service.

## Business Context
A financial services company is migrating their legacy monolithic application from on-premises infrastructure to AWS. The application currently runs on physical servers with local PostgreSQL databases and file storage. The migration must maintain data integrity while minimizing downtime during the cutover period.

## Architecture
Production migration environment deployed in us-east-1 with multi-AZ Aurora PostgreSQL cluster, DMS replication instances in private subnets, and Application Load Balancer in public subnets. VPC spans 3 availability zones with separate subnet tiers for web, application, and database layers. Requires AWS CLI configured with appropriate IAM permissions for CloudFormation, DMS, and Route 53. Target architecture includes Auto Scaling groups for instances running the migrated application, with buckets replacing local file storage. Network configuration includes VPC peering or Direct Connect to on-premises datacenter for DMS replication.

## Requirements

### Core Requirements
1. **DMS Endpoints**: Create source and target DMS endpoints with SSL encryption enabled
2. **DMS Replication Instance**: Deploy DMS replication instance in private subnet with t3.medium instance class
3. **DMS Migration Task**: Configure DMS migration task for full load plus CDC with validation enabled
4. **Aurora PostgreSQL Cluster**: Create Aurora PostgreSQL cluster with 2 reader instances across multiple AZs
5. **Route 53 Routing**: Implement Route 53 hosted zone with weighted routing policies for gradual traffic shift
6. **Parameter Store**: Store database passwords in Parameter Store with SecureString type
7. **CloudWatch Dashboard**: Configure CloudWatch dashboard showing replication metrics and lag time
8. **SNS Alerting**: Create SNS topic for alerting when replication lag exceeds threshold
9. **Stack Outputs**: Output DMS task ARN, Aurora cluster endpoint, and Route 53 hosted zone ID

### Constraints and Best Practices
- Use AWS Database Migration Service (DMS) for continuous data replication
- Implement blue-green deployment strategy with Route 53 weighted routing
- All databases must use encrypted storage with customer-managed keys
- Configure DMS endpoints with SSL/TLS encryption for data in transit
- Use Parameter Store for database credentials
- Enable CloudWatch alarms for DMS replication lag exceeding 300 seconds
- Set DeletionPolicy to Snapshot for all instances

## Expected Output
A complete CloudFormation template in JSON format that automates the database migration infrastructure setup, enabling zero-downtime cutover from on-premises PostgreSQL to Aurora PostgreSQL with continuous replication monitoring.

## Success Criteria
- Template is valid CloudFormation JSON
- All resources are properly configured with required parameters
- Security best practices are implemented (encryption, Parameter Store for secrets)
- Stack outputs provide necessary endpoints and identifiers
- Template supports cross-stack references via Exports
