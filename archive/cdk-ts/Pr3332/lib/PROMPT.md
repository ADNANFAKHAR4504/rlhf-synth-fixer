# ML Inference Pipeline - AWS CDK Project

Hey, I'm building a production-grade machine learning inference pipeline and need help implementing it using AWS CDK with TypeScript. This is for a platform that handles around 100,000 predictions daily.

## What I'm Building

The system needs to support both real-time and batch inference patterns. We're targeting us-east-1 for production deployment, and everything needs to be serverless to keep costs manageable while maintaining high availability.

Key capabilities I need:
- Batch processing for large-scale predictions
- Model versioning with easy rollback support
- A/B testing to compare different model versions
- Real-time inference via API
- Comprehensive monitoring and alerting

## Technical Stack

- **Region**: us-east-1
- **Language**: TypeScript for infrastructure, Python 3.11 for Lambda functions
- **Framework**: AWS CDK
- **Environment**: Production (prod)
- **Processing Volume**: 100,000 predictions per day

## Infrastructure Components

### Storage and Data

I need S3 buckets for storing model artifacts and input data. Make sure versioning is enabled so we can track model history. For prediction results, set up a DynamoDB table with TTL configured - we don't need to keep old predictions forever, maybe 30 days is enough.

Also need Systems Manager Parameter Store for tracking which model version is currently active. This will be key for the versioning and rollback system. And set up Glue Data Catalog so we can run analytics queries on the prediction data later.

### Machine Learning Infrastructure

The core is SageMaker endpoints, but I need them configured with multi-variant support for A/B testing. Auto-scaling is critical - should scale based on InvocationsPerInstance metric. Don't want to overpay during low traffic but need to handle spikes.

For preprocessing, use Lambda functions with Python 3.11. These will clean and transform data before sending to SageMaker. Also need AWS Batch configured for those really large batch jobs that Lambda can't handle.

Step Functions should orchestrate the complex workflows - especially the batch processing pipeline. Make sure error handling and retries are properly configured.

### API and Streaming

Need an API Gateway REST API for real-time inference requests. Enable caching with maybe 5-minute TTL to reduce SageMaker calls for identical requests. 

For real-time data ingestion, set up Kinesis Data Streams. This will feed into Lambda functions that process streams and call SageMaker for predictions.

### Scheduling and Analytics

Use EventBridge to trigger batch jobs on a schedule - probably daily or hourly depending on data volume. Set up an Athena workgroup so the data science team can run SQL queries on prediction results stored in S3.

### Monitoring Setup

Really important - I need visibility into what's happening. Create CloudWatch dashboards showing:
- Model prediction latency (p50, p99 percentiles)
- Inference throughput
- Error rates
- Auto-scaling activity

Set up alarms for:
- High latency (maybe >2 seconds for p99)
- Error rate spikes
- Data drift detection
- Low invocation counts (might indicate upstream issues)

Hook up SNS topics to these alarms so the team gets notified immediately via email or Slack.

### Security Requirements

Security is non-negotiable for production:
- All IAM roles must follow least privilege principle
- Set up VPC endpoints for S3 and DynamoDB so traffic stays private (no internet gateway)
- Use security groups and NACLs for network-level controls
- Enable encryption at rest with KMS where applicable
- All Lambda functions should run in private subnets

## Critical Integration Points

Make sure these data flows work correctly:

1. **Real-time API Flow**: API Gateway → Lambda (preprocessing) → SageMaker endpoint → return response
2. **Stream Processing**: Kinesis → Lambda → SageMaker → DynamoDB (store results)
3. **Batch Workflow**: EventBridge schedule → Step Functions → AWS Batch → Lambda → SageMaker → DynamoDB
4. **Model Version Management**: Parameter Store stores active version → Lambda reads it → retrieves model from S3 → deploys to SageMaker
5. **Analytics Path**: SageMaker results → DynamoDB → S3 (via export) → Glue cataloging → Athena queries
6. **Monitoring**: All services → CloudWatch Logs → CloudWatch Metrics → Alarms → SNS notifications

## A/B Testing Architecture

