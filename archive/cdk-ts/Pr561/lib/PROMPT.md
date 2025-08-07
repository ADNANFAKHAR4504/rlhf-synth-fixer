I need to create a sophisticated serverless data processing pipeline on AWS that handles file uploads with advanced event-driven orchestration and monitoring. The architecture should include:

## Core Components:
1. **S3 Express One Zone bucket** for high-performance file ingestion with metadata capture enabled
2. **Multi-stage processing pipeline** using Step Functions Distributed Map with Express workflows for parallel processing 
3. **Event-driven architecture** using EventBridge Scheduler for automated cleanup jobs and processing schedules
4. **Advanced Lambda functions** with SnapStart for Python, including dead letter queues and fault injection testing
5. **Real-time monitoring** with custom CloudWatch dashboards and EventBridge integration

## Advanced Requirements:
- **File Processing Pipeline**: Implement a Step Functions state machine that processes files in parallel using Distributed Map with up to 1000 concurrent executions
- **Event Routing**: Use EventBridge custom buses to route different file types to appropriate processing workflows  
- **Scheduled Operations**: Use EventBridge Scheduler to run maintenance tasks (file archival, cleanup) with cron expressions
- **Performance Optimization**: Configure Lambda SnapStart for cold start reduction and implement proper memory/timeout settings
- **Fault Tolerance**: Add comprehensive error handling with exponential backoff, circuit breakers, and dead letter queue processing
- **Cost Optimization**: Implement S3 Intelligent Tiering and lifecycle policies for processed files

## Technical Specifications:
- Deploy in **us-west-2** region with multi-AZ redundancy
- Support **JSON Lines (JSONL)** and **delimited file formats** (CSV, TSV, semicolon-delimited)
- Process files up to **10GB** with automatic batching for large datasets
- **Environment tags**: Production with cost allocation tags for team/project tracking
- **Security**: Implement least privilege IAM with resource-based policies and VPC endpoints

## Monitoring & Observability:
- Custom CloudWatch metrics for processing rates, error rates, and latency
- EventBridge rules for alerting on processing failures  
- Step Functions execution history with detailed logging
- Lambda X-Ray tracing for performance analysis

Please use TypeScript CDK with Level 3 constructs and AWS Solutions Constructs patterns where applicable. Create a production-ready solution that demonstrates modern AWS serverless best practices and incorporates the latest 2024-2025 AWS features.

The solution should handle enterprise-scale workloads while maintaining cost efficiency and operational excellence.