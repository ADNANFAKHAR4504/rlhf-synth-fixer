Hey team,

We need to build a blue-green deployment infrastructure for our payment processing system migration to AWS. The business is moving their legacy payment infrastructure from on-premises to the cloud while maintaining PCI DSS compliance throughout the migration. The critical requirement is zero downtime during the cutover.

This is a financial services application handling credit card transactions, so compliance and security are non-negotiable. We need separate blue and green environments that can run in parallel while we gradually shift traffic using weighted routing. The whole system needs to support instant failback within 5 minutes if anything goes wrong during migration.

The architecture needs to handle cross-region disaster recovery as well, with read replicas in us-east-2. All data must be encrypted both at rest and in transit, and we need comprehensive monitoring and alerting throughout the migration process.

## What we need to build

Create a dual-environment payment processing infrastructure using **Pulumi with Python** for AWS. The system needs to support blue-green deployment with automatic failover and cross-region disaster recovery.

### Core Requirements

1. **Dual VPC Architecture**
   - Separate VPCs for blue (existing) and green (new) environments with /16 CIDR blocks
   - Transit Gateway for inter-VPC communication between blue and green
   - Each VPC having 3 private subnets across availability zones
   - NAT Gateways in each availability zone for outbound connectivity
   - VPC Flow Logs for audit compliance

2. **Application Load Balancer**
   - Weighted target groups to control traffic distribution between blue and green environments
   - Health checks configured for both environment targets
   - AWS WAF integration to block OWASP Top 10 vulnerabilities
   - Export ALB DNS name as output

3. **RDS Aurora MySQL Clusters**
   - Aurora MySQL clusters in both blue and green environments
   - Encrypted storage using AWS KMS customer-managed keys
   - Automated backups enabled with retention
   - Cross-region read replicas in us-east-2 for disaster recovery
   - Skip final snapshot for destroyability
   - Export RDS endpoints for both blue and green environments as outputs

4. **Lambda Functions**
   - Payment processing Lambda functions for transaction handling
   - Environment-specific configurations for blue and green
   - Proper IAM roles with least privilege access
   - Integration with SQS for message processing
   - Compatible with Node.js 18+ runtime (avoid deprecated aws-sdk v2)

5. **SQS Queues**
   - Main processing queues for transaction messages
   - Dead letter queues for failed transaction handling
   - Configured with appropriate retention periods for compliance

6. **Route 53 Health Checks and Routing**
   - Health checks for both blue and green environments
   - Failover routing policies for automatic environment switching
   - Weighted routing for gradual traffic migration

7. **CloudWatch Monitoring**
   - Dashboards to monitor migration progress
   - System health metrics for both environments
   - Alarms for critical thresholds
   - Export CloudWatch dashboard URL as output

8. **Systems Manager Parameter Store**
   - Environment-specific configurations for blue and green
   - Secure string parameters for sensitive data using KMS encryption

9. **AWS Secrets Manager**
   - Database credentials stored as secrets
   - API keys and encryption keys
   - Automatic rotation policies

10. **SNS Topics**
    - Alerting on migration events
    - Alerting on failures and threshold breaches
    - Email subscriptions configured for operations team

11. **IAM Roles and Policies**
    - Least privilege access for all services
    - Proper trust relationships between services
    - Separate roles for blue and green environments

12. **VPC Endpoints**
    - S3 VPC endpoint for cost optimization
    - DynamoDB VPC endpoint for private connectivity
    - Secrets Manager endpoint for secure access

### Security and Compliance Constraints

**CRITICAL - PCI DSS Compliance Requirements**:
- Use AWS KMS customer-managed keys for all encryption operations
- Network isolation with separate VPCs for blue and green environments
- AWS WAF rules configured on ALB to block OWASP Top 10 vulnerabilities
- AWS Secrets Manager for all database credentials and API keys
- VPC Flow Logs enabled for audit trail
- CloudWatch Logs for all services for compliance monitoring
- All data at rest must be encrypted
- All data in transit must use TLS 1.2 or higher
- AWS Config for continuous compliance monitoring

**Additional Security Requirements**:
- Automatic failback capability to blue environment within 5 minutes
- Security groups with minimal required access (no 0.0.0.0/0 for ingress except ALB)
- Resource tagging for cost allocation and compliance tracking
- No GuardDuty detector creation (account-level limitation - see deployment requirements)

### Technical Environment

- Deploy to **us-east-1** region (primary)
- Cross-region read replicas in **us-east-2** region
- Pulumi CLI 3.x with Python 3.9+
- Use **environment_suffix** parameter for resource naming uniqueness
- At least 80% of resources must include environment_suffix in names
- Follow naming convention: `{resource-type}-{environment-suffix}`

### Expected Outputs

The infrastructure must export:
- ALB DNS name
- RDS Aurora endpoints for both blue and green environments
- CloudWatch dashboard URL

### Deployment Requirements (CRITICAL)

**Resource Naming**:
- All named resources MUST include **environment_suffix** parameter for uniqueness
- Use format: `f"{resource_name}-{environment_suffix}"` for bucket names, cluster names, queue names, etc.
- This prevents resource conflicts during parallel testing

**Destroyability**:
- All resources must be destroyable after testing
- No RemovalPolicy.RETAIN or DeletionPolicy=Retain policies
- RDS clusters must have `skip_final_snapshot=True` and `deletion_protection=False`
- S3 buckets managed by infrastructure cleanup process

**Service-Specific Requirements**:
- **GuardDuty**: DO NOT create GuardDuty detector (account-level resource, only one per account)
- **AWS Config**: Use correct IAM managed policy `service-role/AWS_ConfigRole` (NOT `ConfigRole` or `AWS_ConfigRole` without service-role prefix)
- **Lambda**: For Node.js 18+, extract data from event object rather than importing aws-sdk v2
- **NAT Gateway**: Cost consideration - creates hourly charges, minimize count where possible
- **Aurora**: Prefer Aurora Serverless v2 for faster provisioning and auto-scaling if possible

### Success Criteria

- **Functionality**: Complete blue-green architecture with traffic control
- **Performance**: Fast failover within 5 minutes between environments
- **Reliability**: Cross-region DR with automated failover
- **Security**: PCI DSS compliant with encryption, WAF, audit logging
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Destroyability**: All resources can be destroyed without manual intervention
- **Code Quality**: Clean Pulumi Python code, well-tested, documented
- **Compliance**: VPC Flow Logs, CloudWatch Logs, AWS Config enabled

## What to deliver

- Complete Pulumi Python implementation
- VPC networking with Transit Gateway
- Application Load Balancer with WAF
- RDS Aurora MySQL clusters (blue and green)
- Lambda functions for payment processing
- SQS queues with dead letter queues
- Route 53 health checks and routing
- CloudWatch dashboards and alarms
- Systems Manager Parameter Store configuration
- AWS Secrets Manager for credentials
- SNS topics for alerting
- IAM roles with least privilege
- VPC endpoints for cost optimization
- Unit tests for all components
- Documentation and deployment instructions