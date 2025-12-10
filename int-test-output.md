[0;36m╔══════════════════════════════════════════════════════════════════════════════════════════════╗[0m
[0;36m║                              🧪 LocalStack Test                                              ║[0m
[0;36m╚══════════════════════════════════════════════════════════════════════════════════════════════╝[0m

[0;34m📍 Stack Path: /mnt/d/Projects/Turing/iac-test-automations[0m

[1;33m🔍 Checking LocalStack status...[0m
[0;32m✅ LocalStack is running[0m

[1;33m🔍 Detecting platform and language...[0m
[0;32m✅ Detected platform: cdk[0m
[0;32m✅ Detected language: ts[0m

[0;35m🧪 Executing tests for cdk platform...[0m
[0;34m📁 Working directory: /mnt/d/Projects/Turing/iac-test-automations[0m

[0;34m🧪 Running Integration Tests against LocalStack CDK Deployment...[0m
[0;32m✅ LocalStack is running[0m
[0;32m✅ Infrastructure outputs found[0m
[0;32m✅ Infrastructure outputs validated[0m
[1;33m📁 Working directory: /mnt/d/Projects/Turing/iac-test-automations[0m
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
----------------------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                         ListStackResources                                                                         |
+-----------------------------------------------------------------------------------------------+-------------------------------------------------+------------------+
|  ApprovalTopic1D517B4C                                                                        |  AWS::SNS::Topic                                |  CREATE_COMPLETE |
|  PipelineVpc0543904A                                                                          |  AWS::EC2::VPC                                  |  CREATE_COMPLETE |
|  BlueTargetGroupF108EB01                                                                      |  AWS::ElasticLoadBalancingV2::TargetGroup       |  CREATE_COMPLETE |
|  BuildLogGroup61A736A8                                                                        |  AWS::Logs::LogGroup                            |  CREATE_COMPLETE |
|  PaymentServiceECR261773D9                                                                    |  AWS::ECR::Repository                           |  CREATE_COMPLETE |
|  CodeBuildRole728CBADE                                                                        |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  BuildProject097C5DB7                                                                         |  AWS::CodeBuild::Project                        |  CREATE_COMPLETE |
|  CDKMetadata                                                                                  |  AWS::CDK::Metadata                             |  CREATE_COMPLETE |
|  IntegrationTestLogGroupAD80749A                                                              |  AWS::Logs::LogGroup                            |  CREATE_COMPLETE |
|  UnitTestLogGroupEA88B9B5                                                                     |  AWS::Logs::LogGroup                            |  CREATE_COMPLETE |
|  StagingEndpoint479919D5                                                                      |  AWS::SSM::Parameter                            |  CREATE_COMPLETE |
|  IntegrationTestProjectB37FF01A                                                               |  AWS::CodeBuild::Project                        |  CREATE_COMPLETE |
|  UnitTestProject1D06E9F9                                                                      |  AWS::CodeBuild::Project                        |  CREATE_COMPLETE |
|  PipelineArtifacts4A9B2621                                                                    |  AWS::S3::Bucket                                |  CREATE_COMPLETE |
|  CodeBuildRoleDefaultPolicy829527DE                                                           |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  CodeDeployRole12BEECBE                                                                       |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0                                 |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E                              |  AWS::Lambda::Function                          |  CREATE_COMPLETE |
|  GreenTargetGroupEEB2DF3E                                                                     |  AWS::ElasticLoadBalancingV2::TargetGroup       |  CREATE_COMPLETE |
|  PipelineVpcIGW3FA4A524                                                                       |  AWS::EC2::InternetGateway                      |  CREATE_COMPLETE |
|  PipelineVpcVPCGW3256101F                                                                     |  AWS::EC2::VPCGatewayAttachment                 |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet2RouteTable5219ED4D                                                   |  AWS::EC2::RouteTable                           |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet2DefaultRoute04C861A0                                                 |  AWS::EC2::Route                                |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet1RouteTableE9A67515                                                   |  AWS::EC2::RouteTable                           |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet1Subnet26FF83E2                                                       |  AWS::EC2::Subnet                               |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet1RouteTableAssociation6D13736B                                        |  AWS::EC2::SubnetRouteTableAssociation          |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet1DefaultRoute44F3E91D                                                 |  AWS::EC2::Route                                |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet2Subnet64F58E18                                                       |  AWS::EC2::Subnet                               |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet2RouteTableAssociation54D39738                                        |  AWS::EC2::SubnetRouteTableAssociation          |  CREATE_COMPLETE |
|  PaymentALBSecurityGroup45E5B5F1                                                              |  AWS::EC2::SecurityGroup                        |  CREATE_COMPLETE |
|  PaymentALBFB8F45F3                                                                           |  AWS::ElasticLoadBalancingV2::LoadBalancer      |  CREATE_COMPLETE |
|  Http5xxAlarm2F844FC7                                                                         |  AWS::CloudWatch::Alarm                         |  CREATE_COMPLETE |
|  PaymentALBProdListener27393BD4                                                               |  AWS::ElasticLoadBalancingV2::Listener          |  CREATE_COMPLETE |
|  PaymentTaskRole22CAA669                                                                      |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentServiceLogGroupE9944FE7                                                               |  AWS::Logs::LogGroup                            |  CREATE_COMPLETE |
|  PaymentExecutionRole63045D24                                                                 |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentTaskDef91F28CEE                                                                       |  AWS::ECS::TaskDefinition                       |  CREATE_COMPLETE |
|  PaymentServiceSecurityGroupA6B8193F                                                          |  AWS::EC2::SecurityGroup                        |  CREATE_COMPLETE |
|  PaymentALBSecurityGrouptoTapStackdevPaymentServiceSecurityGroup3E786E91804409F29F            |  AWS::EC2::SecurityGroupEgress                  |  CREATE_COMPLETE |
|  PaymentALBTestListenerB62D0B27                                                               |  AWS::ElasticLoadBalancingV2::Listener          |  CREATE_COMPLETE |
|  PaymentClusterC76E6148                                                                       |  AWS::ECS::Cluster                              |  CREATE_COMPLETE |
|  PaymentCluster16F92FB4                                                                       |  AWS::ECS::ClusterCapacityProviderAssociations  |  CREATE_COMPLETE |
|  PaymentCodeDeployApp152E5410                                                                 |  AWS::CodeDeploy::Application                   |  CREATE_COMPLETE |
|  TargetResponseTimeAlarmFD6BFEB8                                                              |  AWS::CloudWatch::Alarm                         |  CREATE_COMPLETE |
|  UnhealthyHostAlarmA5C0898D                                                                   |  AWS::CloudWatch::Alarm                         |  CREATE_COMPLETE |
|  PaymentService8D9B0532                                                                       |  AWS::ECS::Service                              |  CREATE_COMPLETE |
|  PaymentDeploymentGroup2417641A                                                               |  AWS::CodeDeploy::DeploymentGroup               |  CREATE_COMPLETE |
|  PaymentExecutionRoleDefaultPolicy3249DC3C                                                    |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  SourceBucketDDD2130A                                                                         |  AWS::S3::Bucket                                |  CREATE_COMPLETE |
|  PipelineRoleDCFDBB91                                                                         |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineApprovalProductionApprovalCodePipelineActionRole14B70AA2                      |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineBuildBuildImageCodePipelineActionRole0A410EB1                                 |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineDeployProductionDeployToProductionCodePipelineActionRole24947C33              |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineDeployStagingDeployToStagingCodePipelineActionRole3F88EDE1                    |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineIntegrationTestRunIntegrationTestsCodePipelineActionRoleEC0782C7              |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineSourceCodePipelineActionRoleC47598D9                                          |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PaymentPipelineUnitTestRunUnitTestsCodePipelineActionRole08AF96FE                            |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  PipelineRoleDefaultPolicy77A82A74                                                            |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipeline253E9956                                                                      |  AWS::CodePipeline::Pipeline                    |  CREATE_COMPLETE |
|  PaymentPipelineApprovalProductionApprovalCodePipelineActionRoleDefaultPolicy0FBDF453         |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipelineBuildBuildImageCodePipelineActionRoleDefaultPolicy45E3270C                    |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipelineDeployProductionDeployToProductionCodePipelineActionRoleDefaultPolicy60A2AE66 |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipelineDeployStagingDeployToStagingCodePipelineActionRoleDefaultPolicy2D918C88       |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipelineIntegrationTestRunIntegrationTestsCodePipelineActionRoleDefaultPolicyD726E8CD |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipelineSourceCodePipelineActionRoleDefaultPolicy1AB7F559                             |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentPipelineUnitTestRunUnitTestsCodePipelineActionRoleDefaultPolicy011735B9               |  AWS::IAM::Policy                               |  CREATE_COMPLETE |
|  PaymentServiceSecurityGroupfromTapStackdevPaymentALBSecurityGroupAE09DCE0805C160E10          |  AWS::EC2::SecurityGroupIngress                 |  CREATE_COMPLETE |
|  SlackWebhookUrl754D14AD                                                                      |  AWS::SSM::Parameter                            |  CREATE_COMPLETE |
|  SlackNotifierRole7EC2C757                                                                    |  AWS::IAM::Role                                 |  CREATE_COMPLETE |
|  SlackNotifierLogGroup8A643683                                                                |  AWS::Logs::LogGroup                            |  CREATE_COMPLETE |
|  SlackNotifier2867FC9C                                                                        |  AWS::Lambda::Function                          |  CREATE_COMPLETE |
|  PipelineStateRule186BFD51                                                                    |  AWS::Events::Rule                              |  CREATE_COMPLETE |
|  PipelineStateRuleAllowEventRuleTapStackdevSlackNotifier15781CB04CE09D53                      |  AWS::Lambda::Permission                        |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet1EIPBD0800F9                                                          |  AWS::EC2::EIP                                  |  CREATE_COMPLETE |
|  PipelineVpcPublicSubnet1NATGatewayA4388274                                                   |  AWS::EC2::NatGateway                           |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet1RouteTable6D8B603D                                                  |  AWS::EC2::RouteTable                           |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet1DefaultRouteC225ACC6                                                |  AWS::EC2::Route                                |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet1Subnet442DCECC                                                      |  AWS::EC2::Subnet                               |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet1RouteTableAssociation791F1EF2                                       |  AWS::EC2::SubnetRouteTableAssociation          |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet2RouteTable9A31913F                                                  |  AWS::EC2::RouteTable                           |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet2DefaultRouteF3A9A6B9                                                |  AWS::EC2::Route                                |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet2SubnetE21FED10                                                      |  AWS::EC2::Subnet                               |  CREATE_COMPLETE |
|  PipelineVpcPrivateSubnet2RouteTableAssociationC502A5A4                                       |  AWS::EC2::SubnetRouteTableAssociation          |  CREATE_COMPLETE |
|  PipelineVpcRestrictDefaultSecurityGroupCustomResourceB527DA03                                |  Custom::VpcRestrictDefaultSG                   |  CREATE_COMPLETE |
+-----------------------------------------------------------------------------------------------+-------------------------------------------------+------------------+
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
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /mnt/d/Projects/Turing/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
  console.log
    Skipping connectivity test on LocalStack - ALB does not serve actual traffic

      at Object.<anonymous> (test/tap-stack.int.test.ts:323:17)

  console.log
    Skipping connectivity test on LocalStack - ALB does not serve actual traffic

      at Object.<anonymous> (test/tap-stack.int.test.ts:340:17)

PASS test/tap-stack.int.test.ts (41.974 s)
  TapStack Integration Tests
    ECS Infrastructure
      ✓ ECS Cluster should exist and be active (107 ms)
      ✓ ECS Service should exist and be running (12 ms)
      ✓ ECS Service should have CodeDeploy deployment controller (9 ms)
    ECR Repository
      ✓ ECR Repository should exist (12 ms)
      ✓ ECR Repository should have image scanning enabled (11 ms)
    CodePipeline
      ✓ CodePipeline should exist and be active (14 ms)
      ✓ CodePipeline should have required stages (8 ms)
    CodeDeploy
      ✓ CodeDeploy Application should exist (11 ms)
      ✓ CodeDeploy should have deployment group (12 ms)
    Application Load Balancer
      ✓ ALB should exist and be active (39 ms)
      ✓ Target Groups should exist (15 ms)
    CloudWatch Alarms
      ✓ CloudWatch Alarms should exist (15 ms)
    Lambda Function
      ✓ Slack Notifier Lambda should exist (28 ms)
    S3 Buckets
      ✓ Artifact Bucket should exist (23 ms)
      ✓ Source Bucket should exist (if using S3 source) (13 ms)
    SSM Parameters
      ✓ SSM Parameters should exist (13 ms)
    SNS Topic
      ✓ Approval SNS Topic should exist (10 ms)
    End-to-End Connectivity
      ✓ Production URL should be accessible (3860 ms)
      ✓ Staging URL should be accessible (2 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        52.764 s, estimated 53 s
Ran all test suites matching /.int.test.ts$/i.
[0;32m🎉 Integration tests completed successfully![0m
[0;34m📊 Test Summary:[0m
[1;33m  • All infrastructure components validated[0m
[1;33m  • LocalStack environment verified[0m
[1;33m  • CDK resources properly configured[0m
[0;32m🎉 Tests completed successfully![0m
