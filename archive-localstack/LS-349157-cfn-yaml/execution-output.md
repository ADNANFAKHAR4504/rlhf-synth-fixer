> tap@0.1.0 localstack:cfn:plan
> ./scripts/localstack-cloudformation-plan.sh

🚀 Starting CloudFormation Plan for LocalStack...
✅ LocalStack is running
📁 Working directory: /home/iqbala/projects/iac-test-automations/lib
✅ CloudFormation template found: TapStack.yml
 uploading template to LocalStack S3...
make_bucket: cf-templates-us-east-1
upload: ./TapStack.yml to s3://cf-templates-us-east-1/TapStack.yml
✅ Template uploaded to LocalStack S3
🔍 Validating CloudFormation template...
✅ CloudFormation template is valid
📋 Checking if stack exists...
📋 Stack does not exist, will create new stack on deploy
✅ Template is valid and ready for deployment
💡 To deploy this stack, run: ./scripts/localstack-cloudformation-deploy.sh
🎉 CloudFormation Plan completed successfully!
root@DESKTOP-69FG5E3:/home/iqbala/projects/iac-test-automations# npm run localstack:cfn:deploy

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
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/8f4dc9c8-7cae-4d4a-b84f-d3e3fc0819ab
📊 Monitoring deployment progress...
🔄 [09:58:07] Vpc (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [09:58:13] Vpc (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [09:58:13] AlbSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [09:58:13] AlbSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [09:58:13] PublicSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [09:58:13] PublicSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [09:58:13] PublicSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [09:58:13] PublicSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [09:58:13] Alb (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_IN_PROGRESS
✅ [09:58:14] Alb (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_COMPLETE
🔄 [09:58:14] Alb5xxAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [09:58:14] Alb5xxAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [09:58:14] AlbTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_IN_PROGRESS
✅ [09:58:14] AlbTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_COMPLETE
🔄 [09:58:14] AlbListenerHttp (AWS::ElasticLoadBalancingV2::Listener): CREATE_IN_PROGRESS
✅ [09:58:14] AlbListenerHttp (AWS::ElasticLoadBalancingV2::Listener): CREATE_COMPLETE
🔄 [09:58:14] AppLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
📈 Progress: 43/43 complete, 0 in progress
✅ [09:58:15] AppLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [09:58:15] AppSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [09:58:15] AppSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [09:58:15] NatEipA (AWS::EC2::EIP): CREATE_IN_PROGRESS
✅ [09:58:15] NatEipA (AWS::EC2::EIP): CREATE_COMPLETE
🔄 [09:58:15] NatGatewayA (AWS::EC2::NatGateway): CREATE_IN_PROGRESS
✅ [09:58:15] NatGatewayA (AWS::EC2::NatGateway): CREATE_COMPLETE
🔄 [09:58:15] InstanceRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [09:58:16] InstanceRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [09:58:16] InstanceProfile (AWS::IAM::InstanceProfile): CREATE_IN_PROGRESS
✅ [09:58:16] InstanceProfile (AWS::IAM::InstanceProfile): CREATE_COMPLETE
🔄 [09:58:16] LaunchConfiguration (AWS::AutoScaling::LaunchConfiguration): CREATE_IN_PROGRESS
✅ [09:58:17] LaunchConfiguration (AWS::AutoScaling::LaunchConfiguration): CREATE_COMPLETE
🔄 [09:58:17] PrivateSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [09:58:17] PrivateSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [09:58:17] PrivateSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [09:58:17] PrivateSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [09:58:17] AutoScalingGroup (AWS::AutoScaling::AutoScalingGroup): CREATE_IN_PROGRESS
✅ [09:58:18] AutoScalingGroup (AWS::AutoScaling::AutoScalingGroup): CREATE_COMPLETE
🔄 [09:58:18] CpuHighAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [09:58:18] CpuHighAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [09:58:18] CpuTargetTrackingPolicy (AWS::AutoScaling::ScalingPolicy): CREATE_IN_PROGRESS
✅ [09:58:18] CpuTargetTrackingPolicy (AWS::AutoScaling::ScalingPolicy): CREATE_COMPLETE
    └─ Resource type AWS::AutoScaling::ScalingPolicy is not supported but was deployed as a fallback
🔄 [09:58:18] FlowLogsLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [09:58:18] FlowLogsLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [09:58:18] InternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS
✅ [09:58:18] InternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE
🔄 [09:58:18] LogsBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [09:58:18] LogsBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [09:58:18] LogsBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [09:58:18] LogsBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [09:58:18] PrivateRouteTableA (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [09:58:18] PrivateRouteTableA (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [09:58:18] PrivateRouteA (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [09:58:18] PrivateRouteA (AWS::EC2::Route): CREATE_COMPLETE
🔄 [09:58:18] PrivateRouteTableB (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [09:58:18] PrivateRouteTableB (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [09:58:18] PrivateRouteB (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [09:58:18] PrivateRouteB (AWS::EC2::Route): CREATE_COMPLETE
🔄 [09:58:18] PrivateSubnetRouteTableAssociationA (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [09:58:18] PrivateSubnetRouteTableAssociationA (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [09:58:18] PrivateSubnetRouteTableAssociationB (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [09:58:18] PrivateSubnetRouteTableAssociationB (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [09:58:18] VpcGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS
✅ [09:58:18] VpcGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE
🔄 [09:58:18] PublicRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [09:58:18] PublicRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [09:58:18] PublicRoute (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [09:58:18] PublicRoute (AWS::EC2::Route): CREATE_COMPLETE
🔄 [09:58:18] PublicSubnetRouteTableAssociationA (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [09:58:19] PublicSubnetRouteTableAssociationA (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [09:58:19] PublicSubnetRouteTableAssociationB (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [09:58:19] PublicSubnetRouteTableAssociationB (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [09:58:19] SsmParamAppPort (AWS::SSM::Parameter): CREATE_IN_PROGRESS
✅ [09:58:20] SsmParamAppPort (AWS::SSM::Parameter): CREATE_COMPLETE
🔄 [09:58:20] SsmParamEnvironment (AWS::SSM::Parameter): CREATE_IN_PROGRESS
✅ [09:58:20] SsmParamEnvironment (AWS::SSM::Parameter): CREATE_COMPLETE
🔄 [09:58:20] SsmParamLogLevel (AWS::SSM::Parameter): CREATE_IN_PROGRESS
✅ [09:58:20] SsmParamLogLevel (AWS::SSM::Parameter): CREATE_COMPLETE
🔄 [09:58:20] SsmParameterNamespace (AWS::SSM::Parameter): CREATE_IN_PROGRESS
✅ [09:58:20] SsmParameterNamespace (AWS::SSM::Parameter): CREATE_COMPLETE
🔄 [09:58:20] SystemLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [09:58:20] SystemLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [09:58:20] UnhealthyHostsAlarm (AWS::CloudWatch::Alarm): CREATE_IN_PROGRESS
✅ [09:58:20] UnhealthyHostsAlarm (AWS::CloudWatch::Alarm): CREATE_COMPLETE
🔄 [09:58:20] VpcFlowLogsRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [09:58:20] VpcFlowLogsRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [09:58:20] VpcFlowLogs (AWS::EC2::FlowLog): CREATE_IN_PROGRESS
✅ [09:58:20] VpcFlowLogs (AWS::EC2::FlowLog): CREATE_COMPLETE
    └─ Resource type AWS::EC2::FlowLog is not supported but was deployed as a fallback
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 29s
📊 Final Resource Summary:
---------------------------------------------------------------------------------------------------------
|                                          ListStackResources                                           |
+--------------------------------------+---------------------------------------------+------------------+
|  Vpc                                 |  AWS::EC2::VPC                              |  CREATE_COMPLETE |
|  AlbSecurityGroup                    |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  PublicSubnetA                       |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  PublicSubnetB                       |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  Alb                                 |  AWS::ElasticLoadBalancingV2::LoadBalancer  |  CREATE_COMPLETE |
|  Alb5xxAlarm                         |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  AlbTargetGroup                      |  AWS::ElasticLoadBalancingV2::TargetGroup   |  CREATE_COMPLETE |
|  AlbListenerHttp                     |  AWS::ElasticLoadBalancingV2::Listener      |  CREATE_COMPLETE |
|  AppLogGroup                         |  AWS::Logs::LogGroup                        |  CREATE_COMPLETE |
|  AppSecurityGroup                    |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  NatEipA                             |  AWS::EC2::EIP                              |  CREATE_COMPLETE |
|  NatGatewayA                         |  AWS::EC2::NatGateway                       |  CREATE_COMPLETE |
|  InstanceRole                        |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  InstanceProfile                     |  AWS::IAM::InstanceProfile                  |  CREATE_COMPLETE |
|  LaunchConfiguration                 |  AWS::AutoScaling::LaunchConfiguration      |  CREATE_COMPLETE |
|  PrivateSubnetA                      |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  PrivateSubnetB                      |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  AutoScalingGroup                    |  AWS::AutoScaling::AutoScalingGroup         |  CREATE_COMPLETE |
|  CpuHighAlarm                        |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  CpuTargetTrackingPolicy             |  AWS::AutoScaling::ScalingPolicy            |  CREATE_COMPLETE |
|  FlowLogsLogGroup                    |  AWS::Logs::LogGroup                        |  CREATE_COMPLETE |
|  InternetGateway                     |  AWS::EC2::InternetGateway                  |  CREATE_COMPLETE |
|  LogsBucket                          |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  LogsBucketPolicy                    |  AWS::S3::BucketPolicy                      |  CREATE_COMPLETE |
|  PrivateRouteTableA                  |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PrivateRouteA                       |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PrivateRouteTableB                  |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PrivateRouteB                       |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PrivateSubnetRouteTableAssociationA |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PrivateSubnetRouteTableAssociationB |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  VpcGatewayAttachment                |  AWS::EC2::VPCGatewayAttachment             |  CREATE_COMPLETE |
|  PublicRouteTable                    |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PublicRoute                         |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PublicSubnetRouteTableAssociationA  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PublicSubnetRouteTableAssociationB  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  SsmParamAppPort                     |  AWS::SSM::Parameter                        |  CREATE_COMPLETE |
|  SsmParamEnvironment                 |  AWS::SSM::Parameter                        |  CREATE_COMPLETE |
|  SsmParamLogLevel                    |  AWS::SSM::Parameter                        |  CREATE_COMPLETE |
|  SsmParameterNamespace               |  AWS::SSM::Parameter                        |  CREATE_COMPLETE |
|  SystemLogGroup                      |  AWS::Logs::LogGroup                        |  CREATE_COMPLETE |
|  UnhealthyHostsAlarm                 |  AWS::CloudWatch::Alarm                     |  CREATE_COMPLETE |
|  VpcFlowLogsRole                     |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  VpcFlowLogs                         |  AWS::EC2::FlowLog                          |  CREATE_COMPLETE |
+--------------------------------------+---------------------------------------------+------------------+
✅ Successfully deployed resources: 43
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • AlbArn: arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/lb-e9557f1b/8840dd4fc8631248
  • AlbDnsName: lb-e9557f1b.elb.localhost.localstack.cloud
  • AlbSecurityGroupId: sg-234a5cefa7867f112
  • AppSecurityGroupId: sg-bd61fcc9b73eecf50
  • AsgName: AutoScalingGroup-2efbac2d
  • InstanceProfileName: tap-stack-localstack-InstanceProfile-817783ee
  • InstanceRoleArn: arn:aws:iam::000000000000:role/tap-stack-localstack-InstanceRole-d8e74f02
  • LaunchTemplateId: LaunchConfiguration-e312401b
  • LogsBucketName: tap-stack-localstack-logsbucket-477bed06
  • ParameterNamespace: /tapstack/prod-us/tap-stack-localstack
  • PrivateSubnetIds: subnet-fe69b65b334f738e2,subnet-dd0c8cfb823bff99d
  • PublicSubnetIds: subnet-8187f50da21179a1a,subnet-f084ec6170cca3c1a
  • TargetGroupArn: arn:aws:elasticloadbalancing:us-east-1:000000000000:targetgroup/tg-07588e8e/9ad9c2ec29ce7d55
  • VpcId: vpc-3eac7942dac64dbd1
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 43 deployed
  • Duration: 29s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!