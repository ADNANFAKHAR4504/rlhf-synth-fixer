# Serverless Application Infrastructure with AWS CDK Python

This solution implements a **production-ready serverless application infrastructure** using AWS CDK with Python. The architecture processes HTTP POST requests through a complete serverless pipeline including API Gateway, Lambda, S3, DynamoDB, and Step Functions.

## Architecture Overview

The solution creates a serverless request processing system that:

1. **Receives** HTTP POST requests via API Gateway with IAM authentication
2. **Processes** requests through a Lambda function
3. **Stores** payloads in S3 for persistent storage
4. **Logs** metadata in DynamoDB for tracking and auditing
5. **Initiates** asynchronous processing via Step Functions

## Infrastructure Components

### 1. API Gateway HTTP API
- **REST API** with IAM-based authentication for secure access
- **POST endpoint** at the root path for receiving requests
- **CORS configuration** for cross-origin support
- **Lambda integration** for request processing

### 2. AWS Lambda Function
- **Python 3.12 runtime** for modern language features
- **Request processing logic** that:
  - Generates unique request IDs using UUID
  - Parses JSON payloads from API Gateway
  - Stores data in S3 with structured key naming
  - Logs metadata to DynamoDB with all required fields
  - Initiates Step Functions execution for async processing
- **Error handling** with graceful HTTP responses
- **Environment variables** for resource configuration

### 3. Amazon S3 Bucket
- **Secure storage** for request payloads
- **Structured key naming** (`requests/{request_id}.json`)
- **Auto-delete objects** for easy cleanup during development
- **Proper IAM permissions** for Lambda read/write access

### 4. DynamoDB Table
- **Pay-per-request billing** for cost optimization
- **Partition key** on `request_id` for efficient lookups
- **Metadata fields**: `request_id`, `timestamp`, `s3_key`, `status`, `step_function_execution_arn`
- **Proper IAM permissions** for Lambda operations

### 5. Step Functions State Machine
- **Simple Pass state** for demonstration purposes
- **Execution naming** with request correlation
- **JSON input/output** for data processing
- **IAM permissions** for Lambda to start executions

### 6. IAM Security
- **Least privilege principle** with specific permissions
- **Lambda execution role** with granular S3, DynamoDB, and Step Functions access
- **API Gateway IAM authorization** for secure endpoint access
- **No hardcoded credentials** or overly broad permissions

## File Structure

The implementation consists of the following files:

### Core Infrastructure
- **`tap.py`** - CDK application entry point with environment configuration
- **`lib/tap_stack.py`** - Main stack definition with all AWS resources
- **`cdk.json`** - CDK configuration with feature flags and app command

### Testing
- **`tests/unit/test_tap_stack.py`** - Unit tests for infrastructure validation
- **`tests/integration/test_tap_stack.py`** - Integration tests for end-to-end workflow

## Implementation Details

### `tap.py`
```python
#!/usr/bin/env python3
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks
Tags.of(app).add('Environment', 'Production')
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
 
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-west-2'  # Deploy to Oregon region as specified
    )
)

TapStack(app, STACK_NAME, props=props)
app.synth()
```

### `lib/tap_stack.py`
The main stack implementation creates all required resources with proper naming conventions (`tap-{environment}-{resource}`) and comprehensive tagging:

- **S3 Bucket**: `tap-{env}-bucket` with auto-delete for cleanup
- **DynamoDB Table**: `tap-{env}-requests` with request_id partition key
- **Lambda Function**: `tap-{env}-processor` with inline code for request processing
- **Step Functions**: `tap-{env}-statemachine` with simple Pass state
- **API Gateway**: `tap-{env}-api` with POST method and IAM authorization

### Lambda Function Logic
The Lambda function implements the complete request processing workflow:

```python
def handler(event, context):
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Store payload in S3
        s3_key = f"requests/{request_id}.json"
        s3_client.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=s3_key,
            Body=json.dumps(body),
            ContentType='application/json'
        )
        
        # Start Step Functions execution
        execution_response = stepfunctions_client.start_execution(
            stateMachineArn=os.environ['STATE_MACHINE_ARN'],
            name=f"execution-{request_id}",
            input=json.dumps({"request_id": request_id, "payload": body})
        )
        execution_arn = execution_response['executionArn']
        
        # Log metadata in DynamoDB
        dynamodb_client.put_item(
            TableName=os.environ['TABLE_NAME'],
            Item={
                'request_id': {'S': request_id},
                'timestamp': {'S': timestamp},
                's3_key': {'S': s3_key},
                'status': {'S': 'processing'},
                'step_function_execution_arn': {'S': execution_arn}
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Request processed successfully',
                'request_id': request_id,
                'execution_arn': execution_arn
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
```

## Deployment Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   pipenv install
   ```

2. **Bootstrap CDK** (first time only):
   ```bash
   npm run cdk:bootstrap
   ```

3. **Deploy Stack**:
   ```bash
   npm run cdk:deploy
   ```

4. **Verify Deployment**:
   ```bash
   npm run test:integration
   ```

5. **Clean Up**:
   ```bash
   npm run cdk:destroy
   ```

## Security Considerations

- **IAM Authentication** on API Gateway prevents unauthorized access
- **Least privilege IAM roles** limit potential security exposure
- **No hardcoded secrets** - all configuration via environment variables
- **Resource tagging** enables proper cost allocation and governance
- **CORS configuration** allows controlled cross-origin requests

## Cost Optimization

- **Pay-per-request DynamoDB** eliminates idle capacity costs
- **Lambda-only compute** with no persistent servers
- **S3 standard storage** for request payload persistence
- **Step Functions Express workflows** for cost-effective orchestration

## Monitoring and Observability

The infrastructure includes CloudWatch integration through:
- **Lambda function logs** for request processing visibility
- **API Gateway access logs** for request tracking
- **Step Functions execution history** for workflow monitoring
- **DynamoDB metrics** for performance monitoring

## Testing Strategy

### Unit Tests
Comprehensive CDK template validation covering:
- Resource creation and configuration
- IAM permissions and security settings
- Environment-specific naming conventions
- Resource tagging compliance
- CloudFormation outputs

### Integration Tests
End-to-end workflow validation including:
- AWS resource accessibility verification
- Complete request processing pipeline testing
- Error handling and graceful degradation
- Cross-service integration verification

This solution provides a robust, scalable, and cost-effective serverless architecture that meets all specified requirements while following AWS best practices for security, monitoring, and operational excellence.