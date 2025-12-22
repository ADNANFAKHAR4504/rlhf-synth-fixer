> tap@0.1.0 localstack:cfn:cleanup
> ./scripts/localstack-cloudformation-cleanup.sh

🧹 Starting CloudFormation LocalStack Cleanup...
📁 Working directory: /c/Users/mikia/Desktop/IAC/iac-test-automations/lib
📊 Removing output files...
✅ Output files removed
🗑️  Destroying CloudFormation infrastructure...
Do you want to delete the CloudFormation stack? (y/N): y
⚠️  Stack does not exist, nothing to delete
✅ Cleanup completed successfully!
💡 All temporary files and resources have been cleaned up
PS C:\Users\mikia\Desktop\IAC\iac-test-automations> npm run localstack:cfn:deploy 

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
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/3557f7f6-cde8-4599-8696-c5b9e336f3fa
📊 Monitoring deployment progress...
🔄 [12:46:15] AlarmNotificationTopic (AWS::SNS::Topic): CREATE_IN_PROGRESS
✅ [12:46:15] AlarmNotificationTopic (AWS::SNS::Topic): CREATE_COMPLETE
🔄 [12:46:15] InternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS
✅ [12:46:15] InternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE
🔄 [12:46:15] VPC (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [12:46:15] VPC (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [12:46:15] AttachGateway (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS
✅ [12:46:15] AttachGateway (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE
🔄 [12:46:15] CloudWatchLogsKMSKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [12:46:15] CloudWatchLogsKMSKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [12:46:15] DBParameterGroup (AWS::RDS::DBParameterGroup): CREATE_IN_PROGRESS
✅ [12:46:15] DBParameterGroup (AWS::RDS::DBParameterGroup): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBParameterGroup is not supported but was deployed as a fallback  
🔄 [12:46:15] SecretsManagerKMSKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [12:46:15] SecretsManagerKMSKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [12:46:15] DBSecret (AWS::SecretsManager::Secret): CREATE_IN_PROGRESS
✅ [12:46:15] DBSecret (AWS::SecretsManager::Secret): CREATE_COMPLETE
🔄 [12:46:15] PrivateSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [12:46:15] PrivateSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [12:46:15] PrivateSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [12:46:15] PrivateSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [12:46:15] DBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_IN_PROGRESS
✅ [12:46:15] DBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBSubnetGroup is not supported but was deployed as a fallback     
🔄 [12:46:15] EC2SecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [12:46:15] EC2SecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [12:46:15] RDSSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [12:46:15] RDSSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [12:46:15] RDSPostgreSQLInstance (AWS::RDS::DBInstance): CREATE_IN_PROGRESS
✅ [12:46:15] RDSPostgreSQLInstance (AWS::RDS::DBInstance): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBInstance is not supported but was deployed as a fallback        
🔄 [12:46:15] DBSecretAttachment (AWS::SecretsManager::SecretTargetAttachment): CREATE_IN_PROGRESS
✅ [12:46:15] DBSecretAttachment (AWS::SecretsManager::SecretTargetAttachment): CREATE_COMPLETE  
🔄 [12:46:15] S3KMSKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [12:46:15] S3KMSKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [12:46:15] S3LoggingBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [12:46:15] S3LoggingBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [12:46:15] S3Bucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [12:46:15] S3Bucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [12:46:15] EC2Role (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [12:46:15] EC2Role (AWS::IAM::Role): CREATE_COMPLETE
🔄 [12:46:15] EC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_IN_PROGRESS
✅ [12:46:15] EC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_COMPLETE
🔄 [12:46:15] EC2LaunchTemplate (AWS::EC2::LaunchTemplate): CREATE_IN_PROGRESS
✅ [12:46:15] EC2LaunchTemplate (AWS::EC2::LaunchTemplate): CREATE_COMPLETE
    └─ Resource type AWS::EC2::LaunchTemplate is not supported but was deployed as a fallback    
🔄 [12:46:15] EC2Instance1 (AWS::EC2::Instance): CREATE_IN_PROGRESS
✅ [12:46:15] EC2Instance1 (AWS::EC2::Instance): CREATE_COMPLETE
🔄 [12:46:15] EC2Instance1CPUAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:15] EC2Instance1CPUAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:15] EC2Instance1MemoryAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:15] EC2Instance1MemoryAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:15] EC2Instance2 (AWS::EC2::Instance): CREATE_IN_PROGRESS
✅ [12:46:16] EC2Instance2 (AWS::EC2::Instance): CREATE_COMPLETE
🔄 [12:46:16] EC2Instance2CPUAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:16] EC2Instance2CPUAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:16] EC2Instance2MemoryAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:16] EC2Instance2MemoryAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:16] PrivateRouteTable1 (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [12:46:16] PrivateRouteTable1 (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [12:46:16] PrivateRouteTable2 (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [12:46:16] PrivateRouteTable2 (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [12:46:16] PrivateSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [12:46:16] PrivateSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [12:46:16] PrivateSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [12:46:16] PrivateSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [12:46:16] PublicRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [12:46:16] PublicRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [12:46:16] PublicRoute (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [12:46:16] PublicRoute (AWS::EC2::Route): CREATE_COMPLETE
🔄 [12:46:16] PublicSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [12:46:16] PublicSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [12:46:16] PublicSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [12:46:16] PublicSubnet1RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [12:46:16] PublicSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [12:46:16] PublicSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [12:46:16] PublicSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [12:46:16] PublicSubnet2RouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [12:46:16] RDSHighCPUAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:16] RDSHighCPUAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:16] RDSHighConnectionsAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:16] RDSHighConnectionsAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:16] RDSLowStorageAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [12:46:16] RDSLowStorageAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [12:46:16] S3KMSKeyAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [12:46:16] S3KMSKeyAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [12:46:16] S3LoggingBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [12:46:16] S3LoggingBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [12:46:16] VPCFlowLogRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [12:46:16] VPCFlowLogRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [12:46:16] VPCFlowLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [12:46:16] VPCFlowLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [12:46:16] VPCFlowLog (AWS::EC2::FlowLog): CREATE_IN_PROGRESS
✅ [12:46:16] VPCFlowLog (AWS::EC2::FlowLog): CREATE_COMPLETE
    └─ Resource type AWS::EC2::FlowLog is not supported but was deployed as a fallback
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 13s
📊 Final Resource Summary:
-----------------------------------------------------------------------------------------------------------
|                                           ListStackResources                                   
         |
+--------------------------------------+-----------------------------------------------+------------------+
|  AlarmNotificationTopic              |  AWS::SNS::Topic                              |  CREATE_COMPLETE |
|  InternetGateway                     |  AWS::EC2::InternetGateway                    |  CREATE_COMPLETE |
|  VPC                                 |  AWS::EC2::VPC                                |  CREATE_COMPLETE |
|  AttachGateway                       |  AWS::EC2::VPCGatewayAttachment               |  CREATE_COMPLETE |
|  CloudWatchLogsKMSKey                |  AWS::KMS::Key                                |  CREATE_COMPLETE |
|  DBParameterGroup                    |  AWS::RDS::DBParameterGroup                   |  CREATE_COMPLETE |
|  SecretsManagerKMSKey                |  AWS::KMS::Key                                |  CREATE_COMPLETE |
|  DBSecret                            |  AWS::SecretsManager::Secret                  |  CREATE_COMPLETE |
|  PrivateSubnet1                      |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  PrivateSubnet2                      |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  DBSubnetGroup                       |  AWS::RDS::DBSubnetGroup                      |  CREATE_COMPLETE |
|  EC2SecurityGroup                    |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  RDSSecurityGroup                    |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  RDSPostgreSQLInstance               |  AWS::RDS::DBInstance                         |  CREATE_COMPLETE |
|  DBSecretAttachment                  |  AWS::SecretsManager::SecretTargetAttachment  |  CREATE_COMPLETE |
|  S3KMSKey                            |  AWS::KMS::Key                                |  CREATE_COMPLETE |
|  S3LoggingBucket                     |  AWS::S3::Bucket                              |  CREATE_COMPLETE |
|  S3Bucket                            |  AWS::S3::Bucket                              |  CREATE_COMPLETE |
|  EC2Role                             |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  EC2InstanceProfile                  |  AWS::IAM::InstanceProfile                    |  CREATE_COMPLETE |
|  EC2LaunchTemplate                   |  AWS::EC2::LaunchTemplate                     |  CREATE_COMPLETE |
|  EC2Instance1                        |  AWS::EC2::Instance                           |  CREATE_COMPLETE |
|  EC2Instance1CPUAlarm                |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  EC2Instance1MemoryAlarm             |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  EC2Instance2                        |  AWS::EC2::Instance                           |  CREATE_COMPLETE |
|  EC2Instance2CPUAlarm                |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  EC2Instance2MemoryAlarm             |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  PrivateRouteTable1                  |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  PrivateRouteTable2                  |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  PrivateSubnet1RouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  PrivateSubnet2RouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  PublicRouteTable                    |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  PublicRoute                         |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  PublicSubnet1                       |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  PublicSubnet1RouteTableAssociation  |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  PublicSubnet2                       |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  PublicSubnet2RouteTableAssociation  |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  RDSHighCPUAlarm                     |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  RDSHighConnectionsAlarm             |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  RDSLowStorageAlarm                  |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  S3KMSKeyAlias                       |  AWS::KMS::Alias                              |  CREATE_COMPLETE |
|  S3LoggingBucketPolicy               |  AWS::S3::BucketPolicy                        |  CREATE_COMPLETE |
|  VPCFlowLogRole                      |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  VPCFlowLogGroup                     |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  VPCFlowLog                          |  AWS::EC2::FlowLog                            |  CREATE_COMPLETE |
+--------------------------------------+-----------------------------------------------+------------------+
✅ Successfully deployed resources: 45
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • AlarmTopicArn: arn:aws:sns:us-east-1:000000000000:topic-d7008762
  • DBSecretArn: arn:aws:secretsmanager:us-east-1:000000000000:secret:tap-stack-localstack-DBSecret-21174610-JXrYaL
  • EC2Instance1Id: i-22faf2ea8ea9df9d4
  • EC2Instance1PrivateIP: 10.80.44.223
  • EC2Instance2Id: i-88e2e68d101ddd9af
  • EC2Instance2PrivateIP: 10.21.7.209
  • EC2RoleArn: arn:aws:iam::000000000000:role/tap-stack-localstack-EC2Role-bfa9aca5
  • EC2SecurityGroupId: sg-5af76d4afb0b26fef
  • PrivateSubnet1Id: subnet-81160bc4b936c9267
  • PrivateSubnet2Id: subnet-8cc844682978d6bdc
  • PrivateSubnetIds: subnet-81160bc4b936c9267,subnet-8cc844682978d6bdc
  • ProjectTags: Project=ModernApp, Environment=dev, Owner=DevOps-Team
  • PublicSubnet1Id: subnet-f2c4361e644616715
  • PublicSubnet2Id: subnet-c6ac23242b8473398
  • PublicSubnetIds: subnet-f2c4361e644616715,subnet-c6ac23242b8473398
  • RDSEndpoint: unknown
  • RDSPort: unknown
  • RDSSecurityGroupId: sg-3507bc49d554e8ff7
  • S3BucketArn: arn:aws:s3:::tap-stack-localstack-s3bucket-560ae385
  • S3BucketName: tap-stack-localstack-s3bucket-560ae385
  • S3LoggingBucketName: tap-stack-localstack-s3loggingbucket-4e8e7ccf
  • StackName: tap-stack-localstack
  • StackRegion: us-east-1
  • VPCCidr: 10.0.0.0/16
  • VPCFlowLogId: unknown
  • VPCId: vpc-423e1b0a6fe7f79b8
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 45 deployed
  • Duration: 13s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!