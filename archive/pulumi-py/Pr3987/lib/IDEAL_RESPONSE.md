```Python
class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.
    
    Serverless Image Inference Pipeline on AWS
    A production-ready pipeline for async image processing with ML inference

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Configuration
        config = pulumi.Config()
        project_name = pulumi.get_project()
        stack_name = pulumi.get_stack()
        resource_prefix = f"{project_name}-{stack_name}"

        # Reasonable defaults for Lambda functions
        LAMBDA_TIMEOUT = 300  # 5 minutes - adjust based on your model inference time
        LAMBDA_MEMORY = 3008  # MB - sufficient for most ML models, tune based on your needs
        SQS_VISIBILITY_TIMEOUT = 360  # 6 minutes - slightly longer than Lambda timeout
        SQS_MESSAGE_RETENTION = 1209600  # 14 days max
        IMAGE_MAX_SIZE_MB = 10  # Adjust based on your requirements

        # ==================== S3 Bucket ====================

        # Bucket for image uploads with versioning
        self.image_bucket = aws.s3.Bucket(
            f"{resource_prefix}-images",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="delete-old-versions",
                    enabled=True,
                    noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                        days=30  # Keep old versions for 30 days
                    )
                )
            ],
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={
                "Environment": stack_name,
                "Purpose": "Image uploads for inference pipeline",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access for security
        bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"{resource_prefix}-images-pab",
            bucket=self.image_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # ==================== DynamoDB Table ====================

        # Table for storing processing results with efficient access patterns
        self.results_table = aws.dynamodb.Table(
            f"{resource_prefix}-results",
            hash_key="image_id",  # Primary key for direct lookups
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="image_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="status",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="created_at",
                    type="N"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="status-created-index",
                    hash_key="status",
                    range_key="created_at",
                    projection_type="ALL",
                    read_capacity=5,
                    write_capacity=5
                )
            ],
            billing_mode="PAY_PER_REQUEST",  # On-demand pricing for variable workloads
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={
                "Environment": stack_name,
                "Purpose": "Inference results storage",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # ==================== SQS Queues ====================

        # Dead letter queue for failed messages
        self.dlq = aws.sqs.Queue(
            f"{resource_prefix}-dlq",
            message_retention_seconds=SQS_MESSAGE_RETENTION,
            visibility_timeout_seconds=30,
            tags={
                "Environment": stack_name,
                "Purpose": "Dead letter queue for failed processing",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Queue for preprocessing tasks
        self.preprocessing_queue = aws.sqs.Queue(
            f"{resource_prefix}-preprocessing",
            visibility_timeout_seconds=SQS_VISIBILITY_TIMEOUT,
            message_retention_seconds=SQS_MESSAGE_RETENTION,
            redrive_policy=self.dlq.arn.apply(lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": 3  # Retry 3 times before sending to DLQ
            })),
            tags={
                "Environment": stack_name,
                "Purpose": "Image preprocessing tasks",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Queue for inference tasks
        self.inference_queue = aws.sqs.Queue(
            f"{resource_prefix}-inference",
            visibility_timeout_seconds=SQS_VISIBILITY_TIMEOUT,
            message_retention_seconds=SQS_MESSAGE_RETENTION,
            redrive_policy=self.dlq.arn.apply(lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": 3
            })),
            tags={
                "Environment": stack_name,
                "Purpose": "Model inference tasks",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # ==================== IAM Roles and Policies ====================

        # Base Lambda execution policy
        lambda_base_policy = aws.iam.Policy(
            f"{resource_prefix}-lambda-base",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "xray:PutTraceSegments",
                            "xray:PutTelemetryRecords"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Preprocessing Lambda role with S3 read and SQS write permissions
        preprocessing_role = aws.iam.Role(
            f"{resource_prefix}-preprocessing-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        preprocessing_policy = aws.iam.Policy(
            f"{resource_prefix}-preprocessing-policy",
            policy=Output.all(
                self.image_bucket.arn,
                self.preprocessing_queue.arn,
                self.inference_queue.arn,
                self.results_table.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:UpdateItem",
                            "dynamodb:PutItem"
                        ],
                        "Resource": args[3]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"{resource_prefix}-preprocessing-base",
            role=preprocessing_role.name,
            policy_arn=lambda_base_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"{resource_prefix}-preprocessing-custom",
            role=preprocessing_role.name,
            policy_arn=preprocessing_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Inference Lambda role with S3 write and DynamoDB write permissions
        inference_role = aws.iam.Role(
            f"{resource_prefix}-inference-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        inference_policy = aws.iam.Policy(
            f"{resource_prefix}-inference-policy",
            policy=Output.all(
                self.image_bucket.arn,
                self.inference_queue.arn,
                self.results_table.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:UpdateItem",
                            "dynamodb:PutItem"
                        ],
                        "Resource": args[2]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"{resource_prefix}-inference-base",
            role=inference_role.name,
            policy_arn=lambda_base_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"{resource_prefix}-inference-custom",
            role=inference_role.name,
            policy_arn=inference_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # API Lambda role with S3 presigned URL and DynamoDB read permissions
        api_role = aws.iam.Role(
            f"{resource_prefix}-api-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        api_policy = aws.iam.Policy(
            f"{resource_prefix}-api-policy",
            policy=Output.all(
                self.image_bucket.arn,
                self.preprocessing_queue.arn,
                self.results_table.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": f"{args[0]}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query"
                        ],
                        "Resource": [args[2], f"{args[2]}/index/*"]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"{resource_prefix}-api-base",
            role=api_role.name,
            policy_arn=lambda_base_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"{resource_prefix}-api-custom",
            role=api_role.name,
            policy_arn=api_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # ==================== Lambda Layer for Model ====================

        # NOTE: You need to create a ZIP file containing your model and dependencies
        # Structure: python/lib/python3.8/site-packages/[your packages]
        # This is a placeholder - replace with your actual model layer
        self.model_layer = aws.lambda_.LayerVersion(
            f"{resource_prefix}-model-layer",
            layer_name=f"{resource_prefix}-model",
            compatible_runtimes=["python3.8", "python3.9", "python3.10", "python3.11"],
            # Create a dummy layer for now - replace with your actual model ZIP
            code=pulumi.AssetArchive({
                "python/model_placeholder.txt": pulumi.StringAsset("Replace with actual model files")
            }),
            description="Pre-trained model and ML dependencies",
            opts=ResourceOptions(parent=self)
        )

        # ==================== Lambda Functions ====================

        # Preprocessing Lambda code
        preprocessing_code = """
import json
import boto3
import os
import base64
from datetime import datetime
import traceback
import uuid

s3 = boto3.client('s3')
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    '''Preprocesses images from S3 and sends to inference queue'''
    
    inference_queue_url = os.environ['INFERENCE_QUEUE_URL']
    table = dynamodb.Table(os.environ['RESULTS_TABLE'])
    
    for record in event['Records']:
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            
            # Handle S3 event notification
            if 'Records' in message_body:
                s3_record = message_body['Records'][0]
                bucket = s3_record['s3']['bucket']['name']
                key = s3_record['s3']['object']['key']
                image_id = key.split('/')[-1].split('.')[0]
            else:
                # Direct message format
                bucket = message_body['bucket']
                key = message_body['key']
                image_id = message_body['image_id']
            
            print(f"Processing image: {image_id} from {bucket}/{key}")
            
            # Update status to processing
            table.update_item(
                Key={'image_id': image_id},
                UpdateExpression='SET #status = :status, preprocessing_started_at = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'preprocessing',
                    ':timestamp': int(datetime.utcnow().timestamp())
                }
            )
            
            # Download image from S3
            response = s3.get_object(Bucket=bucket, Key=key)
            image_data = response['Body'].read()
            
            # Basic preprocessing (resize, normalize, etc.)
            # In production, use PIL or OpenCV for actual preprocessing
            processed_key = f"processed/{image_id}.bin"
            
            # Save preprocessed image back to S3
            s3.put_object(
                Bucket=bucket,
                Key=processed_key,
                Body=image_data,  # In reality, this would be processed data
                Metadata={
                    'original_key': key,
                    'preprocessed_at': datetime.utcnow().isoformat()
                }
            )
            
            # Send to inference queue
            sqs.send_message(
                QueueUrl=inference_queue_url,
                MessageBody=json.dumps({
                    'image_id': image_id,
                    'bucket': bucket,
                    'processed_key': processed_key,
                    'original_key': key
                })
            )
            
            # Update status
            table.update_item(
                Key={'image_id': image_id},
                UpdateExpression='SET #status = :status, preprocessing_completed_at = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'preprocessed',
                    ':timestamp': int(datetime.utcnow().timestamp())
                }
            )
            
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            print(traceback.format_exc())
            
            # Update status to failed
            try:
                table.update_item(
                    Key={'image_id': image_id},
                    UpdateExpression='SET #status = :status, error = :error',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'preprocessing_failed',
                        ':error': str(e)
                    }
                )
            except:
                pass
            
            raise  # Re-raise to trigger retry/DLQ
    
    return {'statusCode': 200}
"""

        self.preprocessing_function = aws.lambda_.Function(
            f"{resource_prefix}-preprocessing",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(preprocessing_code)
            }),
            handler="index.handler",
            runtime="python3.11",
            role=preprocessing_role.arn,
            timeout=LAMBDA_TIMEOUT,
            memory_size=1024,  # 1GB for preprocessing
            reserved_concurrent_executions=10,  # Prevent runaway scaling
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "INFERENCE_QUEUE_URL": self.inference_queue.url,
                    "RESULTS_TABLE": self.results_table.name
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"  # X-Ray tracing
            ),
            tags={
                "Environment": stack_name,
                "Purpose": "Image preprocessing",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Inference Lambda code
        inference_code = """
import json
import boto3
import os
import base64
from datetime import datetime
import traceback

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    '''Runs model inference on preprocessed images'''
    
    table = dynamodb.Table(os.environ['RESULTS_TABLE'])
    
    for record in event['Records']:
        try:
            # Parse SQS message
            message = json.loads(record['body'])
            image_id = message['image_id']
            bucket = message['bucket']
            processed_key = message['processed_key']
            
            print(f"Running inference for image: {image_id}")
            
            # Update status to inferencing
            table.update_item(
                Key={'image_id': image_id},
                UpdateExpression='SET #status = :status, inference_started_at = :timestamp',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'inferencing',
                    ':timestamp': int(datetime.utcnow().timestamp())
                }
            )
            
            # Download preprocessed image
            response = s3.get_object(Bucket=bucket, Key=processed_key)
            image_data = response['Body'].read()
            
            # Load model (in production, load from layer and cache)
            # model = load_model_from_layer()
            
            # Run inference (placeholder - replace with actual model inference)
            # predictions = model.predict(image_data)
            predictions = {
                'classes': ['cat', 'dog', 'bird'],
                'probabilities': [0.7, 0.2, 0.1],
                'confidence': 0.7
            }
            
            # Save results to S3
            results_key = f"results/{image_id}.json"
            s3.put_object(
                Bucket=bucket,
                Key=results_key,
                Body=json.dumps(predictions, indent=2),
                ContentType='application/json'
            )
            
            # Update DynamoDB with results
            table.update_item(
                Key={'image_id': image_id},
                UpdateExpression='''
                    SET #status = :status, 
                        inference_completed_at = :timestamp,
                        results = :results,
                        results_s3_key = :results_key,
                        top_prediction = :top_prediction,
                        confidence = :confidence
                ''',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':timestamp': int(datetime.utcnow().timestamp()),
                    ':results': json.dumps(predictions),
                    ':results_key': results_key,
                    ':top_prediction': predictions['classes'][0],
                    ':confidence': predictions['confidence']
                }
            )
            
            print(f"Inference completed for {image_id}: {predictions['classes'][0]} ({predictions['confidence']*100:.1f}%)")
            
        except Exception as e:
            print(f"Error during inference: {str(e)}")
            print(traceback.format_exc())
            
            # Update status to failed
            try:
                table.update_item(
                    Key={'image_id': image_id},
                    UpdateExpression='SET #status = :status, error = :error',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'inference_failed',
                        ':error': str(e)
                    }
                )
            except:
                pass
            
            raise  # Re-raise to trigger retry/DLQ
    
    return {'statusCode': 200}
"""

        self.inference_function = aws.lambda_.Function(
            f"{resource_prefix}-inference",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(inference_code)
            }),
            handler="index.handler",
            runtime="python3.11",
            role=inference_role.arn,
            timeout=LAMBDA_TIMEOUT,
            memory_size=LAMBDA_MEMORY,
            reserved_concurrent_executions=5,  # Control concurrency for GPU/memory intensive work
            layers=[self.model_layer.arn],
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "RESULTS_TABLE": self.results_table.name
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags={
                "Environment": stack_name,
                "Purpose": "Model inference",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # API Handler Lambda code
        api_handler_code = """
import json
import boto3
import os
import uuid
from datetime import datetime, timedelta
import base64

s3 = boto3.client('s3')
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    '''Handles API Gateway requests for image submission and status checks'''
    
    table = dynamodb.Table(os.environ['RESULTS_TABLE'])
    bucket_name = os.environ['IMAGE_BUCKET']
    queue_url = os.environ['PREPROCESSING_QUEUE_URL']
    
    path = event.get('path', event.get('rawPath', ''))
    method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', ''))
    
    # Enable CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    try:
        # POST /images - Submit new image for processing
        if method == 'POST' and path == '/images':
            # Generate unique image ID
            image_id = str(uuid.uuid4())
            timestamp = int(datetime.utcnow().timestamp())
            
            # Generate presigned URL for S3 upload
            key = f"uploads/{image_id}.jpg"  # Adjust extension as needed
            presigned_url = s3.generate_presigned_url(
                'put_object',
                Params={'Bucket': bucket_name, 'Key': key},
                ExpiresIn=3600  # 1 hour expiry
            )
            
            # Create initial record in DynamoDB
            table.put_item(Item={
                'image_id': image_id,
                'status': 'pending_upload',
                'created_at': timestamp,
                's3_key': key,
                'bucket': bucket_name
            })
            
            # If image data is provided in body, upload directly
            if event.get('body'):
                try:
                    body_data = json.loads(event['body'])
                    if 'image_base64' in body_data:
                        image_data = base64.b64decode(body_data['image_base64'])
                        
                        # Upload to S3
                        s3.put_object(
                            Bucket=bucket_name,
                            Key=key,
                            Body=image_data
                        )
                        
                        # Send to preprocessing queue
                        sqs.send_message(
                            QueueUrl=queue_url,
                            MessageBody=json.dumps({
                                'image_id': image_id,
                                'bucket': bucket_name,
                                'key': key
                            })
                        )
                        
                        # Update status
                        table.update_item(
                            Key={'image_id': image_id},
                            UpdateExpression='SET #status = :status',
                            ExpressionAttributeNames={'#status': 'status'},
                            ExpressionAttributeValues={':status': 'queued'}
                        )
                except:
                    pass  # Fall back to presigned URL method
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({
                    'image_id': image_id,
                    'upload_url': presigned_url,
                    'status': 'pending_upload',
                    'message': 'Upload your image to the provided URL, then it will be automatically processed'
                })
            }
        
        # GET /images/{id} - Get status and results
        elif method == 'GET' and path.startswith('/images/'):
            image_id = path.split('/')[-1]
            
            # Get item from DynamoDB
            response = table.get_item(Key={'image_id': image_id})
            
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Image not found'})
                }
            
            item = response['Item']
            
            # Prepare response
            result = {
                'image_id': image_id,
                'status': item.get('status', 'unknown'),
                'created_at': item.get('created_at'),
                'last_updated': item.get('inference_completed_at', item.get('preprocessing_completed_at', item.get('created_at')))
            }
            
            # Add results if completed
            if item.get('status') == 'completed':
                result['results'] = json.loads(item.get('results', '{}'))
                result['top_prediction'] = item.get('top_prediction')
                result['confidence'] = float(item.get('confidence', 0))
                
                # Generate presigned URL for results
                if item.get('results_s3_key'):
                    result['results_url'] = s3.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': bucket_name, 'Key': item['results_s3_key']},
                        ExpiresIn=3600
                    )
            
            # Add error info if failed
            if 'failed' in item.get('status', ''):
                result['error'] = item.get('error', 'Processing failed')
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result)
            }
        
        # Unsupported endpoint
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Unsupported endpoint'})
            }
            
    except Exception as e:
        print(f"API handler error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }
"""

        self.api_handler_function = aws.lambda_.Function(
            f"{resource_prefix}-api-handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(api_handler_code)
            }),
            handler="index.handler",
            runtime="python3.11",
            role=api_role.arn,
            timeout=30,  # API responses should be fast
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "RESULTS_TABLE": self.results_table.name,
                    "IMAGE_BUCKET": self.image_bucket.id,
                    "PREPROCESSING_QUEUE_URL": self.preprocessing_queue.url
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags={
                "Environment": stack_name,
                "Purpose": "API request handler",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # ==================== Event Sources ====================

        # S3 to SQS notification
        s3_event_queue_policy = aws.sqs.QueuePolicy(
            f"{resource_prefix}-s3-queue-policy",
            queue_url=self.preprocessing_queue.url,
            policy=Output.all(self.preprocessing_queue.arn, self.image_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "s3.amazonaws.com"},
                        "Action": "sqs:SendMessage",
                        "Resource": args[0],
                        "Condition": {
                            "ArnLike": {
                                "aws:SourceArn": args[1]
                            }
                        }
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        bucket_notification = aws.s3.BucketNotification(
            f"{resource_prefix}-bucket-notification",
            bucket=self.image_bucket.id,
            queues=[aws.s3.BucketNotificationQueueArgs(
                queue_arn=self.preprocessing_queue.arn,
                events=["s3:ObjectCreated:*"],
                filter_prefix="uploads/"
            )],
            opts=ResourceOptions(depends_on=[s3_event_queue_policy], parent=self)
        )

        # SQS to Lambda triggers
        preprocessing_event_source = aws.lambda_.EventSourceMapping(
            f"{resource_prefix}-preprocessing-trigger",
            event_source_arn=self.preprocessing_queue.arn,
            function_name=self.preprocessing_function.name,
            batch_size=1,  # Process one image at a time
            maximum_batching_window_in_seconds=0,
            opts=ResourceOptions(parent=self)
        )

        inference_event_source = aws.lambda_.EventSourceMapping(
            f"{resource_prefix}-inference-trigger",
            event_source_arn=self.inference_queue.arn,
            function_name=self.inference_function.name,
            batch_size=1,
            maximum_batching_window_in_seconds=0,
            opts=ResourceOptions(parent=self)
        )

        # ==================== API Gateway ====================

        self.api = aws.apigatewayv2.Api(
            f"{resource_prefix}-api",
            protocol_type="HTTP",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=["Content-Type"],
                max_age=300
            ),
            tags={
                "Environment": stack_name,
                "Purpose": "Image inference API",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration
        api_integration = aws.apigatewayv2.Integration(
            f"{resource_prefix}-api-integration",
            api_id=self.api.id,
            integration_type="AWS_PROXY",
            integration_uri=self.api_handler_function.invoke_arn,
            payload_format_version="2.0",
            opts=ResourceOptions(parent=self)
        )

        # POST /images route
        post_images_route = aws.apigatewayv2.Route(
            f"{resource_prefix}-post-images",
            api_id=self.api.id,
            route_key="POST /images",
            target=api_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # GET /images/{id} route
        get_image_route = aws.apigatewayv2.Route(
            f"{resource_prefix}-get-image",
            api_id=self.api.id,
            route_key="GET /images/{id}",
            target=api_integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        # API deployment
        api_deployment = aws.apigatewayv2.Stage(
            f"{resource_prefix}-api-stage",
            api_id=self.api.id,
            name="$default",
            auto_deploy=True,
            tags={
                "Environment": stack_name,
                **self.tags
            },
            opts=ResourceOptions(depends_on=[post_images_route, get_image_route], parent=self)
        )

        # Lambda permission for API Gateway
        api_lambda_permission = aws.lambda_.Permission(
            f"{resource_prefix}-api-lambda-permission",
            action="lambda:InvokeFunction",
            function=self.api_handler_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(self.api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # ==================== CloudWatch Alarms ====================

        # DLQ alarm - triggers when messages land in dead letter queue
        dlq_alarm = aws.cloudwatch.MetricAlarm(
            f"{resource_prefix}-dlq-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description="Alert when messages are sent to DLQ",
            dimensions={"QueueName": self.dlq.name},
            tags={
                "Environment": stack_name,
                "Severity": "High",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda error rate alarm for preprocessing
        preprocessing_error_alarm = aws.cloudwatch.MetricAlarm(
            f"{resource_prefix}-preprocessing-errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Preprocessing function error rate too high",
            dimensions={"FunctionName": self.preprocessing_function.name},
            tags={
                "Environment": stack_name,
                "Severity": "Medium",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda error rate alarm for inference
        inference_error_alarm = aws.cloudwatch.MetricAlarm(
            f"{resource_prefix}-inference-errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Inference function error rate too high",
            dimensions={"FunctionName": self.inference_function.name},
            tags={
                "Environment": stack_name,
                "Severity": "High",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda throttle alarm
        preprocessing_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"{resource_prefix}-preprocessing-throttles",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Preprocessing function is being throttled",
            dimensions={"FunctionName": self.preprocessing_function.name},
            tags={
                "Environment": stack_name,
                "Severity": "Medium",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # SQS queue age alarm - messages taking too long to process
        queue_age_alarm = aws.cloudwatch.MetricAlarm(
            f"{resource_prefix}-queue-age",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApproximateAgeOfOldestMessage",
            namespace="AWS/SQS",
            period=300,
            statistic="Average",
            threshold=600,  # 10 minutes
            alarm_description="Messages are taking too long to process",
            dimensions={"QueueName": self.preprocessing_queue.name},
            tags={
                "Environment": stack_name,
                "Severity": "Medium",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # ==================== Outputs ====================

        # Register outputs
        self.register_outputs({
            "api_base_url": self.api.api_endpoint,
            "image_bucket_name": self.image_bucket.id,
            "upload_prefix": "uploads/",
            "results_table_name": self.results_table.name,
            "preprocessing_queue_url": self.preprocessing_queue.url,
            "inference_queue_url": self.inference_queue.url,
            "dlq_url": self.dlq.url,
            "preprocessing_function_arn": self.preprocessing_function.arn,
            "inference_function_arn": self.inference_function.arn,
            "api_handler_function_arn": self.api_handler_function.arn,
        })
```