Hey team,

We need to build an active-passive disaster recovery architecture for our payment processing system. Our financial services company requires this to maintain 99.99% availability with automatic failover capabilities. The business needs the system to automatically recover within 5 minutes of detecting a regional outage, and compliance mandates that all transaction data must be replicated across regions with point-in-time recovery.

I've been asked to create this infrastructure using **Terraform with HCL**. The architecture will span two AWS regions - us-east-1 as primary and us-west-2 as secondary. We need to handle payment webhook processing, session management, and ensure all transaction data remains consistent across regions.

The challenge here is making sure everything is properly replicated and can failover seamlessly while keeping costs reasonable. The secondary region should run at minimal capacity until we actually need it for failover. We also need comprehensive monitoring so we know immediately if something goes wrong with the primary region.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Terraform with HCL** for a payment processing system with automatic failover capabilities.

### Core Requirements

1. **Database Layer**
   - Deploy Aurora Global Database with PostgreSQL 13.7
   - Primary cluster in us-east-1, secondary in us-west-2
   - Configure automated backups with 7-day retention
   - Enable point-in-time recovery
   - Aurora must meet RPO under 1 minute

2. **Compute Layer**
   - Create Lambda functions in both regions for payment webhook processing
   - Functions need 1GB memory allocation
   - Deploy identical function code and configuration to both regions
   - Functions must access both Aurora and DynamoDB

3. **DNS and Traffic Management**
   - Configure Route 53 hosted zone with health checks
   - Implement primary and secondary failover routing policies
   - Health checks must detect regional outages
   - Failover must complete within 5 minutes (RTO requirement)

4. **Session Management**
   - Implement DynamoDB global tables for session data
   - Use on-demand billing mode
   - Enable auto-scaling for capacity management
   - Automatic replication between regions

5. **Monitoring and Alerting**
   - Set up CloudWatch alarms monitoring Aurora cluster health
   - Create SNS topic for notifications
   - Alarms should trigger on primary region failures
   - Notifications for failover events

6. **Networking**
   - Create VPCs in both us-east-1 and us-west-2
   - Each VPC needs 3 private subnets across availability zones
   - Establish VPC peering connection between regions
   - Proper security groups for Lambda and Aurora access

7. **Security and Access Control**
   - Implement IAM roles with least-privilege policies
   - Lambda execution role must access Aurora and DynamoDB
   - Cross-region access permissions where needed
   - Proper encryption for data at rest and in transit

8. **Resource Organization**
   - Add resource tags: Environment=DR, Region=primary/secondary, CostCenter=payments
   - Resource names must include environmentSuffix for uniqueness
   - Follow naming convention: resource-type-environment-suffix
   - Consistent tagging across all resources

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use Terraform 1.5+ with AWS provider 5.x
- Modular structure with separate modules for each region
- Remote state backend using S3 and DynamoDB for state locking
- Use **Aurora Global Database** for multi-region database replication
- Use **Lambda** for serverless payment processing
- Use **Route 53** for DNS failover management
- Use **DynamoDB Global Tables** for session replication
- Use **CloudWatch** and **SNS** for monitoring and alerts
- Use **VPC** infrastructure with proper subnet design
- Use **IAM** for security and access control
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** (primary) and **us-west-2** (secondary) regions

### Optional Enhancements

If time permits, consider adding:
- AWS Backup for centralized backup management across regions
- EventBridge rules for automated failover triggers
- Systems Manager Parameter Store for configuration management across regions

### Constraints

- RTO (Recovery Time Objective) must be under 5 minutes
- RPO (Recovery Point Objective) must be under 1 minute
- Aurora Global Database must span exactly 2 regions
- Cost optimization: secondary region runs minimal capacity until failover
- All resources must be destroyable (no Retain policies)
- Use consistent naming with region suffixes
- CloudWatch alarms must trigger SNS notifications
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete disaster recovery setup with automatic failover between us-east-1 and us-west-2
- **Performance**: RTO under 5 minutes, RPO under 1 minute
- **Reliability**: Aurora Global Database with proper replication, Lambda deployed in both regions
- **Security**: IAM least-privilege policies, encrypted data, proper network isolation
- **Monitoring**: CloudWatch alarms monitoring cluster health, SNS notifications configured
- **Resource Naming**: All resources include environmentSuffix in naming
- **Cost Optimization**: Secondary region at minimal capacity until failover needed
- **Code Quality**: Modular Terraform HCL, well-tested, comprehensive documentation

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Aurora Global Database spanning us-east-1 and us-west-2
- Lambda functions for payment processing in both regions
- Route 53 failover routing with health checks
- DynamoDB global tables for session management
- CloudWatch alarms and SNS topics for monitoring
- VPCs with private subnets and VPC peering
- IAM roles and policies
- Unit tests for configuration validation
- Integration tests for deployed resources
- Documentation and deployment instructions
