# CloudWatch Monitoring Stack for ECS Microservices

Hey team,

We need to build a comprehensive observability solution for our fintech startup's microservices platform. They're running five services on ECS Fargate with ALB endpoints, and right now they're flying blind without proper monitoring. The DevOps team needs real-time alerts when things go wrong, and different teams need their own dashboards to track their services.

I've been asked to create this using **Terraform with HCL**. The business wants a production-grade monitoring stack that can catch issues before customers notice them, with intelligent alerting that doesn't wake people up for false alarms.

The environment spans three AWS accounts (dev, staging, prod) and they want cross-account visibility so the platform team can see everything from one place. They're already collecting VPC flow logs and have Container Insights enabled, so we need to tie all that data together into actionable dashboards and alerts.

## What we need to build

Create a multi-layer CloudWatch observability stack using **Terraform with HCL** that monitors ECS-based microservices across multiple environments.

### Core Requirements

1. **Centralized Logging with Metric Extraction**
   - CloudWatch Log Groups for each of the 5 microservices
   - Log retention set to exactly 30 days (MANDATORY)
   - Metric filters to extract error rates and response time patterns
   - Pattern-based filters to identify critical errors in application logs

2. **Intelligent Multi-Layer Alarming**
   - Composite CloudWatch alarms combining CPU, memory, and custom application metrics
   - Two-tier threshold system: warnings at 70%, critical alerts at 90%
   - Separate alarms for infrastructure metrics and application metrics
   - Container Insights alarms for ECS task failures and cluster health

3. **Synthetic Monitoring**
   - CloudWatch Synthetics canaries running every 5 minutes (MANDATORY)
   - Custom monitoring scripts for each API endpoint
   - Availability and latency tracking for all ALB endpoints
   - Canaries must use custom scripts, not just simple URL checks

4. **Alert Routing and Notification**
   - SNS topics for different severity levels and team routing
   - Email subscriptions for critical alerts
   - Webhook subscriptions for integration with incident management tools
   - Encrypted SNS topics using customer-managed KMS keys

5. **Comprehensive Dashboards**
   - CloudWatch dashboard with multiple sections for different metric types
   - Infrastructure metrics section: CPU, memory, network for ECS tasks
   - Application metrics section: error rates, response times, request counts
   - Synthetic monitoring results section: canary success rates and latency
   - Dashboard widgets using metric math expressions for calculated values (MANDATORY)
   - Real-time updates with drill-down capability into specific services

6. **Event-Driven Monitoring**
   - CloudWatch Events rules capturing ECS task state changes
   - Automatic alerts when tasks fail to start or crash unexpectedly
   - Event pattern matching for different failure scenarios

7. **Cross-Account Observability**
   - Cross-account monitoring configuration to aggregate metrics from dev and staging
   - Central monitoring account receiving metrics from multiple sources
   - Proper IAM roles and permissions for cross-account access

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use AWS CloudWatch for logging, metrics, and dashboards
- Use CloudWatch Synthetics for endpoint monitoring with custom scripts
- Use CloudWatch Logs for centralized log aggregation
- Use SNS for alert delivery with email and webhook endpoints
- Use CloudWatch Events for ECS state change tracking
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `monitoring-{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Modular Terraform structure with separate files for different resource types

### MANDATORY Requirements (ALL 3 MUST be implemented)

1. **CloudWatch Synthetics canaries** - Must use custom monitoring scripts (not basic HTTP checks). Canaries should validate endpoint functionality, not just availability.

2. **Dashboard metric math expressions** - Dashboard widgets must include calculated values using CloudWatch metric math (e.g., error rate percentages, p99 latencies, availability calculations).

3. **30-day log retention with metric filters** - All CloudWatch Log Groups must have exactly 30-day retention and include metric filters that extract error patterns for alarming.

### OPTIONAL Requirements (Implement as many as feasible)

1. **Cross-account monitoring** - Set up CloudWatch cross-account observability to aggregate metrics from dev and staging accounts into production monitoring account.

2. **Comprehensive resource tagging** - All CloudWatch resources tagged with Environment, Team, and CostCenter tags for cost allocation and filtering.

3. **Two-tier alarm thresholds** - All alarms configured with separate warning (70%) and critical (90%) thresholds using composite alarms.

4. **Container Insights integration** - Leverage ECS Container Insights metrics for cluster-level monitoring and task-level performance tracking.

5. **Composite alarms for multi-metric conditions** - Use CloudWatch composite alarms that combine multiple individual alarms with AND/OR logic.

6. **KMS encryption for SNS topics** - Encrypt all SNS topics used for alerting with customer-managed KMS keys for data protection.

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use `force_destroy = true` for log groups, no DeletionPolicy: Retain)
- Resource naming must include environmentSuffix parameter for parallel environment deployments
- Include proper error handling and validation in Terraform configuration
- Use Terraform variables for environment-specific configuration
- No hardcoded account IDs or ARNs - use data sources and references

### Constraints

- Must work with existing ECS cluster and ALB infrastructure (reference via data sources)
- Alarm actions must not create noise - thresholds must be tuned for production
- Synthetics canaries must run in VPC for private endpoint monitoring
- Log retention is fixed at 30 days per compliance requirements
- All metric filters must extract actionable metrics (no generic catch-all filters)
- Cross-account monitoring requires proper IAM role trust relationships

## Success Criteria

- **Functionality**: All microservices have log groups with metric extraction, alarms trigger correctly at defined thresholds, dashboards display real-time metrics from all sources
- **Performance**: Canaries complete within 30 seconds, dashboard loads in under 3 seconds, metric filters process logs with minimal latency
- **Reliability**: Alarms have less than 1% false positive rate, canaries have 99.9% success rate against healthy endpoints, no monitoring gaps during deployments
- **Security**: SNS topics encrypted with KMS, IAM policies follow least privilege, cross-account roles use external ID for security
- **Resource Naming**: All CloudWatch resources include environmentSuffix in names for environment isolation
- **Code Quality**: Modular HCL code, well-organized file structure, comprehensive variable documentation

## What to deliver

- Complete Terraform HCL implementation with modular file organization
- Separate files for: log groups (`logs.tf`), alarms (`alarms.tf`), dashboards (`dashboard.tf`), synthetics (`canaries.tf`), SNS topics (`notifications.tf`)
- CloudWatch Synthetics canaries with custom Node.js or Python scripts
- CloudWatch dashboard JSON with metric math expressions
- Composite alarms combining multiple metrics
- SNS topics with proper encryption and subscriptions
- IAM roles for cross-account access
- Variables file for environment-specific configuration
- Unit tests validating Terraform syntax and configuration
- Documentation covering deployment and operational procedures
