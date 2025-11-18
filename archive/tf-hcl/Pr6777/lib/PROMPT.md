# Observability Platform for Payment Processing System

Hey team,

We need to build a comprehensive observability platform for our payment processing infrastructure. The business is getting hammered by compliance audits and we're flying blind on system performance. I've been asked to create this using **Terraform with HCL** so we can manage it alongside our existing infrastructure.

Right now we have no centralized view of what's happening across our payment services. When transactions fail, we're digging through CloudWatch logs manually. When there's a security incident, we're piecing together data from multiple sources. And when auditors ask for compliance reports, we're scrambling to collect evidence. This needs to stop.

The business wants a complete observability solution that gives us real-time visibility into system health, security posture, and compliance status. We need to see everything from application logs to distributed traces to security events in one unified system. And we need it to scale with our growing payment volume without breaking the bank.

## What we need to build

Create an enterprise-grade observability platform using **Terraform with HCL** for a payment processing system running on AWS. This needs to handle centralized logging, distributed tracing, metrics collection, alerting, performance monitoring, and security compliance.

### Core Requirements

1. **Centralized Logging Infrastructure**
   - Aggregate logs from all payment processing services
   - Store logs in structured format for analysis
   - Enable log retention with lifecycle policies (7-30 days)
   - Support log filtering and querying capabilities
   - Include encryption at rest for sensitive payment data

2. **Distributed Tracing System**
   - Trace payment transactions across microservices
   - Identify performance bottlenecks in transaction flow
   - Track API calls between services
   - Correlate traces with logs and metrics
   - Support trace sampling to control costs

3. **Metrics Collection and Visualization**
   - Collect custom metrics from payment applications
   - Create dashboards for business KPIs (transaction volume, success rates)
   - Track latency percentiles (p50, p95, p99)
   - Monitor error rates and failure patterns
   - Visualize system-level metrics (CPU, memory, network)

4. **Alerting and Incident Management**
   - Alert on critical payment processing failures
   - Notify on security anomalies
   - Escalate based on severity levels
   - Support multiple notification channels (email, SNS)
   - Track alert history and response times

5. **Performance Monitoring**
   - Monitor end-to-end transaction latency
   - Track database query performance
   - Identify slow API endpoints
   - Measure external payment gateway response times
   - Detect performance degradation trends

6. **Security Monitoring and Compliance**
   - Monitor AWS account security posture
   - Track API calls and user activities (audit trails)
   - Detect suspicious patterns and anomalies
   - Generate compliance reports for PCI DSS
   - Alert on security configuration changes
   - Track resource configuration compliance

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **CloudWatch** for logs, metrics, custom dashboards, and alarms
- Use **X-Ray** for distributed tracing across services
- Use **CloudTrail** for AWS API audit logging
- Use **EventBridge** for event-driven alerting and routing
- Use **SNS** for multi-channel notifications
- Use **Systems Manager** for operational insights and parameter storage
- Use **Config** for resource configuration tracking and compliance
- Use **Security Hub** for centralized security findings
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no deletion protection)

### Deployment Requirements (CRITICAL)

- All named AWS resources MUST include **environmentSuffix** variable to prevent naming conflicts
- Pattern: `payment-logs-${var.environment_suffix}` or `trace-data-${var.environment_suffix}`
- All resources must be fully destroyable (set `skip_final_snapshot = true` for databases, no retain policies)
- AWS Config IAM role must use correct managed policy: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
- Do NOT create GuardDuty detector in code (account-level resource, manually enabled)
- Include proper error handling and logging for all Lambda functions (if used)
- Tag all resources with `Environment`, `Project`, and `ManagedBy` for cost tracking

### Constraints

- Maintain PCI DSS compliance for payment data handling
- Encrypt all logs and data at rest using AWS managed keys
- Implement least privilege IAM roles for all services
- Keep CloudWatch log retention between 7-30 days to manage costs
- Use X-Ray sampling rules to control tracing costs (sample 5-10% of requests)
- Avoid expensive resources (prefer serverless, avoid NAT gateways)
- All dashboards should focus on payment-specific KPIs
- Security monitoring must detect unauthorized access attempts
- Performance monitoring must track SLAs (99.9% uptime, sub-500ms latency)

## Success Criteria

- **Functionality**: Complete observability stack covering logs, traces, metrics, alerts, and security
- **Performance**: Dashboards load in under 3 seconds, traces available within 1 minute
- **Reliability**: Zero data loss for critical payment events, 99.9% uptime for monitoring services
- **Security**: All data encrypted, audit trails enabled, security findings centralized
- **Compliance**: PCI DSS compliant logging, Config rules for compliance checks
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Cost Efficiency**: Optimized log retention, trace sampling, and serverless architecture
- **Code Quality**: HCL code, well-structured modules, comprehensive variables and outputs

## What to deliver

- Complete Terraform HCL implementation with main.tf, variables.tf, outputs.tf
- CloudWatch log groups for payment application logs
- CloudWatch dashboards for payment KPIs and system metrics
- CloudWatch alarms for critical failures and performance degradation
- X-Ray configuration for distributed tracing
- CloudTrail for AWS API audit logging
- EventBridge rules for event routing and automated responses
- SNS topics for multi-channel notifications
- Systems Manager parameters for operational configuration
- AWS Config rules for compliance validation
- Security Hub integration for centralized security posture
- Unit tests validating resource configurations
- Documentation covering architecture, deployment, and operations
- Example queries for log analysis and troubleshooting
