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
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/bad30392-b8c1-453f-9deb-b6cca73779c9
📊 Monitoring deployment progress...
🔄 [14:54:08] LoggingBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [14:54:08] LoggingBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [14:54:08] LoggingBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [14:54:08] LoggingBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [14:54:08] VPC (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [14:54:08] VPC (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [14:54:08] ALBSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [14:54:08] ALBSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [14:54:08] PublicSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [14:54:08] PublicSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [14:54:08] PublicSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [14:54:08] PublicSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [14:54:08] ALB (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_IN_PROGRESS
✅ [14:54:08] ALB (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_COMPLETE
🔄 [14:54:08] ALBTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_IN_PROGRESS
✅ [14:54:08] ALBTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_COMPLETE
🔄 [14:54:08] ALBListenerHTTP (AWS::ElasticLoadBalancingV2::Listener): CREATE_IN_PROGRESS
✅ [14:54:08] ALBListenerHTTP (AWS::ElasticLoadBalancingV2::Listener): CREATE_COMPLETE
🔄 [14:54:08] AppSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [14:54:08] AppSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [14:54:08] RDSSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [14:54:08] RDSSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [14:54:08] AppToRdsMysqlEgress (AWS::EC2::SecurityGroupEgress): CREATE_IN_PROGRESS
✅ [14:54:08] AppToRdsMysqlEgress (AWS::EC2::SecurityGroupEgress): CREATE_COMPLETE
🔄 [14:54:08] AppToRdsPostgresEgress (AWS::EC2::SecurityGroupEgress): CREATE_IN_PROGRESS
✅ [14:54:08] AppToRdsPostgresEgress (AWS::EC2::SecurityGroupEgress): CREATE_COMPLETE
🔄 [14:54:08] DataEncryptionKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [14:54:08] DataEncryptionKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [14:54:08] ApplicationBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [14:54:08] ApplicationBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [14:54:08] ApplicationBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [14:54:08] ApplicationBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [14:54:08] RDSMasterSecret (AWS::SecretsManager::Secret): CREATE_IN_PROGRESS
✅ [14:54:08] RDSMasterSecret (AWS::SecretsManager::Secret): CREATE_COMPLETE
🔄 [14:54:08] EC2InstanceRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [14:54:09] EC2InstanceRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [14:54:09] EC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_IN_PROGRESS
✅ [14:54:09] EC2InstanceProfile (AWS::IAM::InstanceProfile): CREATE_COMPLETE
🔄 [14:54:09] LaunchConfiguration (AWS::AutoScaling::LaunchConfiguration): CREATE_IN_PROGRESS
✅ [14:54:09] LaunchConfiguration (AWS::AutoScaling::LaunchConfiguration): CREATE_COMPLETE
🔄 [14:54:09] PrivateSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [14:54:09] PrivateSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [14:54:09] AutoScalingGroup (AWS::AutoScaling::AutoScalingGroup): CREATE_IN_PROGRESS
✅ [14:54:09] AutoScalingGroup (AWS::AutoScaling::AutoScalingGroup): CREATE_COMPLETE
🔄 [14:54:09] DataEncryptionKeyAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [14:54:09] DataEncryptionKeyAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [14:54:09] VPCEndpointSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [14:54:09] VPCEndpointSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [14:54:09] EC2MessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [14:54:09] EC2MessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [14:54:09] InternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS
✅ [14:54:09] InternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE
🔄 [14:54:09] InternetGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS
✅ [14:54:09] InternetGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE
🔄 [14:54:09] NATGatewayEIPA (AWS::EC2::EIP): CREATE_IN_PROGRESS
✅ [14:54:09] NATGatewayEIPA (AWS::EC2::EIP): CREATE_COMPLETE
🔄 [14:54:09] NATGatewayA (AWS::EC2::NatGateway): CREATE_IN_PROGRESS
✅ [14:54:09] NATGatewayA (AWS::EC2::NatGateway): CREATE_COMPLETE
🔄 [14:54:09] NATGatewayEIPB (AWS::EC2::EIP): CREATE_IN_PROGRESS
✅ [14:54:09] NATGatewayEIPB (AWS::EC2::EIP): CREATE_COMPLETE
🔄 [14:54:09] NATGatewayB (AWS::EC2::NatGateway): CREATE_IN_PROGRESS
✅ [14:54:09] NATGatewayB (AWS::EC2::NatGateway): CREATE_COMPLETE
🔄 [14:54:09] PrivateRouteTableA (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateRouteTableA (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [14:54:09] PrivateRouteA (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateRouteA (AWS::EC2::Route): CREATE_COMPLETE
🔄 [14:54:09] PrivateRouteTableB (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateRouteTableB (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [14:54:09] PrivateRouteB (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateRouteB (AWS::EC2::Route): CREATE_COMPLETE
🔄 [14:54:09] PrivateSubnetARouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateSubnetARouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [14:54:09] PrivateSubnetBRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [14:54:09] PrivateSubnetBRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [14:54:09] PublicRouteTable (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [14:54:09] PublicRouteTable (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [14:54:09] PublicRoute (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [14:54:09] PublicRoute (AWS::EC2::Route): CREATE_COMPLETE
🔄 [14:54:09] PublicSubnetARouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [14:54:09] PublicSubnetARouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [14:54:09] PublicSubnetBRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [14:54:09] PublicSubnetBRouteTableAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [14:54:09] S3Endpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [14:54:09] S3Endpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [14:54:09] SSMEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [14:54:09] SSMEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [14:54:09] SSMMessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [14:54:09] SSMMessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [14:54:09] SecretsManagerEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [14:54:09] SecretsManagerEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 7s
📊 Final Resource Summary:
---------------------------------------------------------------------------------------------------------
|                                          ListStackResources                                           |
+--------------------------------------+---------------------------------------------+------------------+
|  LoggingBucket                       |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  LoggingBucketPolicy                 |  AWS::S3::BucketPolicy                      |  CREATE_COMPLETE |
|  VPC                                 |  AWS::EC2::VPC                              |  CREATE_COMPLETE |
|  ALBSecurityGroup                    |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  PublicSubnetA                       |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  PublicSubnetB                       |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  ALB                                 |  AWS::ElasticLoadBalancingV2::LoadBalancer  |  CREATE_COMPLETE |
|  ALBTargetGroup                      |  AWS::ElasticLoadBalancingV2::TargetGroup   |  CREATE_COMPLETE |
|  ALBListenerHTTP                     |  AWS::ElasticLoadBalancingV2::Listener      |  CREATE_COMPLETE |
|  AppSecurityGroup                    |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  RDSSecurityGroup                    |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  AppToRdsMysqlEgress                 |  AWS::EC2::SecurityGroupEgress              |  CREATE_COMPLETE |
|  AppToRdsPostgresEgress              |  AWS::EC2::SecurityGroupEgress              |  CREATE_COMPLETE |
|  DataEncryptionKey                   |  AWS::KMS::Key                              |  CREATE_COMPLETE |
|  ApplicationBucket                   |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  ApplicationBucketPolicy             |  AWS::S3::BucketPolicy                      |  CREATE_COMPLETE |
|  RDSMasterSecret                     |  AWS::SecretsManager::Secret                |  CREATE_COMPLETE |
|  EC2InstanceRole                     |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  EC2InstanceProfile                  |  AWS::IAM::InstanceProfile                  |  CREATE_COMPLETE |
|  LaunchConfiguration                 |  AWS::AutoScaling::LaunchConfiguration      |  CREATE_COMPLETE |
|  PrivateSubnetA                      |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  PrivateSubnetB                      |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  AutoScalingGroup                    |  AWS::AutoScaling::AutoScalingGroup         |  CREATE_COMPLETE |
|  DataEncryptionKeyAlias              |  AWS::KMS::Alias                            |  CREATE_COMPLETE |
|  VPCEndpointSecurityGroup            |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  EC2MessagesEndpoint                 |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  InternetGateway                     |  AWS::EC2::InternetGateway                  |  CREATE_COMPLETE |
|  InternetGatewayAttachment           |  AWS::EC2::VPCGatewayAttachment             |  CREATE_COMPLETE |
|  NATGatewayEIPA                      |  AWS::EC2::EIP                              |  CREATE_COMPLETE |
|  NATGatewayA                         |  AWS::EC2::NatGateway                       |  CREATE_COMPLETE |
|  NATGatewayEIPB                      |  AWS::EC2::EIP                              |  CREATE_COMPLETE |
|  NATGatewayB                         |  AWS::EC2::NatGateway                       |  CREATE_COMPLETE |
|  PrivateRouteTableA                  |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PrivateRouteA                       |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PrivateRouteTableB                  |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PrivateRouteB                       |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PrivateSubnetARouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PrivateSubnetBRouteTableAssociation |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PublicRouteTable                    |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PublicRoute                         |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PublicSubnetARouteTableAssociation  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PublicSubnetBRouteTableAssociation  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  S3Endpoint                          |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  SSMEndpoint                         |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  SSMMessagesEndpoint                 |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  SecretsManagerEndpoint              |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
+--------------------------------------+---------------------------------------------+------------------+
✅ Successfully deployed resources: 46
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • ALBArn: arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/lb-9d1de8db/a03a63d855ea1098
  • ALBDNSName: lb-9d1de8db.elb.localhost.localstack.cloud
  • ALBSecurityGroupId: sg-cda881892ae201c0d
  • ALBTargetGroupArn: arn:aws:elasticloadbalancing:us-east-1:000000000000:targetgroup/tg-a56afaa2/c559ef11dad0c2d1
  • AppSecurityGroupId: sg-6838ae4cf54cbcdf0
  • ApplicationBucketArn: arn:aws:s3:::tap-stack-localstack-applicationbucket-2b20321b
  • ApplicationBucketName: tap-stack-localstack-applicationbucket-2b20321b
  • KMSKeyAlias: alias/tapstack-dev-bad30392-b8c1-453f-9deb-b6cca73779c9-data-key
  • KMSKeyArn: arn:aws:kms:us-east-1:000000000000:key/b4ba9873-7c04-47e4-96eb-d22224e96ecd
  • LoggingBucketArn: arn:aws:s3:::tap-stack-localstack-loggingbucket-7e402f25
  • LoggingBucketName: tap-stack-localstack-loggingbucket-7e402f25
  • PrivateSubnetAId: subnet-fa1fb8cad21785b88
  • PrivateSubnetBId: subnet-03bb6f5c96745353c
  • PublicSubnetAId: subnet-55590d622acb878a3
  • PublicSubnetBId: subnet-116082f615635cb2a
  • RDSSecurityGroupId: sg-9a4e40443b44eaf9e
  • VPCId: vpc-3a41f0b7ee4e8b766
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 46 deployed
  • Duration: 7s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!