This is important for comparing model performance. Configure the SageMaker endpoint with two production variants (let's call them ModelA and ModelB). Set traffic distribution like 80% to ModelA and 20% to ModelB initially.

Each variant needs its own CloudWatch metrics so we can compare:
- Latency per variant
- Error rates per variant
- Invocation counts
- Model-specific metrics if available

The data science team should be able to adjust traffic weights based on performance.

## Model Versioning and Rollback

Here's how I envision the versioning system working:

1. Parameter Store maintains a hierarchy like `/ml-pipeline/models/active-version` and `/ml-pipeline/models/versions/{version-id}/metadata`
2. Each version entry stores the S3 path to model artifacts, deployment timestamp, and performance baselines
3. When deploying a new model, Lambda reads the active version parameter, downloads artifacts from S3, and updates SageMaker
4. For rollback, just update the active-version parameter back to a previous version and redeploy

This should be fast - ideally under 5 minutes to rollback if a bad model gets deployed.

## Auto-Scaling Configuration

Configure Application Auto Scaling for the SageMaker endpoint targeting the `SageMakerVariantInvocationsPerInstance` metric. Here's what I'm thinking:

- Target value: 1000 invocations per instance
- Minimum capacity: 1 instance
- Maximum capacity: 10 instances
- Scale-in cooldown: 300 seconds
- Scale-out cooldown: 60 seconds

This should balance cost and performance. Adjust if needed based on actual traffic patterns.

## DynamoDB TTL Setup

Create the DynamoDB table with an `expirationTime` attribute and enable TTL on it. When Lambda writes prediction results, it should calculate the expiration timestamp (current time + 30 days) and set it. DynamoDB will automatically delete expired records.

## Batch Processing Pipeline

The batch workflow in Step Functions should look like:

1. Triggered by EventBridge on schedule
2. Parallel state to process multiple batches concurrently
3. Each parallel branch invokes AWS Batch job
4. Batch jobs read data from S3, preprocess with Lambda, call SageMaker
5. Results written to DynamoDB
6. Glue crawler catalogs the output data
7. Error handling with retry logic and notifications

Use Map state if iterating over dynamic input batches.

## Caching Strategy

Enable API Gateway caching with 300-second (5 minute) TTL. Configure cache keys based on the inference input features - whatever makes predictions unique. Set cache cluster size based on expected traffic and cache hit ratio.

Monitor cache hit/miss rates and adjust TTL if needed.

## VPC Configuration

Create a VPC with private subnets. Deploy:
- Interface VPC endpoints for SageMaker Runtime
- Gateway endpoints for S3 and DynamoDB

Configure security groups allowing HTTPS (443) traffic from:
- Lambda functions in private subnets
- Batch compute environments
- Any other resources that need to call these services

This keeps all ML traffic private and reduces NAT gateway costs.

## Resource Naming Convention

Use this pattern for consistency: `ml-pipeline-{resourceType}-{environment}-{region}`

Examples:
- `ml-pipeline-sagemaker-endpoint-prod-us-east-1`
- `ml-pipeline-dynamodb-predictions-prod-us-east-1`
- `ml-pipeline-lambda-preprocess-prod-us-east-1`

## Code Quality Expectations

I need production-grade code, so please:
- Enable TypeScript strict mode and use explicit typing everywhere
- Use AWS CDK L2 constructs where possible (they're cleaner)
- Add comprehensive error handling with custom error types
- Include JSDoc comments for public methods and complex logic
- Use CDK Aspects for cross-cutting concerns like tagging and encryption
- Organize code into clear sections: networking, storage, compute, monitoring
- Set appropriate removal policies (RETAIN for data resources, DESTROY for compute)
- Use CDK grants methods for IAM permissions instead of manual policies
- Add inline comments explaining non-obvious AWS configurations
- Use environment variables instead of hardcoded values
- Declare dependencies explicitly with `node.addDependency()`
- Tag everything for cost allocation

Follow SOLID principles and keep constructs focused on single responsibilities.

## File Structure

I need exactly three files - don't create anything else:

### 1. lib/tap-stack.ts
Main CDK stack with all AWS resources. Include all the services mentioned above with proper configurations and dependencies.

### 2. tests/tap-stack.unit.test.ts
Unit tests using AWS CDK assertions. Test that resources are created correctly, IAM policies are right, and configurations match requirements. Mock external dependencies.

### 3. tests/tap-stack.int.test.ts
Integration tests validating that services can actually talk to each other. Test the full flow from API Gateway through to DynamoDB. Validate VPC endpoint connectivity.

## Success Criteria

The implementation should:
- Deploy successfully with `cdk deploy` without manual steps
- All AWS services properly configured and connected
- A/B testing works with weighted traffic distribution
- Auto-scaling responds to load changes
- Model versioning supports deployment and rollback
- DynamoDB TTL expires old records automatically
- VPC endpoints provide private connectivity
- CloudWatch dashboards and alarms give operational visibility
- Unit tests achieve >80% coverage
- Integration tests validate end-to-end flows
- TypeScript compiles without errors or warnings
- Code is well-documented with clear comments

## Testing Requirements

Both unit and integration tests are required. Unit tests should cover resource creation and configuration. Integration tests should verify the actual data flows work correctly.

## What I Need From You

Can you create these three files with complete, production-ready code? Make sure all the integration points work correctly and IAM permissions are set up right. Include clear comments explaining architectural decisions and non-obvious configurations.

Start with all necessary imports, organize code logically with section comments, and ensure proper TypeScript typing throughout. Format with consistent indentation and spacing.

Thanks!
