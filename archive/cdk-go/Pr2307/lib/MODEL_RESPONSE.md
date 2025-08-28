I'll create a complete AWS CDK Go application that meets all your requirements. This will be a production-grade, secure, and auditable cloud environment.

## Project Structure

```
tap-infrastructure/
├── bin/
│   └── tap.go
├── lib/
│   ├── tap_stack.go
│   ├── constructs/
│   │   ├── storage_construct.go
│   │   ├── database_construct.go
│   │   ├── compute_construct.go
│   │   └── security_construct.go
├── lambda/
│   └── handler.py
├── go.mod
├── go.sum
├── cdk.json
└── README.md
```

## Main CDK Application

**bin/tap.go**
```go
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"

	"tap-infrastructure/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Get environment from context or default to 'prod'
	env := app.Node().TryGetContext(jsii.String("environment"))
	if env == nil {
		env = "prod"
	}

	// Create the main stack
	lib.NewTapStack(app, "TapInfrastructureStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
				Region:  jsii.String("us-east-1"),
			},
		},
		Environment: env.(string),
	})

	app.Synth(nil)
}
```

## Main Stack

**lib/tap_stack.go**
```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudtrail"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"

	"tap-infrastructure/lib/constructs"
)

type TapStackProps struct {
	awscdk.StackProps
	Environment string
}

type TapStack struct {
	awscdk.Stack
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Create CloudTrail for audit logging
	cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailBucket"), &awss3.BucketProps{
		BucketName:    jsii.String("proj-cloudtrail-" + props.Environment),
		Versioned:     jsii.Bool(true),
		PublicReadAccess: jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:    awss3.BucketEncryption_S3_MANAGED,
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:      jsii.String("DeleteOldLogs"),
				Enabled: jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
			},
		},
	})

	awscloudtrail.NewTrail(stack, jsii.String("AuditTrail"), &awscloudtrail.TrailProps{
		TrailName: jsii.String("proj-audit-trail-" + props.Environment),
		Bucket:    cloudTrailBucket,
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:        jsii.Bool(true),
		EnableFileValidation:      jsii.Bool(true),
	})

	// Create security construct (IAM roles and policies)
	securityConstruct := constructs.NewSecurityConstruct(stack, "SecurityConstruct", &constructs.SecurityConstructProps{
		Environment: props.Environment,
	})

	// Create storage construct (S3 bucket with logging)
	storageConstruct := constructs.NewStorageConstruct(stack, "StorageConstruct", &constructs.StorageConstructProps{
		Environment: props.Environment,
	})

	// Create database construct (DynamoDB table)
	databaseConstruct := constructs.NewDatabaseConstruct(stack, "DatabaseConstruct", &constructs.DatabaseConstructProps{
		Environment: props.Environment,
	})

	// Create compute construct (Lambda function)
	constructs.NewComputeConstruct(stack, "ComputeConstruct", &constructs.ComputeConstructProps{
		Environment:       props.Environment,
		LambdaRole:       securityConstruct.LambdaRole,
		S3Bucket:         storageConstruct.Bucket,
		DynamoDBTable:    databaseConstruct.Table,
	})

	return &TapStack{
		Stack: stack,
	}
}
```

## Security Construct

