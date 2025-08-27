# Complete TapStack Infrastructure Implementation

This document provides the ideal implementation for a comprehensive, production-grade AWS infrastructure stack using CDK Go. The implementation follows AWS best practices for security, monitoring, and compliance.

## Architecture Overview

The TapStack creates a secure, scalable infrastructure with:
- **VPC** with public/private subnets across multiple AZs
- **S3 buckets** with encryption, versioning, and lifecycle policies
- **DynamoDB table** with encryption, PITR, and streams
- **Lambda function** with VPC integration and monitoring
- **CloudTrail** for audit logging
- **CloudWatch alarms** for proactive monitoring
- **SNS** for alerting

## Project Structure

```
iac-test-automations/
├── bin/
│   └── tap.go                     # Main entry point
├── lib/
│   ├── constructs/
│   │   ├── security_construct.go  # VPC, IAM, SNS
│   │   ├── storage_construct.go   # S3 buckets
│   │   ├── database_construct.go  # DynamoDB table
│   │   └── compute_construct.go   # Lambda function & monitoring
│   ├── lambda/
│   │   └── handler.py             # Lambda Python code
│   └── tap_stack.go               # Main stack definition
├── tests/
│   ├── unit/
│   │   └── tap_stack_unit_test.go # Unit tests
│   └── integration/
│   │   └── tap_stack_int_test.go  # Integration tests
└── go.mod                         # Go dependencies
```

## Complete Implementation

### 1. Go Module Configuration (`go.mod`)

```go
module github.com/TuringGpt/iac-test-automations

go 1.23

require (
github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
github.com/aws/aws-sdk-go-v2 v1.38.1
github.com/aws/constructs-go/constructs/v10 v10.4.2
github.com/aws/jsii-runtime-go v1.113.0
github.com/stretchr/testify v1.11.0
)
```

### 2. Main Entry Point (`bin/tap.go`)

```go
package main

import (
"os"

"github.com/TuringGpt/iac-test-automations/lib"
"github.com/aws/aws-cdk-go/awscdk/v2"
"github.com/aws/jsii-runtime-go"
)

func main() {
defer jsii.Close()

app := awscdk.NewApp(nil)

// Get environment suffix from context or use 'dev' as default
var environmentSuffix string
if suffix := app.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
ok := suffix.(string); ok {
vironmentSuffix = suffixStr
{
vironmentSuffix = "dev"
{
vironmentSuffix = "dev"
}

stackName := "TapStack" + environmentSuffix

// Apply global tags
awscdk.Tags_Of(app).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
awscdk.Tags_Of(app).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)

// Create TapStackProps
props := &lib.TapStackProps{
awscdk.StackProps{},
vironment: environmentSuffix,
}

// Initialize the stack
lib.NewTapStack(app, jsii.String(stackName), props)

app.Synth(nil)
}
```

### 3. Main Stack Definition (`lib/tap_stack.go`)

```go
package lib

import (
tapConstructs "github.com/TuringGpt/iac-test-automations/lib/constructs"
"github.com/aws/aws-cdk-go/awscdk/v2"
"github.com/aws/aws-cdk-go/awscdk/v2/awscloudtrail"
"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
"github.com/aws/constructs-go/constructs/v10"
"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
awscdk.StackProps
Environment string
}

type TapStack struct {
awscdk.Stack
Environment string
}

func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
var sprops awscdk.StackProps
if props != nil {
props.StackProps
}
stack := awscdk.NewStack(scope, id, &sprops)

environment := "prod"
if props != nil && props.Environment != "" {
vironment = props.Environment
}

// CloudTrail setup
cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailBucket"), &awss3.BucketProps{
ame:        jsii.String("proj-cloudtrail-" + environment),
ed:         jsii.Bool(true),
jsii.Bool(false),
cryption:        awss3.BucketEncryption_S3_MANAGED,
forceSSL:        jsii.Bool(true),
&[]*awss3.LifecycleRule{
       jsii.String("DeleteOldLogs"),
abled:    jsii.Bool(true),
: awscdk.Duration_Days(jsii.Number(90)),
ewTrail(stack, jsii.String("AuditTrail"), &awscloudtrail.TrailProps{
ame:                  jsii.String("proj-audit-trail-" + environment),
                   cloudTrailBucket,
cludeGlobalServiceEvents: jsii.Bool(true),
Trail:         jsii.Bool(true),
ableFileValidation:       jsii.Bool(true),
dToCloudWatchLogs:       jsii.Bool(true),
})

// Create constructs
securityConstruct := tapConstructs.NewSecurityConstruct(stack, "SecurityConstruct", &tapConstructs.SecurityConstructProps{
vironment: environment,
})

storageConstruct := tapConstructs.NewStorageConstruct(stack, "StorageConstruct", &tapConstructs.StorageConstructProps{
vironment: environment,
})

databaseConstruct := tapConstructs.NewDatabaseConstruct(stack, "DatabaseConstruct", &tapConstructs.DatabaseConstructProps{
vironment: environment,
})

tapConstructs.NewComputeConstruct(stack, "ComputeConstruct", &tapConstructs.ComputeConstructProps{
vironment:   environment,
  securityConstruct.LambdaRole,
    storageConstruct.Bucket,
amoDBTable: databaseConstruct.Table,
gTopic: securityConstruct.AlertingTopic,
         securityConstruct.VPC,
})

// Stack outputs
awscdk.NewCfnOutput(stack, jsii.String("AlertingTopicArn"), &awscdk.CfnOutputProps{
     securityConstruct.AlertingTopic.TopicArn(),
: jsii.String("SNS Topic ARN for infrastructure alerts"),
})

return &TapStack{
     stack,
vironment: environment,
}
}
```

