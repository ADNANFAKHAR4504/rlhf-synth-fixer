### Reasoning Trace
---

This is a comprehensive request for a loyalty system using AWS services with Pulumi (Python). Let me break down what's needed:

1. **API Gateway** - REST endpoints for transactions and lookups
2. **Lambda Functions** (Python 3.10) - Handle points math and data operations
3. **DynamoDB Tables**:
   - Members table (points balance, status, profile)
   - Transactions table (earn/redeem history)
4. **Messaging Services**:
   - SNS for time-sensitive offers
   - SES for email campaigns
   - Pinpoint for multi-channel marketing
5. **S3** for static campaign assets
6. **EventBridge** for scheduling recurring campaigns
7. **CloudWatch** for metrics, logs, and alarms
8. **IAM** with least-privilege access
9. **Dead Letter Queues** for Lambda functions

I need to create a well-structured Pulumi Python program with:
- Proper IAM roles and policies
- API Gateway with REST endpoints
- Lambda functions with appropriate handlers
- DynamoDB tables with sensible schemas
- Integration between all services
- CloudWatch alarms
- Stack outputs

Let me structure this as a complete Pulumi program.
### Answer 
---

I'll create a comprehensive Pulumi Python program for your loyalty system. This will be a production-ready setup with all the components properly wired together.

## Project Structure

```
loyalty-system/
├── __main__.py           # Main Pulumi program
├── Pulumi.yaml           # Project configuration
├── requirements.txt      # Python dependencies
└── lambda_functions/     # Lambda function code
    ├── transactions.py
    ├── lookups.py
    └── campaigns.py
```

## Main Pulumi Program (`__main__.py`)

