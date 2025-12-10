
> tap@0.1.0 localstack:cfn:deploy
> ./scripts/localstack-cloudformation-deploy.sh

[0;32m🚀 Starting CloudFormation Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[1;33m🧹 Cleaning LocalStack resources...[0m
[0;32m✅ LocalStack state reset[0m
[1;33m📁 Working directory: /Users/chandangupta/Desktop/localstack-task/iac-test-automations/lib[0m
[0;32m✅ CloudFormation template found: TapStack.json[0m
[0m uploading template to LocalStack S3...[0m
make_bucket: cf-templates-us-east-1
Completed 39.8 KiB/39.8 KiB (1.0 MiB/s) with 1 file(s) remainingupload: ./TapStack.json to s3://cf-templates-us-east-1/TapStack.json
[0;32m✅ Template uploaded to LocalStack S3[0m
[0;36m🔧 Deploying CloudFormation stack:[0m
[0;34m  • Stack Name: tap-stack-localstack[0m
[0;34m  • Environment: dev[0m
[0;34m  • Template: TapStack.json[0m
[1;33m📦 Creating new stack...[0m
[1;33m⏳ Waiting for stack creation to complete...[0m
[1;33m📦 Creating CloudFormation stack...[0m
[0;32m✅ Stack creation initiated[0m
[0;34m📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/5542cb6d-9a8e-4782-b956-4757d0e9618f[0m
[0;36m📊 Monitoring deployment progress...[0m
[0;34m🔄 [18:52:40] projXAPIGateway4XXErrorAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:40] projXAPIGateway4XXErrorAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:40] projXAPIGateway5XXErrorAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:40] projXAPIGateway5XXErrorAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:40] projXAPIGatewayCloudWatchRole (AWS::IAM::Role): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:40] projXAPIGatewayCloudWatchRole (AWS::IAM::Role): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:40] projXAPIGatewayAccount (AWS::ApiGateway::Account): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXAPIGatewayAccount (AWS::ApiGateway::Account): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXVPC (AWS::EC2::VPC): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXVPC (AWS::EC2::VPC): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXPrivateSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXPrivateSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXPrivateSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXPrivateSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXDBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXDBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXDBSecret (AWS::SecretsManager::Secret): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXDBSecret (AWS::SecretsManager::Secret): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXLambdaSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXLambdaSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXRDSSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:41] projXRDSSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:41] projXRDSInstance (AWS::RDS::DBInstance): CREATE_IN_PROGRESS[0m
[0;36m📈 Progress: 11/12 complete, 1 in progress[0m
[0;36m📈 Progress: 11/12 complete, 1 in progress[0m
[0;32m✅ [18:52:50] projXRDSInstance (AWS::RDS::DBInstance): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:50] projXS3Bucket (AWS::S3::Bucket): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:50] projXS3Bucket (AWS::S3::Bucket): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:50] projXLambdaExecutionRole (AWS::IAM::Role): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:50] projXLambdaExecutionRole (AWS::IAM::Role): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:50] projXLambdaFunction (AWS::Lambda::Function): CREATE_IN_PROGRESS[0m
[0;36m📈 Progress: 14/15 complete, 1 in progress[0m
[0;32m✅ [18:52:56] projXLambdaFunction (AWS::Lambda::Function): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:56] projXAPIGatewayRestAPI (AWS::ApiGateway::RestApi): CREATE_IN_PROGRESS[0m
[0;36m📈 Progress: 15/16 complete, 1 in progress[0m
[0;32m✅ [18:52:58] projXAPIGatewayRestAPI (AWS::ApiGateway::RestApi): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAPIGatewayRequestValidator (AWS::ApiGateway::RequestValidator): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAPIGatewayRequestValidator (AWS::ApiGateway::RequestValidator): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAPIGatewayResource (AWS::ApiGateway::Resource): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAPIGatewayResource (AWS::ApiGateway::Resource): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAPIGatewayMethod (AWS::ApiGateway::Method): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAPIGatewayMethod (AWS::ApiGateway::Method): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAPIGatewayDeployment (AWS::ApiGateway::Deployment): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAPIGatewayDeployment (AWS::ApiGateway::Deployment): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAPIGatewayLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAPIGatewayLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAPIGatewayStage (AWS::ApiGateway::Stage): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAPIGatewayStage (AWS::ApiGateway::Stage): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXInternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXInternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXAttachGateway (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXAttachGateway (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXLambdaDurationAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXLambdaDurationAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXLambdaErrorAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXLambdaErrorAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXLambdaInvokePermission (AWS::Lambda::Permission): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXLambdaInvokePermission (AWS::Lambda::Permission): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXLambdaLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXLambdaLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXNATGatewayEIP (AWS::EC2::EIP): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXNATGatewayEIP (AWS::EC2::EIP): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPublicSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPublicSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXNATGateway (AWS::EC2::NatGateway): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXNATGateway (AWS::EC2::NatGateway): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPrivateRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPrivateRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPrivateRoute (AWS::EC2::Route): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPrivateRoute (AWS::EC2::Route): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPrivateSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPrivateSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPrivateSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPrivateSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPublicRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPublicRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPublicRoute (AWS::EC2::Route): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPublicRoute (AWS::EC2::Route): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPublicSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPublicSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPublicSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPublicSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXPublicSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXPublicSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXRDSCPUAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXRDSCPUAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXRDSStorageAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXRDSStorageAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE[0m
[0;34m🔄 [18:52:58] projXS3BucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS[0m
[0;32m✅ [18:52:58] projXS3BucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE[0m
[0;32m✅ Stack deployment completed successfully![0m
[0;32m⏱️  Total deployment time: 24s[0m
[0;36m📊 Final Resource Summary:[0m
----------------------------------------------------------------------------------------------------------
|                                           ListStackResources                                           |
+-------------------------------------------+-----------------------------------------+------------------+
|  projXAPIGateway4XXErrorAlarm             |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  projXAPIGateway5XXErrorAlarm             |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  projXAPIGatewayCloudWatchRole            |  AWS::IAM::Role                         |  CREATE_COMPLETE |
|  projXAPIGatewayAccount                   |  AWS::ApiGateway::Account               |  CREATE_COMPLETE |
|  projXVPC                                 |  AWS::EC2::VPC                          |  CREATE_COMPLETE |
|  projXPrivateSubnet1                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  projXPrivateSubnet2                      |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  projXDBSubnetGroup                       |  AWS::RDS::DBSubnetGroup                |  CREATE_COMPLETE |
|  projXDBSecret                            |  AWS::SecretsManager::Secret            |  CREATE_COMPLETE |
|  projXLambdaSecurityGroup                 |  AWS::EC2::SecurityGroup                |  CREATE_COMPLETE |
|  projXRDSSecurityGroup                    |  AWS::EC2::SecurityGroup                |  CREATE_COMPLETE |
|  projXRDSInstance                         |  AWS::RDS::DBInstance                   |  CREATE_COMPLETE |
|  projXS3Bucket                            |  AWS::S3::Bucket                        |  CREATE_COMPLETE |
|  projXLambdaExecutionRole                 |  AWS::IAM::Role                         |  CREATE_COMPLETE |
|  projXLambdaFunction                      |  AWS::Lambda::Function                  |  CREATE_COMPLETE |
|  projXAPIGatewayRestAPI                   |  AWS::ApiGateway::RestApi               |  CREATE_COMPLETE |
|  projXAPIGatewayRequestValidator          |  AWS::ApiGateway::RequestValidator      |  CREATE_COMPLETE |
|  projXAPIGatewayResource                  |  AWS::ApiGateway::Resource              |  CREATE_COMPLETE |
|  projXAPIGatewayMethod                    |  AWS::ApiGateway::Method                |  CREATE_COMPLETE |
|  projXAPIGatewayDeployment                |  AWS::ApiGateway::Deployment            |  CREATE_COMPLETE |
|  projXAPIGatewayLogGroup                  |  AWS::Logs::LogGroup                    |  CREATE_COMPLETE |
|  projXAPIGatewayStage                     |  AWS::ApiGateway::Stage                 |  CREATE_COMPLETE |
|  projXInternetGateway                     |  AWS::EC2::InternetGateway              |  CREATE_COMPLETE |
|  projXAttachGateway                       |  AWS::EC2::VPCGatewayAttachment         |  CREATE_COMPLETE |
|  projXLambdaDurationAlarm                 |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  projXLambdaErrorAlarm                    |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  projXLambdaInvokePermission              |  AWS::Lambda::Permission                |  CREATE_COMPLETE |
|  projXLambdaLogGroup                      |  AWS::Logs::LogGroup                    |  CREATE_COMPLETE |
|  projXNATGatewayEIP                       |  AWS::EC2::EIP                          |  CREATE_COMPLETE |
|  projXPublicSubnet1                       |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  projXNATGateway                          |  AWS::EC2::NatGateway                   |  CREATE_COMPLETE |
|  projXPrivateRouteTable                   |  AWS::EC2::RouteTable                   |  CREATE_COMPLETE |
|  projXPrivateRoute                        |  AWS::EC2::Route                        |  CREATE_COMPLETE |
|  projXPrivateSubnet1RouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  projXPrivateSubnet2RouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  projXPublicRouteTable                    |  AWS::EC2::RouteTable                   |  CREATE_COMPLETE |
|  projXPublicRoute                         |  AWS::EC2::Route                        |  CREATE_COMPLETE |
|  projXPublicSubnet1RouteTableAssociation  |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  projXPublicSubnet2                       |  AWS::EC2::Subnet                       |  CREATE_COMPLETE |
|  projXPublicSubnet2RouteTableAssociation  |  AWS::EC2::SubnetRouteTableAssociation  |  CREATE_COMPLETE |
|  projXRDSCPUAlarm                         |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  projXRDSStorageAlarm                     |  AWS::CloudWatch::Alarm                 |  CREATE_COMPLETE |
|  projXS3BucketPolicy                      |  AWS::S3::BucketPolicy                  |  CREATE_COMPLETE |
+-------------------------------------------+-----------------------------------------+------------------+
[0;32m✅ Successfully deployed resources: 43[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json[0m
[0;34m📋 Stack Outputs:[0m
  • APIGatewayId: bfzrxi8vbn
  • APIGatewayURL: https://bfzrxi8vbn.execute-api.amazonaws.com:4566/prod/app
  • DBSecretArn: arn:aws:secretsmanager:us-east-1:000000000000:secret:projX-RDS-Credentials-dev-lOWGHD
  • EnvironmentSuffix: dev
  • LambdaFunctionArn: arn:aws:lambda:us-east-1:000000000000:function:projX-AppFunction-dev
  • LambdaFunctionName: projX-AppFunction-dev
  • NATGatewayEIP: 127.104.189.80-eipalloc-fad93bfd028b2e2e9
  • NATGatewayId: nat-5efc8b8997b87b8b5
  • PrivateSubnet1Id: subnet-864ffc5fbae5257bb
  • PrivateSubnet2Id: subnet-646df39464e575274
  • PublicSubnet1Id: subnet-2db4beacf1af88456
  • PublicSubnet2Id: subnet-6710c38b4076dd95f
  • RDSInstanceEndpoint: localhost.localstack.cloud
  • RDSInstancePort: 4510
  • S3BucketArn: arn:aws:s3:::projx-app-data-000000000000-dev
  • S3BucketName: projx-app-data-000000000000-dev
  • StackName: tap-stack-localstack
  • VPCId: vpc-cb5bcf95a5b7375a0
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: tap-stack-localstack[0m
[0;34m  • Status: CREATE_COMPLETE[0m
[0;34m  • Resources: 43 deployed[0m
[0;34m  • Duration: 24s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 CloudFormation deployment to LocalStack completed successfully![0m
