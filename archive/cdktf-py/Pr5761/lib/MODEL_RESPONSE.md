# Serverless Product Review System - CDKTF Python Implementation

This implementation provides a complete serverless product review processing system using CDKTF with Python.

## File: lib/tap_stack.py

```python
"""TAP Stack module for serverless product review system."""

from cdktf import TerraformStack, S3Backend, TerraformAsset, AssetType, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.s3_bucket_notification import (
    S3BucketNotification,
    S3BucketNotificationLambdaFunction
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole, IamRoleInlinePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_method_settings import ApiGatewayMethodSettings
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json
import os


class TapStack(TerraformStack):
    """CDKTF Python stack for serverless product review system."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # DynamoDB table for product reviews
        reviews_table = DynamodbTable(
            self,
            "reviews_table",
            name=f"product-reviews-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="productId",
            range_key="reviewId",
            attribute=[
                DynamodbTableAttribute(name="productId", type="S"),
                DynamodbTableAttribute(name="reviewId", type="S")
            ],
            point_in_time_recovery={"enabled": True},
            tags={"Environment": "Production", "Name": f"product-reviews-{environment_suffix}"}
        )

        # S3 bucket for review images
        images_bucket = S3Bucket(
            self,
            "images_bucket",
            bucket=f"review-images-{environment_suffix}",
            tags={"Environment": "Production", "Name": f"review-images-{environment_suffix}"}
        )

        # Block public access to S3 bucket
        S3BucketPublicAccessBlock(
            self,
            "images_bucket_block_public",
            bucket=images_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # S3 bucket encryption
        S3BucketServerSideEncryptionConfiguration(
            self,
            "images_bucket_encryption",
            bucket=images_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ]
        )

        # S3 lifecycle configuration for Glacier transition
        S3BucketLifecycleConfiguration(
            self,
            "images_bucket_lifecycle",
            bucket=images_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="glacier-transition",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ]
        )

        # CloudWatch log group for Lambda
        lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/review-processor-{environment_suffix}",
            retention_in_days=7,
            tags={"Environment": "Production"}
        )

        # IAM role for Lambda
        lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"review-processor-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            inline_policy=[
                IamRoleInlinePolicy(
                    name="lambda-permissions",
                    policy=json.dumps({
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "dynamodb:PutItem",
                                    "dynamodb:GetItem",
                                    "dynamodb:Query"
                                ],
                                "Resource": reviews_table.arn
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:GetObject",
                                    "s3:PutObject"
                                ],
                                "Resource": f"{images_bucket.arn}/*"
                            },
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents"
                                ],
                                "Resource": f"{lambda_log_group.arn}:*"
                            }
                        ]
                    })
                )
            ],
            tags={"Environment": "Production"}
        )

        # Package Lambda function code
        lambda_asset = TerraformAsset(
            self,
            "lambda_asset",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE
        )

        # Lambda function for review processing
        review_processor = LambdaFunction(
            self,
            "review_processor",
            function_name=f"review-processor-{environment_suffix}",
            runtime="nodejs18.x",
            handler="index.handler",
            memory_size=512,
            timeout=60,
            role=lambda_role.arn,
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            environment={
                "variables": {
                    "DYNAMODB_TABLE_NAME": reviews_table.name,
                    "S3_BUCKET_NAME": images_bucket.bucket
                }
            },
            tags={"Environment": "Production"},
            depends_on=[lambda_log_group]
        )

        # Lambda permission for S3 to invoke function
        LambdaPermission(
            self,
            "s3_invoke_lambda",
            statement_id="AllowS3Invoke",
            action="lambda:InvokeFunction",
            function_name=review_processor.function_name,
            principal="s3.amazonaws.com",
            source_arn=images_bucket.arn
        )

        # S3 bucket notification for image uploads
        S3BucketNotification(
            self,
            "image_upload_notification",
            bucket=images_bucket.id,
            lambda_function=[
                S3BucketNotificationLambdaFunction(
                    lambda_function_arn=review_processor.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_suffix=".jpg"
                ),
                S3BucketNotificationLambdaFunction(
                    lambda_function_arn=review_processor.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_suffix=".png"
                ),
                S3BucketNotificationLambdaFunction(
                    lambda_function_arn=review_processor.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_suffix=".jpeg"
                ),
                S3BucketNotificationLambdaFunction(
                    lambda_function_arn=review_processor.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_suffix=".gif"
                )
            ],
            depends_on=[review_processor]
        )

        # API Gateway REST API
        api = ApiGatewayRestApi(
            self,
            "reviews_api",
            name=f"reviews-api-{environment_suffix}",
            description="Product Review API",
            tags={"Environment": "Production"}
        )

        # CloudWatch log group for API Gateway
        api_log_group = CloudwatchLogGroup(
            self,
            "api_log_group",
            name=f"/aws/apigateway/reviews-api-{environment_suffix}",
            retention_in_days=7,
            tags={"Environment": "Production"}
        )

        # API Gateway resource: /reviews
        reviews_resource = ApiGatewayResource(
            self,
            "reviews_resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="reviews"
        )

        # API Gateway resource: /reviews/{productId}
        product_reviews_resource = ApiGatewayResource(
            self,
            "product_reviews_resource",
            rest_api_id=api.id,
            parent_id=reviews_resource.id,
            path_part="{productId}"
        )

        # POST /reviews method
        post_method = ApiGatewayMethod(
            self,
            "post_reviews_method",
            rest_api_id=api.id,
            resource_id=reviews_resource.id,
            http_method="POST",
            authorization="AWS_IAM"
        )

        # POST /reviews integration
        ApiGatewayIntegration(
            self,
            "post_reviews_integration",
            rest_api_id=api.id,
            resource_id=reviews_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=review_processor.invoke_arn
        )

        # Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api_invoke_lambda",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=review_processor.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # GET /reviews/{productId} method
        get_method = ApiGatewayMethod(
            self,
            "get_reviews_method",
            rest_api_id=api.id,
            resource_id=product_reviews_resource.id,
            http_method="GET",
            authorization="NONE",
            request_parameters={"method.request.path.productId": True}
        )

        # GET /reviews/{productId} integration
        ApiGatewayIntegration(
            self,
            "get_reviews_integration",
            rest_api_id=api.id,
            resource_id=product_reviews_resource.id,
            http_method=get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=review_processor.invoke_arn
        )

        # API Gateway deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=api.id,
            depends_on=[post_method, get_method],
            lifecycle={"create_before_destroy": True}
        )

        # API Gateway stage
        stage = ApiGatewayStage(
            self,
            "api_stage",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            tags={"Environment": "Production"}
        )

        # API Gateway throttling settings
        ApiGatewayMethodSettings(
            self,
            "api_throttling",
            rest_api_id=api.id,
            stage_name=stage.stage_name,
            method_path="*/*",
            settings={
                "throttling_burst_limit": 100,
                "throttling_rate_limit": 100,
                "logging_level": "INFO",
                "data_trace_enabled": True,
                "metrics_enabled": True
            }
        )
```

