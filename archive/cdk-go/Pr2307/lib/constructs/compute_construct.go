package constructs

import (
	"os"
	"path/filepath"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatchactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment   string
	LambdaRole    awsiam.IRole
	S3Bucket      awss3.IBucket
	DynamoDBTable awsdynamodb.ITable
	AlertingTopic awssns.ITopic
	VPC           awsec2.IVpc
}

type ComputeConstruct struct {
	constructs.Construct
	LambdaFunction awslambda.IFunction
	Alarms         []awscloudwatch.IAlarm
}

func NewComputeConstruct(scope constructs.Construct, id string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Enhanced CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/lambda/proj-lambda-" + props.Environment),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Get private subnets for Lambda VPC configuration
	privateSubnets := props.VPC.PrivateSubnets()

	// Dynamically resolve Lambda code source
	lambdaCode := resolveLambdaCode()

	// Enhanced Lambda function with ARM64 and Python 3.12
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("ProcessorFunction"), &awslambda.FunctionProps{
		FunctionName:                 jsii.String("proj-lambda-" + props.Environment),
		Runtime:                      awslambda.Runtime_PYTHON_3_12(),
		Architecture:                 awslambda.Architecture_ARM_64(),
		Handler:                      jsii.String("handler.lambda_handler"),
		Code:                         lambdaCode,
		Role:                         props.LambdaRole,
		LogGroup:                     logGroup,
		Timeout:                      awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize:                   jsii.Number(512), // Increased for ARM64 optimization
		ReservedConcurrentExecutions: jsii.Number(10),  // Stability limit
		Description:                  jsii.String("Enhanced S3 processor with ARM64 and monitoring"),
		Environment: &map[string]*string{
			"DYNAMODB_TABLE_NAME": props.DynamoDBTable.TableName(),
			"S3_BUCKET_NAME":      props.S3Bucket.BucketName(),
			"ENVIRONMENT":         jsii.String(props.Environment),
		},
		Tracing: awslambda.Tracing_ACTIVE,
		Vpc:     props.VPC,
		VpcSubnets: &awsec2.SubnetSelection{
			Subnets: privateSubnets,
		},
		DeadLetterQueueEnabled: jsii.Bool(true),
		RetryAttempts:          jsii.Number(2),
	})

	// Configure S3 trigger - trigger on all object creation events
	props.S3Bucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(lambdaFunction),
	)

	// Create comprehensive CloudWatch alarms
	alarms := createLambdaAlarms(construct, lambdaFunction, props)
	createDynamoDBAlarms(construct, props.DynamoDBTable, props.AlertingTopic, props.Environment)

	return &ComputeConstruct{
		Construct:      construct,
		LambdaFunction: lambdaFunction,
		Alarms:         alarms,
	}
}

