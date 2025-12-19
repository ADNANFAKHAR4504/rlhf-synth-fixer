Hey team,

We need to build a serverless cryptocurrency price processing system for a fintech startup that's working on their MVP. They're getting real-time price updates from multiple exchanges through webhooks, and they need to process, enrich, and store that data for their trading algorithms. The catch is that cost optimization is critical since they're just starting out, so we need to go fully serverless.

The system needs to handle high-volume webhook traffic from different exchanges, validate and normalize the incoming price data, then enrich it with useful metrics like moving averages and volatility indicators. All of this needs to be stored in a way that their trading algorithms can efficiently query and analyze.

## What we need to build

Create a serverless cryptocurrency data processing pipeline using **CDKTF with Python** that handles webhook ingestion, data enrichment, and storage.

### Core Requirements

1. **Webhook Processing Lambda**
   - Function name: webhook-processor
   - Memory: 1GB (these webhooks can have batched data)
   - Timeout: 60 seconds
   - Must handle incoming price updates from exchanges
   - Write data to DynamoDB with proper validation

2. **Data Enrichment Lambda**
   - Function name: price-enricher
   - Memory: 512MB
   - Triggered automatically by DynamoDB streams
   - Calculate moving averages and volatility metrics
   - Update records with enriched data

3. **Data Storage**
   - DynamoDB table name: crypto-prices
   - Partition key: symbol (string) - e.g., BTC, ETH
   - Sort key: timestamp (number)
   - Enable streams for triggering enrichment
   - Use on-demand billing mode
   - Enable point-in-time recovery for data safety

4. **Event Processing Architecture**
   - Lambda event source mapping from DynamoDB streams to price-enricher
   - Lambda destinations routing successful executions to SNS topic price-updates-success
   - Dead letter queues (SQS) for both Lambda functions with 4-day message retention
   - Proper error handling and retry logic

5. **Security and Encryption**
   - Customer-managed KMS key for encrypting Lambda environment variables
   - IAM roles with least-privilege policies for each Lambda function
   - Proper service-to-service permissions

6. **Monitoring and Observability**
   - CloudWatch Log groups for both Lambda functions
   - Log retention: exactly 3 days
   - CloudWatch subscription filters for error detection
   - SNS notifications for successful processing events

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Lambda** for serverless compute
- Use **DynamoDB** for data storage with streams enabled
- Use **KMS** for encryption of Lambda environment variables
- Use **SQS** for dead letter queues
- Use **CloudWatch Logs** for logging and monitoring
- Use **SNS** for success notifications
- Use **IAM** for roles and policies
- Lambda functions must use ARM64 architecture
- Reserved concurrent executions must be configured for Lambda functions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to **us-east-1** region
- Python 3.9 or higher for Lambda runtime
- CDKTF version 0.19 or higher
- Terraform version 1.5 or higher

### Constraints

- Lambda functions MUST use ARM64 architecture (not x86_64)
- DynamoDB MUST use on-demand billing mode (not provisioned)
- DynamoDB MUST have point-in-time recovery enabled
- Reserved concurrent executions MUST be configured for Lambda functions
- CloudWatch Logs retention MUST be exactly 3 days (not 7, not 1, exactly 3)
- Lambda environment variables MUST be encrypted with customer-managed KMS key (not AWS managed key)
- Dead letter queue message retention MUST be exactly 4 days
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging for all Lambda functions
- Use least-privilege IAM policies (no wildcards in actions)

### Deployment Requirements (CRITICAL)

- All resource names must include the **environmentSuffix** parameter for uniqueness
- This allows multiple instances of the stack to be deployed without conflicts
- Example: lambda function named f"webhook-processor-{environment_suffix}"
- The environmentSuffix should be a configurable input variable
- All resources must be fully destroyable (RemovalPolicy: DESTROY or equivalent)
- Do NOT use RETAIN or DeletionProtection settings
- Stack must be idempotent and redeployable

## Success Criteria

- Functionality: Webhook processor receives data and stores in DynamoDB, enricher automatically processes stream events
- Performance: Lambda functions configured with appropriate memory and timeout settings
- Reliability: Dead letter queues capture failures, DynamoDB point-in-time recovery enabled
- Security: Customer-managed KMS encryption for Lambda env vars, least-privilege IAM policies
- Architecture: ARM64 architecture for Lambda functions, on-demand billing for DynamoDB
- Resource Naming: All resources include environmentSuffix for multi-environment support
- Monitoring: CloudWatch logs with 3-day retention, subscription filters for errors, SNS notifications
- Cost Optimization: Serverless architecture, on-demand billing, appropriate resource sizing
- Code Quality: Python code, well-structured CDKTF stack, proper error handling

## What to deliver

- Complete CDKTF Python implementation with main.py stack file
- cdktf.json configuration file
- requirements.txt with all Python dependencies
- Lambda function code for webhook-processor (in lib/lambda/ directory)
- Lambda function code for price-enricher (in lib/lambda/ directory)
- IAM roles and policies for Lambda functions with least-privilege access
- KMS key configuration for Lambda environment encryption
- DynamoDB table with proper schema and stream configuration
- SQS dead letter queues with 4-day retention
- CloudWatch Log groups with subscription filters
- SNS topic for success notifications
- Lambda event source mapping for DynamoDB streams
- Lambda destinations configuration
- Outputs: Lambda function ARNs, DynamoDB table name, SNS topic ARN
- README.md with deployment instructions and architecture overview
