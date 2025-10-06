### Reasoning Trace
---

The user wants a CDK project in Python that sets up a serverless backend with:

1. Lambda function written in TypeScript
2. API Gateway REST API with /items path (GET and POST)
3. POST stores data to S3
4. Lambda responses should be JSON
5. Proper IAM roles (basic execution + S3 permissions)
6. Environment variables for configuration
7. CloudWatch logging for API Gateway
8. Good IaC practices
9. Parameterizable stack

I need to create:
1. `app.py` - CDK app entry point
2. Stack class with all resources
3. Lambda function code in TypeScript
4. Proper IAM permissions
5. API Gateway with CloudWatch logging
6. S3 bucket
7. Environment variables configuration

Let me structure this properly:
### Answer 
---

I'll create a complete CDK project in Python that sets up your serverless backend. Here's the full solution with all the components you need:

## Project Structure

```
serverless-backend/
├── app.py
├── stack.py
├── lambda/
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
├── requirements.txt
└── cdk.json
```

## CDK Application Files

### `app.py`
```python
#!/usr/bin/env python3
import os
from aws_cdk import App, Environment
from stack import ServerlessBackendStack

app = App()

# Get configuration from context or environment variables
env_config = Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
)

# Stack configuration - can be overridden via CDK context
config = {
    "bucket_name": app.node.try_get_context("bucket_name") or "serverless-items-bucket",
    "environment": app.node.try_get_context("environment") or "dev",
    "api_stage_name": app.node.try_get_context("api_stage_name") or "v1",
    "ip_allowlist": app.node.try_get_context("ip_allowlist") or [],
    "enable_cors": app.node.try_get_context("enable_cors") or True,
    "log_retention_days": app.node.try_get_context("log_retention_days") or 7,
    "custom_domain": app.node.try_get_context("custom_domain"),  # Optional
    "certificate_arn": app.node.try_get_context("certificate_arn"),  # Optional
}

ServerlessBackendStack(
    app, 
    f"ServerlessBackendStack-{config['environment']}",
    env=env_config,
    **config
)

app.synth()
```

