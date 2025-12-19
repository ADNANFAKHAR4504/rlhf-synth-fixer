> tap@0.1.0 localstack:cfn:deploy
> ./scripts/localstack-cloudformation-deploy.sh

🚀 Starting CloudFormation Deploy to LocalStack...
✅ LocalStack is running
🧹 Cleaning LocalStack resources...
✅ LocalStack state reset
📁 Working directory: /home/iqbala/projects/iac-test-automations/lib
✅ CloudFormation template found: TapStack.yml
 uploading template to LocalStack S3...
make_bucket: cf-templates-us-east-1
upload: ./TapStack.yml to s3://cf-templates-us-east-1/TapStack.yml
✅ Template uploaded to LocalStack S3
🔧 Deploying CloudFormation stack:
  • Stack Name: tap-stack-localstack
  • Environment: dev
  • Template: TapStack.yml
📦 Creating new stack...
⏳ Waiting for stack creation to complete...
📦 Creating CloudFormation stack...
✅ Stack creation initiated
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/44bea8ff-66b3-4062-8008-dc0567d0a921
📊 Monitoring deployment progress...
🔄 [12:58:10] AlarmTopic (AWS::SNS::Topic): CREATE_IN_PROGRESS
✅ [12:58:11] AlarmTopic (AWS::SNS::Topic): CREATE_COMPLETE
🔄 [12:58:11] ApiAccessLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [12:58:11] ApiAccessLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [12:58:11] ApiVpc (AWS::EC2::VPC): CREATE_IN_PROGRESS
📈 Progress: 4/5 complete, 1 in progress
✅ [12:58:15] ApiVpc (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [12:58:15] ApiSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [12:58:15] ApiSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [12:58:15] DynamoTable (AWS::DynamoDB::Table): CREATE_IN_PROGRESS
✅ [12:58:22] DynamoTable (AWS::DynamoDB::Table): CREATE_COMPLETE
🔄 [12:58:22] DdbReadScalableTarget (AWS::ApplicationAutoScaling::ScalableTarget): CREATE_IN_PROGRESS
✅ [12:58:22] DdbReadScalableTarget (AWS::ApplicationAutoScaling::ScalableTarget): CREATE_COMPLETE
🔄 [12:58:22] DdbReadScalingPolicy (AWS::ApplicationAutoScaling::ScalingPolicy): CREATE_IN_PROGRESS
✅ [12:58:22] DdbReadScalingPolicy (AWS::ApplicationAutoScaling::ScalingPolicy): CREATE_COMPLETE
🔄 [12:58:22] DdbWriteScalableTarget (AWS::ApplicationAutoScaling::ScalableTarget): CREATE_IN_PROGRESS
✅ [12:58:22] DdbWriteScalableTarget (AWS::ApplicationAutoScaling::ScalableTarget): CREATE_COMPLETE
🔄 [12:58:22] DdbWriteScalingPolicy (AWS::ApplicationAutoScaling::ScalingPolicy): CREATE_IN_PROGRESS
✅ [12:58:22] DdbWriteScalingPolicy (AWS::ApplicationAutoScaling::ScalingPolicy): CREATE_COMPLETE
🔄 [12:58:22] LambdaLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [12:58:22] LambdaLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [12:58:22] LogBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [12:58:22] LogBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [12:58:22] LogBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [12:58:22] LogBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [12:58:22] SecretsManagerSecret (AWS::SecretsManager::Secret): CREATE_IN_PROGRESS
✅ [12:58:22] SecretsManagerSecret (AWS::SecretsManager::Secret): CREATE_COMPLETE
📈 Progress: 13/13 complete, 0 in progress
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 25s
📊 Final Resource Summary:
----------------------------------------------------------------------------------------------
|                                     ListStackResources                                     |
+-------------------------+-----------------------------------------------+------------------+
|  AlarmTopic             |  AWS::SNS::Topic                              |  CREATE_COMPLETE |
|  ApiAccessLogGroup      |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  ApiVpc                 |  AWS::EC2::VPC                                |  CREATE_COMPLETE |
|  ApiSecurityGroup       |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  DynamoTable            |  AWS::DynamoDB::Table                         |  CREATE_COMPLETE |
|  DdbReadScalableTarget  |  AWS::ApplicationAutoScaling::ScalableTarget  |  CREATE_COMPLETE |
|  DdbReadScalingPolicy   |  AWS::ApplicationAutoScaling::ScalingPolicy   |  CREATE_COMPLETE |
|  DdbWriteScalableTarget |  AWS::ApplicationAutoScaling::ScalableTarget  |  CREATE_COMPLETE |
|  DdbWriteScalingPolicy  |  AWS::ApplicationAutoScaling::ScalingPolicy   |  CREATE_COMPLETE |
|  LambdaLogGroup         |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  LogBucket              |  AWS::S3::Bucket                              |  CREATE_COMPLETE |
|  LogBucketPolicy        |  AWS::S3::BucketPolicy                        |  CREATE_COMPLETE |
|  SecretsManagerSecret   |  AWS::SecretsManager::Secret                  |  CREATE_COMPLETE |
+-------------------------+-----------------------------------------------+------------------+
✅ Successfully deployed resources: 13
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • AlarmTopicArn: arn:aws:sns:us-east-1:000000000000:topic-3932dac1
  • DynamoTableArn: arn:aws:dynamodb:us-east-1:000000000000:table/tap-stack-localstack-DynamoTable-de33b83b
  • DynamoTableName: tap-stack-localstack-DynamoTable-de33b83b
  • EnvironmentSuffixOut: dev-us
  • LambdaLogGroupArn: arn:aws:logs:us-east-1:000000000000:log-group:tap-stack-localstack-LambdaLogGroup-2ed53077:*
  • LogBucketArn: arn:aws:s3:::tap-stack-localstack-logbucket-5cb1a884
  • LogBucketName: tap-stack-localstack-logbucket-5cb1a884
  • Project: tapstack
  • SecretArn: arn:aws:secretsmanager:us-east-1:000000000000:secret:tap-stack-localstack-SecretsManagerSecret-4f751c17-NeGbHj
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 13 deployed
  • Duration: 25s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!