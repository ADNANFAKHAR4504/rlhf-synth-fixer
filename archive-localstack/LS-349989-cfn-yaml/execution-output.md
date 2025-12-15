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
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/b4589c80-d1ef-45ba-b6d5-de15908acb87
📊 Monitoring deployment progress...
🔄 [15:10:06] SecureEnvLogsBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvLogsBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvLogBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvLogBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvVPC (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvVPC (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvWebSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvWebSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvPublicSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvPublicSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvPublicSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvPublicSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvALB (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_IN_PROGRESS       
✅ [15:10:06] SecureEnvALB (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_COMPLETE
    └─ Resource type AWS::ElasticLoadBalancingV2::LoadBalancer is not supported but was deployed as a fallback
🔄 [15:10:06] SecureEnvDataBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [15:10:06] SecureEnvDataBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [15:10:06] SecureEnvEC2Role (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvEC2Role (AWS::IAM::Role): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvEC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_IN_PROGRESS        
✅ [15:10:07] SecureEnvEC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvPrivateSubnet1 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvPrivateSubnet1 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvPrivateSubnet2 (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvPrivateSubnet2 (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvDBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvDBSubnetGroup (AWS::RDS::DBSubnetGroup): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBSubnetGroup is not supported but was deployed as a fallback     
🔄 [15:10:07] SecureEnvDBSecret (AWS::SecretsManager::Secret): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvDBSecret (AWS::SecretsManager::Secret): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvDatabaseSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS       
✅ [15:10:07] SecureEnvDatabaseSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvDatabase (AWS::RDS::DBInstance): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvDatabase (AWS::RDS::DBInstance): CREATE_COMPLETE
    └─ Resource type AWS::RDS::DBInstance is not supported but was deployed as a fallback        
🔄 [15:10:07] SecureEnvWebServer (AWS::EC2::Instance): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvWebServer (AWS::EC2::Instance): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_COMPLETE   
    └─ Resource type AWS::ElasticLoadBalancingV2::TargetGroup is not supported but was deployed as a fallback
🔄 [15:10:07] SecureEnvALBListener (AWS::ElasticLoadBalancingV2::Listener): CREATE_IN_PROGRESS   
✅ [15:10:07] SecureEnvALBListener (AWS::ElasticLoadBalancingV2::Listener): CREATE_COMPLETE      
    └─ Resource type AWS::ElasticLoadBalancingV2::Listener is not supported but was deployed as a fallback
🔄 [15:10:07] SecureEnvAlarmTopic (AWS::SNS::Topic): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvAlarmTopic (AWS::SNS::Topic): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvALBResponseTimeAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvALBResponseTimeAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvALBTargetResponseTimeAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS   
✅ [15:10:07] SecureEnvALBTargetResponseTimeAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE      
🔄 [15:10:07] SecureEnvALBUnhealthyHostsAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS       
✅ [15:10:07] SecureEnvALBUnhealthyHostsAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvALBUnhealthyTargetsAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS     
✅ [15:10:07] SecureEnvALBUnhealthyTargetsAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE        
🔄 [15:10:07] SecureEnvInternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvInternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvAttachGateway (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS        
✅ [15:10:07] SecureEnvAttachGateway (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvEC2CPUAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvEC2CPUAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvGuardDutyDetector (AWS::GuardDuty::Detector): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvGuardDutyDetector (AWS::GuardDuty::Detector): CREATE_COMPLETE
    └─ Resource type AWS::GuardDuty::Detector is not supported but was deployed as a fallback    
🔄 [15:10:07] SecureEnvLambdaRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [15:10:07] SecureEnvLambdaRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [15:10:07] SecureEnvLambdaFunction (AWS::Lambda::Function): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvLambdaFunction (AWS::Lambda::Function): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPrivateRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPrivateRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPrivateSubnetRouteTableAssociation1 (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPrivateSubnetRouteTableAssociation1 (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPrivateSubnetRouteTableAssociation2 (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPrivateSubnetRouteTableAssociation2 (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPublicRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPublicRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPublicRoute (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPublicRoute (AWS::EC2::Route): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPublicSubnetRouteTableAssociation1 (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPublicSubnetRouteTableAssociation1 (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvPublicSubnetRouteTableAssociation2 (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvPublicSubnetRouteTableAssociation2 (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvRDSConnectionsAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvRDSConnectionsAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvVPCFlowLogsRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvVPCFlowLogsRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvVPCFlowLogsGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvVPCFlowLogsGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [15:10:12] SecureEnvVPCFlowLogs (AWS::EC2::FlowLog): CREATE_IN_PROGRESS
✅ [15:10:12] SecureEnvVPCFlowLogs (AWS::EC2::FlowLog): CREATE_COMPLETE
    └─ Resource type AWS::EC2::FlowLog is not supported but was deployed as a fallback
📈 Progress: 41/41 complete, 0 in progress
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 28s
📊 Final Resource Summary:
------------------------------------------------------------------------------------------------------------------
|                                               ListStackResources                               
                |
+-----------------------------------------------+---------------------------------------------+------------------+
|  SecureEnvLogsBucket                          |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  SecureEnvLogBucketPolicy                     |  AWS::S3::BucketPolicy                      |  CREATE_COMPLETE |
|  SecureEnvVPC                                 |  AWS::EC2::VPC                              |  CREATE_COMPLETE |
|  SecureEnvWebSecurityGroup                    |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  SecureEnvPublicSubnet1                       |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  SecureEnvPublicSubnet2                       |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  SecureEnvALB                                 |  AWS::ElasticLoadBalancingV2::LoadBalancer  |  CREATE_COMPLETE |
|  SecureEnvDataBucket                          |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  SecureEnvEC2Role                             |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  SecureEnvEC2InstanceProfile                  |  AWS::IAM::InstanceProfile                  |  CREATE_COMPLETE |
|  SecureEnvPrivateSubnet1                      |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  SecureEnvPrivateSubnet2                      |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  SecureEnvDBSubnetGroup                       |  AWS::RDS::DBSubnetGroup                    |  CREATE_COMPLETE |
|  SecureEnvDBSecret                            |  AWS::SecretsManager::Secret                |  CREATE_COMPLETE |
|  SecureEnvDatabaseSecurityGroup               |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  SecureEnvDatabase                            |  AWS::RDS::DBInstance                       |  CREATE_COMPLETE |
|  SecureEnvWebServer                           |  AWS::EC2::Instance                         |  CREATE_COMPLETE |
|  SecureEnvTargetGroup                         |  AWS::ElasticLoadBalancingV2::TargetGroup   |  CREATE_COMPLETE |
|  SecureEnvALBListener                         |  AWS::ElasticLoadBalancingV2::Listener      |  CREATE_COMPLETE |
|  SecureEnvAlarmTopic                          |  AWS::SNS::Topic                            |  CREATE_COMPLETE |
|  SecureEnvALBResponseTimeAlarm                |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  SecureEnvALBTargetResponseTimeAlarm          |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  SecureEnvALBUnhealthyHostsAlarm              |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  SecureEnvALBUnhealthyTargetsAlarm            |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  SecureEnvInternetGateway                     |  AWS::EC2::InternetGateway                  |  CREATE_COMPLETE |
|  SecureEnvAttachGateway                       |  AWS::EC2::VPCGatewayAttachment             |  CREATE_COMPLETE |
|  SecureEnvEC2CPUAlarm                         |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  SecureEnvGuardDutyDetector                   |  AWS::GuardDuty::Detector                   |  CREATE_COMPLETE |
|  SecureEnvLambdaRole                          |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  SecureEnvLambdaFunction                      |  AWS::Lambda::Function                      |  CREATE_COMPLETE |
|  SecureEnvPrivateRouteTable                   |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  SecureEnvPrivateSubnetRouteTableAssociation1 |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  SecureEnvPrivateSubnetRouteTableAssociation2 |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  SecureEnvPublicRouteTable                    |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  SecureEnvPublicRoute                         |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  SecureEnvPublicSubnetRouteTableAssociation1  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  SecureEnvPublicSubnetRouteTableAssociation2  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  SecureEnvRDSConnectionsAlarm                 |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  SecureEnvVPCFlowLogsRole                     |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  SecureEnvVPCFlowLogsGroup                    |  AWS::Logs::LogGroup                        |  CREATE_COMPLETE |
|  SecureEnvVPCFlowLogs                         |  AWS::EC2::FlowLog                          |  CREATE_COMPLETE |
+-----------------------------------------------+---------------------------------------------+------------------+
✅ Successfully deployed resources: 41
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • DatabaseSecretArn: arn:aws:secretsmanager:us-east-1:000000000000:secret:SecureEnvDBMasterPassword-tapstack-b4589c80-jTMWJm
  • LoadBalancerDNS: unknown
  • PrivateSubnet1Id: subnet-9307155863915d506
  • PrivateSubnet2Id: subnet-03ba97190b26c215a
  • PublicSubnet1Id: subnet-b1c49412fa037ee56
  • PublicSubnet2Id: subnet-22ff989e5b335846e
  • S3BucketName: secureenv-000000000000-us-east-1-data-bucket-tapstack-b4589c80
  • VPCId: vpc-3e0523b500a21f2ab
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 41 deployed
  • Duration: 28s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!