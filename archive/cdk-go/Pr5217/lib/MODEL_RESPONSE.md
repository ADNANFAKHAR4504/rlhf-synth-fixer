# E-commerce Order Processing Pipeline - AWS CDK Go Implementation

This implementation provides a serverless order processing pipeline using AWS CDK with Go. The solution includes API Gateway for order ingestion, SQS for asynchronous processing, DynamoDB for storage, and SNS for notifications.

## Architecture Overview

The system processes orders through the following flow:
1. Orders arrive via API Gateway REST API
2. Orders are queued in SQS for processing
3. Lambda functions process orders and update DynamoDB
4. SNS sends notifications for order status updates
5. CloudWatch monitors the entire pipeline

## Implementation Files

### File: lib/tap_stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	*awscdk.StackProps
	EnvironmentSuffix *string
}

type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// DynamoDB Table for Orders
	ordersTable := awsdynamodb.NewTable(stack, jsii.String("OrdersTable"), &awsdynamodb.TableProps{
		TableName: jsii.String(fmt.Sprintf("orders-table-%s", environmentSuffix)),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("orderId"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		BillingMode:   awsdynamodb.BillingMode_PAY_PER_REQUEST,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// SQS Queue for Order Processing
	orderQueue := awssqs.NewQueue(stack, jsii.String("OrderQueue"), &awssqs.QueueProps{
		QueueName:         jsii.String(fmt.Sprintf("order-queue-%s", environmentSuffix)),
		VisibilityTimeout: awscdk.Duration_Seconds(jsii.Number(300)),
	})

	// SNS Topic for Notifications
	orderTopic := awssns.NewTopic(stack, jsii.String("OrderTopic"), &awssns.TopicProps{
		TopicName:   jsii.String(fmt.Sprintf("order-topic-%s", environmentSuffix)),
		DisplayName: jsii.String("Order Processing Notifications"),
	})

	// Lambda Function for Order Processing
	orderProcessorLambda := awslambda.NewFunction(stack, jsii.String("OrderProcessor"), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("order-processor-%s", environmentSuffix)),
		Runtime:      awslambda.Runtime_PYTHON_3_11(),
		Handler:      jsii.String("index.handler"),
		Code:         awslambda.Code_FromAsset(jsii.String("lib/lambda"), nil),
		Environment: &map[string]*string{
			"ORDERS_TABLE": ordersTable.TableName(),
			"SNS_TOPIC":    orderTopic.TopicArn(),
		},
		Timeout: awscdk.Duration_Seconds(jsii.Number(30)),
	})

	// Grant permissions
	ordersTable.GrantReadWriteData(orderProcessorLambda)
	orderTopic.GrantPublish(orderProcessorLambda)

	// API Gateway
	api := awsapigateway.NewRestApi(stack, jsii.String("OrdersApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("orders-api-%s", environmentSuffix)),
		Description: jsii.String("API for order ingestion"),
	})

	// API Integration with Lambda
	integration := awsapigateway.NewLambdaIntegration(orderProcessorLambda, &awsapigateway.LambdaIntegrationOptions{})
	ordersResource := api.Root().AddResource(jsii.String("orders"), nil)
	ordersResource.AddMethod(jsii.String("POST"), integration, nil)

	// Stack outputs
	awscdk.NewCfnOutput(stack, jsii.String("ApiEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String("API Gateway endpoint URL"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("OrdersTableName"), &awscdk.CfnOutputProps{
		Value:       ordersTable.TableName(),
		Description: jsii.String("DynamoDB table name"),
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
```

### File: lib/lambda/index.py

```python
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table_name = os.environ['ORDERS_TABLE']
topic_arn = os.environ['SNS_TOPIC']

def handler(event, context):
    try:
        # Parse order from API Gateway event
        body = json.loads(event.get('body', '{}'))

        order_id = body.get('orderId')
        customer_id = body.get('customerId')
        items = body.get('items', [])

        # Store order in DynamoDB
        table = dynamodb.Table(table_name)
        table.put_item(
            Item={
                'orderId': order_id,
                'customerId': customer_id,
                'items': items,
                'status': 'pending',
                'timestamp': datetime.now().isoformat()
            }
        )

        # Publish notification
        sns.publish(
            TopicArn=topic_arn,
            Message=f'Order {order_id} received',
            Subject='Order Confirmation'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Order processed successfully',
                'orderId': order_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Known Limitations

This initial implementation provides basic order processing but has several areas for improvement:

1. **No Dead Letter Queue**: Failed messages are not captured for retry
2. **Limited Error Handling**: Basic try-catch without specific error types
3. **No CloudWatch Alarms**: Missing alerting for errors and performance issues
4. **No X-Ray Tracing**: Limited visibility into request flow
5. **Missing GSI**: DynamoDB table lacks secondary index for customer queries
6. **No API Validation**: API Gateway doesn't validate request structure
7. **Direct Lambda Integration**: SQS queue created but not integrated into the flow
8. **No Batch Processing**: Lambda processes one order at a time instead of batches
9. **Limited IAM Policies**: Could be more restrictive with least privilege

## Deployment

Deploy using:
```bash
cdk synth
cdk deploy
```

## Testing

Test the API endpoint:
```bash
curl -X POST $API_ENDPOINT/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": "123", "customerId": "456", "items": ["item1", "item2"]}'
```