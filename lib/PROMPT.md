Hey team,

We've been running our payment processing infrastructure for a while now, and while it works, we're burning through way too much budget. The finance team just flagged our AWS bill is up 40% quarter-over-quarter, and they want us to optimize without compromising reliability or security. We need to modernize this infrastructure using **AWS CDK with Python** to implement comprehensive cost optimization while also leveling up our security and monitoring posture.

The current setup has some obvious problems. We're running Lambda functions with 3008MB of memory when most only need 512-1024MB. Our DynamoDB tables are on provisioned capacity even though traffic is unpredictable. We have multiple API Gateways when we should consolidate. And we're paying for NAT Gateways in every environment when dev could use cheaper alternatives. The list goes on.

But this isn't just about cutting costs. The security team has been asking for better threat detection and DDoS protection. Operations wants better alerting for anomalies. Compliance needs audit trails and encryption everywhere. So we need to do this right - optimize costs while making the infrastructure more secure, observable, and compliant.

## What we need to build

Create a comprehensive payment processing infrastructure using **AWS CDK with Python** that optimizes costs, enhances security, and improves operational monitoring. This needs to demonstrate significant cost savings while meeting enterprise security and compliance standards.

### Core Cost Optimization Requirements

1. **Lambda Function Optimization**
   - Right-size Lambda memory from 3008MB to 512-1024MB based on actual usage
   - Implement ARM-based Graviton2 processors for better price-performance
   - Configure appropriate timeout values to prevent overcharging
   - Use reserved concurrency limits to prevent runaway costs

2. **DynamoDB Cost Optimization**
   - Switch from provisioned to on-demand billing mode for unpredictable workloads
   - Implement appropriate capacity settings
   - Enable point-in-time recovery for data protection

3. **API Gateway Consolidation**
   - Consolidate multiple APIs into single REST API Gateway
   - Implement proper resource organization and method configurations
   - Configure request/response transformations efficiently

4. **Compute and Network Optimization**
   - Use NAT Instances instead of NAT Gateways for development environments
   - For production, optimize NAT Gateway placement (single gateway vs multi-AZ)
   - Implement EC2 Auto Scaling with CPU and memory-based policies
   - Right-size EC2 instances based on actual workload requirements

5. **Storage Lifecycle Management**
   - Implement S3 lifecycle policies with 30-day transition to Glacier
   - Configure appropriate storage classes for different data access patterns
   - Enable S3 Intelligent-Tiering where applicable

6. **Logging and Monitoring Optimization**
   - Set CloudWatch Log Groups to 7-day retention for cost savings
   - Implement log filtering to reduce ingestion costs
   - Use CloudWatch Insights for efficient log analysis

7. **Cost Visibility and Alerting**
   - Create CloudWatch dashboards showing cost metrics by service
   - Implement cost comparison reporting before and after optimization
   - Set up automated cost anomaly alerts

### Advanced Security Requirements

8. **DDoS Protection and Rate Limiting**
   - Deploy AWS Shield Advanced subscription for enhanced DDoS protection on API Gateway
   - Implement AWS WAF WebACL on API Gateway with rate limiting rules
   - Configure WAF rules for SQL injection protection
   - Add XSS (Cross-Site Scripting) protection rules

9. **Threat Detection and Monitoring**
   - Enable Amazon GuardDuty detector for intelligent threat detection (note: account-level service, only one detector per account - check if exists before creating)
   - Configure GuardDuty findings to route to SNS for alerting
   - Implement threat detection for unusual API calls and compromised instances

10. **Secrets and Encryption Management**
    - Use AWS Secrets Manager for database credentials and API keys
    - Implement automatic secret rotation where applicable
    - Encrypt all data at rest using AWS KMS
    - Encrypt all data in transit using TLS

### Reliability and Fault Tolerance

11. **Asynchronous Processing**
    - Implement SQS Queue for asynchronous payment processing
    - Configure Dead Letter Queue (DLQ) for failed message handling
    - Set appropriate message retention and visibility timeout

12. **Health Checks and Alarms**
    - CloudWatch Alarm: Lambda error rate exceeds 5%
    - CloudWatch Alarm: DynamoDB read/write throttling detected
    - CloudWatch Alarm: API Gateway 4xx errors exceed 10%
    - CloudWatch Alarm: API Gateway 5xx errors exceed 10%
    - CloudWatch Alarm: EC2 CPU utilization exceeds 80%
    - CloudWatch Alarm: Cost anomalies detected

13. **Automated Event Response**
    - Implement EventBridge Rules to trigger automated responses
    - Route security findings to automated remediation workflows
    - Trigger cost optimization actions based on anomaly detection
    - Integrate operational events with SNS notifications

