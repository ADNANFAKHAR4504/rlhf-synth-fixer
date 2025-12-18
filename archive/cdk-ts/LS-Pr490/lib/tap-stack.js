"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3n = __importStar(require("aws-cdk-lib/aws-s3-notifications"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class TapStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // DynamoDB table for logging Lambda invocations
        const logsTable = new dynamodb.Table(this, 'LambdaInvocationLogs', {
            tableName: `lambda-invocation-logs-${props.environmentSuffix}`,
            partitionKey: {
                name: 'requestId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // S3 bucket for triggering Lambda
        const triggerBucket = new s3.Bucket(this, 'LambdaTriggerBucket', {
            bucketName: `lambda-trigger-bucket-${props.environmentSuffix}-${this.account}`,
            versioned: false,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // IAM role for Lambda function
        const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // Grant DynamoDB write permissions to Lambda
        logsTable.grantWriteData(lambdaRole);
        // Grant S3 read permissions to Lambda
        triggerBucket.grantRead(lambdaRole);
        // Lambda function
        const processFunction = new lambda.Function(this, 'S3ProcessorFunction', {
            functionName: `s3-processor-${props.environmentSuffix}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: 'index.lambda_handler',
            code: lambda.Code.fromInline(`
import json
import boto3
import uuid
import os
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# LocalStack configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
if endpoint_url:
    dynamodb = boto3.resource('dynamodb', endpoint_url=endpoint_url)
else:
    dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('${logsTable.tableName}')

def lambda_handler(event, context):
    try:
        request_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        logger.info(f"Processing S3 event with request ID: {request_id}")
        
        # Process S3 event
        for record in event.get('Records', []):
            if 's3' in record:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for {key} in bucket {bucket}")
                
                # Log invocation to DynamoDB
                table.put_item(
                    Item={
                        'requestId': request_id,
                        'timestamp': timestamp,
                        'bucketName': bucket,
                        'objectKey': key,
                        'eventName': event_name,
                        'functionName': context.function_name,
                        'awsRequestId': context.aws_request_id
                    }
                )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'requestId': request_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing S3 event',
                'error': str(e)
            })
        }
`),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 128,
            environment: {
                DYNAMODB_TABLE_NAME: logsTable.tableName,
                LOG_LEVEL: 'INFO',
            },
        });
        // S3 bucket notification to trigger Lambda
        triggerBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(processFunction));
        // Outputs
        new cdk.CfnOutput(this, 'BucketName', {
            value: triggerBucket.bucketName,
            description: 'Name of the S3 bucket that triggers Lambda',
        });
        new cdk.CfnOutput(this, 'DynamoDBTableName', {
            value: logsTable.tableName,
            description: 'Name of the DynamoDB table for logging',
        });
        new cdk.CfnOutput(this, 'LambdaFunctionName', {
            value: processFunction.functionName,
            description: 'Name of the Lambda function',
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsdURBQXlDO0FBQ3pDLHNFQUF3RDtBQUN4RCxtRUFBcUQ7QUFDckQseURBQTJDO0FBTzNDLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsZ0RBQWdEO1FBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDakUsU0FBUyxFQUFFLDBCQUEwQixLQUFLLENBQUMsaUJBQWlCLEVBQUU7WUFDOUQsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxXQUFXO2dCQUNqQixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxXQUFXO2dCQUNqQixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxnQ0FBZ0MsRUFBRTtnQkFDaEMsMEJBQTBCLEVBQUUsSUFBSTthQUNqQztZQUNELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsa0NBQWtDO1FBQ2xDLE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDL0QsVUFBVSxFQUFFLHlCQUF5QixLQUFLLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUM5RSxTQUFTLEVBQUUsS0FBSztZQUNoQixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxVQUFVLEVBQUUsSUFBSTtZQUNoQixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsK0JBQStCO1FBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDM0QsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUN4QywwQ0FBMEMsQ0FDM0M7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXJDLHNDQUFzQztRQUN0QyxhQUFhLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXBDLGtCQUFrQjtRQUNsQixNQUFNLGVBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3ZFLFlBQVksRUFBRSxnQkFBZ0IsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQ3ZELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVU7WUFDbEMsT0FBTyxFQUFFLHNCQUFzQjtZQUMvQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OzBCQWlCVCxTQUFTLENBQUMsU0FBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBZ0Q1QyxDQUFDO1lBQ0ksSUFBSSxFQUFFLFVBQVU7WUFDaEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFdBQVcsRUFBRTtnQkFDWCxtQkFBbUIsRUFBRSxTQUFTLENBQUMsU0FBUztnQkFDeEMsU0FBUyxFQUFFLE1BQU07YUFDbEI7U0FDRixDQUFDLENBQUM7UUFFSCwyQ0FBMkM7UUFDM0MsYUFBYSxDQUFDLG9CQUFvQixDQUNoQyxFQUFFLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFDM0IsSUFBSSxHQUFHLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQzNDLENBQUM7UUFFRixVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDcEMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxVQUFVO1lBQy9CLFdBQVcsRUFBRSw0Q0FBNEM7U0FDMUQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsU0FBUyxDQUFDLFNBQVM7WUFDMUIsV0FBVyxFQUFFLHdDQUF3QztTQUN0RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxlQUFlLENBQUMsWUFBWTtZQUNuQyxXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhKRCw0QkF3SkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHMzbiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtbm90aWZpY2F0aW9ucyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFRhcFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFRhcFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIER5bmFtb0RCIHRhYmxlIGZvciBsb2dnaW5nIExhbWJkYSBpbnZvY2F0aW9uc1xuICAgIGNvbnN0IGxvZ3NUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnTGFtYmRhSW52b2NhdGlvbkxvZ3MnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBsYW1iZGEtaW52b2NhdGlvbi1sb2dzLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAncmVxdWVzdElkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlTcGVjaWZpY2F0aW9uOiB7XG4gICAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBTMyBidWNrZXQgZm9yIHRyaWdnZXJpbmcgTGFtYmRhXG4gICAgY29uc3QgdHJpZ2dlckJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0xhbWJkYVRyaWdnZXJCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgbGFtYmRhLXRyaWdnZXItYnVja2V0LSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9LSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIElBTSByb2xlIGZvciBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdMYW1iZGFFeGVjdXRpb25Sb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAgICdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJ1xuICAgICAgICApLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IER5bmFtb0RCIHdyaXRlIHBlcm1pc3Npb25zIHRvIExhbWJkYVxuICAgIGxvZ3NUYWJsZS5ncmFudFdyaXRlRGF0YShsYW1iZGFSb2xlKTtcblxuICAgIC8vIEdyYW50IFMzIHJlYWQgcGVybWlzc2lvbnMgdG8gTGFtYmRhXG4gICAgdHJpZ2dlckJ1Y2tldC5ncmFudFJlYWQobGFtYmRhUm9sZSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBwcm9jZXNzRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdTM1Byb2Nlc3NvckZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgczMtcHJvY2Vzc29yLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzgsXG4gICAgICBoYW5kbGVyOiAnaW5kZXgubGFtYmRhX2hhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG5pbXBvcnQganNvblxuaW1wb3J0IGJvdG8zXG5pbXBvcnQgdXVpZFxuaW1wb3J0IG9zXG5mcm9tIGRhdGV0aW1lIGltcG9ydCBkYXRldGltZVxuaW1wb3J0IGxvZ2dpbmdcblxubG9nZ2VyID0gbG9nZ2luZy5nZXRMb2dnZXIoKVxubG9nZ2VyLnNldExldmVsKGxvZ2dpbmcuSU5GTylcblxuIyBMb2NhbFN0YWNrIGNvbmZpZ3VyYXRpb25cbmVuZHBvaW50X3VybCA9IG9zLmVudmlyb24uZ2V0KCdBV1NfRU5EUE9JTlRfVVJMJylcbmlmIGVuZHBvaW50X3VybDpcbiAgICBkeW5hbW9kYiA9IGJvdG8zLnJlc291cmNlKCdkeW5hbW9kYicsIGVuZHBvaW50X3VybD1lbmRwb2ludF91cmwpXG5lbHNlOlxuICAgIGR5bmFtb2RiID0gYm90bzMucmVzb3VyY2UoJ2R5bmFtb2RiJylcbnRhYmxlID0gZHluYW1vZGIuVGFibGUoJyR7bG9nc1RhYmxlLnRhYmxlTmFtZX0nKVxuXG5kZWYgbGFtYmRhX2hhbmRsZXIoZXZlbnQsIGNvbnRleHQpOlxuICAgIHRyeTpcbiAgICAgICAgcmVxdWVzdF9pZCA9IHN0cih1dWlkLnV1aWQ0KCkpXG4gICAgICAgIHRpbWVzdGFtcCA9IGRhdGV0aW1lLnV0Y25vdygpLmlzb2Zvcm1hdCgpXG4gICAgICAgIFxuICAgICAgICBsb2dnZXIuaW5mbyhmXCJQcm9jZXNzaW5nIFMzIGV2ZW50IHdpdGggcmVxdWVzdCBJRDoge3JlcXVlc3RfaWR9XCIpXG4gICAgICAgIFxuICAgICAgICAjIFByb2Nlc3MgUzMgZXZlbnRcbiAgICAgICAgZm9yIHJlY29yZCBpbiBldmVudC5nZXQoJ1JlY29yZHMnLCBbXSk6XG4gICAgICAgICAgICBpZiAnczMnIGluIHJlY29yZDpcbiAgICAgICAgICAgICAgICBidWNrZXQgPSByZWNvcmRbJ3MzJ11bJ2J1Y2tldCddWyduYW1lJ11cbiAgICAgICAgICAgICAgICBrZXkgPSByZWNvcmRbJ3MzJ11bJ29iamVjdCddWydrZXknXVxuICAgICAgICAgICAgICAgIGV2ZW50X25hbWUgPSByZWNvcmRbJ2V2ZW50TmFtZSddXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oZlwiUHJvY2Vzc2luZyB7ZXZlbnRfbmFtZX0gZm9yIHtrZXl9IGluIGJ1Y2tldCB7YnVja2V0fVwiKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICMgTG9nIGludm9jYXRpb24gdG8gRHluYW1vREJcbiAgICAgICAgICAgICAgICB0YWJsZS5wdXRfaXRlbShcbiAgICAgICAgICAgICAgICAgICAgSXRlbT17XG4gICAgICAgICAgICAgICAgICAgICAgICAncmVxdWVzdElkJzogcmVxdWVzdF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICd0aW1lc3RhbXAnOiB0aW1lc3RhbXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYnVja2V0TmFtZSc6IGJ1Y2tldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICdvYmplY3RLZXknOiBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAnZXZlbnROYW1lJzogZXZlbnRfbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdmdW5jdGlvbk5hbWUnOiBjb250ZXh0LmZ1bmN0aW9uX25hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYXdzUmVxdWVzdElkJzogY29udGV4dC5hd3NfcmVxdWVzdF9pZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdzdGF0dXNDb2RlJzogMjAwLFxuICAgICAgICAgICAgJ2JvZHknOiBqc29uLmR1bXBzKHtcbiAgICAgICAgICAgICAgICAnbWVzc2FnZSc6ICdTdWNjZXNzZnVsbHkgcHJvY2Vzc2VkIFMzIGV2ZW50JyxcbiAgICAgICAgICAgICAgICAncmVxdWVzdElkJzogcmVxdWVzdF9pZFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6XG4gICAgICAgIGxvZ2dlci5lcnJvcihmXCJFcnJvciBwcm9jZXNzaW5nIGV2ZW50OiB7c3RyKGUpfVwiKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ3N0YXR1c0NvZGUnOiA1MDAsXG4gICAgICAgICAgICAnYm9keSc6IGpzb24uZHVtcHMoe1xuICAgICAgICAgICAgICAgICdtZXNzYWdlJzogJ0Vycm9yIHByb2Nlc3NpbmcgUzMgZXZlbnQnLFxuICAgICAgICAgICAgICAgICdlcnJvcic6IHN0cihlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuYCksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PREJfVEFCTEVfTkFNRTogbG9nc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgTE9HX0xFVkVMOiAnSU5GTycsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gUzMgYnVja2V0IG5vdGlmaWNhdGlvbiB0byB0cmlnZ2VyIExhbWJkYVxuICAgIHRyaWdnZXJCdWNrZXQuYWRkRXZlbnROb3RpZmljYXRpb24oXG4gICAgICBzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQsXG4gICAgICBuZXcgczNuLkxhbWJkYURlc3RpbmF0aW9uKHByb2Nlc3NGdW5jdGlvbilcbiAgICApO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRyaWdnZXJCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgUzMgYnVja2V0IHRoYXQgdHJpZ2dlcnMgTGFtYmRhJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEeW5hbW9EQlRhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiBsb2dzVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBEeW5hbW9EQiB0YWJsZSBmb3IgbG9nZ2luZycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTGFtYmRhRnVuY3Rpb25OYW1lJywge1xuICAgICAgdmFsdWU6IHByb2Nlc3NGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIExhbWJkYSBmdW5jdGlvbicsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==