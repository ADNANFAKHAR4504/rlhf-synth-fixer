# Lambda ETL Infrastructure Optimization

Create a Pulumi TypeScript program to optimize an existing Lambda-based ETL infrastructure. The configuration must:

1. Refactor three existing Lambda functions (data-ingestion, data-transform, data-output) to use ARM-based Graviton2 processors for cost savings.
2. Implement reserved concurrency of 50 for the data-transform function to prevent throttling.
3. Configure memory optimization by analyzing CloudWatch metrics and right-sizing from current 3008MB to appropriate levels.
4. Enable Lambda SnapStart for the data-transform function to reduce cold starts.
5. Set up proper environment variables for S3 bucket names using Pulumi config instead of hardcoded values.
6. Configure X-Ray tracing for all functions to identify performance bottlenecks.
7. Implement proper tagging strategy with Environment, Team, and CostCenter tags.
8. Set up CloudWatch alarms for function errors exceeding 1% error rate.
9. Configure Lambda layers for shared dependencies across all three functions.
10. Set appropriate timeout values based on historical execution data (ingestion: 60s, transform: 300s, output: 120s).

## Technical Requirements

- Platform: Pulumi
- Language: TypeScript
- Complexity: Hard
- AWS Services: Lambda, CloudWatch, X-Ray, S3
- Region: us-east-1

## Architecture

The solution implements a three-stage ETL pipeline:
1. Data Ingestion Lambda: Reads from source and stores raw data
2. Data Transform Lambda: Processes and transforms data with optimized performance
3. Data Output Lambda: Writes processed data to destination

All functions use:
- ARM64 architecture (Graviton2)
- Shared Lambda layer for common dependencies
- X-Ray tracing for observability
- CloudWatch alarms for error monitoring
- Optimized memory settings based on workload