### Observability and Notifications

14. **Multi-Channel Alerting**
    - Create SNS Topic for cost anomaly alerts
    - Create SNS Topic for security findings (GuardDuty, WAF)
    - Create SNS Topic for operational alerts (Lambda errors, API issues, EC2 health)
    - Configure appropriate subscribers for each topic

15. **Cost Anomaly Detection**
    - Integrate with AWS Cost Explorer for anomaly detection
    - Configure cost anomaly detection with SNS notifications
    - Set appropriate thresholds for different service categories
    - Enable historical cost comparison reporting

16. **Comprehensive CloudWatch Dashboards**
    - Cost metrics dashboard with breakdown by service
    - Security posture dashboard with WAF blocks, GuardDuty findings
    - Operational health dashboard with Lambda metrics, API Gateway metrics, DynamoDB performance
    - Resource utilization dashboard with EC2, memory, network metrics

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use Lambda for serverless compute (Python 3.11+ runtime)
- Use DynamoDB for payment transaction storage
- Use API Gateway REST API for payment endpoints
- Use SQS for asynchronous payment queue with DLQ
- Use S3 for payment audit logs and archives
- Use CloudWatch for logs, metrics, alarms, and dashboards
- Use EC2 with Auto Scaling for any stateful workloads
- Use VPC with optimized networking (NAT optimization)
- Use WAF WebACL for API Gateway protection
- Use Shield Advanced for DDoS protection
- Use GuardDuty for threat detection (check account-level limitation)
- Use SNS for multi-channel alerting
- Use Secrets Manager for credential management
- Use Cost Explorer for cost anomaly detection
- Use EventBridge for automated event response
- Use Systems Manager Parameter Store for configuration parameters
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `resource-type-{environment_suffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no DeletionProtection flags)

### Deployment Requirements (CRITICAL)

- GuardDuty is an account-level service - only ONE detector per AWS account/region. Do not create GuardDuty detector if one already exists. Include check or document manual setup requirement.
- Lambda functions using Node.js 18+ do not have AWS SDK v2 by default - use SDK v3 or extract data from event objects
- All named resources (S3 buckets, DynamoDB tables, Lambda functions, etc.) MUST include environmentSuffix parameter in their names
- No RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- No DeletionProtection: true flags
- RDS/Aurora: set skip_final_snapshot=true for destroyability
- Include proper error handling and input validation in Lambda functions

### Constraints

- Optimize for cost reduction while maintaining security and reliability
- Security cannot be compromised for cost savings
- All data must be encrypted at rest and in transit
- Must meet compliance requirements (PCI DSS applicable for payment processing)
- Must provide comprehensive monitoring and alerting
- Must enable automated threat detection and response
- Must support asynchronous payment processing for reliability
- Infrastructure must be reproducible across environments using environmentSuffix

## Success Criteria

- **Cost Optimization**: Demonstrate 40%+ cost reduction through Lambda rightsizing, DynamoDB on-demand, API consolidation, NAT optimization, S3 lifecycle policies, and log retention
- **Security**: WAF protection with rate limiting and injection prevention, Shield Advanced for DDoS, GuardDuty threat detection, encryption everywhere, proper IAM least privilege
- **Compliance**: S3 encryption, resource tagging, public access blocking, audit logging enabled
- **Reliability**: SQS with DLQ for fault tolerance, CloudWatch alarms for operational issues, multi-AZ where appropriate, health checks
- **Observability**: Comprehensive CloudWatch dashboards for cost/security/operations, SNS alerting for all critical events, Cost Explorer integration for anomaly detection
- **Resource Naming**: All resources include environmentSuffix for parallel deployment support
- **Destroyability**: All resources can be cleanly destroyed after testing
- **Code Quality**: Clean Python CDK code, well-structured, follows AWS best practices, includes inline documentation

## What to deliver

- Complete AWS CDK Python implementation with all 20+ requirements
- Lambda functions (payment processing, event handlers)
- DynamoDB tables with on-demand billing
- API Gateway REST API with consolidated endpoints
- SQS Queue with DLQ for async processing
- S3 buckets with lifecycle policies
- VPC with optimized networking (NAT Instance for dev, NAT Gateway for prod)
- EC2 Auto Scaling groups with policies
- WAF WebACL with security rules
- Shield Advanced subscription
- GuardDuty integration (with account-level awareness)
- SNS Topics for alerting (cost, security, operations)
- Secrets Manager for credentials
- Cost Explorer anomaly detection integration
- EventBridge Rules for automated responses
- CloudWatch Alarms for all critical metrics
- CloudWatch Dashboards for visibility
- Unit tests for all stack components
- Documentation explaining cost optimization strategies and deployment process
