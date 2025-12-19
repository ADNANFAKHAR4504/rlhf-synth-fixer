Hey team,

We need to build a production-grade serverless stock pattern detection system for a financial services company. They're processing real-time market data feeds and need to generate intelligent alerts when specific trading patterns emerge. This is a critical system that handles peak volumes of 10,000 events per second during market hours (9:30 AM to 4:00 PM EST) and must scale down to zero during off-hours to keep costs under control.

The business has been pretty specific about what they need. I've been asked to create this infrastructure using **CDK with TypeScript** and deploy it to the us-east-1 region for proximity to financial markets. They need sub-100ms pattern detection latency, production-grade observability, automated deployment safety with canary releases, advanced security through WAF protection, and comprehensive cost optimization.

This is an enhanced version of a previous implementation that scored too low on training complexity. The business wants us to add several advanced capabilities including Step Functions orchestration, real-time Kinesis ingestion, canary deployments with automated rollback, AWS WAF security, custom CloudWatch dashboards, power tuning for cost optimization, and a multi-stage approval workflow for critical alerts.

## What we need to build

Create a comprehensive serverless stock pattern detection system using **CDK with TypeScript** that provides real-time pattern analysis, intelligent alerting, and production-grade operational capabilities.

### Core API and Processing Requirements

1. **API Gateway REST API**
   - Deploy REST API with two endpoints: /patterns and /alerts
   - Enable request validation for all incoming requests
   - Implement request throttling at 1000 requests per second with burst capacity of 2000
   - Attach AWS WAF for security (covered in requirement 16)

2. **Pattern Detection Lambda**
   - Create Lambda function named 'PatternDetector'
   - Configure with 512MB memory allocation
   - Process incoming market data and identify trading patterns
   - Reserved concurrency of exactly 50
   - Use ARM64 architecture (Graviton2 processors)

3. **Trading Patterns Storage**
   - DynamoDB table named 'TradingPatterns'
   - Partition key: 'patternId', sort key: 'timestamp'
   - On-demand billing mode with point-in-time recovery enabled
   - Configure auto-scaling for burst protection

4. **Alert Queue Processing**
   - SQS queue named 'AlertQueue'
   - Visibility timeout: 300 seconds
   - Message retention period: exactly 4 days
   - Dead letter queue for failed messages

5. **Alert Processor Lambda**
   - Lambda function named 'AlertProcessor'
   - Reads from AlertQueue with batch size of 10
   - Maximum receive count of 3 before moving to DLQ
   - ARM64 architecture

6. **Scheduled Threshold Checking**
   - EventBridge rule triggering every 5 minutes
   - Must use custom event patterns with at least 3 matching conditions
   - Triggers ThresholdChecker Lambda function

7. **Threshold Checker Lambda**
   - Lambda function named 'ThresholdChecker'
   - Triggered by EventBridge rule
   - Environment variables for configurable thresholds
   - ARM64 architecture

8. **CloudWatch Logs Configuration**
   - Retention period: 7 days for all Lambda functions
   - Enable detailed logging for troubleshooting

9. **SNS Alert Topic**
   - SNS topic named 'TradingAlerts'
   - Email subscription for critical alerts
   - Integration with approval workflow

10. **Dead Letter Queue Setup**
    - DLQ for AlertProcessor Lambda
    - Maximum receive count: 3 attempts
    - Separate queue for failed message analysis

11. **CloudWatch Alarms**
    - Monitor Lambda error rates exceeding 1% threshold
    - Create alarms for all Lambda functions
    - Integration with SNS for notifications

12. **Stack Outputs**
    - API Gateway URL (main endpoint)
    - SQS AlertQueue URL
    - All additional outputs listed in requirement 19

### Advanced Orchestration and Processing

13. **Step Functions State Machine for Pattern Analysis**
    - Create state machine named 'PatternAnalysisWorkflow'
    - Must use Express Workflows (type: EXPRESS) for cost optimization
    - State flow: DataValidation → PatternDetection → ConfidenceScoring → AlertDecision
    - Implement Parallel state processing multiple pattern types simultaneously:
      * head-and-shoulders pattern
      * double-top pattern
      * ascending-triangle pattern
    - Add retry logic with exponential backoff (maxAttempts: 3, backoffRate: 2.0)
    - Include Catch states with fallback to manual review queue
    - Output the state machine ARN

