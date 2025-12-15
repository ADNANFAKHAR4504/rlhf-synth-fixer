> tap@0.1.0 localstack:cfn:deploy
> ./scripts/localstack-cloudformation-deploy.sh

🚀 Starting CloudFormation Deploy to LocalStack...
✅ LocalStack is running
🧹 Cleaning LocalStack resources...
✅ LocalStack state reset
📁 Working directory: /c/Users/mikia/Desktop/IAC/iac-test-automations/lib
✅ CloudFormation template found: TapStack.yml
 uploading template to LocalStack S3...
make_bucket: cf-templates-us-east-1
upload: .\TapStack.yml to s3://cf-templates-us-east-1/TapStack.yml
✅ Template uploaded to LocalStack S3
🔧 Deploying CloudFormation stack:
  • Stack Name: tap-stack-localstack
  • Environment: dev
  • Template: TapStack.yml
📦 Creating new stack...
⏳ Waiting for stack creation to complete...
📦 Creating CloudFormation stack...
✅ Stack creation initiated
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/cb7095af-1a1e-4fd3-9f4c-d4c275438a4c
📊 Monitoring deployment progress...
🔄 [10:33:26] VPC (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [10:33:26] VPC (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [10:33:26] ApplicationSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [10:33:26] ApplicationSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [10:33:26] KMSKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [10:33:26] KMSKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [10:33:26] ArtifactsBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [10:33:26] ArtifactsBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [10:33:26] DatabaseSecret (AWS::SecretsManager::Secret): CREATE_IN_PROGRESS
✅ [10:33:26] DatabaseSecret (AWS::SecretsManager::Secret): CREATE_COMPLETE
🔄 [10:33:26] EC2InstanceRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [10:33:26] EC2InstanceRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [10:33:26] EC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_IN_PROGRESS
✅ [10:33:26] EC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_COMPLETE
🔄 [10:33:26] ElasticIP (AWS::EC2::EIP): CREATE_IN_PROGRESS
✅ [10:33:26] ElasticIP (AWS::EC2::EIP): CREATE_COMPLETE
    └─ Resource type AWS::EC2::EIP is not supported but was deployed as a fallback
🔄 [10:33:26] LogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [10:33:26] LogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [10:33:26] LaunchTemplate (AWS::EC2::LaunchTemplate): CREATE_IN_PROGRESS
✅ [10:33:26] LaunchTemplate (AWS::EC2::LaunchTemplate): CREATE_COMPLETE
    └─ Resource type AWS::EC2::LaunchTemplate is not supported but was deployed as a fallback
🔄 [10:33:26] PublicSubnet (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [10:33:26] PublicSubnet (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [10:33:26] AutoScalingGroup (AWS::AutoScaling::AutoScalingGroup): CREATE_IN_PROGRESS
✅ [10:33:26] AutoScalingGroup (AWS::AutoScaling::AutoScalingGroup): CREATE_COMPLETE
    └─ Resource type AWS::AutoScaling::AutoScalingGroup is not supported but was deployed as a fallback
🔄 [10:33:26] SNSTopic (AWS::SNS::Topic): CREATE_IN_PROGRESS
✅ [10:33:26] SNSTopic (AWS::SNS::Topic): CREATE_COMPLETE
🔄 [10:33:26] CPUAlarmHigh (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [10:33:26] CPUAlarmHigh (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [10:33:26] CPUAlarmLow (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [10:33:26] CPUAlarmLow (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [10:33:26] PrivateSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [10:33:26] PrivateSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [10:33:26] PrivateSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [10:33:26] PrivateSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [10:33:26] DBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_IN_PROGRESS
✅ [10:33:26] DBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBSubnetGroup is not supported but was deployed as a fallback
🔄 [10:33:26] DatabaseSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [10:33:26] DatabaseSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [10:33:26] InternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS
✅ [10:33:26] InternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE
🔄 [10:33:26] InternetGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS
✅ [10:33:26] InternetGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE
🔄 [10:33:26] PublicRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [10:33:26] PublicRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [10:33:26] DefaultPublicRoute (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [10:33:26] DefaultPublicRoute (AWS::EC2::Route): CREATE_COMPLETE
🔄 [10:33:26] KMSKeyAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [10:33:26] KMSKeyAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [10:33:26] MonitoringDashboard (AWS::CloudWatch::Dashboard): CREATE_IN_PROGRESS
✅ [10:33:26] MonitoringDashboard (AWS::CloudWatch::Dashboard): CREATE_COMPLETE
    └─ Resource type AWS::CloudWatch::Dashboard is not supported but was deployed as a fallback       
🔄 [10:33:26] PrivateRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [10:33:26] PrivateRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [10:33:26] PrivateSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [10:33:26] PrivateSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [10:33:26] PrivateSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [10:33:26] PrivateSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [10:33:26] PublicSubnetRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [10:33:26] PublicSubnetRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [10:33:26] RDSLogGroupError (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [10:33:26] RDSLogGroupError (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [10:33:26] RDSLogGroupSlowQuery (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [10:33:26] RDSLogGroupSlowQuery (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [10:33:26] RDSLogGroupGeneral (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [10:33:26] RDSLogGroupGeneral (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [10:33:26] RDSDatabase (AWS::RDS::DBInstance): CREATE_IN_PROGRESS
✅ [10:33:26] RDSDatabase (AWS::RDS::DBInstance): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBInstance is not supported but was deployed as a fallback
🔄 [10:33:26] SNSTopicPolicy (AWS::SNS::TopicPolicy): CREATE_IN_PROGRESS
✅ [10:33:26] SNSTopicPolicy (AWS::SNS::TopicPolicy): CREATE_COMPLETE
🔄 [10:33:26] SecretRDSInstanceAttachment (AWS::SecretsManager::SecretTargetAttachment): CREATE_IN_PROGRESS
✅ [10:33:26] SecretRDSInstanceAttachment (AWS::SecretsManager::SecretTargetAttachment): CREATE_COMPLETE
🔄 [10:33:26] StackNotificationLambdaRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [10:33:26] StackNotificationLambdaRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [10:33:26] StackNotificationFunction (AWS::Lambda::Function): CREATE_IN_PROGRESS
✅ [10:33:31] StackNotificationFunction (AWS::Lambda::Function): CREATE_COMPLETE
🔄 [10:33:31] StackNotificationCustomResource (Custom::StackNotification): CREATE_IN_PROGRESS
✅ [10:33:31] StackNotificationCustomResource (Custom::StackNotification): CREATE_COMPLETE
    └─ Resource type Custom::StackNotification is not supported but was deployed as a fallback        
🔄 [10:33:31] TargetTrackingScalingPolicy (AWS::AutoScaling::ScalingPolicy): CREATE_IN_PROGRESS       
✅ [10:33:31] TargetTrackingScalingPolicy (AWS::AutoScaling::ScalingPolicy): CREATE_COMPLETE
    └─ Resource type AWS::AutoScaling::ScalingPolicy is not supported but was deployed as a fallback  
📈 Progress: 39/39 complete, 0 in progress
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 28s
📊 Final Resource Summary:
-----------------------------------------------------------------------------------------------------------
|                                           ListStackResources                                        
    |
+--------------------------------------+-----------------------------------------------+------------------+
|  VPC                                 |  AWS::EC2::VPC                                |  CREATE_COMPLETE |
|  ApplicationSecurityGroup            |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  KMSKey                              |  AWS::KMS::Key                                |  CREATE_COMPLETE |
|  ArtifactsBucket                     |  AWS::S3::Bucket                              |  CREATE_COMPLETE |
|  DatabaseSecret                      |  AWS::SecretsManager::Secret                  |  CREATE_COMPLETE |
|  EC2InstanceRole                     |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  EC2InstanceProfile                  |  AWS::IAM::InstanceProfile                    |  CREATE_COMPLETE |
|  ElasticIP                           |  AWS::EC2::EIP                                |  CREATE_COMPLETE |
|  LogGroup                            |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  LaunchTemplate                      |  AWS::EC2::LaunchTemplate                     |  CREATE_COMPLETE |
|  PublicSubnet                        |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  AutoScalingGroup                    |  AWS::AutoScaling::AutoScalingGroup           |  CREATE_COMPLETE |
|  SNSTopic                            |  AWS::SNS::Topic                              |  CREATE_COMPLETE |
|  CPUAlarmHigh                        |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  CPUAlarmLow                         |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  PrivateSubnet1                      |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  PrivateSubnet2                      |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  DBSubnetGroup                       |  AWS::RDS::DBSubnetGroup                      |  CREATE_COMPLETE |
|  DatabaseSecurityGroup               |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  InternetGateway                     |  AWS::EC2::InternetGateway                    |  CREATE_COMPLETE |
|  InternetGatewayAttachment           |  AWS::EC2::VPCGatewayAttachment               |  CREATE_COMPLETE |
|  PublicRouteTable                    |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  DefaultPublicRoute                  |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  KMSKeyAlias                         |  AWS::KMS::Alias                              |  CREATE_COMPLETE |
|  MonitoringDashboard                 |  AWS::CloudWatch::Dashboard                   |  CREATE_COMPLETE |
|  PrivateRouteTable                   |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  PrivateSubnet1RouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  PrivateSubnet2RouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  PublicSubnetRouteTableAssociation   |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  RDSLogGroupError                    |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  RDSLogGroupSlowQuery                |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  RDSLogGroupGeneral                  |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  RDSDatabase                         |  AWS::RDS::DBInstance                         |  CREATE_COMPLETE |
|  SNSTopicPolicy                      |  AWS::SNS::TopicPolicy                        |  CREATE_COMPLETE |
|  SecretRDSInstanceAttachment         |  AWS::SecretsManager::SecretTargetAttachment  |  CREATE_COMPLETE |
|  StackNotificationLambdaRole         |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  StackNotificationFunction           |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  StackNotificationCustomResource     |  Custom::StackNotification                    |  CREATE_COMPLETE |
|  TargetTrackingScalingPolicy         |  AWS::AutoScaling::ScalingPolicy              |  CREATE_COMPLETE |
+--------------------------------------+-----------------------------------------------+------------------+
✅ Successfully deployed resources: 39
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • AccountId: 000000000000
  • ApplicationSecurityGroupId: sg-a2f906afa6c9053fa
  • ApplicationURL: http://unknown
  • AutoScalingGroupName: unknown
  • CloudWatchLogGroup: /aws/ec2/Production
  • DatabaseSecretArn: arn:aws:secretsmanager:us-east-1:000000000000:secret:Production-database-credentials-PBcNpN
  • DatabaseSecurityGroupId: sg-a013aa07f72e7c9c2
  • EC2InstanceRoleArn: arn:aws:iam::000000000000:role/Production-EC2-Instance-Role
  • ElasticIPAddress: unknown
  • EnvironmentName: Production
  • KMSKeyArn: arn:aws:kms:us-east-1:000000000000:key/dce2171a-5dc5-49ac-a865-8ec3454d2c00
  • KMSKeyId: dce2171a-5dc5-49ac-a865-8ec3454d2c00
  • LaunchTemplateId: unknown
  • LaunchTemplateVersion: unknown
  • MonitoringDashboardURL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Production-Infrastructure-Dashboard
  • PrivateSubnet1Id: subnet-25c4e23266b7504ef
  • PrivateSubnet2Id: subnet-dcf1ce94b5c040c61
  • PublicSubnetId: subnet-079fd9d562f529899
  • RDSDatabaseEndpoint: unknown
  • RDSDatabasePort: unknown
  • Region: us-east-1
  • S3BucketArn: arn:aws:s3:::tap-stack-localstack-artifactsbucket-e54d28f3
  • S3BucketName: tap-stack-localstack-artifactsbucket-e54d28f3
  • SNSTopicArn: arn:aws:sns:us-east-1:000000000000:Production-Notifications
  • StackName: tap-stack-localstack
  • StackNotificationFunctionArn: arn:aws:lambda:us-east-1:000000000000:function:Production-Stack-Notifier
  • VPCCidr: 10.0.0.0/16
  • VPCId: vpc-f7af06f965142fb19
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 39 deployed
  • Duration: 28s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!