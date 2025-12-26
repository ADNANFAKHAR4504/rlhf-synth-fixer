# Serverless CRUD API with Pulumi Python

Build a Pulumi Python stack that sets up a simple serverless API for item management.

## Environment

Deploy to `us-east-1`. Main component should be `TapStack` in `lib/tap_stack.py`, accepting `TapStackArgs` for environment suffix and tags. Tests import from `lib.tap_stack`.

## Core Infrastructure

### 1. DynamoDB Table

Create an `aws.dynamodb.Table` for storing items:
- Name: `<environment_suffix>-items-table`
- Partition key: `ItemId` as string
- Sort key: `CreatedAt` as string
- Use PAY_PER_REQUEST billing
- Enable point-in-time recovery and encryption
- Table ARN gets used for IAM policy

### 2. IAM Role for Lambda

Set up a Lambda execution role that grants access to DynamoDB and CloudWatch:
- Attach `AWSLambdaBasicExecutionRole` for writing logs to CloudWatch
- Add custom inline policy for DynamoDB access - least privilege, only allowing `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan` on the specific table
- Tag everything with `args.tags`

### 3. Lambda Function

Deploy an inline Lambda that processes API requests and accesses DynamoDB:
- Python 3.9 runtime
- Name: `<environment_suffix>-items-lambda`
- Embed code using `pulumi.AssetArchive` or `StringAsset` - lightweight handler that returns JSON
- Timeout 5 seconds, memory 128MB
- Environment variable `DYNAMODB_TABLE_NAME` pointing to the table so Lambda can read/write items
- Set `publish=True` for versioning
- Apply tags

The handler is intentionally simple for quick deployment and smoke testing. Infrastructure supports full CRUD but the handler itself just returns a basic response.

### 4. API Gateway REST v1

Create REST API that connects to the Lambda function:
- Name: `<environment_suffix>-items-api`
- Resources for `/items`, `/items/ItemId`, `/items/ItemId/CreatedAt` paths
- Methods: GET and POST on `/items`, GET/PUT/DELETE on item paths, OPTIONS for CORS
- All methods integrate with Lambda using AWS_PROXY to invoke the function
- Deploy to `prod` stage
- Configure throttling: rate limit around 17 requests/sec, burst limit 50

### 5. CloudWatch Monitoring

Set up logging and alarms that send notifications to SNS:
- Log group `/aws/lambda/function_name` with 14 day retention for Lambda logs
- Three alarms on Lambda metrics: Duration averaging over 4000ms, any Errors, any Throttles
- Create SNS topic that receives alarm notifications
- Tag alarms and topic

### 6. Tagging Strategy

Apply tags from `TapStackArgs.tags` to all resources. Recommend defaults like `Project: IaC-Nova-Test, Owner: LLM-Eval`.

### 7. Stack Outputs

Export these via `register_outputs`:
- `dynamodb_table_name`
- `lambda_function_name`
- `api_rest_id`
- `api_stage`
- `alarm_topic_arn`

### 8. Scaling Notes

API Gateway throttling handles about 1000 requests per minute. Lambda uses on-demand concurrency - no AppAutoScaling or provisioned concurrency configured. This keeps things simple and avoids provider version quirks in different environments.

## Testing

Tests should import `from lib.tap_stack import TapStack, TapStackArgs`. Unit tests mock the Pulumi runtime, integration tests validate against live AWS.