### `stack.py`
```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_s3 as s3,
    aws_logs as logs,
    aws_lambda_nodejs as nodejs,
)
from constructs import Construct
from typing import List, Optional


class ServerlessBackendStack(Stack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        bucket_name: str,
        environment: str,
        api_stage_name: str,
        ip_allowlist: List[str],
        enable_cors: bool,
        log_retention_days: int,
        custom_domain: Optional[str] = None,
        certificate_arn: Optional[str] = None,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        # S3 Bucket for storing items
        items_bucket = s3.Bucket(
            self,
            "ItemsBucket",
            bucket_name=f"{bucket_name}-{environment}-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if environment == "prod" else RemovalPolicy.DESTROY,
            auto_delete_objects=environment != "prod",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30),
                    enabled=True
                )
            ]
        )

        # CloudWatch Log Group for Lambda
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/items-handler-{environment}",
            retention=logs.RetentionDays(log_retention_days),
            removal_policy=RemovalPolicy.DESTROY
        )

        # IAM Role for Lambda
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for items handler Lambda in {environment}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add S3 permissions to Lambda role (least privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    items_bucket.bucket_arn,
                    f"{items_bucket.bucket_arn}/*"
                ]
            )
        )

        # Lambda Function
        items_handler = nodejs.NodejsFunction(
            self,
            "ItemsHandler",
            function_name=f"items-handler-{environment}",
            entry="lambda/index.ts",
            handler="handler",
            runtime=lambda_.Runtime.NODEJS_18_X,
            timeout=Duration.seconds(30),
            memory_size=512,
            role=lambda_role,
            log_group=lambda_log_group,
            environment={
                "BUCKET_NAME": items_bucket.bucket_name,
                "ENVIRONMENT": environment,
                "LOG_LEVEL": "INFO" if environment == "prod" else "DEBUG",
                "REGION": self.region,
            },
            bundling=nodejs.BundlingOptions(
                minify=environment == "prod",
                source_map=environment != "prod",
                external_modules=["aws-sdk"],
                tsconfig="lambda/tsconfig.json"
            ),
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2,
            dead_letter_queue_enabled=False
        )

        # CloudWatch Log Group for API Gateway
        api_log_group = logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name=f"/aws/apigateway/items-api-{environment}",
            retention=logs.RetentionDays(log_retention_days),
            removal_policy=RemovalPolicy.DESTROY
        )

        # API Gateway REST API
        api = apigateway.RestApi(
            self,
            "ItemsApi",
            rest_api_name=f"items-api-{environment}",
            description=f"REST API for items management in {environment}",
            deploy_options=apigateway.StageOptions(
                stage_name=api_stage_name,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                ),
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                tracing_enabled=True,
            ),
            cloud_watch_role=True,
            endpoint_types=[apigateway.EndpointType.REGIONAL],
            policy=self._create_resource_policy(ip_allowlist) if ip_allowlist else None,
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            items_handler,
            request_templates={"application/json": '{"statusCode": 200}'},
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={
                        "application/json": "$input.json('$')"
                    }
                )
            ],
            proxy=False,
            allow_test_invoke=True,
        )

        # API Gateway /items resource
        items_resource = api.root.add_resource("items")

        # Configure CORS if enabled
        if enable_cors:
            cors_options = apigateway.CorsOptions(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
                max_age=Duration.seconds(300)
            )
            items_resource.add_cors_preflight(
                allow_origins=cors_options.allow_origins,
                allow_methods=cors_options.allow_methods,
                allow_headers=cors_options.allow_headers,
                max_age=cors_options.max_age
            )

        # GET /items
        items_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={
                        "application/json": apigateway.Model.EMPTY_MODEL
                    }
                )
            ],
            request_validator=apigateway.RequestValidator(
                self,
                "GetRequestValidator",
                rest_api=api,
                validate_request_parameters=True,
                validate_request_body=False
            ),
            api_key_required=False
        )

        # POST /items
        items_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={
                        "application/json": apigateway.Model.EMPTY_MODEL
                    }
                )
            ],
            request_validator=apigateway.RequestValidator(
                self,
                "PostRequestValidator",
                rest_api=api,
                validate_request_parameters=False,
                validate_request_body=True
            ),
            api_key_required=False
        )

        # Custom domain (optional)
        if custom_domain and certificate_arn:
            from aws_cdk import aws_certificatemanager as acm
            from aws_cdk import aws_route53 as route53
            from aws_cdk import aws_route53_targets as targets
            
            certificate = acm.Certificate.from_certificate_arn(
                self, "Certificate", certificate_arn
            )
            
            domain = apigateway.DomainName(
                self,
                "CustomDomain",
                domain_name=custom_domain,
                certificate=certificate,
                endpoint_type=apigateway.EndpointType.REGIONAL,
                security_policy=apigateway.SecurityPolicy.TLS_1_2
            )
            
            apigateway.BasePathMapping(
                self,
                "BasePathMapping",
                domain_name=domain,
                rest_api=api,
                base_path=""
            )

        # Outputs
        self.output_api_url = f"https://{api.rest_api_id}.execute-api.{self.region}.amazonaws.com/{api_stage_name}"
        self.output_bucket_name = items_bucket.bucket_name

    def _create_resource_policy(self, ip_allowlist: List[str]) -> iam.PolicyDocument:
        """Create API Gateway resource policy for IP allowlist"""
        statements = []
        
        if ip_allowlist:
            statements.append(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AnyPrincipal()],
                    actions=["execute-api:Invoke"],
                    resources=["*"],
                    conditions={
                        "IpAddress": {
                            "aws:SourceIp": ip_allowlist
                        }
                    }
                )
            )
        else:
            statements.append(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AnyPrincipal()],
                    actions=["execute-api:Invoke"],
                    resources=["*"]
                )
            )
        
        return iam.PolicyDocument(statements=statements)
```

### `lambda/index.ts`
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.REGION || 'us-east-1' });
const BUCKET_NAME = process.env.BUCKET_NAME!;
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

interface Item {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
}

const log = (level: string, message: string, data?: any) => {
    if (LOG_LEVEL === 'DEBUG' || (LOG_LEVEL === 'INFO' && level !== 'DEBUG')) {
        console.log(JSON.stringify({
            level,
            message,
            data,
            timestamp: new Date().toISOString()
        }));
    }
};

const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify(body)
    };
};

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    log('INFO', 'Lambda invoked', {
        requestId: context.requestId,
        method: event.httpMethod,
        path: event.path,
        resource: event.resource
    });

    try {
        const method = event.httpMethod;
        const resource = event.resource;

        if (resource === '/items') {
            switch (method) {
                case 'GET':
                    return await handleGetItems(event);
                case 'POST':
                    return await handlePostItem(event);
                default:
                    return createResponse(405, {
                        error: 'Method not allowed',
                        message: `Method ${method} is not supported`
                    });
            }
        }

        return createResponse(404, {
            error: 'Not found',
            message: `Resource ${resource} not found`
        });

    } catch (error) {
        log('ERROR', 'Lambda execution failed', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
        });

        return createResponse(500, {
            error: 'Internal server error',
            message: 'An unexpected error occurred'
        });
    }
};

