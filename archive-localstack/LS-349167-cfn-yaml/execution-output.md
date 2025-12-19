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
📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/00b3bbdc-b813-46a4-a40c-3eee376547f9
📊 Monitoring deployment progress...
🔄 [17:33:23] Vpc (AWS::EC2::VPC): CREATE_IN_PROGRESS
✅ [17:33:23] Vpc (AWS::EC2::VPC): CREATE_COMPLETE
🔄 [17:33:23] AlbSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [17:33:23] AlbSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [17:33:23] PublicSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [17:33:23] PublicSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [17:33:23] PublicSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [17:33:23] PublicSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [17:33:23] Alb (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_IN_PROGRESS
✅ [17:33:24] Alb (AWS::ElasticLoadBalancingV2::LoadBalancer): CREATE_COMPLETE
🔄 [17:33:24] AlbTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_IN_PROGRESS
✅ [17:33:24] AlbTargetGroup (AWS::ElasticLoadBalancingV2::TargetGroup): CREATE_COMPLETE
🔄 [17:33:24] AlbHttpListener (AWS::ElasticLoadBalancingV2::Listener): CREATE_IN_PROGRESS
✅ [17:33:24] AlbHttpListener (AWS::ElasticLoadBalancingV2::Listener): CREATE_COMPLETE
🔄 [17:33:24] AppSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [17:33:24] AppSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [17:33:24] TrailKmsKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [17:33:24] TrailKmsKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [17:33:24] CloudTrailBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [17:33:24] CloudTrailBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [17:33:24] CloudTrailBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [17:33:24] CloudTrailBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [17:33:24] LogsKmsKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [17:33:24] LogsKmsKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [17:33:24] CloudTrailLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [17:33:24] CloudTrailLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [17:33:24] CloudTrailLogRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [17:33:25] CloudTrailLogRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [17:33:25] CloudTrail (AWS::CloudTrail::Trail): CREATE_IN_PROGRESS
✅ [17:33:25] CloudTrail (AWS::CloudTrail::Trail): CREATE_COMPLETE
🔄 [17:33:25] EndpointSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [17:33:25] EndpointSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [17:33:25] PrivateSubnetA (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [17:33:25] PrivateSubnetA (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [17:33:25] PrivateSubnetB (AWS::EC2::Subnet): CREATE_IN_PROGRESS
✅ [17:33:25] PrivateSubnetB (AWS::EC2::Subnet): CREATE_COMPLETE
🔄 [17:33:25] CloudWatchLogsEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:25] CloudWatchLogsEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:25] DataKmsKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [17:33:25] DataKmsKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [17:33:25] LoggingBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS
✅ [17:33:25] LoggingBucket (AWS::S3::Bucket): CREATE_COMPLETE
🔄 [17:33:25] ConfigRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [17:33:25] ConfigRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [17:33:25] DataKmsAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [17:33:25] DataKmsAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [17:33:25] Ec2Endpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:25] Ec2Endpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:25] Ec2MessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:25] Ec2MessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:25] FlowLogLogGroup (AWS::Logs::LogGroup): CREATE_IN_PROGRESS
✅ [17:33:25] FlowLogLogGroup (AWS::Logs::LogGroup): CREATE_COMPLETE
🔄 [17:33:25] FlowLogRole (AWS::IAM::Role): CREATE_IN_PROGRESS
✅ [17:33:25] FlowLogRole (AWS::IAM::Role): CREATE_COMPLETE
🔄 [17:33:25] InternetGateway (AWS::EC2::InternetGateway): CREATE_IN_PROGRESS
✅ [17:33:25] InternetGateway (AWS::EC2::InternetGateway): CREATE_COMPLETE
🔄 [17:33:25] KmsEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:25] KmsEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:25] LoggingBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS
✅ [17:33:25] LoggingBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE
🔄 [17:33:25] LogsKmsAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [17:33:25] LogsKmsAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [17:33:25] PrivateRouteTableA (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [17:33:25] PrivateRouteTableA (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [17:33:25] PrivateRouteTableB (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [17:33:25] PrivateRouteTableB (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [17:33:25] PrivateSubnetARouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [17:33:25] PrivateSubnetARouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [17:33:25] PrivateSubnetBRouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [17:33:25] PrivateSubnetBRouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [17:33:25] VpcGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_IN_PROGRESS
✅ [17:33:25] VpcGatewayAttachment (AWS::EC2::VPCGatewayAttachment): CREATE_COMPLETE
🔄 [17:33:25] PublicRouteTableA (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [17:33:25] PublicRouteTableA (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [17:33:25] PublicRouteA (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [17:33:25] PublicRouteA (AWS::EC2::Route): CREATE_COMPLETE
🔄 [17:33:25] PublicRouteTableB (AWS::EC2::RouteTable): CREATE_IN_PROGRESS
✅ [17:33:25] PublicRouteTableB (AWS::EC2::RouteTable): CREATE_COMPLETE
🔄 [17:33:25] PublicRouteB (AWS::EC2::Route): CREATE_IN_PROGRESS
✅ [17:33:25] PublicRouteB (AWS::EC2::Route): CREATE_COMPLETE
🔄 [17:33:25] PublicSubnetARouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [17:33:25] PublicSubnetARouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [17:33:25] PublicSubnetBRouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_IN_PROGRESS
✅ [17:33:25] PublicSubnetBRouteAssociation (AWS::EC2::SubnetRouteTableAssociation): CREATE_COMPLETE
🔄 [17:33:25] RdsKmsKey (AWS::KMS::Key): CREATE_IN_PROGRESS
✅ [17:33:25] RdsKmsKey (AWS::KMS::Key): CREATE_COMPLETE
🔄 [17:33:25] RdsKmsAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [17:33:25] RdsKmsAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [17:33:25] RdsSecurityGroup (AWS::EC2::SecurityGroup): CREATE_IN_PROGRESS
✅ [17:33:25] RdsSecurityGroup (AWS::EC2::SecurityGroup): CREATE_COMPLETE
🔄 [17:33:25] S3Endpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:25] S3Endpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:25] SsmEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:26] SsmEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:26] SsmMessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:26] SsmMessagesEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:26] StsEndpoint (AWS::EC2::VPCEndpoint): CREATE_IN_PROGRESS
✅ [17:33:26] StsEndpoint (AWS::EC2::VPCEndpoint): CREATE_COMPLETE
🔄 [17:33:26] TrailKmsAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS
✅ [17:33:26] TrailKmsAlias (AWS::KMS::Alias): CREATE_COMPLETE
🔄 [17:33:26] VpcFlowLogs (AWS::EC2::FlowLog): CREATE_IN_PROGRESS
✅ [17:33:26] VpcFlowLogs (AWS::EC2::FlowLog): CREATE_COMPLETE
    └─ Resource type AWS::EC2::FlowLog is not supported but was deployed as a fallback
📈 Progress: 51/51 complete, 0 in progress
✅ Stack deployment completed successfully!
⏱️  Total deployment time: 21s
📊 Final Resource Summary:
----------------------------------------------------------------------------------------------------
|                                        ListStackResources                                        |
+---------------------------------+---------------------------------------------+------------------+
|  Vpc                            |  AWS::EC2::VPC                              |  CREATE_COMPLETE |
|  AlbSecurityGroup               |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  PublicSubnetA                  |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  PublicSubnetB                  |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  Alb                            |  AWS::ElasticLoadBalancingV2::LoadBalancer  |  CREATE_COMPLETE |
|  AlbTargetGroup                 |  AWS::ElasticLoadBalancingV2::TargetGroup   |  CREATE_COMPLETE |
|  AlbHttpListener                |  AWS::ElasticLoadBalancingV2::Listener      |  CREATE_COMPLETE |
|  AppSecurityGroup               |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  TrailKmsKey                    |  AWS::KMS::Key                              |  CREATE_COMPLETE |
|  CloudTrailBucket               |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  CloudTrailBucketPolicy         |  AWS::S3::BucketPolicy                      |  CREATE_COMPLETE |
|  LogsKmsKey                     |  AWS::KMS::Key                              |  CREATE_COMPLETE |
|  CloudTrailLogGroup             |  AWS::Logs::LogGroup                        |  CREATE_COMPLETE |
|  CloudTrailLogRole              |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  CloudTrail                     |  AWS::CloudTrail::Trail                     |  CREATE_COMPLETE |
|  EndpointSecurityGroup          |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  PrivateSubnetA                 |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  PrivateSubnetB                 |  AWS::EC2::Subnet                           |  CREATE_COMPLETE |
|  CloudWatchLogsEndpoint         |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  DataKmsKey                     |  AWS::KMS::Key                              |  CREATE_COMPLETE |
|  LoggingBucket                  |  AWS::S3::Bucket                            |  CREATE_COMPLETE |
|  ConfigRole                     |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  DataKmsAlias                   |  AWS::KMS::Alias                            |  CREATE_COMPLETE |
|  Ec2Endpoint                    |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  Ec2MessagesEndpoint            |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  FlowLogLogGroup                |  AWS::Logs::LogGroup                        |  CREATE_COMPLETE |
|  FlowLogRole                    |  AWS::IAM::Role                             |  CREATE_COMPLETE |
|  InternetGateway                |  AWS::EC2::InternetGateway                  |  CREATE_COMPLETE |
|  KmsEndpoint                    |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  LoggingBucketPolicy            |  AWS::S3::BucketPolicy                      |  CREATE_COMPLETE |
|  LogsKmsAlias                   |  AWS::KMS::Alias                            |  CREATE_COMPLETE |
|  PrivateRouteTableA             |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PrivateRouteTableB             |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PrivateSubnetARouteAssociation |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PrivateSubnetBRouteAssociation |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  VpcGatewayAttachment           |  AWS::EC2::VPCGatewayAttachment             |  CREATE_COMPLETE |
|  PublicRouteTableA              |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PublicRouteA                   |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PublicRouteTableB              |  AWS::EC2::RouteTable                       |  CREATE_COMPLETE |
|  PublicRouteB                   |  AWS::EC2::Route                            |  CREATE_COMPLETE |
|  PublicSubnetARouteAssociation  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  PublicSubnetBRouteAssociation  |  AWS::EC2::SubnetRouteTableAssociation      |  CREATE_COMPLETE |
|  RdsKmsKey                      |  AWS::KMS::Key                              |  CREATE_COMPLETE |
|  RdsKmsAlias                    |  AWS::KMS::Alias                            |  CREATE_COMPLETE |
|  RdsSecurityGroup               |  AWS::EC2::SecurityGroup                    |  CREATE_COMPLETE |
|  S3Endpoint                     |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  SsmEndpoint                    |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  SsmMessagesEndpoint            |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  StsEndpoint                    |  AWS::EC2::VPCEndpoint                      |  CREATE_COMPLETE |
|  TrailKmsAlias                  |  AWS::KMS::Alias                            |  CREATE_COMPLETE |
|  VpcFlowLogs                    |  AWS::EC2::FlowLog                          |  CREATE_COMPLETE |
+---------------------------------+---------------------------------------------+------------------+
✅ Successfully deployed resources: 51
📊 Generating stack outputs...
✅ Outputs saved to cfn-outputs/flat-outputs.json
📋 Stack Outputs:
  • AlbArn: arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/lb-8b6b0438/4023dbea9969d9cb
  • AlbDnsName: lb-8b6b0438.elb.localhost.localstack.cloud
  • CloudTrailArn: trail-c76f5909
  • CloudTrailBucketName: tap-stack-localstack-cloudtrailbucket-4e9a6d0c
  • ConfigRecorderName: default
  • FlowLogId: unknown
  • KmsKeyArns: 8e3c3464-1a11-4294-a371-72c28719dfb5,1e70ee9d-f01e-41f2-a8db-fb72816f5a00,2e10dccd-62fd-4e86-8177-487812a1c4b7,abc06277-9c3c-4bb4-b4fd-cc62ede64056
  • LoggingBucketName: tap-stack-localstack-loggingbucket-ac0fb22d
  • PrimaryRegionOut: us-east-1
  • PrivateSubnetIds: subnet-ff08d6c0d23c1e932,subnet-93be6ed6b3450ba4c
  • PublicSubnetIds: subnet-26ab500de8893ecd1,subnet-41272769708a15147
  • SecondaryRegionOut: us-west-2
  • SecurityControlsSummary: WAF=True;SecurityHub=True;GuardDuty=True;CloudTrail=multi-region;Config=enabled;FlowLogs=enabled;S3SSE=KMS;RDS=TLS+KMS
  • VpcId: vpc-da5816bbebf45492c
🎯 Deployment Summary:
  • Stack: tap-stack-localstack
  • Status: CREATE_COMPLETE
  • Resources: 51 deployed
  • Duration: 21s
  • LocalStack: http://localhost:4566
🎉 CloudFormation deployment to LocalStack completed successfully!