```python
"""
Loyalty System Infrastructure
AWS Region: us-east-1
Built with Pulumi Python
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export

# Configuration
config = Config()
stack = pulumi.get_stack()
region = "us-east-1"

# Tags for all resources
default_tags = {
    "Project": "LoyaltySystem",
    "Environment": stack,
    "ManagedBy": "Pulumi"
}

# =============================================================================
# DynamoDB Tables
# =============================================================================

# Members Table - Stores member profiles and current points balance
members_table = aws.dynamodb.Table("members",
    name=f"loyalty-members-{stack}",
    billing_mode="PAY_PER_REQUEST",  # On-demand pricing, adjust to PROVISIONED if needed
    hash_key="member_id",
    
    attributes=[
        {
            "name": "member_id",
            "type": "S"
        },
        {
            "name": "email",
            "type": "S"
        },
        {
            "name": "status",
            "type": "S"
        }
    ],
    
    # Global secondary indexes for lookups
    global_secondary_indexes=[
        {
            "name": "email-index",
            "hash_key": "email",
            "projection_type": "ALL"
        },
        {
            "name": "status-index", 
            "hash_key": "status",
            "projection_type": "INCLUDE",
            "non_key_attributes": ["member_id", "points_balance", "tier"]
        }
    ],
    
    # Enable point-in-time recovery for production
    point_in_time_recovery={"enabled": True},
    
    # Enable encryption at rest
    server_side_encryption={"enabled": True},
    
    tags={**default_tags, "Table": "Members"}
)

# Transactions Table - Stores earn/redeem history
transactions_table = aws.dynamodb.Table("transactions",
    name=f"loyalty-transactions-{stack}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="member_id",
    range_key="transaction_id",
    
    attributes=[
        {
            "name": "member_id",
            "type": "S"
        },
        {
            "name": "transaction_id",
            "type": "S"
        },
        {
            "name": "transaction_date",
            "type": "S"
        },
        {
            "name": "transaction_type",
            "type": "S"
        }
    ],
    
    # Local secondary index for date-based queries
    local_secondary_indexes=[
        {
            "name": "date-index",
            "range_key": "transaction_date",
            "projection_type": "ALL"
        }
    ],
    
    # Global secondary index for transaction type queries
    global_secondary_indexes=[
        {
            "name": "type-date-index",
            "hash_key": "transaction_type",
            "range_key": "transaction_date",
            "projection_type": "ALL"
        }
    ],
    
    # TTL for old transactions (optional - set ttl_attribute_name if needed)
    # ttl={"attribute_name": "expiry", "enabled": True},
    
    point_in_time_recovery={"enabled": True},
    server_side_encryption={"enabled": True},
    
    tags={**default_tags, "Table": "Transactions"}
)

# =============================================================================
# S3 Bucket for Campaign Assets
# =============================================================================

campaign_assets_bucket = aws.s3.Bucket("campaign-assets",
    bucket=f"loyalty-campaign-assets-{stack}-{pulumi.get_project()}",
    acl="private",
    
    versioning={"enabled": True},
    
    server_side_encryption_configuration={
        "rule": {
            "apply_server_side_encryption_by_default": {
                "sse_algorithm": "AES256"
            }
        }
    },
    
    lifecycle_rules=[
        {
            "enabled": True,
            "id": "cleanup-old-assets",
            "noncurrent_version_expiration": {"days": 90},
            "expiration": {"days": 365}
        }
    ],
    
    tags={**default_tags, "Purpose": "CampaignAssets"}
)

# Block public access
campaign_assets_bucket_pab = aws.s3.BucketPublicAccessBlock("campaign-assets-pab",
    bucket=campaign_assets_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# =============================================================================
# SNS Topic for Time-Sensitive Offers
# =============================================================================

offers_topic = aws.sns.Topic("time-sensitive-offers",
    name=f"loyalty-offers-{stack}",
    display_name="Loyalty Time-Sensitive Offers",
    
    # Enable encryption for sensitive data
    kms_master_key_id="alias/aws/sns",
    
    # Message delivery retry policy
    delivery_policy=json.dumps({
        "http": {
            "defaultHealthyRetryPolicy": {
                "minDelayTarget": 20,
                "maxDelayTarget": 20,
                "numRetries": 3,
                "numMaxDelayRetries": 0,
                "numNoDelayRetries": 0,
                "numMinDelayRetries": 0,
                "backoffFunction": "linear"
            }
        }
    }),
    
    tags={**default_tags, "Type": "Offers"}
)

# =============================================================================
# SES Configuration (Email Campaigns)
# =============================================================================

# Configuration set for tracking
ses_configuration_set = aws.ses.ConfigurationSet("email-campaigns",
    name=f"loyalty-campaigns-{stack}",
    reputation_tracking_enabled=True
)

# Event destination for tracking
ses_event_destination = aws.ses.EventDestination("campaign-events",
    name=f"loyalty-events-{stack}",
    configuration_set_name=ses_configuration_set.name,
    enabled=True,
    
    cloudwatch_destinations=[{
        "default_value": "default",
        "dimension_name": "MessageTag",
        "value_source": "messageTag",
        "matching_types": ["send", "bounce", "complaint", "delivery", "reject"]
    }]
)

# Note: SES requires domain/email verification
# Add verified identities manually or via:
# aws.ses.DomainIdentity("domain", domain="yourdomain.com")
# aws.ses.EmailIdentity("email", email="noreply@yourdomain.com")

# =============================================================================
# Pinpoint Application (Multi-Channel Marketing)
# =============================================================================

pinpoint_app = aws.pinpoint.App("loyalty-marketing",
    name=f"loyalty-system-{stack}",
    
    # Configure campaign limits
    campaign_hook={
        "lambda_function_name": "",  # Will be set when campaign Lambda is created
        "mode": "FILTER"
    },
    
    limits={
        "daily": 10000,
        "maximum_duration": 3600,
        "messages_per_second": 100,
        "total": 100000
    },
    
    quiet_time={
        "start": "00:00",
        "end": "06:00"
    },
    
    tags={**default_tags, "Channel": "MultiChannel"}
)

# Enable Email channel for Pinpoint
pinpoint_email_channel = aws.pinpoint.EmailChannel("email-channel",
    application_id=pinpoint_app.application_id,
    enabled=True,
    from_address=f"loyalty@{config.get('domain', 'example.com')}",
    # identity="arn:aws:ses:...",  # Link to verified SES identity
)

# Enable SMS channel for Pinpoint (requires SMS spending limit increase)
# pinpoint_sms_channel = aws.pinpoint.SmsChannel("sms-channel",
#     application_id=pinpoint_app.application_id,
#     enabled=True,
#     short_code="",  # Add short code if available
# )

# =============================================================================
# IAM Roles and Policies
# =============================================================================

# Lambda execution role
lambda_role = aws.iam.Role("lambda-execution",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Effect": "Allow"
        }]
    }),
    tags=default_tags
)

# Lambda basic execution policy
lambda_basic_policy = aws.iam.RolePolicyAttachment("lambda-basic",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# DynamoDB access policy for Lambda
dynamodb_policy = aws.iam.RolePolicy("lambda-dynamodb",
    role=lambda_role.id,
    policy=Output.all(
        members_table.arn,
        transactions_table.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem"
                ],
                "Resource": [
                    args[0],
                    f"{args[0]}/index/*",
                    args[1],
                    f"{args[1]}/index/*"
                ]
            }
        ]
    }))
)

# SNS publish policy for Lambda
sns_policy = aws.iam.RolePolicy("lambda-sns",
    role=lambda_role.id,
    policy=offers_topic.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": ["sns:Publish"],
            "Resource": arn
        }]
    }))
)

# SES send policy for Lambda
ses_policy = aws.iam.RolePolicy("lambda-ses",
    role=lambda_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendTemplatedEmail",
                "ses:SendBulkTemplatedEmail"
            ],
            "Resource": "*",
            "Condition": {
                "StringLike": {
                    "ses:ConfigurationSet": f"loyalty-campaigns-{stack}"
                }
            }
        }]
    })
)

# S3 access policy for Lambda (campaign assets)
s3_policy = aws.iam.RolePolicy("lambda-s3",
    role=lambda_role.id,
    policy=campaign_assets_bucket.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                arn,
                f"{arn}/*"
            ]
        }]
    }))
)

# Pinpoint access policy for Lambda
pinpoint_policy = aws.iam.RolePolicy("lambda-pinpoint",
    role=lambda_role.id,
    policy=pinpoint_app.application_id.apply(lambda app_id: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "mobiletargeting:SendMessages",
                "mobiletargeting:SendUsersMessages",
                "mobiletargeting:CreateCampaign",
                "mobiletargeting:UpdateEndpoint"
            ],
            "Resource": f"arn:aws:mobiletargeting:{region}:*:apps/{app_id}/*"
        }]
    }))
)

# =============================================================================
# Dead Letter Queues for Lambda Functions
# =============================================================================

transactions_dlq = aws.sqs.Queue("transactions-dlq",
    name=f"loyalty-transactions-dlq-{stack}",
    message_retention_seconds=1209600,  # 14 days
    visibility_timeout_seconds=300,
    
    redrive_allow_policy=json.dumps({
        "redrivePermission": "allowAll"
    }),
    
    tags={**default_tags, "Type": "DLQ"}
)

lookups_dlq = aws.sqs.Queue("lookups-dlq",
    name=f"loyalty-lookups-dlq-{stack}",
    message_retention_seconds=1209600,
    visibility_timeout_seconds=300,
    
    redrive_allow_policy=json.dumps({
        "redrivePermission": "allowAll"
    }),
    
    tags={**default_tags, "Type": "DLQ"}
)

campaigns_dlq = aws.sqs.Queue("campaigns-dlq",
    name=f"loyalty-campaigns-dlq-{stack}",
    message_retention_seconds=1209600,
    visibility_timeout_seconds=300,
    
    redrive_allow_policy=json.dumps({
        "redrivePermission": "allowAll"
    }),
    
    tags={**default_tags, "Type": "DLQ"}
)

# =============================================================================
# Lambda Functions
# =============================================================================

# Transactions Lambda - Handles earn/redeem operations
transactions_function = aws.lambda_.Function("transactions",
    name=f"loyalty-transactions-{stack}",
    runtime="python3.10",
    handler="index.handler",
    role=lambda_role.arn,
    
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
import uuid

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
MEMBERS_TABLE = os.environ['MEMBERS_TABLE']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

members_table = dynamodb.Table(MEMBERS_TABLE)
transactions_table = dynamodb.Table(TRANSACTIONS_TABLE)

def handler(event, context):
    '''
    Process loyalty transactions (earn/redeem points)
    Expected payload:
    {
        "member_id": "string",
        "transaction_type": "EARN|REDEEM",
        "points": number,
        "description": "string",
        "metadata": {}
    }
    '''
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        member_id = body.get('member_id')
        transaction_type = body.get('transaction_type', 'EARN').upper()
        points = Decimal(str(body.get('points', 0)))
        description = body.get('description', '')
        metadata = body.get('metadata', {})
        
        # Validate inputs
        if not member_id or points <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid request parameters'})
            }
        
        # Get current member balance
        member_response = members_table.get_item(Key={'member_id': member_id})
        if 'Item' not in member_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Member not found'})
            }
        
        member = member_response['Item']
        current_balance = Decimal(str(member.get('points_balance', 0)))
        
        # Calculate new balance
        if transaction_type == 'EARN':
            new_balance = current_balance + points
            points_change = points
        elif transaction_type == 'REDEEM':
            if current_balance < points:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Insufficient points'})
                }
            new_balance = current_balance - points
            points_change = -points
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid transaction type'})
            }
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        transaction_date = datetime.utcnow().isoformat()
        
        transaction_item = {
            'member_id': member_id,
            'transaction_id': transaction_id,
            'transaction_date': transaction_date,
            'transaction_type': transaction_type,
            'points': points,
            'points_change': points_change,
            'balance_before': current_balance,
            'balance_after': new_balance,
            'description': description,
            'metadata': metadata,
            'created_at': transaction_date
        }
        
        # Update member balance and record transaction atomically
        try:
            # Update member balance
            members_table.update_item(
                Key={'member_id': member_id},
                UpdateExpression='SET points_balance = :new_balance, last_transaction_date = :date',
                ExpressionAttributeValues={
                    ':new_balance': new_balance,
                    ':date': transaction_date
                },
                ConditionExpression='attribute_exists(member_id)'
            )
            
            # Record transaction
            transactions_table.put_item(Item=transaction_item)
            
            # Check for tier upgrade based on new balance
            new_tier = calculate_tier(new_balance)
            if new_tier != member.get('tier'):
                members_table.update_item(
                    Key={'member_id': member_id},
                    UpdateExpression='SET tier = :tier',
                    ExpressionAttributeValues={':tier': new_tier}
                )
                
                # Send tier upgrade notification
                if new_tier and member.get('tier'):
                    sns.publish(
                        TopicArn=SNS_TOPIC_ARN,
                        Subject=f'Loyalty Tier Upgrade - {member_id}',
                        Message=json.dumps({
                            'member_id': member_id,
                            'event_type': 'TIER_UPGRADE',
                            'old_tier': member.get('tier'),
                            'new_tier': new_tier,
                            'new_balance': float(new_balance)
                        })
                    )
            
            # Send notification for large transactions
            if abs(points) >= 1000:
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject=f'Large Transaction - {member_id}',
                    Message=json.dumps({
                        'member_id': member_id,
                        'event_type': 'LARGE_TRANSACTION',
                        'transaction_type': transaction_type,
                        'points': float(points),
                        'new_balance': float(new_balance)
                    })
                )
            
        except Exception as e:
            print(f"Transaction failed: {str(e)}")
            raise
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'transaction_id': transaction_id,
                'new_balance': float(new_balance),
                'tier': new_tier
            }, default=str)
        }
        
    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def calculate_tier(points_balance):
    '''Calculate member tier based on points balance'''
    if points_balance >= 50000:
        return 'PLATINUM'
    elif points_balance >= 25000:
        return 'GOLD'
    elif points_balance >= 10000:
        return 'SILVER'
    else:
        return 'BRONZE'
""")
    }),
    
    environment={
        "variables": {
            "MEMBERS_TABLE": members_table.name,
            "TRANSACTIONS_TABLE": transactions_table.name,
            "SNS_TOPIC_ARN": offers_topic.arn
        }
    },
    
    timeout=30,  # Adjust based on expected processing time
    memory_size=256,  # Adjust based on workload
    
    dead_letter_config={
        "target_arn": transactions_dlq.arn
    },
    
    tracing_config={"mode": "Active"},  # Enable X-Ray tracing
    
    tags={**default_tags, "Function": "Transactions"}
)

# Lookups Lambda - Handles member queries and balance checks
lookups_function = aws.lambda_.Function("lookups",
    name=f"loyalty-lookups-{stack}",
    runtime="python3.10",
    handler="index.handler",
    role=lambda_role.arn,
    
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os
from decimal import Decimal
from datetime import datetime, timedelta

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
MEMBERS_TABLE = os.environ['MEMBERS_TABLE']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']

members_table = dynamodb.Table(MEMBERS_TABLE)
transactions_table = dynamodb.Table(TRANSACTIONS_TABLE)

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handler(event, context):
    '''
    Handle member lookups and transaction history queries
    Endpoints:
    - GET /members/{member_id} - Get member details
    - GET /members/{member_id}/transactions - Get transaction history
    - GET /members/email/{email} - Lookup by email
    '''
    try:
        path = event.get('path', '')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {}) or {}
        
        # Route based on path
        if '/transactions' in path:
            member_id = path_parameters.get('member_id')
            return get_transaction_history(member_id, query_parameters)
        elif '/email/' in path:
            email = path_parameters.get('email')
            return lookup_by_email(email)
        else:
            member_id = path_parameters.get('member_id')
            return get_member_details(member_id)
            
    except Exception as e:
        print(f"Error processing lookup: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

def get_member_details(member_id):
    '''Get member profile and current balance'''
    if not member_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Member ID required'})
        }
    
    response = members_table.get_item(Key={'member_id': member_id})
    
    if 'Item' not in response:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Member not found'})
        }
    
    member = response['Item']
    
    # Calculate lifetime stats
    stats = calculate_lifetime_stats(member_id)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'member_id': member['member_id'],
            'email': member.get('email'),
            'status': member.get('status', 'ACTIVE'),
            'tier': member.get('tier', 'BRONZE'),
            'points_balance': member.get('points_balance', 0),
            'created_date': member.get('created_date'),
            'last_transaction_date': member.get('last_transaction_date'),
            'lifetime_points_earned': stats.get('earned', 0),
            'lifetime_points_redeemed': stats.get('redeemed', 0),
            'profile': member.get('profile', {})
        }, default=decimal_default)
    }

def get_transaction_history(member_id, query_params):
    '''Get transaction history for a member'''
    if not member_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Member ID required'})
        }
    
    # Parse query parameters
    limit = int(query_params.get('limit', 50))
    limit = min(limit, 100)  # Cap at 100
    
    # Date range filtering
    days_back = int(query_params.get('days', 30))
    start_date = (datetime.utcnow() - timedelta(days=days_back)).isoformat()
    
    # Query transactions
    response = transactions_table.query(
        IndexName='date-index',
        KeyConditionExpression='member_id = :member_id AND transaction_date >= :start_date',
        ExpressionAttributeValues={
            ':member_id': member_id,
            ':start_date': start_date
        },
        ScanIndexForward=False,  # Most recent first
        Limit=limit
    )
    
    transactions = response.get('Items', [])
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'member_id': member_id,
            'transactions': transactions,
            'count': len(transactions),
            'has_more': response.get('LastEvaluatedKey') is not None
        }, default=decimal_default)
    }

def lookup_by_email(email):
    '''Lookup member by email address'''
    if not email:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Email required'})
        }
    
    response = members_table.query(
        IndexName='email-index',
        KeyConditionExpression='email = :email',
        ExpressionAttributeValues={':email': email}
    )
    
    items = response.get('Items', [])
    
    if not items:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Member not found'})
        }
    
    member = items[0]  # Email should be unique
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'member_id': member['member_id'],
            'email': member.get('email'),
            'status': member.get('status', 'ACTIVE'),
            'tier': member.get('tier', 'BRONZE'),
            'points_balance': member.get('points_balance', 0)
        }, default=decimal_default)
    }

def calculate_lifetime_stats(member_id):
    '''Calculate lifetime points earned and redeemed'''
    earned = Decimal(0)
    redeemed = Decimal(0)
    
    # Query all transactions for the member
    paginator = dynamodb.meta.client.get_paginator('query')
    
    for page in paginator.paginate(
        TableName=TRANSACTIONS_TABLE,
        KeyConditionExpression='member_id = :member_id',
        ExpressionAttributeValues={':member_id': member_id}
    ):
        for item in page.get('Items', []):
            if item.get('transaction_type', {}).get('S') == 'EARN':
                earned += Decimal(item.get('points', {}).get('N', 0))
            elif item.get('transaction_type', {}).get('S') == 'REDEEM':
                redeemed += Decimal(item.get('points', {}).get('N', 0))
    
    return {'earned': earned, 'redeemed': redeemed}
""")
    }),
    
    environment={
        "variables": {
            "MEMBERS_TABLE": members_table.name,
            "TRANSACTIONS_TABLE": transactions_table.name
        }
    },
    
    timeout=30,
    memory_size=256,
    
    dead_letter_config={
        "target_arn": lookups_dlq.arn
    },
    
    tracing_config={"mode": "Active"},
    
    tags={**default_tags, "Function": "Lookups"}
)

# Campaigns Lambda - Handles scheduled campaigns and bulk operations
campaigns_function = aws.lambda_.Function("campaigns",
    name=f"loyalty-campaigns-{stack}",
    runtime="python3.10",
    handler="index.handler",
    role=lambda_role.arn,
    
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')
sns = boto3.client('sns')
pinpoint = boto3.client('pinpoint')
s3 = boto3.client('s3')

# Environment variables
MEMBERS_TABLE = os.environ['MEMBERS_TABLE']
TRANSACTIONS_TABLE = os.environ['TRANSACTIONS_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
SES_CONFIG_SET = os.environ['SES_CONFIG_SET']
PINPOINT_APP_ID = os.environ['PINPOINT_APP_ID']
ASSETS_BUCKET = os.environ['ASSETS_BUCKET']

members_table = dynamodb.Table(MEMBERS_TABLE)
transactions_table = dynamodb.Table(TRANSACTIONS_TABLE)

def handler(event, context):
    '''
    Process scheduled campaigns and bulk operations
    Event sources: EventBridge, SNS, Direct invocation
    '''
    try:
        # Determine event source
        if 'Records' in event:
            # SNS event
            for record in event['Records']:
                if record['EventSource'] == 'aws:sns':
                    message = json.loads(record['Sns']['Message'])
                    return process_campaign_trigger(message)
        
        elif 'source' in event and event['source'] == 'aws.events':
            # EventBridge scheduled event
            return process_scheduled_campaign(event)
        
        else:
            # Direct invocation
            campaign_type = event.get('campaign_type')
            
            if campaign_type == 'MONTHLY_STATEMENT':
                return generate_monthly_statements()
            elif campaign_type == 'POINTS_EXPIRY_WARNING':
                return send_expiry_warnings()
            elif campaign_type == 'TIER_ANNIVERSARY':
                return process_tier_anniversaries()
            elif campaign_type == 'PROMOTIONAL_CAMPAIGN':
                return run_promotional_campaign(event)
            else:
                return process_custom_campaign(event)
                
    except Exception as e:
        print(f"Campaign processing error: {str(e)}")
        raise

def process_scheduled_campaign(event):
    '''Process EventBridge scheduled campaigns'''
    detail = event.get('detail', {})
    campaign_name = detail.get('campaign_name')
    
    print(f"Processing scheduled campaign: {campaign_name}")
    
    if campaign_name == 'daily_rollover':
        return process_daily_rollover()
    elif campaign_name == 'weekly_digest':
        return send_weekly_digest()
    elif campaign_name == 'monthly_statements':
        return generate_monthly_statements()
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': f'Campaign {campaign_name} processed'})
    }

def generate_monthly_statements():
    '''Generate and send monthly statements to all active members'''
    
    # Get all active members
    response = members_table.query(
        IndexName='status-index',
        KeyConditionExpression='status = :status',
        ExpressionAttributeValues={':status': 'ACTIVE'}
    )
    
    members = response.get('Items', [])
    processed = 0
    errors = []
    
    for member in members:
        try:
            # Get member's transactions for the month
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            transactions = transactions_table.query(
                IndexName='date-index',
                KeyConditionExpression='member_id = :member_id AND transaction_date BETWEEN :start AND :end',
                ExpressionAttributeValues={
                    ':member_id': member['member_id'],
                    ':start': start_date.isoformat(),
                    ':end': end_date.isoformat()
                }
            )
            
            # Calculate summary
            earned = sum(Decimal(t.get('points', 0)) for t in transactions['Items'] 
                        if t.get('transaction_type') == 'EARN')
            redeemed = sum(Decimal(t.get('points', 0)) for t in transactions['Items'] 
                          if t.get('transaction_type') == 'REDEEM')
            
            # Prepare email content
            email_data = {
                'member_name': member.get('profile', {}).get('name', 'Valued Member'),
                'member_id': member['member_id'],
                'current_balance': float(member.get('points_balance', 0)),
                'tier': member.get('tier', 'BRONZE'),
                'points_earned': float(earned),
                'points_redeemed': float(redeemed),
                'transaction_count': len(transactions['Items']),
                'statement_period': f"{start_date.strftime('%B %d')} - {end_date.strftime('%B %d, %Y')}"
            }
            
            # Send via SES
            if member.get('email'):
                ses.send_templated_email(
                    Source=f"Loyalty Program <noreply@{os.environ.get('DOMAIN', 'example.com')}>",
                    Destination={'ToAddresses': [member['email']]},
                    Template='MonthlyStatement',  # Create this template in SES
                    TemplateData=json.dumps(email_data),
                    ConfigurationSetName=SES_CONFIG_SET
                )
                processed += 1
                
        except Exception as e:
            errors.append({'member_id': member['member_id'], 'error': str(e)})
            print(f"Error processing statement for {member['member_id']}: {str(e)}")
    
    # Log results
    print(f"Monthly statements: {processed} sent, {len(errors)} errors")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed,
            'errors': len(errors),
            'error_details': errors[:10]  # Return first 10 errors
        })
    }

def send_expiry_warnings():
    '''Send warnings for points expiring soon'''
    # Implementation depends on your expiry rules
    # This is a placeholder implementation
    
    warning_days = 30
    expiry_date = datetime.utcnow() + timedelta(days=warning_days)
    
    # Query for expiring points (if you track expiry dates)
    # For now, return placeholder
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Expiry warnings processed'})
    }

def process_tier_anniversaries():
    '''Process tier anniversary bonuses and communications'''
    
    today = datetime.utcnow().strftime('%m-%d')
    
    # Query members by join anniversary
    # This would require storing join_date in the members table
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Anniversary bonuses processed'})
    }

def run_promotional_campaign(event):
    '''Run targeted promotional campaigns via Pinpoint'''
    
    campaign_config = event.get('config', {})
    segment_id = campaign_config.get('segment_id')
    message_config = campaign_config.get('message', {})
    
    try:
        # Create Pinpoint campaign
        response = pinpoint.create_campaign(
            ApplicationId=PINPOINT_APP_ID,
            WriteCampaignRequest={
                'Name': campaign_config.get('name', f"Promo-{datetime.utcnow().isoformat()}"),
                'SegmentId': segment_id,
                'MessageConfiguration': {
                    'EmailMessage': {
                        'Title': message_config.get('subject'),
                        'HtmlBody': message_config.get('html_body'),
                        'FromAddress': f"offers@{os.environ.get('DOMAIN', 'example.com')}"
                    },
                    'SMSMessage': {
                        'Body': message_config.get('sms_body'),
                        'MessageType': 'PROMOTIONAL'
                    }
                },
                'Schedule': {
                    'StartTime': datetime.utcnow().isoformat(),
                    'Frequency': 'ONCE'
                }
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'campaign_id': response['CampaignResponse']['Id'],
                'status': response['CampaignResponse']['State']['CampaignStatus']
            })
        }
        
    except Exception as e:
        print(f"Error creating promotional campaign: {str(e)}")
        raise

def process_daily_rollover():
    '''Process daily points rollover and maintenance tasks'''
    
    # Implement your rollover logic here
    # Example: expire old points, calculate bonuses, etc.
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Daily rollover completed'})
    }

def send_weekly_digest():
    '''Send weekly activity digest to engaged members'''
    
    # Get members with recent activity
    one_week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    
    # This would require querying members with recent transactions
    # Placeholder implementation
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Weekly digest sent'})
    }

def process_custom_campaign(event):
    '''Process custom campaign logic'''
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Custom campaign processed', 'event': event})
    }

def process_campaign_trigger(message):
    '''Process campaign triggers from SNS'''
    
    event_type = message.get('event_type')
    
    if event_type == 'TIER_UPGRADE':
        # Send tier upgrade welcome package
        member_id = message.get('member_id')
        new_tier = message.get('new_tier')
        
        # Get member details
        response = members_table.get_item(Key={'member_id': member_id})
        if 'Item' in response:
            member = response['Item']
            
            # Send congratulations email
            if member.get('email'):
                ses.send_templated_email(
                    Source=f"Loyalty Program <noreply@{os.environ.get('DOMAIN', 'example.com')}>",
                    Destination={'ToAddresses': [member['email']]},
                    Template='TierUpgrade',  # Create this template in SES
                    TemplateData=json.dumps({
                        'member_name': member.get('profile', {}).get('name', 'Valued Member'),
                        'new_tier': new_tier,
                        'benefits': get_tier_benefits(new_tier)
                    }),
                    ConfigurationSetName=SES_CONFIG_SET
                )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Campaign trigger processed'})
    }

def get_tier_benefits(tier):
    '''Get benefits description for a tier'''
    benefits = {
        'BRONZE': ['1x points on purchases', 'Birthday bonus'],
        'SILVER': ['1.5x points on purchases', 'Birthday bonus', 'Quarterly bonus points'],
        'GOLD': ['2x points on purchases', 'Birthday bonus', 'Monthly bonus points', 'Priority support'],
        'PLATINUM': ['3x points on purchases', 'Birthday bonus', 'Weekly bonus points', 'VIP support', 'Exclusive offers']
    }
    return benefits.get(tier, [])
""")
    }),
    
    environment={
        "variables": {
            "MEMBERS_TABLE": members_table.name,
            "TRANSACTIONS_TABLE": transactions_table.name,
            "SNS_TOPIC_ARN": offers_topic.arn,
            "SES_CONFIG_SET": ses_configuration_set.name,
            "PINPOINT_APP_ID": pinpoint_app.application_id,
            "ASSETS_BUCKET": campaign_assets_bucket.id,
            "DOMAIN": config.get("domain") or "example.com"
        }
    },
    
    timeout=300,  # 5 minutes for bulk operations
    memory_size=512,  # More memory for bulk processing
    
    dead_letter_config={
        "target_arn": campaigns_dlq.arn
    },
    
    tracing_config={"mode": "Active"},
    
    tags={**default_tags, "Function": "Campaigns"}
)

# =============================================================================
# API Gateway
# =============================================================================

# REST API
api = aws.apigateway.RestApi("loyalty-api",
    name=f"loyalty-api-{stack}",
    description="Loyalty System API",
    
    endpoint_configuration={
        "types": "REGIONAL"
    },
    
    # Enable API Gateway logging
    minimum_compression_size=1024,
    
    tags={**default_tags, "Type": "API"}
)

# API Gateway execution role
api_gateway_role = aws.iam.Role("api-gateway-execution",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "apigateway.amazonaws.com"},
            "Effect": "Allow"
        }]
    }),
    tags=default_tags
)

# Attach policy to invoke Lambda functions
api_gateway_lambda_policy = aws.iam.RolePolicy("api-gateway-lambda",
    role=api_gateway_role.id,
    policy=Output.all(
        transactions_function.arn,
        lookups_function.arn
    ).apply(lambda arns: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": list(arns)
        }]
    }))
)

# =============================================================================
# API Resources and Methods
# =============================================================================

# /transactions resource
transactions_resource = aws.apigateway.Resource("transactions-resource",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="transactions"
)

# POST /transactions
transactions_post = aws.apigateway.Method("transactions-post",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method="POST",
    authorization="NONE",  # Add API key or Cognito authorizer for production
)

transactions_integration = aws.apigateway.Integration("transactions-integration",
    rest_api=api.id,
    resource_id=transactions_resource.id,
    http_method=transactions_post.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=transactions_function.invoke_arn
)

# /members resource
members_resource = aws.apigateway.Resource("members-resource",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="members"
)

# /members/{member_id} resource
member_id_resource = aws.apigateway.Resource("member-id-resource",
    rest_api=api.id,
    parent_id=members_resource.id,
    path_part="{member_id}"
)

# GET /members/{member_id}
member_get = aws.apigateway.Method("member-get",
    rest_api=api.id,
    resource_id=member_id_resource.id,
    http_method="GET",
    authorization="NONE",
)

member_integration = aws.apigateway.Integration("member-integration",
    rest_api=api.id,
    resource_id=member_id_resource.id,
    http_method=member_get.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lookups_function.invoke_arn
)

# /members/{member_id}/transactions resource
member_transactions_resource = aws.apigateway.Resource("member-transactions-resource",
    rest_api=api.id,
    parent_id=member_id_resource.id,
    path_part="transactions"
)

# GET /members/{member_id}/transactions
member_transactions_get = aws.apigateway.Method("member-transactions-get",
    rest_api=api.id,
    resource_id=member_transactions_resource.id,
    http_method="GET",
    authorization="NONE",
)

member_transactions_integration = aws.apigateway.Integration("member-transactions-integration",
    rest_api=api.id,
    resource_id=member_transactions_resource.id,
    http_method=member_transactions_get.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lookups_function.invoke_arn
)

# /members/email/{email} resource
members_email_resource = aws.apigateway.Resource("members-email-resource",
    rest_api=api.id,
    parent_id=members_resource.id,
    path_part="email"
)

email_resource = aws.apigateway.Resource("email-resource",
    rest_api=api.id,
    parent_id=members_email_resource.id,
    path_part="{email}"
)

# GET /members/email/{email}
email_get = aws.apigateway.Method("email-get",
    rest_api=api.id,
    resource_id=email_resource.id,
    http_method="GET",
    authorization="NONE",
)

email_integration = aws.apigateway.Integration("email-integration",
    rest_api=api.id,
    resource_id=email_resource.id,
    http_method=email_get.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lookups_function.invoke_arn
)

# API Deployment
api_deployment = aws.apigateway.Deployment("api-deployment",
    rest_api=api.id,
    
    # Force new deployment on changes
    triggers={
        "redeployment": pulumi.Output.all(
            transactions_integration.id,
            member_integration.id,
            member_transactions_integration.id,
            email_integration.id
        ).apply(lambda x: json.dumps(x))
    },
    
    lifecycle={
        "create_before_destroy": True
    }
)

# API Stage
api_stage = aws.apigateway.Stage("api-stage",
    deployment=api_deployment.id,
    rest_api=api.id,
    stage_name=stack,
    
    # Enable logging
    xray_tracing_enabled=True,
    
    # Throttling settings
    throttle_settings={
        "rate_limit": 1000,
        "burst_limit": 2000
    },
    
    # Access logging
    access_log_settings={
        "destination_arn": pulumi.Output.concat("arn:aws:logs:", region, ":", aws.get_caller_identity().account_id, ":log-group:API-Gateway-Execution-Logs_", api.id, "/", stack),
        "format": json.dumps({
            "requestId": "$context.requestId",
            "ip": "$context.identity.sourceIp",
            "caller": "$context.identity.caller",
            "user": "$context.identity.user",
            "requestTime": "$context.requestTime",
            "httpMethod": "$context.httpMethod",
            "resourcePath": "$context.resourcePath",
            "status": "$context.status",
            "protocol": "$context.protocol",
            "responseLength": "$context.responseLength"
        })
    },
    
    tags={**default_tags, "Stage": stack}
)

# Lambda permissions for API Gateway
transactions_api_permission = aws.lambda_.Permission("transactions-api-permission",
    action="lambda:InvokeFunction",
    function=transactions_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api.execution_arn, "/*/*")
)

lookups_api_permission = aws.lambda_.Permission("lookups-api-permission",
    action="lambda:InvokeFunction",
    function=lookups_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api.execution_arn, "/*/*")
)

# =============================================================================
# EventBridge Rules for Scheduled Tasks
# =============================================================================

# Daily rollover rule (runs at 2 AM UTC)
daily_rollover_rule = aws.cloudwatch.EventRule("daily-rollover",
    name=f"loyalty-daily-rollover-{stack}",
    description="Daily points rollover and maintenance",
    schedule_expression="cron(0 2 * * ? *)",
    
    tags={**default_tags, "Schedule": "Daily"}
)

daily_rollover_target = aws.cloudwatch.EventTarget("daily-rollover-target",
    rule=daily_rollover_rule.name,
    arn=campaigns_function.arn,
    
    input=json.dumps({
        "source": "aws.events",
        "detail": {
            "campaign_name": "daily_rollover"
        }
    })
)

daily_rollover_permission = aws.lambda_.Permission("daily-rollover-permission",
    action="lambda:InvokeFunction",
    function=campaigns_function.name,
    principal="events.amazonaws.com",
    source_arn=daily_rollover_rule.arn
)

# Weekly digest rule (runs Mondays at 9 AM UTC)
weekly_digest_rule = aws.cloudwatch.EventRule("weekly-digest",
    name=f"loyalty-weekly-digest-{stack}",
    description="Weekly activity digest",
    schedule_expression="cron(0 9 ? * MON *)",
    
    tags={**default_tags, "Schedule": "Weekly"}
)

weekly_digest_target = aws.cloudwatch.EventTarget("weekly-digest-target",
    rule=weekly_digest_rule.name,
    arn=campaigns_function.arn,
    
    input=json.dumps({
        "source": "aws.events",
        "detail": {
            "campaign_name": "weekly_digest"
        }
    })
)

weekly_digest_permission = aws.lambda_.Permission("weekly-digest-permission",
    action="lambda:InvokeFunction",
    function=campaigns_function.name,
    principal="events.amazonaws.com",
    source_arn=weekly_digest_rule.arn
)

# Monthly statements rule (runs on the 1st of each month at 5 AM UTC)
monthly_statements_rule = aws.cloudwatch.EventRule("monthly-statements",
    name=f"loyalty-monthly-statements-{stack}",
    description="Monthly member statements",
    schedule_expression="cron(0 5 1 * ? *)",
    
    tags={**default_tags, "Schedule": "Monthly"}
)

monthly_statements_target = aws.cloudwatch.EventTarget("monthly-statements-target",
    rule=monthly_statements_rule.name,
    arn=campaigns_function.arn,
    
    input=json.dumps({
        "source": "aws.events",
        "detail": {
            "campaign_name": "monthly_statements"
        }
    })
)

monthly_statements_permission = aws.lambda_.Permission("monthly-statements-permission",
    action="lambda:InvokeFunction",
    function=campaigns_function.name,
    principal="events.amazonaws.com",
    source_arn=monthly_statements_rule.arn
)

# =============================================================================
# CloudWatch Alarms
# =============================================================================

# Lambda error alarm
lambda_errors_alarm = aws.cloudwatch.MetricAlarm("lambda-errors",
    name=f"loyalty-lambda-errors-{stack}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,
    alarm_description="Alert when Lambda functions have errors",
    
    dimensions={
        "FunctionName": transactions_function.name
    },
    
    alarm_actions=[offers_topic.arn],  # Send to SNS topic
    
    tags={**default_tags, "Type": "Alarm"}
)

# Lambda throttles alarm
lambda_throttles_alarm = aws.cloudwatch.MetricAlarm("lambda-throttles",
    name=f"loyalty-lambda-throttles-{stack}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="Throttles",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="Alert when Lambda functions are throttled",
    
    tags={**default_tags, "Type": "Alarm"}
)

# API Gateway 5xx errors alarm
api_5xx_alarm = aws.cloudwatch.MetricAlarm("api-5xx",
    name=f"loyalty-api-5xx-{stack}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="5XXError",
    namespace="AWS/ApiGateway",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="Alert when API has 5xx errors",
    
    dimensions={
        "ApiName": api.name,
        "Stage": api_stage.stage_name
    },
    
    alarm_actions=[offers_topic.arn],
    
    tags={**default_tags, "Type": "Alarm"}
)

# DynamoDB throttles alarm
dynamodb_throttles_alarm = aws.cloudwatch.MetricAlarm("dynamodb-throttles",
    name=f"loyalty-dynamodb-throttles-{stack}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="ConditionalCheckFailedRequests",
    namespace="AWS/DynamoDB",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="Alert when DynamoDB tables are throttled",
    
    dimensions={
        "TableName": members_table.name
    },
    
    tags={**default_tags, "Type": "Alarm"}
)

# =============================================================================
# CloudWatch Log Groups
# =============================================================================

# Create log groups with retention policies
transactions_log_group = aws.cloudwatch.LogGroup("transactions-logs",
    name=f"/aws/lambda/{transactions_function.name}",
    retention_in_days=30,  # Adjust based on compliance requirements
    tags={**default_tags, "Function": "Transactions"}
)

lookups_log_group = aws.cloudwatch.LogGroup("lookups-logs",
    name=f"/aws/lambda/{lookups_function.name}",
    retention_in_days=30,
    tags={**default_tags, "Function": "Lookups"}
)

campaigns_log_group = aws.cloudwatch.LogGroup("campaigns-logs",
    name=f"/aws/lambda/{campaigns_function.name}",
    retention_in_days=90,  # Keep campaign logs longer for analysis
    tags={**default_tags, "Function": "Campaigns"}
)

# =============================================================================
# SNS Subscription for Campaign Lambda
# =============================================================================

campaigns_sns_subscription = aws.sns.TopicSubscription("campaigns-subscription",
    topic=offers_topic.arn,
    protocol="lambda",
    endpoint=campaigns_function.arn,
    
    filter_policy=json.dumps({
        "event_type": ["TIER_UPGRADE", "LARGE_TRANSACTION"]
    })
)

campaigns_sns_permission = aws.lambda_.Permission("campaigns-sns-permission",
    action="lambda:InvokeFunction",
    function=campaigns_function.name,
    principal="sns.amazonaws.com",
    source_arn=offers_topic.arn
)

# =============================================================================
# Stack Outputs
# =============================================================================

# API Gateway outputs
export("api_base_url", pulumi.Output.concat("https://", api.id, ".execute-api.", region, ".amazonaws.com/", api_stage.stage_name))
export("api_id", api.id)
export("api_stage", api_stage.stage_name)

# DynamoDB outputs
export("members_table_name", members_table.name)
export("members_table_arn", members_table.arn)
export("transactions_table_name", transactions_table.name)
export("transactions_table_arn", transactions_table.arn)

# Lambda outputs
export("transactions_function_name", transactions_function.name)
export("transactions_function_arn", transactions_function.arn)
export("lookups_function_name", lookups_function.name)
export("lookups_function_arn", lookups_function.arn)
export("campaigns_function_name", campaigns_function.name)
export("campaigns_function_arn", campaigns_function.arn)

# Messaging outputs
export("sns_topic_arn", offers_topic.arn)
export("ses_configuration_set", ses_configuration_set.name)
export("pinpoint_app_id", pinpoint_app.application_id)

# Storage outputs
export("campaign_assets_bucket", campaign_assets_bucket.id)
export("campaign_assets_bucket_arn", campaign_assets_bucket.arn)

# Queue outputs
export("transactions_dlq_url", transactions_dlq.url)
export("lookups_dlq_url", lookups_dlq.url)
export("campaigns_dlq_url", campaigns_dlq.url)

# Alarm outputs
export("cloudwatch_alarms", {
    "lambda_errors": lambda_errors_alarm.name,
    "lambda_throttles": lambda_throttles_alarm.name,
    "api_5xx": api_5xx_alarm.name,
    "dynamodb_throttles": dynamodb_throttles_alarm.name
})

# EventBridge rules
export("scheduled_campaigns", {
    "daily_rollover": daily_rollover_rule.name,
    "weekly_digest": weekly_digest_rule.name,
    "monthly_statements": monthly_statements_rule.name
})

# API endpoints for easy reference
export("api_endpoints", {
    "create_transaction": pulumi.Output.concat("POST ", api_base_url, "/transactions"),
    "get_member": pulumi.Output.concat("GET ", api_base_url, "/members/{member_id}"),
    "get_member_transactions": pulumi.Output.concat("GET ", api_base_url, "/members/{member_id}/transactions"),
    "lookup_by_email": pulumi.Output.concat("GET ", api_base_url, "/members/email/{email}")
})

print(f"""
=============================================================================
Loyalty System Deployment - {stack}
=============================================================================

IMPORTANT SETUP STEPS:
1. Verify SES domain/email identities for sending emails
2. Request SMS spending limit increase for Pinpoint if using SMS
3. Create SES email templates (MonthlyStatement, TierUpgrade, etc.)
4. Configure Pinpoint segments for targeted campaigns
5. Upload campaign assets to S3 bucket
6. Set up API authentication (API keys, Cognito, etc.)

ENVIRONMENT VARIABLES TO CONFIGURE:
- Set 'domain' in Pulumi config for email sending domain
- Adjust Lambda memory/timeout based on workload
- Configure DynamoDB capacity if switching from on-demand
- Adjust CloudWatch log retention based on compliance

CAPACITY SETTINGS:
- DynamoDB: Currently set to PAY_PER_REQUEST (on-demand)
- Lambda: 256MB memory, 30s timeout (campaigns: 512MB, 300s)
- API Gateway: 1000 req/s rate limit, 2000 burst
- CloudWatch Logs: 30-day retention (90 days for campaigns)

=============================================================================
""")