### 4. Security Construct (`lib/constructs/security_construct.go`)

```go
package constructs

import (
"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
"github.com/aws/constructs-go/constructs/v10"
"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
Environment string
}

type SecurityConstruct struct {
constructs.Construct
LambdaRole    awsiam.IRole
AlertingTopic awssns.ITopic
VPC           awsec2.IVpc
VPCEndpoints  map[string]awsec2.IVpcEndpoint
}

func NewSecurityConstruct(scope constructs.Construct, id string, props *SecurityConstructProps) *SecurityConstruct {
construct := constructs.NewConstruct(scope, &id)

// Create SNS topic for alerting
alertingTopic := awssns.NewTopic(construct, jsii.String("AlertingTopic"), &awssns.TopicProps{
ame:   jsii.String("proj-alerts-" + props.Environment),
ame: jsii.String("TAP Infrastructure Alerts"),
})

// Create VPC for private endpoints
vpc := awsec2.NewVpc(construct, jsii.String("VPC"), &awsec2.VpcProps{
ame:            jsii.String("proj-vpc-" + props.Environment),
           jsii.Number(2),
ableDnsHostnames: jsii.Bool(true),
ableDnsSupport:   jsii.Bool(true),
etConfiguration: &[]*awsec2.SubnetConfiguration{
ame:       jsii.String("Private"),
etType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
 jsii.Number(24),
ame:       jsii.String("Public"),
etType: awsec2.SubnetType_PUBLIC,
 jsii.Number(24),
VPC endpoints for private service access
vpcEndpoints := make(map[string]awsec2.IVpcEndpoint)

// S3 Gateway endpoint
vpcEndpoints["s3"] = awsec2.NewGatewayVpcEndpoint(construct, jsii.String("S3Endpoint"), &awsec2.GatewayVpcEndpointProps{
   vpc,
VpcEndpointAwsService_S3(),
})

// DynamoDB Gateway endpoint
vpcEndpoints["dynamodb"] = awsec2.NewGatewayVpcEndpoint(construct, jsii.String("DynamoDBEndpoint"), &awsec2.GatewayVpcEndpointProps{
   vpc,
VpcEndpointAwsService_DYNAMODB(),
})

// CloudWatch Logs Interface endpoint
vpcEndpoints["logs"] = awsec2.NewInterfaceVpcEndpoint(construct, jsii.String("LogsEndpoint"), &awsec2.InterfaceVpcEndpointProps{
             vpc,
         awsec2.InterfaceVpcEndpointAwsService_CLOUDWATCH_LOGS(),
sEnabled: jsii.Bool(true),
})

// Enhanced Lambda role with VPC and X-Ray permissions
lambdaRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
ame:    jsii.String("proj-lambda-role-" + props.Environment),
  awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
: jsii.String("Enhanced IAM role for Lambda with VPC and X-Ray access"),
agedPolicies: &[]awsiam.IManagedPolicy{
agedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
agedPolicy_FromAwsManagedPolicyName(jsii.String("AWSXRayDaemonWriteAccess")),
hanced inline policies
enhancedS3Policy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
ts: &[]awsiam.PolicyStatement{
ewPolicyStatement(&awsiam.PolicyStatementProps{
s: &[]*string{
g("s3:GetObject"),
g("s3:GetObjectVersion"),
g("s3:GetObjectAttributes"),
g{
g("arn:aws:s3:::proj-s3-" + props.Environment + "/*"),
ditions: &map[string]interface{}{
g]interface{}{
sport": "true",
hancedDynamoPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
ts: &[]awsiam.PolicyStatement{
ewPolicyStatement(&awsiam.PolicyStatementProps{
s: &[]*string{
g("dynamodb:PutItem"),
g("dynamodb:UpdateItem"),
g("dynamodb:ConditionCheckItem"),
g{
g("arn:aws:dynamodb:us-east-1:*:table/proj-dynamodb-" + props.Environment),
enhanced policies
awsiam.NewPolicy(construct, jsii.String("EnhancedS3AccessPolicy"), &awsiam.PolicyProps{
ame: jsii.String("proj-enhanced-s3-policy-" + props.Environment),
t:   enhancedS3Policy,
    &[]awsiam.IRole{lambdaRole},
})

awsiam.NewPolicy(construct, jsii.String("EnhancedDynamoDBAccessPolicy"), &awsiam.PolicyProps{
ame: jsii.String("proj-enhanced-dynamodb-policy-" + props.Environment),
t:   enhancedDynamoPolicy,
    &[]awsiam.IRole{lambdaRole},
})

return &SecurityConstruct{
struct:     construct,
  lambdaRole,
gTopic: alertingTopic,
         vpc,
dpoints:  vpcEndpoints,
}
}
```

