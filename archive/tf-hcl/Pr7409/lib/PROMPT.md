Hey team,

We need to build a comprehensive monitoring and observability platform for our payment processing infrastructure. The business is processing thousands of transactions per hour, and we need real-time visibility into system health, performance anomalies, and compliance logging. I've been asked to create this using Terraform with HCL.

The current setup is running on ECS Fargate with Node.js microservices hitting an RDS Aurora PostgreSQL cluster through Application Load Balancers. Everything is spread across 3 availability zones in us-east-1. The compliance team requires 30-day log retention and cross-account log sharing to the central security account. We need to catch issues before they impact customers and have proper alerting channels for different severity levels.

## What we need to build

Create a production-ready observability platform using **Terraform with HCL** that provides real-time monitoring, intelligent alerting, and centralized log aggregation for a payment processing system running on AWS ECS.

### Core Requirements

1. **CloudWatch Dashboards and Metrics**
   - Deploy CloudWatch dashboards with custom widgets showing ECS service metrics
   - Include RDS performance monitoring with query performance insights
   - Configure custom CloudWatch metrics with 1-minute resolution for critical business metrics
   - Enable CloudWatch Container Insights for ECS cluster visibility

2. **Alerting Infrastructure**
   - Configure SNS topics with multiple subscription endpoints for critical, warning, and info severity levels
   - Support both email and SMS subscriptions for different alert types
   - Set up CloudWatch alarms for CPU utilization, memory usage, and custom application metrics
   - Implement composite alarms that trigger only when multiple conditions are met simultaneously

3. **Log Processing and Analysis**
   - Create CloudWatch Logs metric filters to extract error rates and latency metrics from application logs
   - Set up saved CloudWatch Logs Insights queries for common troubleshooting patterns
   - Configure 30-day log retention policy to meet compliance requirements
   - Enable cross-account log sharing to central security account for audit purposes

4. **Synthetic Monitoring**
   - Implement CloudWatch Synthetics canaries to monitor API endpoints every 5 minutes
   - Configure canaries to test critical payment processing workflows
   - Alert on canary failures indicating endpoint availability issues

5. **Optional Advanced Features**
   - Add EventBridge rules to trigger Lambda functions for alarm enrichment
   - Implement X-Ray service map for distributed tracing across microservices
   - Deploy Grafana on EC2 for advanced visualization dashboards

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **CloudWatch** for dashboards, metrics, and alarms
- Use **CloudWatch Container Insights** for ECS cluster monitoring
- Use **CloudWatch Synthetics** for endpoint monitoring
- Use **SNS** for multi-channel alerting with different severity topics
- Use **CloudWatch Logs** with metric filters and cross-account sharing
- Optionally use **EventBridge**, **Lambda**, **X-Ray**, and **EC2** for enhanced features
- Resource names must include **environmentSuffix** parameter for uniqueness across deployments
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Tag all resources appropriately for cost tracking and compliance

### Infrastructure Context

- Compute: ECS Fargate clusters running Node.js microservices
- Database: RDS Aurora PostgreSQL cluster
- Load Balancing: Application Load Balancers
- Network: Multi-AZ deployment across 3 availability zones
- VPC Flow Logs: Enabled
- Log Retention: 30 days mandatory
- Cross-account: Security account ID needed for log sharing

### Constraints

- All metric filters must extract both error rates and latency percentiles from logs
- Composite alarms should combine at least 2 individual alarm conditions
- SNS topics must support both email and SMS subscription types
- CloudWatch dashboards must be structured with logical groupings by service
- All resources must be destroyable without retention policies (RemovalPolicy DESTROY, no RETAIN)
- Canaries must run at 5-minute intervals with proper timeout and retry configuration
- IAM roles and policies must follow least-privilege principles
- No hardcoded values - all configuration through variables

## Success Criteria

- Functionality: Complete monitoring coverage for ECS, RDS, ALB with real-time metrics
- Alerting: Multi-tier SNS notification system with appropriate thresholds
- Observability: Centralized log aggregation with automated metric extraction
- Compliance: 30-day log retention with cross-account sharing enabled
- Reliability: Synthetic monitoring detecting endpoint failures within 5 minutes
- Resource Naming: All resources include environmentSuffix for deployment uniqueness
- Destroyability: All resources can be fully destroyed without retention policies
- Code Quality: Clean Terraform HCL, well-structured modules, comprehensive variables

## Deployment Requirements (CRITICAL)

- All resource names MUST include the environmentSuffix variable to ensure uniqueness across multiple deployments
- All resources MUST be fully destroyable - no retention policies (RemovalPolicy DESTROY)
- For resources like CloudWatch Log Groups, explicitly set deletion policies
- Lambda functions must handle Node.js 18+ SDK requirements (aws-sdk v3 if needed)
- Cross-account log sharing requires proper IAM permissions and resource policies

## What to deliver

- Complete Terraform HCL implementation with main.tf, variables.tf, outputs.tf
- CloudWatch dashboards with widgets for all monitored services
- SNS topics with subscription configuration for different alert severities
- CloudWatch alarms for infrastructure and application metrics
- CloudWatch Logs metric filters extracting business metrics
- CloudWatch Synthetics canaries for endpoint monitoring
- Optional: EventBridge rules, Lambda functions for enrichment, X-Ray configuration
- Comprehensive variable definitions with descriptions and defaults
- Output values for dashboard URLs, SNS topic ARNs, alarm names
- Documentation in comments explaining configuration choices