## File: lib/lambda/index.js

```javascript
// Review processing Lambda function using AWS SDK v3
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle S3 event (image processing)
    if (event.Records && event.Records[0].eventSource === 'aws:s3') {
        return handleS3Event(event);
    }

    // Handle API Gateway event
    if (event.httpMethod) {
        return handleApiGatewayEvent(event);
    }

    return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Unsupported event type' })
    };
};

async function handleS3Event(event) {
    try {
        const record = event.Records[0];
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing image: ${objectKey} from bucket: ${bucketName}`);

        // Get object metadata
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });

        const response = await s3Client.send(getCommand);
        console.log(`Image metadata: ContentType=${response.ContentType}, Size=${response.ContentLength}`);

        // Here you would add image validation and processing logic
        // For example: check file size, validate image format, extract metadata, etc.

        return {
            statusCode: 200,
            message: 'Image processed successfully'
        };
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error;
    }
}

async function handleApiGatewayEvent(event) {
    const method = event.httpMethod;
    const path = event.path;

    try {
        if (method === 'POST' && path === '/reviews') {
            return await createReview(event);
        } else if (method === 'GET' && path.startsWith('/reviews/')) {
            return await getReviews(event);
        }

        return {
            statusCode: 404,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Not found' })
        };
    } catch (error) {
        console.error('Error handling API Gateway event:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error', error: error.message })
        };
    }
}

async function createReview(event) {
    const body = JSON.parse(event.body || '{}');
    const { productId, reviewId, rating, comment, imageUrl } = body;

    // Validate input
    if (!productId || !reviewId || !rating) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Missing required fields: productId, reviewId, rating' })
        };
    }

    if (rating < 1 || rating > 5) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Rating must be between 1 and 5' })
        };
    }

    // Create review item
    const item = {
        productId,
        reviewId,
        rating,
        comment: comment || '',
        imageUrl: imageUrl || '',
        timestamp: new Date().toISOString()
    };

    const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    });

    await docClient.send(putCommand);

    return {
        statusCode: 201,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Review created successfully', review: item })
    };
}

async function getReviews(event) {
    const productId = event.pathParameters?.productId;

    if (!productId) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Missing productId parameter' })
        };
    }

    const queryCommand = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'productId = :productId',
        ExpressionAttributeValues: {
            ':productId': productId
        }
    });

    const result = await docClient.send(queryCommand);

    return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({
            productId,
            count: result.Count,
            reviews: result.Items
        })
    };
}

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    };
}
```

## File: lib/lambda/package.json

```json
{
  "name": "review-processor",
  "version": "1.0.0",
  "description": "Lambda function for processing product reviews",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/lib-dynamodb": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0"
  }
}
```