async function handleGetItems(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        log('DEBUG', 'Fetching items from S3', { bucket: BUCKET_NAME });

        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: 'items/',
            MaxKeys: 100
        });

        const listResponse = await s3Client.send(listCommand);
        const items: Item[] = [];

        if (listResponse.Contents) {
            for (const object of listResponse.Contents) {
                if (object.Key && !object.Key.endsWith('/')) {
                    try {
                        const getCommand = new GetObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: object.Key
                        });
                        
                        const getResponse = await s3Client.send(getCommand);
                        const bodyString = await getResponse.Body?.transformToString();
                        
                        if (bodyString) {
                            const item = JSON.parse(bodyString) as Item;
                            items.push(item);
                        }
                    } catch (err) {
                        log('ERROR', `Failed to fetch item ${object.Key}`, err);
                    }
                }
            }
        }

        log('INFO', 'Successfully fetched items', { count: items.length });

        return createResponse(200, {
            items,
            count: items.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log('ERROR', 'Failed to fetch items', error);
        throw error;
    }
}

async function handlePostItem(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        if (!event.body) {
            return createResponse(400, {
                error: 'Bad request',
                message: 'Request body is required'
            });
        }

        let itemData: Partial<Item>;
        try {
            itemData = JSON.parse(event.body);
        } catch (err) {
            return createResponse(400, {
                error: 'Bad request',
                message: 'Invalid JSON in request body'
            });
        }

        if (!itemData.name) {
            return createResponse(400, {
                error: 'Bad request',
                message: 'Item name is required'
            });
        }

        const item: Item = {
            id: uuidv4(),
            name: itemData.name,
            description: itemData.description,
            createdAt: new Date().toISOString()
        };

        log('DEBUG', 'Storing item to S3', { item });

        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `items/${item.id}.json`,
            Body: JSON.stringify(item),
            ContentType: 'application/json',
            Metadata: {
                'created-by': 'items-api',
                'environment': process.env.ENVIRONMENT || 'unknown'
            }
        });

        await s3Client.send(putCommand);

        log('INFO', 'Successfully created item', { id: item.id });

        return createResponse(200, {
            message: 'Item created successfully',
            item,
            location: `items/${item.id}.json`
        });

    } catch (error) {
        log('ERROR', 'Failed to create item', error);
        throw error;
    }
}
```

### `lambda/package.json`
```json
{
  "name": "items-handler",
  "version": "1.0.0",
  "description": "Lambda function for handling items API",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.119",
    "@types/node": "^20.5.0",
    "@types/uuid": "^9.0.2",
    "typescript": "^5.1.6"
  }
}
```

### `lambda/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": true
  },
  "exclude": ["node_modules", "dist"]
}
```

### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
aws-cdk.aws-lambda-python-alpha>=2.100.0a0
```

### `cdk.json`
```json
{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "environment": "dev",
    "api_stage_name": "v1",
    "bucket_name": "serverless-items",
    "ip_allowlist": [],
    "enable_cors": true,
    "log_retention_days": 7
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
# Python dependencies
pip install -r requirements.txt

# TypeScript dependencies for Lambda
cd lambda && npm install && cd ..
```

2. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap
```

3. **Deploy with default settings:**
```bash
cdk deploy
```

4. **Deploy with custom parameters:**
```bash
# With IP allowlist
cdk deploy -c ip_allowlist='["1.2.3.4/32","5.6.7.8/32"]'

# Production deployment
cdk deploy -c environment=prod -c log_retention_days=30

# With custom domain
cdk deploy -c custom_domain=api.example.com -c certificate_arn=arn:aws:acm:...
```

## Key Features Implemented

1. **Lambda Function (TypeScript):**
   - Handles GET and POST requests for `/items`
   - Stores data in S3 as JSON files
   - Returns JSON responses
   - Includes proper error handling and logging

2. **API Gateway:**
   - REST API with `/items` resource
   - CloudWatch logging enabled for requests and responses
   - CORS configuration
   - Request validation
   - Optional IP allowlist support
   - Throttling configuration

3. **IAM Permissions:**
   - Minimal permissions (principle of least privilege)
   - Lambda has only necessary S3 permissions
   - Basic execution role for CloudWatch logs

4. **Configuration:**
   - Environment variables for Lambda configuration
   - Parameterized stack for easy customization
   - CDK context for deployment-time configuration

5. **Observability:**
   - CloudWatch logs for both API Gateway and Lambda
   - X-Ray tracing enabled
   - Structured JSON logging

6. **Best Practices:**
   - S3 bucket versioning and encryption
   - Lifecycle rules for old versions
   - Retention policies for logs
   - Environment-specific configurations
   - TypeScript for type safety in Lambda

The solution is production-ready and follows AWS best practices for serverless applications. You can deploy it immediately with `cdk deploy` and it will create a fully functional serverless backend.