Hey team,

We've got a critical project for a financial services company that needs a robust disaster recovery solution for their transaction processing system. Their main operations run in us-east-1, but they need us-west-2 as a hot DR site with automated failover. The business requirement is clear: minimal data loss and downtime when things go south, with an RTO under 5 minutes.

The challenge here is building a complete multi-region architecture that handles database replication, session management, traffic routing, and automated failover. This is mission-critical financial infrastructure, so we need to get this right. We're talking RDS Aurora with cross-region replicas, DynamoDB global tables for session data, and Route 53 health checks that can detect and respond to failures within 30 seconds.

I've been asked to implement this using **Terraform with HCL** to give us a modular, workspace-based approach that can manage both regions efficiently.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Terraform with HCL** for a transaction processing system spanning us-east-1 (primary) and us-west-2 (DR).

### Core Requirements

1. **Database Layer**
   - Deploy RDS Aurora PostgreSQL clusters in both us-east-1 and us-west-2
   - Configure cross-region read replicas between regions
   - Enforce SSL/TLS encryption for all replication connections
   - Set up CloudWatch alarms for replication lag exceeding 60 seconds

2. **Session Management**
   - Configure DynamoDB global tables across both regions
   - Use on-demand billing mode for cost optimization
   - Ensure automatic replication of session data

3. **Traffic Routing and Health Monitoring**
   - Set up Route 53 hosted zone with failover routing policy
   - Create primary and secondary record sets pointing to respective regions
   - Implement health checks monitoring the primary region's ALB endpoint
   - Configure health checks to detect failures within 30 seconds

4. **Storage and Static Assets**
   - Create S3 buckets in both us-east-1 and us-west-2
   - Enable versioning on all buckets
   - Configure cross-region replication rules for static assets
   - Ensure automatic sync between regions

5. **Compute Layer**
   - Deploy identical Lambda functions in both regions for transaction processing
   - Package Lambda functions as ZIP files stored in S3
   - Ensure functions can operate independently in either region

6. **Network Connectivity**
   - Configure VPC peering between us-east-1 and us-west-2
   - Set up proper route table entries for cross-region communication
   - Create private subnets in each region with 3 availability zones
   - Deploy NAT gateways for outbound traffic

7. **Notifications and Monitoring**
   - Set up SNS topics in both regions for failover notifications
   - Configure CloudWatch alarms for critical metrics
   - Ensure alerts reach operations team during failover events

8. **Access Control**
   - Create IAM roles for cross-region resource access
   - Implement assume role policies for secure cross-region operations
   - Follow least privilege principle with no wildcard actions
   - Ensure proper permissions for replication and failover

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS Aurora PostgreSQL** with Global Database feature
- Use **DynamoDB** global tables for session management
- Use **Route 53** for DNS failover with health checks
- Use **S3** with cross-region replication
- Use **Lambda** for transaction processing
- Use **VPC peering** for cross-region networking
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for notifications
- Use **IAM** for access control
- Use **Application Load Balancer** as health check endpoint
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** (primary) and **us-west-2** (DR) regions
- Use Terraform 1.5+ features and AWS provider 5.x

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or DeletionProtection)
- Use modular Terraform structure with separate modules for each service
- Utilize Terraform workspaces for region management
- Every named resource must include ${var.environment_suffix} parameter
- This is mandatory to support parallel deployments and testing
- Examples: bucket name should be "transaction-assets-${var.environment_suffix}"
- ALB name should be "transaction-alb-${var.environment_suffix}"

### Constraints

- RDS read replicas must use encrypted connections with SSL/TLS enforcement
- Route 53 health checks must detect failures within 30 seconds
- All S3 buckets must use versioning and cross-region replication
- Lambda functions must be packaged as ZIP files stored in S3
- DynamoDB global tables must use on-demand billing mode
- IAM roles must follow least privilege with no wildcard actions
- Infrastructure should automatically failover when health checks detect primary region failure
- All resources must be fully destroyable after testing
- Include proper error handling and validation
- Each region should have 3 availability zones

## Success Criteria

- **Functionality**: Complete multi-region DR setup with automated failover
- **Performance**: RTO under 5 minutes, health check response within 30 seconds
- **Reliability**: RDS replication lag monitoring, automatic DNS failover
- **Security**: SSL/TLS encrypted replication, least privilege IAM policies, no wildcard actions
- **Resource Naming**: All resources include environment_suffix for parallel deployment support
- **Code Quality**: Modular HCL code, well-tested, comprehensive documentation
- **Destroyability**: All resources can be torn down cleanly without retention policies

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Separate modules for RDS, DynamoDB, Route 53, S3, Lambda, VPC, CloudWatch, SNS, IAM, and ALB
- Workspace configuration for managing both regions
- Unit tests for all components
- Documentation including deployment instructions and failover procedures
- Output values for all critical resources (endpoints, ARNs, DNS names)
