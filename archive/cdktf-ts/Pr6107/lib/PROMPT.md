# Multi-Region Disaster Recovery Architecture for Payment Processing Application

## Platform and Language Requirements

**CRITICAL**: This task MUST be implemented using **CDKTF with TypeScript**.

## Background

A financial services company needs to implement a disaster recovery solution for their payment processing system. The current single-region deployment has caused significant revenue loss during recent AWS outages. The board has mandated a multi-region active-passive architecture with automated failover capabilities.

## Infrastructure Requirements

Create a Terraform configuration using CDKTF with TypeScript to implement a multi-region disaster recovery architecture for a payment processing application. The configuration must:

### 1. Provider Configuration
- Define provider blocks for both **us-east-1 (primary)** and **us-east-2 (DR)** regions with appropriate aliases

### 2. Database Layer - RDS Aurora Global Database
- Create RDS Aurora Global Database cluster with a **primary cluster in us-east-1**
- Configure **secondary read-only cluster in us-east-2**
- Use **RDS Aurora PostgreSQL 13.7** with global database configuration
- Enable appropriate backup and replication settings

### 3. Compute Layer - Auto Scaling Groups
- Set up Auto Scaling Groups in both regions
- Configure launch templates referencing region-specific AMIs
- Use **t3.large instances** as specified
- Ensure proper scaling policies and health checks

### 4. Load Balancing - Application Load Balancers
- Configure Application Load Balancers in both regions
- Set up target group attachments to the Auto Scaling Groups
- Implement appropriate health checks and routing rules

### 5. DNS and Failover - Route 53
- Implement Route 53 failover routing policy
- Configure health checks monitoring the primary ALB endpoint
- Ensure automatic DNS failover when primary region health checks fail
- Use existing Route 53 hosted zone for DNS management

### 6. Storage - S3 Cross-Region Replication
- Create S3 buckets in both regions for static assets
- Enable cross-region replication rules
- Enable versioning on all buckets
- Configure appropriate lifecycle policies

### 7. Monitoring - CloudWatch Alarms
- Define CloudWatch alarms for:
  - Database replication lag
  - ALB unhealthy target count
  - ASG instance health
- Configure cross-region CloudWatch dashboards

### 8. Notifications - SNS Topics
- Configure SNS topics in both regions for alarm notifications
- Set up cross-region subscriptions for critical alerts
- Ensure proper notification delivery for failover events

### 9. Security - IAM Roles and Policies
- Implement IAM roles and policies for cross-region resource access
- Configure appropriate permissions for replication
- Follow least privilege principles

### 10. Resource Tagging
- Add consistent resource tagging across ALL resources with:
  - **Environment** tag
  - **CostCenter** tag
  - **DR-Role** tag (e.g., "primary", "dr", "global")

## Environment Details

- **Multi-region AWS deployment** spanning us-east-1 (primary) and us-east-2 (DR) regions
- **VPCs in both regions** with 3 availability zones each
- **Private subnets** for database and application tiers
- **Public subnets** for Application Load Balancers
- **NAT gateways** for outbound connectivity
- **Terraform version**: 1.5+
- **AWS provider version**: 5.0+
- AWS CLI must be configured with appropriate multi-region permissions

## Mandatory Constraints

1. **Primary region must be us-east-1 with failover to us-east-2**
2. **RTO (Recovery Time Objective) must be under 5 minutes**
3. **Use Route 53 health checks for automatic DNS failover**
4. **Database replication must use RDS Aurora Global Database**
5. **Application tier must use Auto Scaling Groups with cross-region AMI copying**
6. **All resources must be tagged with Environment, CostCenter, and DR-Role tags**
7. **S3 buckets must have cross-region replication enabled with lifecycle policies**
8. **Monitoring must include CloudWatch cross-region dashboards and SNS alerting**

## Expected Output

A modular Terraform configuration with separate files for:
- **Networking** resources (VPCs, subnets, NAT gateways, routing)
- **Compute** resources (Auto Scaling Groups, launch templates)
- **Database** resources (RDS Aurora Global Database clusters)
- **Storage** resources (S3 buckets with replication)
- **Monitoring** resources (CloudWatch alarms and dashboards)
- **DNS** resources (Route 53 health checks and failover routing)

The configuration should support `terraform plan` and `terraform apply` commands that create a fully functional **active-passive DR setup** with automated failover triggering when primary region health checks fail.

## Success Criteria

- All infrastructure components are deployed successfully in both regions
- RDS Aurora Global Database is configured with primary in us-east-1 and replica in us-east-2
- Route 53 health checks monitor primary ALB and trigger failover automatically
- S3 cross-region replication is active and tested
- CloudWatch alarms are configured and SNS notifications are working
- All resources are properly tagged
- Infrastructure can survive a complete us-east-1 region outage with RTO < 5 minutes
- Configuration is modular and maintainable
