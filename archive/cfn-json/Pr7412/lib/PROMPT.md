# Observability Infrastructure for ECS Microservices

Hey team,

We've been tasked with building out comprehensive monitoring and observability infrastructure for our financial services company's microservices architecture. The platform team is running multiple ECS-based services in production, and right now we're flying a bit blind without proper centralized monitoring. The business is asking for full visibility into what's happening across all our services, and we need to make sure we're staying compliant with financial regulations that require 90-day log retention.

The engineering team has been struggling with troubleshooting issues across our distributed system. When something goes wrong, they're manually checking logs across multiple services, and there's no easy way to trace requests as they flow through the system. We need to fix this by implementing proper distributed tracing, centralized logging, and proactive alerting before issues impact customers.

This needs to be built using **CloudFormation with JSON** since that's what our infrastructure team has standardized on. We're deploying everything to us-east-1 where our production ECS clusters are running.

## What we need to build

Create an observability infrastructure using **CloudFormation with JSON** that provides comprehensive monitoring, logging, and tracing capabilities for our ECS-based microservices platform.

### Core Requirements

1. **Centralized Logging**
   - Configure CloudWatch Logs with 90-day retention period for all services
   - Must comply with financial regulations requiring 90-day log retention
   - Ensure all log groups follow consistent naming patterns

2. **Distributed Tracing**
   - Set up X-Ray service map with 0.1 sampling rate for distributed tracing
   - Enable tracing across all microservices to track request flows
   - Configure X-Ray to capture traces for troubleshooting

3. **Custom Metrics and Namespaces**
   - Create custom CloudWatch metrics namespace 'FinanceApp/Production'
   - Allow application teams to publish custom business metrics
   - Organize metrics in a structured namespace for easy discovery

4. **Proactive Alerting**
   - Deploy 5 metric alarms for CPU, memory, error rate, latency, and availability
   - Configure SNS topic with email subscription for alarm notifications
   - Create composite alarm combining CPU > 80% AND memory > 85% for critical conditions
   - Store alarm thresholds in Parameter Store as SecureString parameters

5. **Visualization Dashboard**
   - Implement CloudWatch Dashboard with CPU, memory, request count, and error rate widgets
   - Provide at-a-glance visibility into system health
   - Include widgets for all critical metrics

6. **Synthetic Monitoring**
   - Deploy CloudWatch Synthetics canary for health check endpoint monitoring
   - Proactively detect availability issues before customers are impacted
   - Monitor service endpoints continuously

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **CloudWatch Logs** for centralized logging with 90-day retention
- Use **X-Ray** for distributed tracing with 0.1 sampling rate
- Use **CloudWatch Metrics** with custom namespace 'FinanceApp/Production'
- Use **CloudWatch Alarms** for CPU, memory, error rate, latency, and availability monitoring
- Use **SNS** for alarm notification distribution
- Use **CloudWatch Synthetics** for synthetic monitoring with canary
- Use **Parameter Store** for storing alarm thresholds as SecureString
- Use **CloudWatch Dashboard** with minimum 4 widgets
- Resource names must include **environmentSuffix** parameter for uniqueness across deployments
- Follow naming convention: {resource-type}-{purpose}-environment-suffix
- Deploy to **us-east-1** region
- Enable CloudWatch Container Insights for ECS cluster monitoring

### Constraints

- All CloudWatch Log Groups MUST have exactly 90-day retention period
- X-Ray sampling rate MUST be 0.1 (10% of requests)
- Custom metrics namespace MUST be 'FinanceApp/Production'
- Composite alarm MUST combine CPU > 80% AND memory > 85%
- Dashboard MUST include at least 4 widgets
- All alarm thresholds MUST be stored in Parameter Store
- All resources must be destroyable (no Retain policies)
- All resources must have Cost Allocation Tags: Environment=Production, Team=Platform
- Include proper error handling and validation
- SNS topic must support email subscription endpoint

### Deployment Requirements (CRITICAL)

- All resources MUST include **environmentSuffix** parameter in their names
- This allows multiple deployments in the same account without conflicts
- Format: {ResourceType}{Purpose}{environmentSuffix}
- Example: LogGroupApp${environmentSuffix}, AlarmCPU${environmentSuffix}
- All resources must be fully destroyable (RemovalPolicy: DESTROY, no RETAIN policies)
- Stack must be redeployable without manual resource cleanup

## Success Criteria

- **Functionality**: All 10 mandatory requirements implemented successfully
- **Compliance**: 90-day log retention enforced on all log groups
- **Tracing**: X-Ray distributed tracing working with 0.1 sampling rate
- **Alerting**: All 5 metric alarms plus composite alarm functioning correctly
- **Visualization**: Dashboard displays all 4 required widgets with real-time data
- **Monitoring**: Synthetics canary actively monitoring endpoints
- **Security**: Alarm thresholds stored securely in Parameter Store
- **Tagging**: All resources tagged with Environment=Production, Team=Platform
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be deleted cleanly without manual intervention
- **Code Quality**: Clean JSON CloudFormation template, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON implementation in lib/TapStack.json
- CloudWatch Logs configuration with 90-day retention
- X-Ray tracing setup with 0.1 sampling rate
- Custom CloudWatch metrics namespace configuration
- 5 metric alarms (CPU, memory, error rate, latency, availability)
- Composite alarm for multi-metric conditions
- SNS topic with email subscription capability
- CloudWatch Dashboard with 4+ widgets
- CloudWatch Synthetics canary for endpoint monitoring
- Parameter Store parameters for alarm thresholds
- Proper IAM roles and permissions for all services
- Cost Allocation Tags on all resources
- Documentation explaining the architecture and usage