**lib/constructs/security_construct.go**
```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
	Environment string
}

type SecurityConstruct struct {
	constructs.Construct
	LambdaRole awsiam.IRole
}

func NewSecurityConstruct(scope constructs.Construct, id string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create IAM role for Lambda function with least privilege
	lambdaRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:  jsii.String("proj-lambda-role-" + props.Environment),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String("IAM role for Lambda function with least privilege access"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	// Inline policy for S3 access (read-only to specific bucket)
	s3Policy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("s3:GetObject"),
					jsii.String("s3:GetObjectVersion"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:s3:::proj-s3-" + props.Environment + "/*"),
				},
			}),
		},
	})

	// Inline policy for DynamoDB access (write-only to specific table)
	dynamoPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("dynamodb:PutItem"),
					jsii.String("dynamodb:UpdateItem"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:dynamodb:us-east-1:*:table/proj-dynamodb-" + props.Environment),
				},
			}),
		},
	})

	// Attach inline policies to the role
	awsiam.NewPolicy(construct, jsii.String("S3AccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-s3-access-policy-" + props.Environment),
		Document:   s3Policy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	awsiam.NewPolicy(construct, jsii.String("DynamoDBAccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-dynamodb-access-policy-" + props.Environment),
		Document:   dynamoPolicy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	return &SecurityConstruct{
		Construct:  construct,
		LambdaRole: lambdaRole,
	}
}
```

## Storage Construct

**lib/constructs/storage_construct.go**
```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageConstructProps struct {
	Environment string
}

type StorageConstruct struct {
	constructs.Construct
	Bucket       awss3.IBucket
	LoggingBucket awss3.IBucket
}

func NewStorageConstruct(scope constructs.Construct, id string, props *StorageConstructProps) *StorageConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create S3 bucket for access logging
	loggingBucket := awss3.NewBucket(construct, jsii.String("AccessLogsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-s3-logs-" + props.Environment),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:      jsii.String("DeleteOldAccessLogs"),
				Enabled: jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(30)),
			},
		},
	})

	// Create main S3 bucket with versioning and server access logging
	bucket := awss3.NewBucket(construct, jsii.String("MainBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-s3-" + props.Environment),
		Versioned:         jsii.Bool(true),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		// Enable event notifications (will be configured in compute construct)
		EventBridgeEnabled: jsii.Bool(true),
	})

	return &StorageConstruct{
		Construct:     construct,
		Bucket:        bucket,
		LoggingBucket: loggingBucket,
	}
}
```

## Database Construct

**lib/constructs/database_construct.go**
```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type DatabaseConstructProps struct {
	Environment string
}

type DatabaseConstruct struct {
	constructs.Construct
	Table awsdynamodb.ITable
}

func NewDatabaseConstruct(scope constructs.Construct, id string, props *DatabaseConstructProps) *DatabaseConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create DynamoDB table with partition key, sort key, encryption, and point-in-time recovery
	table := awsdynamodb.NewTable(construct, jsii.String("MainTable"), &awsdynamodb.TableProps{
		TableName: jsii.String("proj-dynamodb-" + props.Environment),
		// Partition key
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("pk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Sort key
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("sk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Enable encryption at rest
		Encryption: awsdynamodb.TableEncryption_AWS_MANAGED,
		// Enable point-in-time recovery
		PointInTimeRecovery: jsii.Bool(true),
		// Billing mode
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		// Enable deletion protection for production
		DeletionProtection: jsii.Bool(true),
		// Enable CloudWatch Contributor Insights
		ContributorInsightsEnabled: jsii.Bool(true),
	})

	// Add tags for better resource management
	awscdk.Tags_Of(table).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(table).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)

	return &DatabaseConstruct{
		Construct: construct,
		Table:     table,
	}
}
```

## Compute Construct