14. **Kinesis Data Stream for Real-Time Ingestion**
    - Create Kinesis Data Stream named 'MarketDataStream'
    - Use on-demand capacity mode (streamModeDetails: ON_DEMAND)
    - Enable enhanced fan-out for multiple consumers
    - Data retention period: 24 hours for replay capability
    - Server-side encryption using customer-managed KMS key
    - Create Lambda function 'KinesisConsumer':
      * Batch size: 100 records
      * Batch window: 5 seconds
      * Enable bisect-on-function-error for automated error handling
    - Output the Kinesis stream ARN

15. **Canary Deployment with Automated Rollback**
    - Implement API Gateway canary deployment with 10% traffic to canary stage
    - Create Lambda alias named 'live' with weighted routing:
      * 90% traffic to $LATEST (production)
      * 10% traffic to canary version
    - Configure CodeDeploy application and deployment group for Lambda
    - Use deployment configuration: Canary10Percent5Minutes (not Linear or AllAtOnce)
    - Create CloudWatch alarms monitoring canary error rates (threshold: 2%)
    - Implement automated rollback if canary alarms trigger
    - Use Lambda versioning with immutable version numbers
    - Output Lambda alias ARN and CodeDeploy deployment group name

16. **AWS WAF with Advanced Security Rules**
    - Create WAF WebACL named 'PatternDetectionWAF'
    - Attach to API Gateway REST API
    - Implement rate-based rule: block IPs exceeding 2000 requests per 5 minutes (exactly 5 minutes, not 1 or 10)
    - Add geo-blocking rule: block requests from countries ['CN', 'RU', 'KP']
    - Include AWS Managed Rules: AWSManagedRulesCommonRuleSet for SQL injection and XSS protection
    - Add custom rule: require 'X-API-Key' header with regex pattern validation
    - Configure WAF logging to S3 bucket with prefix 'waf-logs/'
    - Set default action to ALLOW with CloudWatch metrics enabled
    - Output WAF WebACL ARN

17. **Custom CloudWatch Embedded Metrics and Dashboard**
    - Implement embedded metric format (EMF) in all Lambda functions
    - Create custom metrics with namespace 'StockPatternDetection':
      * 'PatternDetectionDuration' (milliseconds) with dimensions: PatternType, Confidence
      * 'ConfidenceScore' (percentage 0-100) with dimensions: PatternType, Symbol
      * 'AlertPriority' (count) with dimensions: Severity (LOW/MEDIUM/HIGH/CRITICAL)
    - Create CloudWatch dashboard named 'PatternDetectionDashboard' with minimum 12 widgets:
      * API Gateway latency percentiles (p50, p90, p99) - line graph
      * Lambda concurrent executions for all Lambda functions - stacked area chart
      * DynamoDB consumed read/write capacity units - line graph
      * SQS queue depth and message age - number widgets
      * Step Functions execution status (success/failed/aborted) - pie chart
      * Custom metrics: average confidence score by pattern type - bar chart
      * WAF blocked requests count - number widget
      * Kinesis stream incoming records - line graph
    - Enable anomaly detection on PatternDetectionDuration metric
    - Output the dashboard URL

18. **Cost Optimization with Power Tuning**
    - Implement Lambda power tuning using nested Step Functions state machine
    - Deploy power tuning for PatternDetector function with exactly 5 memory configurations: [512, 1024, 1536, 2048, 3008]
    - Configure auto-scaling target tracking for reserved concurrency based on SQS queue depth
    - Set scaling policy: target value of 5 messages per Lambda concurrency
    - Enable DynamoDB auto-scaling for read/write capacity (even with on-demand for burst protection)
    - Configure S3 bucket lifecycle policy with Intelligent-Tiering for WAF logs
    - Document Lambda SnapStart applicability (or why not applicable for Node.js runtime)
    - Add cost allocation tags to ALL resources:
      * Project: StockPatternDetection
      * Environment: Production
      * CostCenter: Trading
    - Create CloudWatch billing alarm triggering when estimated charges exceed $100/month
    - Output the power tuning state machine ARN