func createLambdaAlarms(construct constructs.Construct, fn awslambda.IFunction, props *ComputeConstructProps) []awscloudwatch.IAlarm {
	var alarms []awscloudwatch.IAlarm

	// Error Rate Alarm (>1%)
	errorRateAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorRateAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-error-rate-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function error rate exceeded 1%"),
		Metric: awscloudwatch.NewMathExpression(&awscloudwatch.MathExpressionProps{
			Expression: jsii.String("(errors / invocations) * 100"),
			UsingMetrics: &map[string]awscloudwatch.IMetric{
				"errors": fn.MetricErrors(&awscloudwatch.MetricOptions{
					Statistic: awscloudwatch.Stats_SUM(),
					Period:    awscdk.Duration_Minutes(jsii.Number(5)),
				}),
				"invocations": fn.MetricInvocations(&awscloudwatch.MetricOptions{
					Statistic: awscloudwatch.Stats_SUM(),
					Period:    awscdk.Duration_Minutes(jsii.Number(5)),
				}),
			},
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	errorRateAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	// Duration Alarm (>30s)
	durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-duration-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function duration exceeded 30 seconds"),
		Metric: fn.MetricDuration(&awscloudwatch.MetricOptions{
			Statistic: awscloudwatch.Stats_AVERAGE(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(30000), // 30 seconds in milliseconds
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	durationAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	// Throttling Alarm
	throttleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-throttles-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function is being throttled"),
		Metric: fn.MetricThrottles(&awscloudwatch.MetricOptions{
			Statistic: awscloudwatch.Stats_SUM(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(1),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	throttleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	alarms = append(alarms, errorRateAlarm, durationAlarm, throttleAlarm)
	return alarms
}

func createDynamoDBAlarms(construct constructs.Construct, table awsdynamodb.ITable, topic awssns.ITopic, env string) {
	// DynamoDB Read Throttling Alarm
	readThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBReadThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-dynamodb-read-throttles-" + env),
		AlarmDescription: jsii.String("DynamoDB table experiencing read throttling"),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/DynamoDB"),
			MetricName: jsii.String("ReadThrottles"),
			DimensionsMap: &map[string]*string{
				"TableName": table.TableName(),
			},
			Statistic: awscloudwatch.Stats_SUM(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	readThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))

	// DynamoDB Write Throttling Alarm
	writeThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBWriteThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-dynamodb-write-throttles-" + env),
		AlarmDescription: jsii.String("DynamoDB table experiencing write throttling"),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/DynamoDB"),
			MetricName: jsii.String("WriteThrottles"),
			DimensionsMap: &map[string]*string{
				"TableName": table.TableName(),
			},
			Statistic: awscloudwatch.Stats_SUM(),
			Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	writeThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))
}

// resolveLambdaCode dynamically finds the Lambda source code or falls back to inline code
func resolveLambdaCode() awslambda.Code {
	// Possible Lambda code paths to check
	possiblePaths := []string{
		"lambda",        // Standard path from project root
		"lib/lambda",    // Alternative path
		"../lambda",     // Relative from lib directory
		"../lib/lambda", // Alternative relative path
		"./lambda",      // Current directory
	}

	// Try to find a valid Lambda directory
	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			// Check if handler.py exists in this directory
			handlerPath := filepath.Join(path, "handler.py")
			if _, err := os.Stat(handlerPath); err == nil {
				return awslambda.Code_FromAsset(jsii.String(path), nil)
			}
		}
	}

	// Fallback to inline Lambda code if no valid path found
	return awslambda.Code_FromInline(jsii.String(getInlineLambdaCode()))
}

// getInlineLambdaCode returns the Lambda function code as an inline string
func getInlineLambdaCode() string {
	return `import json
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
    Enhanced Lambda function to process S3 object creation events.
    
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
                # Extract S3 object information
                bucket_name = record['s3']['bucket']['name']
                object_key = unquote_plus(record['s3']['object']['key'])
                object_size = record['s3']['object']['size']
                event_name = record['eventName']
                event_time = record['eventTime']
                
                logger.info(f"Processing S3 object: s3://{bucket_name}/{object_key}")
                
                # Get additional object metadata
                try:
                    response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                    last_modified = response.get('LastModified', '').isoformat() if response.get('LastModified') else ''
                    content_type = response.get('ContentType', 'unknown')
                    etag = response.get('ETag', '').strip('"')
                except Exception as e:
                    logger.warning(f"Could not get object metadata: {e}")
                    last_modified = ''
                    content_type = 'unknown'
                    etag = ''
                
                # Create DynamoDB item
                item = {
                    'pk': f"s3#{bucket_name}#{object_key}",
                    'sk': f"event#{event_time}#{processed_records}",
                    'object_key': object_key,
                    'bucket_name': bucket_name,
                    'object_size': object_size,
                    'event_name': event_name,
                    'event_time': event_time,
                    'last_modified': last_modified,
                    'content_type': content_type,
                    'etag': etag,
                    'environment': ENVIRONMENT,
                    'processed_at': datetime.utcnow().isoformat(),
                    'lambda_request_id': context.aws_request_id,
                    'lambda_function_name': context.function_name
                }
                
                # Store in DynamoDB
                table.put_item(Item=item)
                processed_records += 1
                
                logger.info(f"Successfully processed record {processed_records}: {object_key}")
        
        result = {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} S3 events',
                'processed_records': processed_records,
                'environment': ENVIRONMENT
            })
        }
        
        logger.info(f"Lambda execution completed: {result}")
        return result
        
    except Exception as e:
        error_message = f"Error processing S3 event: {str(e)}"
        logger.error(error_message)
        
        # Return error response
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message,
                'environment': ENVIRONMENT
            })
        }`
}
