(venv) prakhar@Prakhars-MacBook-Air iac-test-automations % npm run localstack:cfn:deploy                                                                                       

> tap@0.1.0 localstack:cfn:deploy
> ./scripts/localstack-cloudformation-deploy.sh

🚀 Starting CloudFormation Deploy to LocalStack...
✅ LocalStack is running
🧹 Cleaning LocalStack resources...
  🗑️  Deleting CloudFormation stack: tap-stack-localstack-prakhar
✅ LocalStack state reset
📁 Working directory: /Users/prakhar/Desktop/Code/Turing/iac-test-automations/lib
✅ CloudFormation template found: TapStack.yml
 uploading template to LocalStack S3...
make_bucket: cf-templates-us-east-1
upload: ./TapStack.yml to s3://cf-templates-us-east-1/TapStack.yml
✅ Template uploaded to LocalStack S3
🔧 Deploying CloudFormation stack:
  • Stack Name: tap-stack-localstack-abcd
  • Environment: iac-101911959
  • Template: TapStack.yml
📦 Creating new stack...
⏳ Waiting for stack creation to complete...
📦 Creating CloudFormation stack...
✅ Stack creation initiated
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack-abcd/7104d985-57b9-4fef-9c68-2840ae6d0f13
📊 Monitoring deployment progress...
🔄 [11:09:18] TapDataKmsKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [11:09:18] TapDataKmsKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [11:09:18] TapDataKmsAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [11:09:18] TapDataKmsAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [11:09:18] TapTransactionMetadataTable (AWS::DynamoDB::Table): CREATE_IN_PROGRESS
✅ [11:09:18] TapTransactionMetadataTable (AWS::DynamoDB::Table): CREATE_COMPLETE
🔄 [11:09:18] TapOutputBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [11:09:18] TapOutputBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [11:09:18] TapInputBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [11:09:18] TapInputBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [11:09:18] TapLambdaExecutionRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [11:09:18] TapLambdaExecutionRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [11:09:18] TapVpc (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [11:09:18] TapVpc (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [11:09:18] TapLambdaSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [11:09:18] TapLambdaSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [11:09:18] TapPrivateSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [11:09:18] TapPrivateSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [11:09:18] TapPrivateSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [11:09:18] TapPrivateSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [11:09:18] TapPrivateSubnetC (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [11:09:18] TapPrivateSubnetC (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [11:09:18] TapDataProcessorFunction (AWS::Lambda::Function): CREATE_IN_PROGRESS
📈 Progress: 11/12 complete, 1 in progress
✅ [11:09:24] TapDataProcessorFunction (AWS::Lambda::Function): CREATE_COMPLETE
🔄 [11:09:24] TapDataProcessorLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [11:09:24] TapDataProcessorLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [11:09:24] TapPrivateRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [11:09:24] TapPrivateRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [11:09:24] TapDynamoDBGatewayEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [11:09:24] TapDynamoDBGatewayEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [11:09:24] TapInputBucketLambdaPermission (AWS::Lambda::Permission): CREATE_IN_PROGRESS
✅ [11:09:24] TapInputBucketLambdaPermission (AWS::Lambda::Permission): CREATE_COMPLETE
🔄 [11:09:24] TapLambdaErrorAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [11:09:24] TapLambdaErrorAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [11:09:24] TapPrivateSubnetARouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [11:09:24] TapPrivateSubnetARouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [11:09:24] TapPrivateSubnetBRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [11:09:24] TapPrivateSubnetBRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [11:09:24] TapPrivateSubnetCRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [11:09:24] TapPrivateSubnetCRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [11:09:24] TapS3GatewayEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [11:09:24] TapS3GatewayEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [11:09:24] TapS3NotificationConfigRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [11:09:24] TapS3NotificationConfigRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [11:09:24] TapS3NotificationConfigFunction (AWS::Lambda::Function): CREATE_IN_PROGRESS
📈 Progress: 22/23 complete, 1 in progress
✅ [11:09:29] TapS3NotificationConfigFunction (AWS::Lambda::Function): CREATE_COMPLETE
🔄 [11:09:29] TapS3NotificationConfig (Custom::S3BucketNotification): CREATE_IN_PROGRESS
📈 Progress: 23/24 complete, 1 in progress
📈 Progress: 23/24 complete, 1 in progress
✅ [11:09:38] TapS3NotificationConfig (Custom::S3BucketNotification): CREATE_COMPLETE
🔄 [11:09:38] TapUnauthorizedAccessAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [11:09:38] TapUnauthorizedAccessAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [11:09:38] TapUnauthorizedAccessMetricFilter (AWS::Logs::MetricFilter): CREATE_IN_PROGRESS
✅ [11:09:38] TapUnauthorizedAccessMetricFilter (AWS::Logs::MetricFilter): CREATE_COMPLETE
    └─ Resource type AWS::Logs::MetricFilter is not supported but was deployed as a fallback
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 25s
📊 Final Resource Summary:
--------------------------------------------------------------------------------------------------------
|                                          ListStackResources                                          |
+-----------------------------------------+-----------------------------------------+------------------+
|  TapDataKmsKey                          |  AWS::KMS::Key                          |  CREATE_COMPLETE |
|  TapDataKmsAlias                        |  AWS::KMS::Alias                        |  CREATE_COMPLETE |
|  TapTransactionMetadataTable            |  AWS::DynamoDB::Table                   |  CREATE_COMPLETE |
|  TapOutputBucket                        |  AWS::S3::Bucket                        |  CREATE_COMPLETE |
|  TapInputBucket                         |  AWS::S3::Bucket                        |  CREATE_COMPLETE |
|  TapLambdaExecutionRole                 |  AWS::IAM::Role                         |  CREATE_COMPLETE |
|  TapVpc                                 |  AWS::EC2::VPC                          |  CREATE_COMPLETE |
|  TapLambdaSecurityGroup                 |  AWS::EC2::SecurityGroup                |  CREATE_COMPLETE |
|  TapPrivateSubnetA                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  TapPrivateSubnetB                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  TapPrivateSubnetC                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  TapDataProcessorFunction               |  AWS::Lambda::Function                  |  CREATE_COMPLETE |
|  TapDataProcessorLogGroup               |  AWS::Logs::LogGroup                    |  CREATE_COMPLETE |
|  TapPrivateRouteTable                   |  AWS::EC2::RouteTable                   |  CREATE_COMPLETE |
|  TapDynamoDBGatewayEndpoint             |  AWS::EC2::VPCEndpoint                  |  CREATE_COMPLETE |
|  TapInputBucketLambdaPermission         |  AWS::Lambda::Permission                |  CREATE_COMPLETE |
|  TapLambdaErrorAlarm                    |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  TapPrivateSubnetARouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  TapPrivateSubnetBRouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  TapPrivateSubnetCRouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  TapS3GatewayEndpoint                   |  AWS::EC2::VPCEndpoint                  |  CREATE_COMPLETE |
|  TapS3NotificationConfigRole            |  AWS::IAM::Role                         |  CREATE_COMPLETE |
|  TapS3NotificationConfigFunction        |  AWS::Lambda::Function                  |  CREATE_COMPLETE |
|  TapS3NotificationConfig                |  Custom::S3BucketNotification           |  CREATE_COMPLETE |
|  TapUnauthorizedAccessAlarm             |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  TapUnauthorizedAccessMetricFilter      |  AWS::Logs::MetricFilter                |  CREATE_COMPLETE |
:...skipping...
--------------------------------------------------------------------------------------------------------
|                                          ListStackResources                                          |
+-----------------------------------------+-----------------------------------------+------------------+
|  TapDataKmsKey                          |  AWS::KMS::Key                          |  CREATE_COMPLETE |
|  TapDataKmsAlias                        |  AWS::KMS::Alias                        |  CREATE_COMPLETE |
|  TapTransactionMetadataTable            |  AWS::DynamoDB::Table                   |  CREATE_COMPLETE |
|  TapOutputBucket                        |  AWS::S3::Bucket                        |  CREATE_COMPLETE |
|  TapInputBucket                         |  AWS::S3::Bucket                        |  CREATE_COMPLETE |
|  TapLambdaExecutionRole                 |  AWS::IAM::Role                         |  CREATE_COMPLETE |
|  TapVpc                                 |  AWS::EC2::VPC                          |  CREATE_COMPLETE |
|  TapLambdaSecurityGroup                 |  AWS::EC2::SecurityGroup                |  CREATE_COMPLETE |
|  TapPrivateSubnetA                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  TapPrivateSubnetB                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  TapPrivateSubnetC                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  TapDataProcessorFunction               |  AWS::Lambda::Function                  |  CREATE_COMPLETE |
|  TapDataProcessorLogGroup               |  AWS::Logs::LogGroup                    |  CREATE_COMPLETE |
|  TapPrivateRouteTable                   |  AWS::EC2::RouteTable                   |  CREATE_COMPLETE |
|  TapDynamoDBGatewayEndpoint             |  AWS::EC2::VPCEndpoint                  |  CREATE_COMPLETE |
|  TapInputBucketLambdaPermission         |  AWS::Lambda::Permission                |  CREATE_COMPLETE |
|  TapLambdaErrorAlarm                    |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  TapPrivateSubnetARouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  TapPrivateSubnetBRouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  TapPrivateSubnetCRouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  TapS3GatewayEndpoint                   |  AWS::EC2::VPCEndpoint                  |  CREATE_COMPLETE |
|  TapS3NotificationConfigRole            |  AWS::IAM::Role                         |  CREATE_COMPLETE |
|  TapS3NotificationConfigFunction        |  AWS::Lambda::Function                  |  CREATE_COMPLETE |
|  TapS3NotificationConfig                |  Custom::S3BucketNotification           |  CREATE_COMPLETE |
|  TapUnauthorizedAccessAlarm             |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  TapUnauthorizedAccessMetricFilter      |  AWS::Logs::MetricFilter                |  CREATE_COMPLETE |
+-----------------------------------------+-----------------------------------------+------------------+

✅ Successfully deployed resources: 26
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • DataKmsKeyArn: 4b0e67aa-6fdf-4e2b-b4ba-27ea87d16204
  • DataProcessorFunctionName: tap-stack-localstack-abcd-data-processor
  • InputBucketName: tap-stack-localstack-abcd-tapinputbucket-ecafeef1
  • OutputBucketName: tap-stack-localstack-abcd-tapoutputbucket-c31d15f7
  • TransactionMetadataTableName: tap-transaction-metadata
  • VpcId: vpc-d0926a69c70b849c4
🎯 Deployment Summary:
  • Stack: tap-stack-localstack-abcd
  • Status: CREATE_COMPLETE
  • Resources: 26 deployed
  • Duration: 25s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!