### 5. Storage Construct (`lib/constructs/storage_construct.go`)

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
Bucket        awss3.IBucket
LoggingBucket awss3.IBucket
}

func NewStorageConstruct(scope constructs.Construct, id string, props *StorageConstructProps) *StorageConstruct {
construct := constructs.NewConstruct(scope, &id)

// Enhanced logging bucket
loggingBucket := awss3.NewBucket(construct, jsii.String("AccessLogsBucket"), &awss3.BucketProps{
ame:        jsii.String("proj-s3-logs-" + props.Environment),
jsii.Bool(false),
cryption:        awss3.BucketEncryption_S3_MANAGED,
forceSSL:        jsii.Bool(true),
&[]*awss3.LifecycleRule{
       jsii.String("DeleteOldAccessLogs"),
abled:    jsii.Bool(true),
: awscdk.Duration_Days(jsii.Number(90)),
sitions: &[]*awss3.Transition{
  awss3.StorageClass_INFREQUENT_ACCESS(),
sitionAfter: awscdk.Duration_Days(jsii.Number(30)),
hanced main bucket with SSL-only policy and Transfer Acceleration
bucket := awss3.NewBucket(construct, jsii.String("MainBucket"), &awss3.BucketProps{
ame:             jsii.String("proj-s3-" + props.Environment),
ed:              jsii.Bool(true),
     jsii.Bool(false),
    awss3.BlockPublicAccess_BLOCK_ALL(),
cryption:             awss3.BucketEncryption_S3_MANAGED,
forceSSL:             jsii.Bool(true),
sferAcceleration:   jsii.Bool(true),
gBucket,
g("access-logs/"),
tBridgeEnabled:     jsii.Bool(true),
})

return &StorageConstruct{
struct:     construct,
      bucket,
gBucket: loggingBucket,
}
}
```

### 6. Database Construct (`lib/constructs/database_construct.go`)

```go
package constructs

import (
"github.com/aws/aws-cdk-go/awscdk/v2"
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
ame: jsii.String("proj-dynamodb-" + props.Environment),
 key
Key: &awsdynamodb.Attribute{
ame: jsii.String("pk"),
awsdynamodb.AttributeType_STRING,
key
&awsdynamodb.Attribute{
ame: jsii.String("sk"),
awsdynamodb.AttributeType_STRING,
able encryption at rest
cryption: awsdynamodb.TableEncryption_AWS_MANAGED,
able point-in-time recovery using new API
tInTimeRecoverySpecification: &awsdynamodb.PointInTimeRecoverySpecification{
tInTimeRecoveryEnabled: jsii.Bool(true),
g mode
gMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
able deletion protection for production
Protection: jsii.Bool(true),
able CloudWatch Contributor Insights
tributorInsightsEnabled: jsii.Bool(true),
specification for change data capture
namodb.StreamViewType_NEW_AND_OLD_IMAGES,
class for cost optimization
namodb.TableClass_STANDARD,
old property
awscdk.RemovalPolicy_RETAIN,
})

// Add Global Secondary Index for common query patterns
table.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexProps{
dexName: jsii.String("GSI1"),
Key: &awsdynamodb.Attribute{
ame: jsii.String("gsi1pk"),
awsdynamodb.AttributeType_STRING,
&awsdynamodb.Attribute{
ame: jsii.String("gsi1sk"),
awsdynamodb.AttributeType_STRING,
tags for better resource management
awscdk.Tags_Of(table).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
awscdk.Tags_Of(table).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)
awscdk.Tags_Of(table).Add(jsii.String("BackupEnabled"), jsii.String("true"), nil)

return &DatabaseConstruct{
struct: construct,
   table,
}
}
```

### 7. Compute Construct (`lib/constructs/compute_construct.go`)

```go
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
ame:  jsii.String("/aws/lambda/proj-lambda-" + props.Environment),
tion:     awslogs.RetentionDays_ONE_MONTH,
awscdk.RemovalPolicy_DESTROY,
})

// Get private subnets for Lambda VPC configuration
privateSubnets := props.VPC.PrivateSubnets()

// Dynamically resolve Lambda code source
lambdaCode := resolveLambdaCode()

// Enhanced Lambda function with ARM64 and Python 3.12
lambdaFunction := awslambda.NewFunction(construct, jsii.String("ProcessorFunction"), &awslambda.FunctionProps{
ctionName:                 jsii.String("proj-lambda-" + props.Environment),
time:                      awslambda.Runtime_PYTHON_3_12(),
               awslambda.Architecture_ARM_64(),
dler:                      jsii.String("handler.lambda_handler"),
                       lambdaCode,
                       props.LambdaRole,
                   logGroup,
                    awscdk.Duration_Minutes(jsii.Number(5)),
                  jsii.Number(512),
currentExecutions: jsii.Number(10),
:                  jsii.String("Enhanced S3 processor with ARM64 and monitoring"),
vironment: &map[string]*string{
AMODB_TABLE_NAME": props.DynamoDBTable.TableName(),
AME":      props.S3Bucket.BucketName(),
VIRONMENT":         jsii.String(props.Environment),
g: awslambda.Tracing_ACTIVE,
   props.VPC,
ets: &awsec2.SubnetSelection{
ets: privateSubnets,
ueueEnabled: jsii.Bool(true),
         jsii.Number(2),
})

// Configure S3 trigger
props.S3Bucket.AddEventNotification(
tType_OBJECT_CREATED,
otifications.NewLambdaDestination(lambdaFunction),
)

// Create comprehensive CloudWatch alarms
alarms := createLambdaAlarms(construct, lambdaFunction, props)
createDynamoDBAlarms(construct, props.DynamoDBTable, props.AlertingTopic, props.Environment)

return &ComputeConstruct{
struct:      construct,
ction: lambdaFunction,
       alarms,
}
}

func createLambdaAlarms(construct constructs.Construct, fn awslambda.IFunction, props *ComputeConstructProps) []awscloudwatch.IAlarm {
var alarms []awscloudwatch.IAlarm

// Error Rate Alarm
errorRateAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorRateAlarm"), &awscloudwatch.AlarmProps{
ame:        jsii.String("proj-lambda-error-rate-" + props.Environment),
: jsii.String("Lambda function error rate exceeded 1%"),
ewMathExpression(&awscloudwatch.MathExpressionProps{
: jsii.String("(errors / invocations) * 100"),
gMetrics: &map[string]awscloudwatch.IMetric{
.MetricErrors(&awscloudwatch.MetricOptions{
   awscdk.Duration_Minutes(jsii.Number(5)),
vocations": fn.MetricInvocations(&awscloudwatch.MetricOptions{
   awscdk.Duration_Minutes(jsii.Number(5)),
_Minutes(jsii.Number(5)),
       jsii.Number(1),
Periods: jsii.Number(2),
gData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
})
errorRateAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

// Duration Alarm
durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
ame:        jsii.String("proj-lambda-duration-" + props.Environment),
: jsii.String("Lambda function duration exceeded 30 seconds"),
.MetricDuration(&awscloudwatch.MetricOptions{
   awscdk.Duration_Minutes(jsii.Number(5)),
       jsii.Number(30000),
Periods: jsii.Number(2),
gData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
})
durationAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

// Throttling Alarm
throttleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaThrottleAlarm"), &awscloudwatch.AlarmProps{
ame:        jsii.String("proj-lambda-throttles-" + props.Environment),
: jsii.String("Lambda function is being throttled"),
.MetricThrottles(&awscloudwatch.MetricOptions{
   awscdk.Duration_Minutes(jsii.Number(5)),
       jsii.Number(1),
Periods: jsii.Number(1),
gData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
})
throttleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

alarms = append(alarms, errorRateAlarm, durationAlarm, throttleAlarm)
return alarms
}

func createDynamoDBAlarms(construct constructs.Construct, table awsdynamodb.ITable, topic awssns.ITopic, env string) {
// DynamoDB Read Throttling Alarm
readThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBReadThrottleAlarm"), &awscloudwatch.AlarmProps{
ame:        jsii.String("proj-dynamodb-read-throttles-" + env),
: jsii.String("DynamoDB table experiencing read throttling"),
ewMetric(&awscloudwatch.MetricProps{
amespace:  jsii.String("AWS/DynamoDB"),
ame: jsii.String("ReadThrottles"),
sionsMap: &map[string]*string{
ame": table.TableName(),
   awscdk.Duration_Minutes(jsii.Number(5)),
       jsii.Number(1),
Periods: jsii.Number(2),
gData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
})
readThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))

// DynamoDB Write Throttling Alarm
writeThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBWriteThrottleAlarm"), &awscloudwatch.AlarmProps{
ame:        jsii.String("proj-dynamodb-write-throttles-" + env),
: jsii.String("DynamoDB table experiencing write throttling"),
ewMetric(&awscloudwatch.MetricProps{
amespace:  jsii.String("AWS/DynamoDB"),
ame: jsii.String("WriteThrottles"),
sionsMap: &map[string]*string{
ame": table.TableName(),
   awscdk.Duration_Minutes(jsii.Number(5)),
       jsii.Number(1),
Periods: jsii.Number(2),
gData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
})
writeThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))
}

// resolveLambdaCode dynamically finds the Lambda source code or falls back to inline code
func resolveLambdaCode() awslambda.Code {
possiblePaths := []string{
path := range possiblePaths {
err := os.Stat(path); err == nil {
dlerPath := filepath.Join(path, "handler.py")
err := os.Stat(handlerPath); err == nil {
 awslambda.Code_FromAsset(jsii.String(path), nil)
 awslambda.Code_FromInline(jsii.String(getInlineLambdaCode()))
}

func getInlineLambdaCode() string {
return `import json
import boto3
import logging
import os
from datetime import datetime
from urllib.parse import unquote_plus

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event, context):
    logger.info(f"Processing S3 event: {json.dumps(event)}")
    
    try:
        table = dynamodb.Table(TABLE_NAME)
        processed_records = 0
        
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket_name = record['s3']['bucket']['name']
                object_key = unquote_plus(record['s3']['object']['key'])
                
                item = {
                    'pk': f"s3#{bucket_name}#{object_key}",
                    'sk': f"event#{record['eventTime']}",
                    'object_key': object_key,
                    'bucket_name': bucket_name,
                    'event_name': record['eventName'],
                    'processed_at': datetime.utcnow().isoformat(),
                    'environment': ENVIRONMENT
                }
                
                table.put_item(Item=item)
                processed_records += 1
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {processed_records} records',
                'environment': ENVIRONMENT
            })
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise
`
}
```

### 8. Lambda Handler (`lib/lambda/handler.py`)

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
    """
    
    logger.info(f"Processing S3 event: {json.dumps(event)}")
    
    try:
        table = dynamodb.Table(TABLE_NAME)
        processed_records = 0
        
        # Process each record in the event
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                processed_records += process_s3_record(record, table, context)
        
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


def process_s3_record(record: Dict[str, Any], table, context) -> int:
    """Process a single S3 record and store metadata in DynamoDB."""
    
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
            'pk': f"OBJECT#{bucket_name}",
            'sk': f"KEY#{object_key}#{event_time}",
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
            'lambda_request_id': getattr(context, 'aws_request_id', 'unknown')
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored metadata for {object_key}")
        return 1
        
    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        raise
```

## Deployment Commands

```bash
# Synthesize CDK template
npx cdk synth --context environmentSuffix=dev

# Deploy to AWS
npx cdk deploy TapStackdev --context environmentSuffix=dev

# Run unit tests
go test ./tests/unit/... -v -cover

# Run integration tests
go test -tags=integration ./tests/integration/... -v

# Lint code
./scripts/lint.sh
```

## Security Features

- Encryption at rest for all data (S3, DynamoDB)
- Encryption in transit with SSL/TLS enforcement
- Network security with VPC and private subnets
- IAM least privilege access policies
- Audit logging with CloudTrail
- Comprehensive monitoring with CloudWatch alarms

## Resource Naming Convention

All resources follow the pattern: proj-{resource}-{environment}

Examples:
- proj-s3-dev (S3 bucket for dev environment)
- proj-dynamodb-prod (DynamoDB table for prod environment)
- proj-lambda-staging (Lambda function for staging environment)

## AWS Services Used

- AWS CloudTrail
- Amazon S3 
- Amazon DynamoDB
- AWS Lambda
- Amazon VPC
- Amazon EC2
- AWS IAM
- Amazon SNS
- Amazon CloudWatch
- Amazon CloudWatch Logs
