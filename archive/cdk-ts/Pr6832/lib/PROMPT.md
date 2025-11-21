Hey team,

We need to build a high-availability solution for a critical trading platform that handles millions of transactions daily. A financial services company needs a robust infrastructure solution deployed in a single region to maintain their 99.99% uptime SLA while optimizing costs.

The business requirement is clear: build this using **AWS CDK with TypeScript** to provision infrastructure in us-east-1 region. The system must handle high availability within the region using multiple availability zones, maintain session state, and provide comprehensive monitoring and alerting.

This is a production-grade system that needs to coordinate multiple AWS services while ensuring data consistency, minimal downtime, and automated health monitoring. The trading platform processes real-time orders, so any downtime directly impacts revenue and customer trust.

## What we need to build

Create a high-availability infrastructure using **AWS CDK with TypeScript** for a trading platform deployed in the us-east-1 region with multi-AZ redundancy.

### Core Requirements

1. **DNS and Health Monitoring**
   - Set up Route 53 health checks monitoring API Gateway endpoints
   - Implement health check endpoints that validate application availability
   - Configure health checks with 30-second intervals and appropriate failure thresholds

2. **Database Layer with High Availability**
   - Deploy Aurora PostgreSQL cluster with writer and read replica
   - Use Aurora Serverless v2 for cost optimization
   - Configure multi-AZ deployment for high availability
   - Enable 7-day backup retention
   - Enable encryption at rest

3. **Compute Layer**
   - Create Lambda functions for processing trade orders
   - Configure SQS queues feeding Lambda processors
   - Deploy Lambda functions in VPC for secure database access
   - Implement automated health monitoring function

4. **Session State Management**
   - Configure DynamoDB table for user session data
   - Enable point-in-time recovery on DynamoDB tables
   - Use pay-per-request billing mode
   - Enable streams for change capture

5. **Storage**
   - Implement S3 buckets with versioning for application configurations
   - Set up separate buckets for audit logs with versioning
   - Configure lifecycle policies and auto-delete on removal

6. **Monitoring and Alerting**
   - Set up CloudWatch alarms monitoring database CPU utilization
   - Create alarms for Lambda error rates and invocation failures
   - Monitor API Gateway latency and error rates
   - Configure SNS notifications for critical alerts
   - Implement comprehensive monitoring dashboards

7. **API Layer**
   - Deploy API Gateway REST API in us-east-1
   - Implement health check endpoints
   - Set up API Gateway logging and monitoring
   - Enable CloudWatch request/response tracing

8. **Event Distribution**
   - Configure EventBridge for critical events
   - Implement event filtering and routing logic
   - Log events to CloudWatch Logs for audit trail

9. **Continuous Health Monitoring**
   - Implement automated health monitoring Lambda function
   - Validate system health every hour
   - Test health check endpoints, database connectivity, and API availability
   - Alert on any health issues

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **Route 53** for DNS management and health checks
- Use **Aurora PostgreSQL** with Serverless v2 for database
- Use **Lambda** for serverless compute
- Use **SQS** for decoupled message processing
- Use **DynamoDB** for session state with point-in-time recovery
- Use **S3** with versioning for static assets and logs
- Use **CloudWatch** for comprehensive monitoring and alarming
- Use **API Gateway** for REST API endpoints
- Use **EventBridge** for event distribution
- Use **Systems Manager Parameter Store** for configurations
- Use **VPC** with private subnets and VPC endpoints (no NAT Gateways for cost optimization)
- Use **IAM** roles with least-privilege access
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{purpose}-{region}-{environment-suffix}`
- Deploy to **us-east-1** region
- Use CDK 2.x with TypeScript
- Implement proper VPC networking with private isolated subnets

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names for uniqueness
- All resources must be destroyable - NO RemovalPolicy.RETAIN allowed
- NO DeletionProtection enabled on databases or other resources
- Lambda functions must be deployed with proper VPC configuration
- Aurora cluster must support multi-AZ deployment for high availability
- DynamoDB tables must have point-in-time recovery enabled
- S3 buckets must have versioning enabled
- All IAM roles must follow least-privilege principle
- Health checks must monitor actual application endpoints, not just infrastructure
- Use Node.js 18.x or higher for Lambda runtimes (includes AWS SDK v3)

### Constraints

- Ensure high availability within the region using multiple AZs
- Maintain session state consistency
- All resources must be fully automated with no manual steps
- Support deployment and teardown without leaving orphaned resources
- Include proper error handling and retry logic in all Lambda functions
- Implement exponential backoff for all AWS service API calls
- Use CloudWatch Logs for centralized logging
- Tag all resources with environment and region identifiers
- Optimize for cost using serverless services and VPC endpoints

## Success Criteria

- **Functionality**: Complete high-availability solution with comprehensive monitoring
- **Performance**: API latency under 1000ms
- **Reliability**: System maintains 99.99% uptime within the region
- **Monitoring**: Comprehensive CloudWatch dashboards and alarms for all critical metrics
- **Automation**: Hourly health monitoring with automated alerting
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: TypeScript with strong typing, comprehensive error handling, well-documented
- **Cost Optimization**: Efficient use of serverless services and VPC endpoints

## What to deliver

- Complete **AWS CDK with TypeScript** implementation organized as CDK Constructs
- Stack deployed to us-east-1 with all services
- Lambda functions for trade order processing (Node.js 18.x)
- Lambda function for automated health monitoring
- CloudWatch alarms and monitoring dashboards
- Documentation explaining the architecture and deployment procedures
- Deployment instructions for us-east-1
- Testing procedures to validate system health