19. **Multi-Stage Approval Workflow**
    - Implement approval workflow for high-priority alerts (CRITICAL severity only)
    - Create SNS topic named 'AlertApprovalRequests' with HTTP/S subscription endpoint
    - Generate approval tokens using signed URLs with 1-hour expiration
    - Create SQS queue named 'PendingApprovals' with 2-hour visibility timeout
    - Implement DynamoDB table 'ApprovalTracking':
      * Partition key: 'approvalId'
      * TTL attribute: 'expiresAt'
    - Create Lambda function 'ApprovalProcessor':
      * Implement idempotency using DynamoDB conditional writes
      * Handle approval/rejection decisions
    - Configure approval expiration: auto-reject after 1 hour if no response
    - Implement approval callback Lambda triggered by API Gateway /approve/{token} endpoint
    - Add CloudWatch Logs Insights query for tracking approval latency
    - Output approval API endpoint URL and pending approvals queue URL

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Deploy to **us-east-1** region
- All Lambda functions must use ARM64 architecture (Graviton2 processors)
- All Lambda functions must have X-Ray tracing enabled with custom segments
- All Lambda functions must use Lambda Layers for shared dependencies with versioning
- Resource names must include **environmentSuffix** parameter for uniqueness across deployments
- Follow naming convention: `{resource-type}-${environmentSuffix}`

### Constraints

- Lambda functions: ARM-based Graviton2 processors (ARM64) for cost optimization
- SQS queues: message retention period of exactly 4 days
- EventBridge rules: custom event patterns with at least 3 matching conditions
- Lambda: X-Ray tracing enabled with custom segments
- Lambda: use Lambda Layers for shared dependencies with versioning
- PatternDetector Lambda: reserved concurrency of exactly 50
- API Gateway: throttling at 1000 req/sec with burst of 2000
- DynamoDB tables: on-demand billing with point-in-time recovery
- Step Functions: Express Workflows only (not Standard)
- Kinesis: on-demand capacity mode with enhanced fan-out
- CodeDeploy: Canary10Percent5Minutes configuration (not Linear or AllAtOnce)
- WAF rate rule: exactly 2000 requests per 5-minute period
- CloudWatch dashboard: minimum 12 widgets
- Power tuning: exactly 5 memory configs [512, 1024, 1536, 2048, 3008]
- Cost allocation tags: exactly Project, Environment, CostCenter (these 3 tags on ALL resources)
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging throughout

## Success Criteria

- **Functionality**: All 19 requirements implemented correctly with proper integration
- **Performance**: Sub-100ms pattern detection latency, handles 10,000 events/sec peak load
- **Reliability**: Proper error handling with DLQs, retry logic, automated rollback on failures
- **Security**: WAF protection, encryption at rest (KMS), least-privilege IAM roles, request validation
- **Observability**: Comprehensive CloudWatch dashboard, custom metrics, anomaly detection, X-Ray tracing
- **Cost Optimization**: Scales to zero off-hours, power tuning, auto-scaling, Graviton2 processors
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployments
- **Code Quality**: TypeScript with proper types, well-tested, comprehensive documentation
- **Deployment Safety**: Canary deployments with automated rollback capability
- **Training Quality**: Implementation complexity targets score of 8/10 or higher

## What to deliver

- Complete CDK TypeScript implementation with all 19 requirements
- Stack outputs (12 required):
  * API Gateway URL (main endpoint)
  * API Gateway URL (canary endpoint)
  * SQS AlertQueue URL
  * SQS PendingApprovals queue URL
  * Kinesis stream ARN
  * Step Functions PatternAnalysisWorkflow ARN
  * Step Functions PowerTuningWorkflow ARN
  * Lambda alias 'live' ARN
  * CodeDeploy deployment group name
  * WAF WebACL ARN
  * CloudWatch dashboard URL
  * Approval API endpoint URL
- Lambda functions: PatternDetector, AlertProcessor, ThresholdChecker, KinesisConsumer, ApprovalProcessor, and supporting functions
- Step Functions state machines: PatternAnalysisWorkflow (Express), PowerTuningWorkflow
- DynamoDB tables: TradingPatterns, ApprovalTracking
- SQS queues: AlertQueue (with DLQ), PendingApprovals
- SNS topics: TradingAlerts, AlertApprovalRequests
- Kinesis Data Stream: MarketDataStream with KMS encryption
- AWS WAF WebACL with security rules attached to API Gateway
- CloudWatch dashboard with minimum 12 widgets
- CodeDeploy configuration for canary deployments
- S3 bucket for WAF logs with Intelligent-Tiering lifecycle policy
- Unit tests for all components
- Integration tests validating all workflows
- Comprehensive deployment documentation
- Cost allocation tags on all resources