**lib/constructs/compute_construct.go**
```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment   string
	LambdaRole    awsiam.IRole
	S3Bucket      awss3.IBucket
	DynamoDBTable awsdynamodb.ITable
}

type ComputeConstruct struct {
	constructs.Construct
	LambdaFunction awslambda.IFunction
}

func NewComputeConstruct(scope constructs.Construct, id string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create CloudWatch Log Group for Lambda with retention policy
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/lambda/proj-lambda-" + props.Environment),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Lambda function
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("ProcessorFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String("proj-lambda-" + props.Environment),
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("handler.lambda_handler"),
		Code:         awslambda.Code_FromAsset(jsii.String("lambda"), nil),
		Role:         props.LambdaRole,
		LogGroup:     logGroup,
		Timeout:      awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize:   jsii.Number(256),
		Description:  jsii.String("Processes S3 object creation events and writes to DynamoDB"),
		Environment: &map[string]*string{
			"DYNAMODB_TABLE_NAME": props.DynamoDBTable.TableName(),
			"S3_BUCKET_NAME":      props.S3Bucket.BucketName(),
			"ENVIRONMENT":         jsii.String(props.Environment),
		},
		// Enable X-Ray tracing for better observability
		Tracing: awslambda.Tracing_ACTIVE,
	})

	// Configure S3 bucket to trigger Lambda on object creation
	props.S3Bucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(lambdaFunction),
		&awss3.NotificationKeyFilter{
			// Only trigger for certain file types if needed
			// Suffix: jsii.String(".json"),
		},
	)

	// Add tags
	awscdk.Tags_Of(lambdaFunction).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(lambdaFunction).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)

	return &ComputeConstruct{
		Construct:      construct,
		LambdaFunction: lambdaFunction,
	}
}
```

## Lambda Function Code

**lambda/handler.py**
```python
import json
import boto3
import logging
import os
from datetime import datetime
from urllib.parse import unquote_plus
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
BUCKET_NAME = os.environ['S3_BUCKET_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda function to process S3 object creation events.
    
    This function is triggered when objects are created in the S3 bucket.
    It extracts metadata from the S3 event and stores it in DynamoDB.
    
    Args:
        event: S3 event notification
        context: Lambda context object
        
    Returns:
        Dict containing status and processed records count
    """
    
    logger.info(f"Processing S3 event: {json.dumps(event)}")
    
    try:
        # Get DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        
        processed_records = 0
        
        # Process each record in the event
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                processed_records += process_s3_record(record, table)
        
        logger.info(f"Successfully processed {processed_records} records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} records',
                'environment': ENVIRONMENT
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        raise


def process_s3_record(record: Dict[str, Any], table) -> int:
    """
    Process a single S3 record and store metadata in DynamoDB.
    
    Args:
        record: Single S3 event record
        table: DynamoDB table resource
        
    Returns:
        Number of records processed (0 or 1)
    """
    
    try:
        # Extract S3 information
        s3_info = record['s3']
        bucket_name = s3_info['bucket']['name']
        object_key = unquote_plus(s3_info['object']['key'])
        object_size = s3_info['object']['size']
        
        # Extract event information
        event_name = record['eventName']
        event_time = record['eventTime']
        
        logger.info(f"Processing object: {object_key} from bucket: {bucket_name}")
        
        # Get additional object metadata from S3
        try:
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            content_type = response.get('ContentType', 'unknown')
            last_modified = response.get('LastModified', datetime.now()).isoformat()
            etag = response.get('ETag', '').strip('"')
        except Exception as e:
            logger.warning(f"Could not get object metadata: {str(e)}")
            content_type = 'unknown'
            last_modified = datetime.now().isoformat()
            etag = 'unknown'
        
        # Create DynamoDB item
        item = {
            'pk': f"OBJECT#{bucket_name}",  # Partition key
            'sk': f"KEY#{object_key}#{event_time}",  # Sort key with timestamp for uniqueness
            'object_key': object_key,
            'bucket_name': bucket_name,
            'object_size': object_size,
            'content_type': content_type,
            'event_name': event_name,
            'event_time': event_time,
            'last_modified': last_modified,
            'etag': etag,
            'processed_at': datetime.now().isoformat(),
            'environment': ENVIRONMENT,
            'lambda_request_id': getattr(context, 'aws_request_id', 'unknown') if 'context' in locals() else 'unknown'
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored metadata for {object_key}")
        return 1
        
    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        # Re-raise to trigger Lambda retry mechanism
        raise


def get_object_metadata(bucket: str, key: str) -> Dict[str, Any]:
    """
    Get additional metadata for an S3 object.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        Dictionary containing object metadata
    """
    
    try:
        response = s3_client.head_object(Bucket=bucket, Key=key)
        return {
            'content_type': response.get('ContentType', 'unknown'),
            'content_length': response.get('ContentLength', 0),
            'last_modified': response.get('LastModified', datetime.now()).isoformat(),
            'etag': response.get('ETag', '').strip('"'),
            'server_side_encryption': response.get('ServerSideEncryption', 'none'),
            'metadata': response.get('Metadata', {})
        }
    except Exception as e:
        logger.warning(f"Could not retrieve metadata for {key}: {str(e)}")
        return {
            'content_type': 'unknown',
            'content_length': 0,
            'last_modified': datetime.now().isoformat(),
            'etag': 'unknown',
            'server_side_encryption': 'unknown',
            'metadata': {}
        }
```

