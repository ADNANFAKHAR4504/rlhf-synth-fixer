# CloudWatch Monitoring Environment Setup

Hey team,

We need to build a comprehensive monitoring solution for a fintech startup that's just getting started with AWS. They're looking to establish a solid foundation for centralized logging and alerting across their infrastructure. I've been asked to create this using **CDKTF with TypeScript**. The business wants to catch and alert on application errors in real-time before they impact customers.

The startup has multiple development teams deploying various services, and they need a way to aggregate logs, automatically detect critical errors, and notify the right people when things go wrong. They're operating in the ca-central-1 region and want everything set up as infrastructure as code so it can be version controlled and easily replicated.

This is a greenfield project, so we're starting from scratch. They want a dashboard where teams can see system health at a glance, and they need it done right from the beginning with proper IAM permissions and cost tracking through tags.

## What we need to build

Create a monitoring stack using **CDKTF with TypeScript** that provides centralized logging with automated error detection and alerting for an AWS environment.

### Core Requirements

1. **Centralized Logging**
   - CloudWatch Logs group for application logs
   - 30-day retention period for logs
   - Log stream prefix pattern based on service names
   - Enable CloudWatch Logs Insights for querying
   - Log group name pattern: /aws/application/{service-name}

2. **Log Processing**
   - Lambda function to process incoming log events
   - Filter logs for ERROR and CRITICAL severity levels
   - Lambda must use Node.js 18 runtime
   - Function timeout cannot exceed 60 seconds
   - Proper error handling and logging

3. **Metrics and Alarms**
   - Metric filter to count error occurrences per minute
   - CloudWatch alarm triggering when errors exceed 10 per 5-minute period
   - Alarms must use INSUFFICIENT_DATA as default state

4. **Notification System**
   - SNS topic for alarm notifications
   - Email subscription endpoint
   - SNS must have server-side encryption enabled

5. **Monitoring Dashboard**
   - CloudWatch dashboard with error metrics and alarm status
   - Use 2x2 widget grid layout
   - Real-time visibility into system health

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **CloudWatch Logs** for centralized logging
- Use **Lambda** for log event processing
- Use **SNS** for alarm notifications
- Use **IAM** for least-privilege access control
- Use **CloudWatch Alarms** for error detection
- Use **CloudWatch Dashboard** for visualization
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to **ca-central-1** region (with override capability)
- All resources in single CDKTF stack

### Constraints

- Use CDKTF L2 constructs where available, avoid L1 constructs
- Lambda function must use Node.js 18 runtime
- All CloudWatch alarms must use INSUFFICIENT_DATA as default state
- SNS topic must have server-side encryption enabled
- Lambda timeout must not exceed 60 seconds
- Dashboard must use 2x2 widget grid layout
- Log group name pattern: /aws/application/{service-name}
- All resources created in single stack
- All resources must be destroyable (no Retain policies)
- IAM roles with least-privilege access only
- Apply resource tags: Environment=production, Team=platform
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete monitoring stack that detects and alerts on errors automatically
- **Performance**: Lambda processes logs within 60 seconds, alarms trigger within 5 minutes
- **Reliability**: All components properly integrated and functional
- **Security**: Least-privilege IAM roles, encrypted SNS topic
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript code, well-structured, documented

## What to deliver

- Complete CDKTF TypeScript implementation
- CloudWatch Logs group with proper configuration
- Lambda function for log processing (Node.js 18)
- Metric filters and CloudWatch alarms
- SNS topic with email subscription
- CloudWatch dashboard with 2x2 layout
- IAM roles and policies with least-privilege access
- Unit tests for all components
- Documentation and deployment instructions
