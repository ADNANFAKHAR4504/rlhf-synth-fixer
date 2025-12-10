
> tap@0.1.0 localstack:cdk:test
> ./scripts/localstack-cdk-test.sh

[0;34m🧪 Running Integration Tests against LocalStack CDK Deployment...[0m
[0;32m✅ LocalStack is running[0m
[0;32m✅ Infrastructure outputs found[0m
[0;32m✅ Infrastructure outputs validated[0m
[1;33m📁 Working directory: /home/drank/Turing/iac-test-automations[0m
[1;33m📦 Installing dependencies...[0m
[0;32m✅ Node.js dependencies installed[0m

> tap@0.1.0 build
> tsc --skipLibCheck

[1;33m🔧 Setting up LocalStack environment...[0m
[0;34m🌐 Environment configured for LocalStack:[0m
[1;33m  • AWS_ENDPOINT_URL: http://localhost:4566[0m
[1;33m  • AWS_REGION: us-east-1[0m
[1;33m  • CDK_DEFAULT_ACCOUNT: 000000000000[0m
[1;33m  • SSL Verification: Disabled[0m
[1;33m🔍 Verifying CDK stack deployment...[0m
[0;32m✅ CDK Stack is deployed: TapStackdev (Status: CREATE_COMPLETE)[0m
[0;34m📊 Deployed Resources:[0m
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                                    ListStackResources                                                                                    |
+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------+------------------+
|  CDKMetadata                                                                                                          |  AWS::CDK::Metadata                           |  CREATE_COMPLETE |
|  NetworkVPC962EC14D                                                                                                   |  AWS::EC2::VPC                                |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet2RouteTable40E8A765                                                                            |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet2SubnetF5D10D0A                                                                                |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet2RouteTableAssociation75697915                                                                 |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCIGWF93F4916                                                                                                |  AWS::EC2::InternetGateway                    |  CREATE_COMPLETE |
|  NetworkVPCVPCGW990C1587                                                                                              |  AWS::EC2::VPCGatewayAttachment               |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet1RouteTable1DFC5E00                                                                            |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet1DefaultRoute08D2D596                                                                          |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet3RouteTable9A7773C9                                                                            |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet3Subnet60D12A3C                                                                                |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet3RouteTableAssociationE7D2E6CC                                                                 |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet2DefaultRoute176C4CD9                                                                          |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet1Subnet8E5CCBD1                                                                                |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet1RouteTableAssociation4DAD73DC                                                                 |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet3DefaultRoute52B72BA4                                                                          |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  NetworkALBSecurityGroupA9DF196C                                                                                      |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  ComputeALB00A47009                                                                                                   |  AWS::ElasticLoadBalancingV2::LoadBalancer    |  CREATE_COMPLETE |
|  ComputeTargetGroupBC784054                                                                                           |  AWS::ElasticLoadBalancingV2::TargetGroup     |  CREATE_COMPLETE |
|  ComputeALBHTTPListener23EC8B10                                                                                       |  AWS::ElasticLoadBalancingV2::Listener        |  CREATE_COMPLETE |
|  ComputeContainerLogGroup63DD31C5                                                                                     |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  ComputeECSCluster8B528103                                                                                            |  AWS::ECS::Cluster                            |  CREATE_COMPLETE |
|  ComputeECSClusterDefaultServiceDiscoveryNamespaceFCA1E9D2                                                            |  AWS::ServiceDiscovery::PrivateDnsNamespace   |  CREATE_COMPLETE |
|  ComputeTaskDefinitionTaskRoleD5579FD6                                                                                |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  ComputeTaskDefinitionTaskRoleDefaultPolicyC44C9C5C                                                                   |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  NetworkECSSecurityGroup37FD3565                                                                                      |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet1SubnetDFDCBA02                                                                               |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet2Subnet09CB847C                                                                               |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet3Subnet03D602DE                                                                               |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  ComputeFargateServiceCloudmapServiceE06788C3                                                                         |  AWS::ServiceDiscovery::Service               |  CREATE_COMPLETE |
|  ComputeTaskDefinitionExecutionRoleF925A2AB                                                                           |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  ComputeTaskDefinition30D3D6DD                                                                                        |  AWS::ECS::TaskDefinition                     |  CREATE_COMPLETE |
|  ComputeFargateService8DC6B733                                                                                        |  AWS::ECS::Service                            |  CREATE_COMPLETE |
|  ComputeFargateServiceTaskCountTarget25EB4250                                                                         |  AWS::ApplicationAutoScaling::ScalableTarget  |  CREATE_COMPLETE |
|  ComputeFargateServiceTaskCountTargetCPUScaling87F44E33                                                               |  AWS::ApplicationAutoScaling::ScalingPolicy   |  CREATE_COMPLETE |
|  ComputeFargateServiceTaskCountTargetMemoryScaling404F421B                                                            |  AWS::ApplicationAutoScaling::ScalingPolicy   |  CREATE_COMPLETE |
|  ComputeTaskDefinitionExecutionRoleDefaultPolicy1E206A30                                                              |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092                                                          |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  StorageDataBucketB1B922FA                                                                                            |  AWS::S3::Bucket                              |  CREATE_COMPLETE |
|  CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F                                                       |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0                                                         |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E                                                      |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet1SubnetBF807499                                                                              |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet2Subnet91A3EC7D                                                                              |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet3Subnet41E2F95A                                                                              |  AWS::EC2::Subnet                             |  CREATE_COMPLETE |
|  DatabaseClusterSubnets5540150D                                                                                       |  AWS::RDS::DBSubnetGroup                      |  CREATE_COMPLETE |
|  DatabaseClusterSecretD1FB634F                                                                                        |  AWS::SecretsManager::Secret                  |  CREATE_COMPLETE |
|  NetworkDatabaseSecurityGroup2B3F4679                                                                                 |  AWS::EC2::SecurityGroup                      |  CREATE_COMPLETE |
|  DatabaseCluster5B53A178                                                                                              |  AWS::RDS::DBCluster                          |  CREATE_COMPLETE |
|  LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRole9741ECFB                                                      |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRoleDefaultPolicyADDA7DEB                                         |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A                                                                 |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  DatabaseClusterLogRetentionpostgresql025D39CE                                                                        |  Custom::LogRetention                         |  CREATE_COMPLETE |
|  DatabaseClusterSecretAttachmentDC8466C0                                                                              |  AWS::SecretsManager::SecretTargetAttachment  |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet3RouteTable896AABB9                                                                          |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet3RouteTableAssociation0B647F95                                                               |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet1RouteTable30C2693B                                                                          |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet1RouteTableAssociation19B1642A                                                               |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet2RouteTable461D486E                                                                          |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCIsolatedSubnet2RouteTableAssociationFECA7C6A                                                               |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  DatabaseClusterwriterF225C73E                                                                                        |  AWS::RDS::DBInstance                         |  CREATE_COMPLETE |
|  DatabaseClusterreader47184CDA                                                                                        |  AWS::RDS::DBInstance                         |  CREATE_COMPLETE |
|  DatabaseDatabaseAlarmTopicECB4E563                                                                                   |  AWS::SNS::Topic                              |  CREATE_COMPLETE |
|  DatabaseDatabaseCPUAlarm17E31067                                                                                     |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  DatabaseDatabaseConnectionsAlarm5361E47C                                                                             |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  EventBridgeCustomEventBus39E329A6                                                                                    |  AWS::Events::EventBus                        |  CREATE_COMPLETE |
|  EventBridgeEventDLQD8286430                                                                                          |  AWS::SQS::Queue                              |  CREATE_COMPLETE |
|  EventBridgeEventTargetQueue87A956B3                                                                                  |  AWS::SQS::Queue                              |  CREATE_COMPLETE |
|  EventBridgeApplicationEventRule58126747                                                                              |  AWS::Events::Rule                            |  CREATE_COMPLETE |
|  EventBridgeEventArchiveFE1D36E0                                                                                      |  AWS::Events::Archive                         |  CREATE_COMPLETE |
|  EventBridgeEventDLQPolicy591266E9                                                                                    |  AWS::SQS::QueuePolicy                        |  CREATE_COMPLETE |
|  EventBridgeEventTargetQueuePolicy75E2EEA9                                                                            |  AWS::SQS::QueuePolicy                        |  CREATE_COMPLETE |
|  FailoverAuroraFailoverFunctionServiceRole99054FE7                                                                    |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  FailoverAuroraFailoverFunctionServiceRoleDefaultPolicy2A5A2286                                                       |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  FailoverAuroraFailoverFunctionF43866F0                                                                               |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  FailoverAuroraFailoverFunctionLogRetention15C936D6                                                                   |  Custom::LogRetention                         |  CREATE_COMPLETE |
|  FailoverECSScalingFunctionServiceRoleE0656765                                                                        |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  FailoverECSScalingFunctionServiceRoleDefaultPolicy4BB4186B                                                           |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  FailoverECSScalingFunction579BC7BF                                                                                   |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  FailoverECSScalingFunctionLogRetention25406467                                                                       |  Custom::LogRetention                         |  CREATE_COMPLETE |
|  FailoverFailoverNotificationTopicE4BE5644                                                                            |  AWS::SNS::Topic                              |  CREATE_COMPLETE |
|  FailoverFailoverStateMachineRoleFBEE186A                                                                             |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  FailoverHealthCheckFunctionServiceRole44BB11F1                                                                       |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  FailoverHealthCheckFunctionC19B489D                                                                                  |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  FailoverRoute53UpdateFunctionServiceRole8CCC9929                                                                     |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  FailoverRoute53UpdateFunctionServiceRoleDefaultPolicy6A939F97                                                        |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  FailoverRoute53UpdateFunctionD22D0AE5                                                                                |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  FailoverFailoverStateMachineRoleDefaultPolicyB414C625                                                                |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  FailoverStateMachineLogGroup28AC1C8B                                                                                 |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  FailoverFailoverStateMachine15BF1736                                                                                 |  AWS::StepFunctions::StateMachine             |  CREATE_COMPLETE |
|  FailoverHealthCheckFunctionLogRetention240D9BF1                                                                      |  Custom::LogRetention                         |  CREATE_COMPLETE |
|  FailoverRoute53UpdateFunctionLogRetention823E196E                                                                    |  Custom::LogRetention                         |  CREATE_COMPLETE |
|  MonitoringCanaryAlarmTopic846CF7A5                                                                                   |  AWS::SNS::Topic                              |  CREATE_COMPLETE |
|  MonitoringCanaryArtifactsBucketAE86F2E1                                                                              |  AWS::S3::Bucket                              |  CREATE_COMPLETE |
|  MonitoringCanaryArtifactsBucketPolicy7E4FA331                                                                        |  AWS::S3::BucketPolicy                        |  CREATE_COMPLETE |
|  MonitoringCanaryArtifactsBucketAutoDeleteObjectsCustomResourceFD7C8F2E                                               |  Custom::S3AutoDeleteObjects                  |  CREATE_COMPLETE |
|  MonitoringCanaryRoleAFBCE305                                                                                         |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  MonitoringEndpointCanaryBD8A8295                                                                                     |  AWS::Synthetics::Canary                      |  CREATE_COMPLETE |
|  MonitoringCanaryDurationAlarmCB31F106                                                                                |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  MonitoringCanaryFailureAlarm81B1981B                                                                                 |  AWS::CloudWatch::Alarm                       |  CREATE_COMPLETE |
|  MonitoringCanaryRoleDefaultPolicy12E575D3                                                                            |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  NetworkDatabaseSecurityGroupfromTapStackdevNetworkECSSecurityGroup54D93F625432A8EBEFF8                               |  AWS::EC2::SecurityGroupIngress               |  CREATE_COMPLETE |
|  NetworkECSSecurityGroupfromTapStackdevNetworkALBSecurityGroup8BEAE0FC8080844F6089                                    |  AWS::EC2::SecurityGroupIngress               |  CREATE_COMPLETE |
|  NetworkECSSecurityGroupfromTapStackdevNetworkALBSecurityGroup8BEAE0FC80F0D44ECB                                      |  AWS::EC2::SecurityGroupIngress               |  CREATE_COMPLETE |
|  NetworkVPCFlowLogIAMRole4DFB294E                                                                                     |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  NetworkVPCFlowLogGroupB1819E47                                                                                       |  AWS::Logs::LogGroup                          |  CREATE_COMPLETE |
|  NetworkVPCFlowLogFC6CBD90                                                                                            |  AWS::EC2::FlowLog                            |  CREATE_COMPLETE |
|  NetworkVPCFlowLogIAMRoleDefaultPolicyF5D8ADA2                                                                        |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet1EIPA6BC988D                                                                                   |  AWS::EC2::EIP                                |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet1NATGateway3EC80B04                                                                            |  AWS::EC2::NatGateway                         |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet1RouteTableBA4C5B00                                                                           |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet1DefaultRoute3D2C8F97                                                                         |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet1RouteTableAssociationF6FFFF95                                                                |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet2EIPA4C1D46E                                                                                   |  AWS::EC2::EIP                                |  CREATE_COMPLETE |
|  NetworkVPCPublicSubnet2NATGateway436741C2                                                                            |  AWS::EC2::NatGateway                         |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet2RouteTable0C1DD852                                                                           |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet2DefaultRoute448F285C                                                                         |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet2RouteTableAssociation07D70763                                                                |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet3RouteTable69ACC5A7                                                                           |  AWS::EC2::RouteTable                         |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet3DefaultRouteE14405CA                                                                         |  AWS::EC2::Route                              |  CREATE_COMPLETE |
|  NetworkVPCPrivateSubnet3RouteTableAssociation65D6198D                                                                |  AWS::EC2::SubnetRouteTableAssociation        |  CREATE_COMPLETE |
|  NetworkVPCRestrictDefaultSecurityGroupCustomResourceF93F8EF4                                                         |  Custom::VpcRestrictDefaultSG                 |  CREATE_COMPLETE |
|  ParameterStoreAPIKeyParam76D4067E                                                                                    |  AWS::SSM::Parameter                          |  CREATE_COMPLETE |
|  ParameterStoreAppConfigParamC57E6C34                                                                                 |  AWS::SSM::Parameter                          |  CREATE_COMPLETE |
|  ParameterStoreDBConfigParamB01AC71A                                                                                  |  AWS::SSM::Parameter                          |  CREATE_COMPLETE |
|  ParameterStoreParameterReplicationFunctionServiceRoleED6D0434                                                        |  AWS::IAM::Role                               |  CREATE_COMPLETE |
|  ParameterStoreParameterReplicationFunctionServiceRoleDefaultPolicy242B4C5A                                           |  AWS::IAM::Policy                             |  CREATE_COMPLETE |
|  ParameterStoreParameterReplicationFunction54B02DC7                                                                   |  AWS::Lambda::Function                        |  CREATE_COMPLETE |
|  ParameterStoreParameterChangeRule7736D702                                                                            |  AWS::Events::Rule                            |  CREATE_COMPLETE |
|  ParameterStoreParameterChangeRuleAllowEventRuleTapStackdevParameterStoreParameterReplicationFunction9B02C33EAED68F85 |  AWS::Lambda::Permission                      |  CREATE_COMPLETE |
|  ParameterStoreParameterReplicationFunctionLogRetention06A70CCE                                                       |  Custom::LogRetention                         |  CREATE_COMPLETE |
|  Route53HostedZoneBA40ECB3                                                                                            |  AWS::Route53::HostedZone                     |  CREATE_COMPLETE |
|  Route53AppRecord7B944693                                                                                             |  AWS::Route53::RecordSet                      |  CREATE_COMPLETE |
|  Route53HealthCheckE7919D71                                                                                           |  AWS::Route53::HealthCheck                    |  CREATE_COMPLETE |
|  StorageDataBucketPolicyC997B69E                                                                                      |  AWS::S3::BucketPolicy                        |  CREATE_COMPLETE |
|  StorageDataBucketAutoDeleteObjectsCustomResource4BB14FB3                                                             |  Custom::S3AutoDeleteObjects                  |  CREATE_COMPLETE |
|  StorageSessionTable45B5C5F7                                                                                          |  AWS::DynamoDB::GlobalTable                   |  CREATE_COMPLETE |
+-----------------------------------------------------------------------------------------------------------------------+-----------------------------------------------+------------------+
[1;33m🚀 Starting integration tests...[0m
[0;34m📋 Running test:integration script...[0m

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /home/drank/Turing/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
  console.log
    Skipping bucket encryption test in LocalStack

      at Object.<anonymous> (test/tap-stack.int.test.ts:252:17)

  console.log
    Skipping bucket versioning test in LocalStack

      at Object.<anonymous> (test/tap-stack.int.test.ts:272:17)

  console.log
    Skipping S3 object operations test in LocalStack

      at Object.<anonymous> (test/tap-stack.int.test.ts:287:17)

  console.log
    EventBridge resource not found in LocalStack - this is a known limitation

      at Object.<anonymous> (test/tap-stack.int.test.ts:563:19)

  console.log
    Skipping EventBridge archive test in LocalStack

      at Object.<anonymous> (test/tap-stack.int.test.ts:574:17)

  console.warn
    QueueUrl=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TapStackdevEventQueueus-east-1 differs from SQSClient resolved endpoint=http://localhost:4566/, using QueueUrl host as endpoint.
    Set [endpoint=string] or [useQueueUrlAsEndpoint=false] on the SQSClient.

      589 |     test('Should verify SQS queue attributes', async () => {
      590 |       try {
    > 591 |         const response = await sqsClient.send(
          |                          ^
      592 |           new GetQueueAttributesCommand({
      593 |             QueueUrl: queueUrl,
      594 |             AttributeNames: ['All'],

      at warn (node_modules/@aws-sdk/middleware-sdk-sqs/dist-cjs/index.js:23:32)
      at next (node_modules/@smithy/middleware-endpoint/dist-cjs/index.js:178:16)
      at node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:5:26
      at Object.<anonymous> (test/tap-stack.int.test.ts:591:26)

  console.log
    SQS queue not found in LocalStack - this is a known limitation

      at Object.<anonymous> (test/tap-stack.int.test.ts:603:19)

  console.warn
    QueueUrl=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TapStackdevEventQueueus-east-1 differs from SQSClient resolved endpoint=http://localhost:4566/, using QueueUrl host as endpoint.
    Set [endpoint=string] or [useQueueUrlAsEndpoint=false] on the SQSClient.

      614 |
      615 |         // Send message
    > 616 |         const sendResponse = await sqsClient.send(
          |                              ^
      617 |           new SendMessageCommand({
      618 |             QueueUrl: queueUrl,
      619 |             MessageBody: testMessage,

      at warn (node_modules/@aws-sdk/middleware-sdk-sqs/dist-cjs/index.js:23:32)
      at next (node_modules/@smithy/middleware-endpoint/dist-cjs/index.js:178:16)
      at node_modules/@aws-sdk/middleware-sdk-sqs/dist-cjs/index.js:88:18
      at node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:5:26
      at Object.<anonymous> (test/tap-stack.int.test.ts:616:30)

  console.log
    SQS queue not found in LocalStack - this is a known limitation

      at Object.<anonymous> (test/tap-stack.int.test.ts:650:19)

  console.log
    Skipping AWS Backup test in LocalStack

      at Object.<anonymous> (test/tap-stack.int.test.ts:665:17)

  console.log
    Found 0 database alarms in LocalStack

      at Object.<anonymous> (test/tap-stack.int.test.ts:770:17)

PASS test/tap-stack.int.test.ts
  TapStack Integration Tests - Live AWS Resources
    Environment Configuration
      ✓ Should load flat-outputs.json successfully (1 ms)
      ✓ Should have all required output keys (1 ms)
    DynamoDB - Session Table
      ✓ Should verify table exists and is active (22 ms)
      ✓ Should have correct billing mode (PAY_PER_REQUEST) (7 ms)
      ✓ Should verify Point-in-Time Recovery is enabled (7 ms)
      ✓ Should be able to write and read an item (81 ms)
    S3 - Data Bucket
      ✓ Should verify bucket encryption is enabled (11 ms)
      ✓ Should verify bucket versioning is enabled (1 ms)
      ✓ Should be able to upload and download an object (1 ms)
    RDS - Aurora PostgreSQL Cluster
      ✓ Should verify cluster exists and is available (11 ms)
      ✓ Should verify storage is encrypted (4 ms)
      ✓ Should verify backup retention is configured (4 ms)
      ✓ Should verify writer and reader instances exist (6 ms)
    ECS - Fargate Service
      ✓ Should verify ECS cluster is active (4 ms)
      ✓ Should verify Fargate service is running (7 ms)
    Application Load Balancer
      ✓ Should verify ALB exists and is active (7 ms)
      ✓ Should verify target group exists (5 ms)
      ✓ Should verify HTTP listener is configured (4 ms)
      ✓ Should verify target health (7 ms)
    Route53 - DNS and Health Checks
      ✓ Should verify hosted zone exists (7 ms)
      ✓ Should verify health check is configured correctly (4 ms)
      ✓ Should verify DNS records exist (9 ms)
    EventBridge and SQS
      ✓ Should verify EventBridge event bus exists (6 ms)
      ✓ Should verify event archive exists (1 ms)
      ✓ Should verify SQS queue attributes (83 ms)
      ✓ Should be able to send and receive message from SQS queue (4 ms)
    AWS Backup
      ✓ Should verify backup selection exists
    Systems Manager - Parameter Store
      ✓ Should verify app config parameter exists (5 ms)
      ✓ Should verify database config parameter exists (4 ms)
      ✓ Should verify parameter replication Lambda function exists (9 ms)
    Step Functions - Failover State Machine
      ✓ Should verify state machine exists (12 ms)
      ✓ Should verify state machine definition is valid (10 ms)
    CloudWatch - Alarms and Metrics
      ✓ Should verify CloudWatch alarms are configured (5 ms)

Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        1.036 s
Ran all test suites matching /.int.test.ts$/i.
[0;32m🎉 Integration tests completed successfully![0m
[0;34m📊 Test Summary:[0m
[1;33m  • All infrastructure components validated[0m
[1;33m  • LocalStack environment verified[0m
[1;33m  • CDK resources properly configured[0m