## Configuration Files

**go.mod**
```go
module tap-infrastructure

go 1.19

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.87.0
)

require (
	github.com/Masterminds/semver/v3 v3.2.1 // indirect
	github.com/cdklabs/awscdk-asset-awscli-go/awscliv1/v2 v2.2.200 // indirect
	github.com/cdklabs/awscdk-asset-kubectl-go/kubectlv20/v2 v2.1.2 // indirect
	github.com/cdklabs/awscdk-asset-node-proxy-agent-go/nodeproxyagentv6/v2 v2.0.1 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/yuin/goldmark v1.4.13 // indirect
	golang.org/x/lint v0.0.0-20210508222113-6edffad5e616 // indirect
	golang.org/x/mod v0.12.0 // indirect
	golang.org/x/sys v0.10.0 // indirect
	golang.org/x/tools v0.11.0 // indirect
)
```

**cdk.json**
```json
{
  "app": "go run bin/tap.go",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*test.go",
      "**/*_test.go",
      "go.sum",
      "**/.gitignore",
      "**/.vscode",
      "**/.idea",
      "**/.DS_Store",
      "**/node_modules",
      "**/dist"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true,
    "environment": "prod"
  }
}
```

## README.md

```markdown
# TAP Infrastructure - AWS CDK Go

A secure, auditable cloud infrastructure built with AWS CDK in Go, featuring S3, DynamoDB, Lambda, and comprehensive audit logging.

## Architecture Overview

This infrastructure creates:

- **S3 Bucket**: Versioned storage with server access logging and Lambda triggers
- **DynamoDB Table**: Encrypted table with point-in-time recovery and CloudWatch Contributor Insights
- **Lambda Function**: Python-based processor triggered by S3 events
- **IAM Roles**: Least-privilege security model
- **CloudTrail**: Comprehensive audit logging
- **CloudWatch**: Centralized logging and monitoring

## Project Structure

```
tap-infrastructure/
├── bin/tap.go                           # Main CDK application
├── lib/
│   ├── tap_stack.go                     # Main stack definition
│   └── constructs/
│       ├── security_construct.go        # IAM roles and policies
│       ├── storage_construct.go         # S3 buckets and logging
│       ├── database_construct.go        # DynamoDB table
│       └── compute_construct.go         # Lambda function
├── lambda/handler.py                    # Lambda function code
├── go.mod                              # Go module definition
├── cdk.json                            # CDK configuration
└── README.md                           # This file
```

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **AWS CDK CLI** installed (`npm install -g aws-cdk`)
3. **Go** 1.19 or later
4. **Python** 3.9 or later (for Lambda function)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd tap-infrastructure
go mod tidy
```

### 2. Bootstrap CDK (if not done before)

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

### 3. Deploy Infrastructure

```bash
# Deploy to production environment (default)
cdk deploy

# Deploy to different environment
cdk deploy -c environment=dev
```

### 4. Verify Deployment

```bash
# List all stacks
cdk list

# View stack outputs
aws cloudformation describe-stacks --stack-name TapInfrastructureStack
```

## Configuration

### Environment Variables

The infrastructure supports different environments through CDK context:

```bash
# Production (default)