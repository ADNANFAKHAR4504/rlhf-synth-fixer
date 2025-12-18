# CloudFormation LocalStack Deployment Execution Output

**Execution Date:** 2025-12-18 13:10:19

---

🚀 Starting CloudFormation Deploy to LocalStack...
✅ LocalStack is running
🧹 Cleaning LocalStack resources...
✅ LocalStack state reset
📁 Working directory: /home/chris/turing_work/new_synth/IAC-synth-54729183/iac-test-automations/lib
✅ CloudFormation template found: TapStack.json
 uploading template to LocalStack S3...
make_bucket: cf-templates-us-east-1
Completed 36.3 KiB/36.3 KiB (957.4 KiB/s) with 1 file(s) remainingupload: ./TapStack.json to s3://cf-templates-us-east-1/TapStack.json
✅ Template uploaded to LocalStack S3
🔧 Deploying CloudFormation stack:
  • Stack Name: tap-stack-localstack
  • Environment: dev
  • Template: TapStack.json
📦 Creating new stack...
⏳ Waiting for stack creation to complete...
📦 Creating CloudFormation stack...
✅ Stack creation initiated
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/a7a097fa-facf-4777-a728-35d9826f931b
📊 Monitoring deployment progress...
🔄 [12:08:47] WeatherAnomalyTopic (AWS::SNS::Topic): CREATE_IN_PROGRESS
✅ [12:08:47] WeatherAnomalyTopic (AWS::SNS::Topic): CREATE_COMPLETE
🔄 [12:08:47] APIGateway4xxAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:08:47] APIGateway4xxAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:08:47] WeatherReadingsTable (AWS::DynamoDB::Table): CREATE_IN_PROGRESS
✅ [12:08:50] WeatherReadingsTable (AWS::DynamoDB::Table): CREATE_COMPLETE
🔄 [12:08:50] DataAggregationLambdaRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [12:08:50] DataAggregationLambdaRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [12:08:50] DataAggregationFunction (AWS::Lambda::Function): CREATE_IN_PROGRESS
✅ [12:08:50] DataAggregationFunction (AWS::Lambda::Function): CREATE_COMPLETE
🔄 [12:08:50] WeatherAPI (AWS::ApiGateway::RestApi): CREATE_IN_PROGRESS
✅ [12:08:50] WeatherAPI (AWS::ApiGateway::RestApi): CREATE_COMPLETE
🔄 [12:08:50] SensorDataResource (AWS::ApiGateway::Resource): CREATE_IN_PROGRESS
✅ [12:08:50] SensorDataResource (AWS::ApiGateway::Resource): CREATE_COMPLETE
🔄 [12:08:50] SensorDataMethod (AWS::ApiGateway::Method): CREATE_IN_PROGRESS
✅ [12:08:50] SensorDataMethod (AWS::ApiGateway::Method): CREATE_COMPLETE
🔄 [12:08:50] WeatherAPIDeployment (AWS::ApiGateway::Deployment): CREATE_IN_PROGRESS
📈 Progress: 17/18 complete, 0 in progress
✅ [12:08:50] WeatherAPIDeployment (AWS::ApiGateway::Deployment): CREATE_COMPLETE
🔄 [12:08:50] APIUsagePlan (AWS::ApiGateway::UsagePlan): CREATE_IN_PROGRESS
✅ [12:08:51] APIUsagePlan (AWS::ApiGateway::UsagePlan): CREATE_COMPLETE
🔄 [12:08:51] SchedulerRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [12:08:51] SchedulerRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [12:08:51] DailyReportSchedule (AWS::Scheduler::Schedule): CREATE_IN_PROGRESS
✅ [12:08:51] DailyReportSchedule (AWS::Scheduler::Schedule): CREATE_COMPLETE
🔄 [12:08:51] DynamoDBAutoScalingRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [12:08:51] DynamoDBAutoScalingRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [12:08:51] DynamoDBThrottleAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:08:51] DynamoDBThrottleAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:08:51] FailedEventsBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [12:08:51] FailedEventsBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [12:08:51] HourlyAggregationSchedule (AWS::Scheduler::Schedule): CREATE_IN_PROGRESS
✅ [12:08:51] HourlyAggregationSchedule (AWS::Scheduler::Schedule): CREATE_COMPLETE
🔄 [12:08:51] LambdaErrorAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:08:51] LambdaErrorAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:08:51] LambdaFailureDestination (AWS::Lambda::EventInvokeConfig): CREATE_IN_PROGRESS
❌ [12:08:51] LambdaFailureDestination (AWS::Lambda::EventInvokeConfig): CREATE_FAILED
    └─ Resource provider operation failed: An error occurred (InvalidParameterValueException) when calling the PutFunctionEventInvokeConfig operation: The provided destination config DestinationConfig(onSuccess=null, onFailure=OnFailure(destination=arn:aws:s3:::weather-failed-events-dev-000000000000)) is invalid.
❌ Stack deployment failed with status: CREATE_FAILED
📋 Failure Summary:
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                                                                                                                                                 DescribeStackEvents                                                                                                                                                                                                |
+-----------------------------+---------------------------+---------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|  2025-12-18T12:08:51.824449Z|  tap-stack-localstack     |  AWS::CloudFormation::Stack     |  None                                                                                                                                                                                                                                                                                                                  |
|  2025-12-18T12:08:51.823893Z|  tap-stack-localstack     |  AWS::CloudFormation::Stack     |  None                                                                                                                                                                                                                                                                                                                  |
|  2025-12-18T12:08:51.823669Z|  LambdaFailureDestination |  AWS::Lambda::EventInvokeConfig |  Resource provider operation failed: An error occurred (InvalidParameterValueException) when calling the PutFunctionEventInvokeConfig operation: The provided destination config DestinationConfig(onSuccess=null, onFailure=OnFailure(destination=arn:aws:s3:::weather-failed-events-dev-000000000000)) is invalid.   |
+-----------------------------+---------------------------+---------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
