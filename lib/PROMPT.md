# Real-Time Observability Platform for Payment Transaction Monitoring

Hey team,

We've got an urgent requirement from our financial services client who's experiencing blind spots in their payment processing system. They're running a high-volume payment platform and need to detect anomalies within 60 seconds of any service degradation. Right now, they don't have the visibility they need to catch issues before they impact customers.

The business team has asked us to build this using **Terraform with HCL** for the infrastructure deployment. They need a complete observability solution that can ingest transaction events in real-time, process them through distributed tracing, emit custom metrics, and alert the operations team immediately when thresholds are breached.

This is a production system handling financial transactions, so we need to be extra careful about security (KMS encryption everywhere), reliability (composite alarms), and performance (container-based Lambda for fast cold starts). The infrastructure needs to be deployed in the eu-west-1 region to comply with their data residency requirements.

## What we need to build

Create a real-time observability platform using **Terraform with HCL** for monitoring payment transaction flows with distributed tracing, custom metrics, and automated alerting.

### Core Requirements

1. **Real-Time Data Ingestion**
   - Deploy Kinesis Data Streams with 5 shards for ingesting transaction events
   - Enable shard-level metrics for detailed monitoring
   - Configure stream retention for event replay capabilities

2. **Stream Processing with Container-Based Lambda**
   - Create Lambda function using container image (not zip) to process stream records
   - Emit custom metrics to CloudWatch from processed transactions
   - Implement proper error handling and dead letter queue configuration

3. **Distributed Tracing with X-Ray**
   - Configure X-Ray service map with custom segments for transaction flow visualization
   - Capture 100% of requests with custom segments showing payment stages
   - Enable X-Ray tracing across all Lambda functions and AWS services

4. **Metrics and Dashboards**
   - Set up CloudWatch dashboard with 10 custom widgets displaying transaction metrics
   - Use custom CloudWatch namespaces with dimension filtering for metrics
   - Display key metrics: transaction volume, error rates, latency percentiles, throughput

5. **Composite Alarm System**
   - Create composite CloudWatch alarms monitoring error rates and latency thresholds
   - Each composite alarm must combine at least 2 child metrics
   - Configure alarm states and evaluation periods for production workloads

6. **Secure Notifications**
   - Configure SNS topic with KMS encryption using customer-managed keys
   - Set up topic policies for secure access control
   - Subscribe operations team endpoints for alert delivery

7. **Event-Driven Routing**
   - Implement EventBridge rules to route specific transaction patterns to different targets
   - Use content-based filtering with pattern matching for transaction types
   - Configure multiple targets for different event patterns

8. **Enhanced Monitoring**
   - Enable enhanced monitoring on all resources with 1-minute granularity
   - Configure detailed CloudWatch metrics for all services
   - Set up metric filters for log-based metrics

9. **Log Analysis Queries**
   - Create CloudWatch Logs Insights queries for transaction pattern analysis
   - Include queries for: error analysis, latency trends, top transaction types
   - Save queries for quick access by operations team

10. **Log Retention Policies**
    - Configure retention policies of 30 days for all log groups
    - Ensure automatic cleanup of old logs to control costs
    - Apply consistent retention across Lambda, Kinesis, and custom application logs

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Deploy to **eu-west-1** region for data residency compliance
- Use **Kinesis Data Streams** for real-time event ingestion
- Use **Lambda** with container images (Docker) for stream processing
- Use **X-Ray** for distributed tracing with 100% sampling
- Use **CloudWatch** for metrics, dashboards, alarms, and log analysis
- Use **SNS** with KMS encryption for notifications
- Use **EventBridge** for event-driven routing
- Use **KMS** for encryption of SNS topics and sensitive data
- Resource names must include **environmentSuffix** parameter for uniqueness across environments
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies - use DESTROY removal policy)

### Critical Constraints (ALL 7 must be met)

1. **Composite Alarms Only**: All CloudWatch alarms must use composite alarms with at least 2 child metrics (no standalone alarms)
2. **Customer-Managed KMS Keys**: SNS topics must be encrypted with customer-managed KMS keys (not AWS managed)
3. **Container-Based Lambda**: Lambda functions must use container images instead of zip deployments (requires Dockerfile and ECR)
4. **Shard-Level Metrics**: Kinesis Data Streams must have shard-level metrics enabled for detailed monitoring
5. **Custom Namespaces**: All metrics must be stored in custom CloudWatch namespaces with dimension filtering (not default namespace)
6. **Content-Based Filtering**: EventBridge rules must use content-based filtering with pattern matching (not simple routing)
7. **Full X-Ray Sampling**: X-Ray tracing must capture 100% of requests with custom segments (not default sampling)

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names must include the environmentSuffix variable to ensure uniqueness when deploying to multiple environments (dev, staging, prod). Use format: resource-type-environment-suffix
- **Destroyability**: All resources must be fully destroyable without manual intervention. Do NOT use retention policies that prevent deletion. Lambda log groups, KMS keys, and all other resources should use DESTROY removal policy.
- **Container Build**: Lambda functions require Docker installed locally for container image builds. ECR repository must be created before Lambda function deployment.
- **Region-Specific**: All resources must be created in eu-west-1 region. Verify region configuration in provider.tf.

### Constraints

- All CloudWatch alarms must use composite alarm architecture
- SNS topics must use customer-managed KMS keys for encryption
- Lambda functions must use container images with proper Dockerfile
- Kinesis streams must enable enhanced shard-level metrics
- All custom metrics must use namespaced dimensions
- EventBridge rules must implement content-based pattern matching
- X-Ray must capture 100% of traces with custom segment annotations
- Log groups must have 30-day retention policy configured
- Include proper IAM roles and policies for all services
- Enable VPC endpoints for private service communication
- Include proper error handling and dead letter queues

## Success Criteria

- **Functionality**: Real-time processing of transaction events through Kinesis to Lambda with X-Ray tracing
- **Observability**: CloudWatch dashboard displays all 10 custom widgets with live metrics
- **Alerting**: Composite alarms trigger SNS notifications when thresholds breached
- **Tracing**: X-Ray service map shows complete transaction flow with custom segments
- **Event Routing**: EventBridge routes transactions to correct targets based on patterns
- **Security**: All SNS topics encrypted with customer-managed KMS keys
- **Performance**: Lambda processes stream records within 60 seconds with container cold start optimization
- **Monitoring**: Enhanced monitoring enabled with 1-minute granularity across all resources
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployment
- **Code Quality**: Clean HCL code, well-structured modules, comprehensive documentation

## What to deliver

- Complete Terraform HCL implementation with modular file structure
- Kinesis Data Streams configuration with 5 shards and enhanced metrics
- Lambda function code with Dockerfile for container image deployment
- X-Ray tracing configuration with custom segments and service map
- CloudWatch dashboard with 10 custom widgets for transaction monitoring
- Composite CloudWatch alarms with multi-metric evaluation
- SNS topic with customer-managed KMS key encryption
- EventBridge rules with content-based filtering patterns
- CloudWatch Logs Insights saved queries for transaction analysis
- Comprehensive outputs.tf exposing all resource ARNs and endpoints
- Detailed README.md with deployment instructions and architecture overview
- variables.tf with clear descriptions and validation rules
- IAM roles and policies following least privilege principle