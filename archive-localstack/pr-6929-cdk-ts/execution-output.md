[0;36m╔══════════════════════════════════════════════════════════════════════════════════════════════╗[0m
[0;36m║                              🚀 LocalStack Deploy                                            ║[0m
[0;36m╚══════════════════════════════════════════════════════════════════════════════════════════════╝[0m

[0;34m📍 Stack Path: /mnt/d/Projects/Turing/iac-test-automations[0m

[1;33m🔍 Checking LocalStack status...[0m
[0;32m✅ LocalStack is running[0m

[1;33m🔍 Detecting platform and language...[0m
[0;32m✅ Detected platform: cdk[0m
[0;32m✅ Detected language: ts[0m

[0;35m🚀 Executing deployment for cdk platform...[0m
[0;34m📁 Working directory: /mnt/d/Projects/Turing/iac-test-automations[0m

[0;32m🚀 Starting CDK Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[1;33m🧹 Cleaning LocalStack resources...[0m
[0;32m✅ LocalStack state reset[0m
[1;33m📁 Working directory: /mnt/d/Projects/Turing/iac-test-automations[0m
[0;32m✅ CDK project found: cdk.json[0m
[0;34m🔧 Using CDK Local: ./node_modules/.bin/cdklocal[0m
[1;33m📦 Installing dependencies...[0m
[0;32m✅ Node.js dependencies installed[0m
[1;33m🔨 Building TypeScript...[0m

> tap@0.1.0 build
> tsc --skipLibCheck

[0;32m✅ TypeScript build completed[0m
[1;33m📦 Bootstrapping CDK environment in LocalStack...[0m
[0;32m✅ CDK Bootstrap completed[0m
[0;36m🔧 Deploying CDK stack:[0m
[0;34m  • Stack Name: TapStackdev[0m
[0;34m  • Environment: dev[0m
[0;34m  • Region: us-east-1[0m
[1;33m📦 Deploying CDK stack...[0m
[1;33m[0m
[1;33m✨  Synthesis time: 50.61s[0m
[1;33m[0m
[1;33mTapStackdev: start: Building TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code[0m
[1;33mTapStackdev: success: Built TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code[0m
[1;33mTapStackdev: start: Building TapStackdev Template[0m
[1;33mTapStackdev: success: Built TapStackdev Template[0m
[1;33mTapStackdev: start: Publishing TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)[0m
[1;33mTapStackdev: start: Publishing TapStackdev Template (000000000000-us-east-1-a461b42d)[0m
[1;33mTapStackdev: success: Published TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)[0m
[1;33mTapStackdev: success: Published TapStackdev Template (000000000000-us-east-1-a461b42d)[0m
[1;33mTapStackdev: deploying... [1/1][0m
[1;33mTapStackdev: creating CloudFormation changeset...[0m
[1;33mTapStackdev |  0/85 | 8:47:12 AM | REVIEW_IN_PROGRESS   | AWS::CloudFormation::Stack                    | TapStackdev User Initiated[0m
[0;34m🔄 TapStackdev |  0/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::CloudFormation::Stack                    | TapStackdev [0m
[0;34m🔄 TapStackdev |  0/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::SNS::Topic                               | ApprovalTopic (ApprovalTopic1D517B4C) [0m
[0;32m✅ TapStackdev |  1/85 | 8:47:12 AM | CREATE_COMPLETE      | AWS::SNS::Topic                               | ApprovalTopic (ApprovalTopic1D517B4C) [0m
[0;34m🔄 TapStackdev |  1/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPC                                 | PipelineVpc (PipelineVpc0543904A) [0m
[0;34m🔄 TapStackdev |  1/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::TargetGroup      | BlueTargetGroup (BlueTargetGroupF108EB01) [0m
[0;32m✅ TapStackdev |  2/85 | 8:47:12 AM | CREATE_COMPLETE      | AWS::EC2::VPC                                 | PipelineVpc (PipelineVpc0543904A) [0m
[0;32m✅ TapStackdev |  3/85 | 8:47:12 AM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::TargetGroup      | BlueTargetGroup (BlueTargetGroupF108EB01) [0m
[0;34m🔄 TapStackdev |  3/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                           | BuildLogGroup (BuildLogGroup61A736A8) [0m
[0;34m🔄 TapStackdev |  3/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::ECR::Repository                          | PaymentServiceECR (PaymentServiceECR261773D9) [0m
[0;32m✅ TapStackdev |  4/85 | 8:47:12 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                           | BuildLogGroup (BuildLogGroup61A736A8) [0m
[0;32m✅ TapStackdev |  5/85 | 8:47:12 AM | CREATE_COMPLETE      | AWS::ECR::Repository                          | PaymentServiceECR (PaymentServiceECR261773D9) [0m
[0;34m🔄 TapStackdev |  5/85 | 8:47:12 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | CodeBuildRole (CodeBuildRole728CBADE) [0m
[0;32m✅ TapStackdev |  6/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | CodeBuildRole (CodeBuildRole728CBADE) [0m
[0;34m🔄 TapStackdev |  6/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::CodeBuild::Project                       | BuildProject (BuildProject097C5DB7) [0m
[0;32m✅ TapStackdev |  7/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::CodeBuild::Project                       | BuildProject (BuildProject097C5DB7) [0m
[0;32m✅ TapStackdev |  8/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::CDK::Metadata                            | CDKMetadata/Default (CDKMetadata) [0m
[0;34m🔄 TapStackdev |  8/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::CDK::Metadata                            | CDKMetadata/Default (CDKMetadata) [0m
[0;34m🔄 TapStackdev |  8/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                           | IntegrationTestLogGroup (IntegrationTestLogGroupAD80749A) [0m
[0;34m🔄 TapStackdev |  8/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                           | UnitTestLogGroup (UnitTestLogGroupEA88B9B5) [0m
[0;32m✅ TapStackdev |  9/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                           | IntegrationTestLogGroup (IntegrationTestLogGroupAD80749A) [0m
[0;32m✅ TapStackdev | 10/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                           | UnitTestLogGroup (UnitTestLogGroupEA88B9B5) [0m
[0;34m🔄 TapStackdev | 10/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::SSM::Parameter                           | StagingEndpoint (StagingEndpoint479919D5) [0m
[0;34m🔄 TapStackdev | 10/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::CodeBuild::Project                       | IntegrationTestProject (IntegrationTestProjectB37FF01A) [0m
[0;32m✅ TapStackdev | 11/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::SSM::Parameter                           | StagingEndpoint (StagingEndpoint479919D5) [0m
[0;32m✅ TapStackdev | 12/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::CodeBuild::Project                       | IntegrationTestProject (IntegrationTestProjectB37FF01A) [0m
[0;34m🔄 TapStackdev | 12/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::CodeBuild::Project                       | UnitTestProject (UnitTestProject1D06E9F9) [0m
[0;32m✅ TapStackdev | 13/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::CodeBuild::Project                       | UnitTestProject (UnitTestProject1D06E9F9) [0m
[0;34m🔄 TapStackdev | 13/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                               | PipelineArtifacts (PipelineArtifacts4A9B2621) [0m
[0;34m🔄 TapStackdev | 13/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | CodeBuildRole/DefaultPolicy (CodeBuildRoleDefaultPolicy829527DE) [0m
[0;32m✅ TapStackdev | 14/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::S3::Bucket                               | PipelineArtifacts (PipelineArtifacts4A9B2621) [0m
[0;32m✅ TapStackdev | 15/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | CodeBuildRole/DefaultPolicy (CodeBuildRoleDefaultPolicy829527DE) [0m
[0;34m🔄 TapStackdev | 15/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | CodeDeployRole (CodeDeployRole12BEECBE) [0m
[0;34m🔄 TapStackdev | 15/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) [0m
[0;32m✅ TapStackdev | 16/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | CodeDeployRole (CodeDeployRole12BEECBE) [0m
[0;34m🔄 TapStackdev | 16/85 | 8:47:13 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                         | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) [0m
[0;32m✅ TapStackdev | 17/85 | 8:47:13 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) [0m
[0;32m✅ TapStackdev | 18/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::Lambda::Function                         | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) [0m
[0;34m🔄 TapStackdev | 18/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::TargetGroup      | GreenTargetGroup (GreenTargetGroupEEB2DF3E) [0m
[0;32m✅ TapStackdev | 19/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::TargetGroup      | GreenTargetGroup (GreenTargetGroupEEB2DF3E) [0m
[0;34m🔄 TapStackdev | 19/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::InternetGateway                     | PipelineVpc/IGW (PipelineVpcIGW3FA4A524) [0m
[0;34m🔄 TapStackdev | 19/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCGatewayAttachment                | PipelineVpc/VPCGW (PipelineVpcVPCGW3256101F) [0m
[0;32m✅ TapStackdev | 20/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::InternetGateway                     | PipelineVpc/IGW (PipelineVpcIGW3FA4A524) [0m
[0;34m🔄 TapStackdev | 20/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                          | PipelineVpc/PublicSubnet2/RouteTable (PipelineVpcPublicSubnet2RouteTable5219ED4D) [0m
[0;32m✅ TapStackdev | 21/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::VPCGatewayAttachment                | PipelineVpc/VPCGW (PipelineVpcVPCGW3256101F) [0m
[0;34m🔄 TapStackdev | 21/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                               | PipelineVpc/PublicSubnet2/DefaultRoute (PipelineVpcPublicSubnet2DefaultRoute04C861A0) [0m
[0;32m✅ TapStackdev | 22/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                          | PipelineVpc/PublicSubnet2/RouteTable (PipelineVpcPublicSubnet2RouteTable5219ED4D) [0m
[0;34m🔄 TapStackdev | 22/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                          | PipelineVpc/PublicSubnet1/RouteTable (PipelineVpcPublicSubnet1RouteTableE9A67515) [0m
[0;32m✅ TapStackdev | 23/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::Route                               | PipelineVpc/PublicSubnet2/DefaultRoute (PipelineVpcPublicSubnet2DefaultRoute04C861A0) [0m
[0;32m✅ TapStackdev | 24/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                          | PipelineVpc/PublicSubnet1/RouteTable (PipelineVpcPublicSubnet1RouteTableE9A67515) [0m
[0;34m🔄 TapStackdev | 24/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                              | PipelineVpc/PublicSubnet1/Subnet (PipelineVpcPublicSubnet1Subnet26FF83E2) [0m
[0;34m🔄 TapStackdev | 24/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PublicSubnet1/RouteTableAssociation (PipelineVpcPublicSubnet1RouteTableAssociation6D13736B) [0m
[0;32m✅ TapStackdev | 25/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                              | PipelineVpc/PublicSubnet1/Subnet (PipelineVpcPublicSubnet1Subnet26FF83E2) [0m
[0;34m🔄 TapStackdev | 25/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                               | PipelineVpc/PublicSubnet1/DefaultRoute (PipelineVpcPublicSubnet1DefaultRoute44F3E91D) [0m
[0;32m✅ TapStackdev | 26/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PublicSubnet1/RouteTableAssociation (PipelineVpcPublicSubnet1RouteTableAssociation6D13736B) [0m
[0;34m🔄 TapStackdev | 26/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                              | PipelineVpc/PublicSubnet2/Subnet (PipelineVpcPublicSubnet2Subnet64F58E18) [0m
[0;32m✅ TapStackdev | 27/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::Route                               | PipelineVpc/PublicSubnet1/DefaultRoute (PipelineVpcPublicSubnet1DefaultRoute44F3E91D) [0m
[0;34m🔄 TapStackdev | 27/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PublicSubnet2/RouteTableAssociation (PipelineVpcPublicSubnet2RouteTableAssociation54D39738) [0m
[0;32m✅ TapStackdev | 28/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                              | PipelineVpc/PublicSubnet2/Subnet (PipelineVpcPublicSubnet2Subnet64F58E18) [0m
[0;34m🔄 TapStackdev | 28/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup                       | PaymentALB/SecurityGroup (PaymentALBSecurityGroup45E5B5F1) [0m
[0;32m✅ TapStackdev | 29/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PublicSubnet2/RouteTableAssociation (PipelineVpcPublicSubnet2RouteTableAssociation54D39738) [0m
[0;34m🔄 TapStackdev | 29/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::LoadBalancer     | PaymentALB (PaymentALBFB8F45F3) [0m
[0;32m✅ TapStackdev | 30/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::SecurityGroup                       | PaymentALB/SecurityGroup (PaymentALBSecurityGroup45E5B5F1) [0m
[0;32m✅ TapStackdev | 31/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::LoadBalancer     | PaymentALB (PaymentALBFB8F45F3) [0m
[0;34m🔄 TapStackdev | 31/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                        | Http5xxAlarm (Http5xxAlarm2F844FC7) [0m
[0;32m✅ TapStackdev | 32/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                        | Http5xxAlarm (Http5xxAlarm2F844FC7) [0m
[0;34m🔄 TapStackdev | 32/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::Listener         | PaymentALB/ProdListener (PaymentALBProdListener27393BD4) [0m
[0;34m🔄 TapStackdev | 32/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentTaskRole (PaymentTaskRole22CAA669) [0m
[0;32m✅ TapStackdev | 33/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::Listener         | PaymentALB/ProdListener (PaymentALBProdListener27393BD4) [0m
[0;34m🔄 TapStackdev | 33/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                           | PaymentServiceLogGroup (PaymentServiceLogGroupE9944FE7) [0m
[0;32m✅ TapStackdev | 34/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentTaskRole (PaymentTaskRole22CAA669) [0m
[0;32m✅ TapStackdev | 35/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                           | PaymentServiceLogGroup (PaymentServiceLogGroupE9944FE7) [0m
[0;34m🔄 TapStackdev | 35/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentExecutionRole (PaymentExecutionRole63045D24) [0m
[0;32m✅ TapStackdev | 36/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentExecutionRole (PaymentExecutionRole63045D24) [0m
[0;34m🔄 TapStackdev | 36/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ECS::TaskDefinition                      | PaymentTaskDef (PaymentTaskDef91F28CEE) [0m
[0;34m🔄 TapStackdev | 36/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup                       | PaymentService/SecurityGroup (PaymentServiceSecurityGroupA6B8193F) [0m
[0;32m✅ TapStackdev | 37/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ECS::TaskDefinition                      | PaymentTaskDef (PaymentTaskDef91F28CEE) [0m
[0;34m🔄 TapStackdev | 37/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroupEgress                 | PaymentALB/SecurityGroup/to TapStackdevPaymentServiceSecurityGroup3E786E91:80 (PaymentALBSecurityGrouptoTapStackdevPaymentServiceSecurityGroup3E786E91804409F29F) [0m
[0;32m✅ TapStackdev | 38/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::SecurityGroup                       | PaymentService/SecurityGroup (PaymentServiceSecurityGroupA6B8193F) [0m
[0;34m🔄 TapStackdev | 38/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::Listener         | PaymentALB/TestListener (PaymentALBTestListenerB62D0B27) [0m
[0;32m✅ TapStackdev | 39/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::EC2::SecurityGroupEgress                 | PaymentALB/SecurityGroup/to TapStackdevPaymentServiceSecurityGroup3E786E91:80 (PaymentALBSecurityGrouptoTapStackdevPaymentServiceSecurityGroup3E786E91804409F29F) [0m
[0;34m🔄 TapStackdev | 39/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ECS::Cluster                             | PaymentCluster (PaymentClusterC76E6148) [0m
[0;32m✅ TapStackdev | 40/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::Listener         | PaymentALB/TestListener (PaymentALBTestListenerB62D0B27) [0m
[0;34m🔄 TapStackdev | 40/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ECS::ClusterCapacityProviderAssociations | PaymentCluster/PaymentCluster (PaymentCluster16F92FB4) [0m
[0;32m✅ TapStackdev | 41/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ECS::Cluster                             | PaymentCluster (PaymentClusterC76E6148) [0m
[0;34m🔄 TapStackdev | 41/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::CodeDeploy::Application                  | PaymentCodeDeployApp (PaymentCodeDeployApp152E5410) [0m
[0;32m✅ TapStackdev | 42/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::ECS::ClusterCapacityProviderAssociations | PaymentCluster/PaymentCluster (PaymentCluster16F92FB4) [0m
[0;32m✅ TapStackdev | 43/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::CodeDeploy::Application                  | PaymentCodeDeployApp (PaymentCodeDeployApp152E5410) [0m
[0;34m🔄 TapStackdev | 43/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                        | TargetResponseTimeAlarm (TargetResponseTimeAlarmFD6BFEB8) [0m
[0;32m✅ TapStackdev | 44/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                        | TargetResponseTimeAlarm (TargetResponseTimeAlarmFD6BFEB8) [0m
[0;34m🔄 TapStackdev | 44/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                        | UnhealthyHostAlarm (UnhealthyHostAlarmA5C0898D) [0m
[0;32m✅ TapStackdev | 45/85 | 8:47:15 AM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                        | UnhealthyHostAlarm (UnhealthyHostAlarmA5C0898D) [0m
[0;34m🔄 TapStackdev | 45/85 | 8:47:15 AM | CREATE_IN_PROGRESS   | AWS::ECS::Service                             | PaymentService/Service (PaymentService8D9B0532) [0m
[0;32m✅ TapStackdev | 46/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::ECS::Service                             | PaymentService/Service (PaymentService8D9B0532) [0m
[0;34m🔄 TapStackdev | 46/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::CodeDeploy::DeploymentGroup              | PaymentDeploymentGroup (PaymentDeploymentGroup2417641A) [0m
[0;32m✅ TapStackdev | 47/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::CodeDeploy::DeploymentGroup              | PaymentDeploymentGroup (PaymentDeploymentGroup2417641A) [0m
[0;34m🔄 TapStackdev | 47/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentExecutionRole/DefaultPolicy (PaymentExecutionRoleDefaultPolicy3249DC3C) [0m
[0;32m✅ TapStackdev | 48/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentExecutionRole/DefaultPolicy (PaymentExecutionRoleDefaultPolicy3249DC3C) [0m
[0;34m🔄 TapStackdev | 48/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                               | SourceBucket (SourceBucketDDD2130A) [0m
[0;32m✅ TapStackdev | 49/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::S3::Bucket                               | SourceBucket (SourceBucketDDD2130A) [0m
[0;34m🔄 TapStackdev | 49/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PipelineRole (PipelineRoleDCFDBB91) [0m
[0;34m🔄 TapStackdev | 49/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/Approval/ProductionApproval/CodePipelineActionRole (PaymentPipelineApprovalProductionApprovalCodePipelineActionRole14B70AA2) [0m
[0;32m✅ TapStackdev | 50/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PipelineRole (PipelineRoleDCFDBB91) [0m
[0;34m🔄 TapStackdev | 50/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/Build/BuildImage/CodePipelineActionRole (PaymentPipelineBuildBuildImageCodePipelineActionRole0A410EB1) [0m
[0;32m✅ TapStackdev | 51/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/Approval/ProductionApproval/CodePipelineActionRole (PaymentPipelineApprovalProductionApprovalCodePipelineActionRole14B70AA2) [0m
[0;34m🔄 TapStackdev | 51/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/DeployProduction/DeployToProduction/CodePipelineActionRole (PaymentPipelineDeployProductionDeployToProductionCodePipelineActionRole24947C33) [0m
[0;32m✅ TapStackdev | 52/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/Build/BuildImage/CodePipelineActionRole (PaymentPipelineBuildBuildImageCodePipelineActionRole0A410EB1) [0m
[0;34m🔄 TapStackdev | 52/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/DeployStaging/DeployToStaging/CodePipelineActionRole (PaymentPipelineDeployStagingDeployToStagingCodePipelineActionRole3F88EDE1) [0m
[0;32m✅ TapStackdev | 53/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/DeployProduction/DeployToProduction/CodePipelineActionRole (PaymentPipelineDeployProductionDeployToProductionCodePipelineActionRole24947C33) [0m
[0;32m✅ TapStackdev | 54/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/DeployStaging/DeployToStaging/CodePipelineActionRole (PaymentPipelineDeployStagingDeployToStagingCodePipelineActionRole3F88EDE1) [0m
[0;34m🔄 TapStackdev | 54/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/IntegrationTest/RunIntegrationTests/CodePipelineActionRole (PaymentPipelineIntegrationTestRunIntegrationTestsCodePipelineActionRoleEC0782C7) [0m
[0;32m✅ TapStackdev | 55/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/IntegrationTest/RunIntegrationTests/CodePipelineActionRole (PaymentPipelineIntegrationTestRunIntegrationTestsCodePipelineActionRoleEC0782C7) [0m
[0;34m🔄 TapStackdev | 55/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/Source/Source/CodePipelineActionRole (PaymentPipelineSourceCodePipelineActionRoleC47598D9) [0m
[0;34m🔄 TapStackdev | 55/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | PaymentPipeline/UnitTest/RunUnitTests/CodePipelineActionRole (PaymentPipelineUnitTestRunUnitTestsCodePipelineActionRole08AF96FE) [0m
[0;32m✅ TapStackdev | 56/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/Source/Source/CodePipelineActionRole (PaymentPipelineSourceCodePipelineActionRoleC47598D9) [0m
[0;34m🔄 TapStackdev | 56/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PipelineRole/DefaultPolicy (PipelineRoleDefaultPolicy77A82A74) [0m
[0;32m✅ TapStackdev | 57/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | PaymentPipeline/UnitTest/RunUnitTests/CodePipelineActionRole (PaymentPipelineUnitTestRunUnitTestsCodePipelineActionRole08AF96FE) [0m
[0;32m✅ TapStackdev | 58/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PipelineRole/DefaultPolicy (PipelineRoleDefaultPolicy77A82A74) [0m
[0;34m🔄 TapStackdev | 58/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::CodePipeline::Pipeline                   | PaymentPipeline (PaymentPipeline253E9956) [0m
[0;34m🔄 TapStackdev | 58/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/Approval/ProductionApproval/CodePipelineActionRole/DefaultPolicy (PaymentPipelineApprovalProductionApprovalCodePipelineActionRoleDefaultPolicy0FBDF453) [0m
[0;32m✅ TapStackdev | 59/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::CodePipeline::Pipeline                   | PaymentPipeline (PaymentPipeline253E9956) [0m
[0;32m✅ TapStackdev | 60/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/Approval/ProductionApproval/CodePipelineActionRole/DefaultPolicy (PaymentPipelineApprovalProductionApprovalCodePipelineActionRoleDefaultPolicy0FBDF453) [0m
[0;34m🔄 TapStackdev | 60/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/Build/BuildImage/CodePipelineActionRole/DefaultPolicy (PaymentPipelineBuildBuildImageCodePipelineActionRoleDefaultPolicy45E3270C) [0m
[0;34m🔄 TapStackdev | 60/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/DeployProduction/DeployToProduction/CodePipelineActionRole/DefaultPolicy (PaymentPipelineDeployProductionDeployToProductionCodePipelineActionRoleDefaultPolicy60A2AE66) [0m
[0;32m✅ TapStackdev | 61/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/Build/BuildImage/CodePipelineActionRole/DefaultPolicy (PaymentPipelineBuildBuildImageCodePipelineActionRoleDefaultPolicy45E3270C) [0m
[0;32m✅ TapStackdev | 62/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/DeployProduction/DeployToProduction/CodePipelineActionRole/DefaultPolicy (PaymentPipelineDeployProductionDeployToProductionCodePipelineActionRoleDefaultPolicy60A2AE66) [0m
[0;34m🔄 TapStackdev | 62/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/DeployStaging/DeployToStaging/CodePipelineActionRole/DefaultPolicy (PaymentPipelineDeployStagingDeployToStagingCodePipelineActionRoleDefaultPolicy2D918C88) [0m
[0;34m🔄 TapStackdev | 62/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/IntegrationTest/RunIntegrationTests/CodePipelineActionRole/DefaultPolicy (PaymentPipelineIntegrationTestRunIntegrationTestsCodePipelineActionRoleDefaultPolicyD726E8CD) [0m
[0;32m✅ TapStackdev | 63/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/DeployStaging/DeployToStaging/CodePipelineActionRole/DefaultPolicy (PaymentPipelineDeployStagingDeployToStagingCodePipelineActionRoleDefaultPolicy2D918C88) [0m
[0;34m🔄 TapStackdev | 63/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/Source/Source/CodePipelineActionRole/DefaultPolicy (PaymentPipelineSourceCodePipelineActionRoleDefaultPolicy1AB7F559) [0m
[0;32m✅ TapStackdev | 64/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/IntegrationTest/RunIntegrationTests/CodePipelineActionRole/DefaultPolicy (PaymentPipelineIntegrationTestRunIntegrationTestsCodePipelineActionRoleDefaultPolicyD726E8CD) [0m
[0;34m🔄 TapStackdev | 64/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                              | PaymentPipeline/UnitTest/RunUnitTests/CodePipelineActionRole/DefaultPolicy (PaymentPipelineUnitTestRunUnitTestsCodePipelineActionRoleDefaultPolicy011735B9) [0m
[0;32m✅ TapStackdev | 65/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/Source/Source/CodePipelineActionRole/DefaultPolicy (PaymentPipelineSourceCodePipelineActionRoleDefaultPolicy1AB7F559) [0m
[0;34m🔄 TapStackdev | 65/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroupIngress                | PaymentService/SecurityGroup/from TapStackdevPaymentALBSecurityGroupAE09DCE0:80 (PaymentServiceSecurityGroupfromTapStackdevPaymentALBSecurityGroupAE09DCE0805C160E10) [0m
[0;32m✅ TapStackdev | 66/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Policy                              | PaymentPipeline/UnitTest/RunUnitTests/CodePipelineActionRole/DefaultPolicy (PaymentPipelineUnitTestRunUnitTestsCodePipelineActionRoleDefaultPolicy011735B9) [0m
[0;32m✅ TapStackdev | 67/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::EC2::SecurityGroupIngress                | PaymentService/SecurityGroup/from TapStackdevPaymentALBSecurityGroupAE09DCE0:80 (PaymentServiceSecurityGroupfromTapStackdevPaymentALBSecurityGroupAE09DCE0805C160E10) [0m
[0;34m🔄 TapStackdev | 67/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::SSM::Parameter                           | SlackWebhookUrl (SlackWebhookUrl754D14AD) [0m
[0;32m✅ TapStackdev | 68/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::SSM::Parameter                           | SlackWebhookUrl (SlackWebhookUrl754D14AD) [0m
[0;34m🔄 TapStackdev | 68/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                                | SlackNotifierRole (SlackNotifierRole7EC2C757) [0m
[0;34m🔄 TapStackdev | 68/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                           | SlackNotifierLogGroup (SlackNotifierLogGroup8A643683) [0m
[0;32m✅ TapStackdev | 69/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::IAM::Role                                | SlackNotifierRole (SlackNotifierRole7EC2C757) [0m
[0;34m🔄 TapStackdev | 69/85 | 8:47:17 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                         | SlackNotifier (SlackNotifier2867FC9C) [0m
[0;32m✅ TapStackdev | 70/85 | 8:47:17 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                           | SlackNotifierLogGroup (SlackNotifierLogGroup8A643683) [0m
[0;34m🔄 TapStackdev | 70/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::Events::Rule                             | PipelineStateRule (PipelineStateRule186BFD51) [0m
[0;32m✅ TapStackdev | 71/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::Lambda::Function                         | SlackNotifier (SlackNotifier2867FC9C) [0m
[0;34m🔄 TapStackdev | 71/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission                       | PipelineStateRule/AllowEventRuleTapStackdevSlackNotifier15781CB0 (PipelineStateRuleAllowEventRuleTapStackdevSlackNotifier15781CB04CE09D53) [0m
[0;32m✅ TapStackdev | 72/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::Events::Rule                             | PipelineStateRule (PipelineStateRule186BFD51) [0m
[0;34m🔄 TapStackdev | 72/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                                 | PipelineVpc/PublicSubnet1/EIP (PipelineVpcPublicSubnet1EIPBD0800F9) [0m
[0;32m✅ TapStackdev | 73/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::Lambda::Permission                       | PipelineStateRule/AllowEventRuleTapStackdevSlackNotifier15781CB0 (PipelineStateRuleAllowEventRuleTapStackdevSlackNotifier15781CB04CE09D53) [0m
[0;34m🔄 TapStackdev | 73/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                          | PipelineVpc/PublicSubnet1/NATGateway (PipelineVpcPublicSubnet1NATGatewayA4388274) [0m
[0;32m✅ TapStackdev | 74/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::EIP                                 | PipelineVpc/PublicSubnet1/EIP (PipelineVpcPublicSubnet1EIPBD0800F9) [0m
[0;34m🔄 TapStackdev | 74/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                          | PipelineVpc/PrivateSubnet1/RouteTable (PipelineVpcPrivateSubnet1RouteTable6D8B603D) [0m
[0;32m✅ TapStackdev | 75/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::NatGateway                          | PipelineVpc/PublicSubnet1/NATGateway (PipelineVpcPublicSubnet1NATGatewayA4388274) [0m
[0;34m🔄 TapStackdev | 75/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                               | PipelineVpc/PrivateSubnet1/DefaultRoute (PipelineVpcPrivateSubnet1DefaultRouteC225ACC6) [0m
[0;32m✅ TapStackdev | 76/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                          | PipelineVpc/PrivateSubnet1/RouteTable (PipelineVpcPrivateSubnet1RouteTable6D8B603D) [0m
[0;34m🔄 TapStackdev | 76/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                              | PipelineVpc/PrivateSubnet1/Subnet (PipelineVpcPrivateSubnet1Subnet442DCECC) [0m
[0;32m✅ TapStackdev | 77/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::Route                               | PipelineVpc/PrivateSubnet1/DefaultRoute (PipelineVpcPrivateSubnet1DefaultRouteC225ACC6) [0m
[0;34m🔄 TapStackdev | 77/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PrivateSubnet1/RouteTableAssociation (PipelineVpcPrivateSubnet1RouteTableAssociation791F1EF2) [0m
[0;32m✅ TapStackdev | 78/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                              | PipelineVpc/PrivateSubnet1/Subnet (PipelineVpcPrivateSubnet1Subnet442DCECC) [0m
[0;32m✅ TapStackdev | 79/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PrivateSubnet1/RouteTableAssociation (PipelineVpcPrivateSubnet1RouteTableAssociation791F1EF2) [0m
[0;34m🔄 TapStackdev | 79/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                          | PipelineVpc/PrivateSubnet2/RouteTable (PipelineVpcPrivateSubnet2RouteTable9A31913F) [0m
[0;34m🔄 TapStackdev | 79/85 | 8:48:32 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                               | PipelineVpc/PrivateSubnet2/DefaultRoute (PipelineVpcPrivateSubnet2DefaultRouteF3A9A6B9) [0m
[0;32m✅ TapStackdev | 80/85 | 8:48:32 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                          | PipelineVpc/PrivateSubnet2/RouteTable (PipelineVpcPrivateSubnet2RouteTable9A31913F) [0m
[0;34m🔄 TapStackdev | 80/85 | 8:48:33 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                              | PipelineVpc/PrivateSubnet2/Subnet (PipelineVpcPrivateSubnet2SubnetE21FED10) [0m
[0;32m✅ TapStackdev | 81/85 | 8:48:33 AM | CREATE_COMPLETE      | AWS::EC2::Route                               | PipelineVpc/PrivateSubnet2/DefaultRoute (PipelineVpcPrivateSubnet2DefaultRouteF3A9A6B9) [0m
[0;34m🔄 TapStackdev | 81/85 | 8:48:33 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PrivateSubnet2/RouteTableAssociation (PipelineVpcPrivateSubnet2RouteTableAssociationC502A5A4) [0m
[0;32m✅ TapStackdev | 82/85 | 8:48:33 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                              | PipelineVpc/PrivateSubnet2/Subnet (PipelineVpcPrivateSubnet2SubnetE21FED10) [0m
[0;34m🔄 TapStackdev | 82/85 | 8:48:33 AM | CREATE_IN_PROGRESS   | Custom::VpcRestrictDefaultSG                  | PipelineVpc/RestrictDefaultSecurityGroupCustomResource/Default (PipelineVpcRestrictDefaultSecurityGroupCustomResourceB527DA03) [0m
[0;32m✅ TapStackdev | 83/85 | 8:48:33 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation         | PipelineVpc/PrivateSubnet2/RouteTableAssociation (PipelineVpcPrivateSubnet2RouteTableAssociationC502A5A4) [0m
[0;32m✅ TapStackdev | 84/85 | 8:48:42 AM | CREATE_COMPLETE      | Custom::VpcRestrictDefaultSG                  | PipelineVpc/RestrictDefaultSecurityGroupCustomResource/Default (PipelineVpcRestrictDefaultSecurityGroupCustomResourceB527DA03) [0m
[0;32m✅ TapStackdev | 85/85 | 8:48:42 AM | CREATE_COMPLETE      | AWS::CloudFormation::Stack                    | TapStackdev [0m
[1;33m[0m
[1;33m ✅  TapStackdev[0m
[1;33m[0m
[1;33m✨  Deployment time: 90.68s[0m
[1;33m[0m
[0;36m📋 Outputs:[0m
[1;33mTapStackdev.ALBDnsName = payment-service-alb-dev.elb.localhost.localstack.cloud[0m
[1;33mTapStackdev.CodeDeployApplicationName = payment-service-app-dev[0m
[1;33mTapStackdev.ECRRepositoryUri = 000000000000.dkr.ecr.us-east-1.localhost.localstack.cloud:4566/payment-service-dev[0m
[1;33mTapStackdev.PipelineName = payment-service-pipeline-dev[0m
[1;33mTapStackdev.ProductionURL = http://payment-service-alb-dev.elb.localhost.localstack.cloud[0m
[1;33mTapStackdev.StagingURL = http://payment-service-alb-dev.elb.localhost.localstack.cloud:8080[0m
[1;33mStack ARN:[0m
[1;33marn:aws:cloudformation:us-east-1:000000000000:stack/TapStackdev/6f1f62d4-1678-4578-825d-c86b51b29b12[0m
[1;33m[0m
[1;33m✨  Total time: 141.3s[0m
[1;33m[0m
[1;33m[0m
[1;33mNOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)[0m
[1;33m[0m
[1;33m34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)[0m
[1;33m[0m
[1;33m	Overview: We do not collect customer content and we anonymize the[0m
[1;33m	          telemetry we do collect. See the attached issue for more[0m
[1;33m	          information on what data is collected, why, and how to[0m
[1;33m	          opt-out. Telemetry will NOT be collected for any CDK CLI[0m
[1;33m	          version prior to version 2.1100.0 - regardless of[0m
[1;33m	          opt-in/out. You can also preview the telemetry we will start[0m
[1;33m	          collecting by logging it to a local file, by adding[0m
[1;33m	          `--unstable=telemetry --telemetry-file=my/local/file` to any[0m
[1;33m	          `cdk` command.[0m
[1;33m[0m
[1;33m	Affected versions: cli: ^2.0.0[0m
[1;33m[0m
[1;33m	More information at: https://github.com/aws/aws-cdk/issues/34892[0m
[1;33m[0m
[1;33m[0m
[1;33mIf you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".[0m
[0;32m⏱️  Total deployment time: 145s[0m
[1;33m🔍 Verifying deployment...[0m
[0;32m✅ Stack status: CREATE_COMPLETE[0m
[0;36m📊 Final Resource Summary:[0m
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
[0;32m✅ Successfully deployed resources: 84[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json[0m
[1;33mℹ️  No stack outputs defined[0m
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: TapStackdev[0m
[0;34m  • Status: CREATE_COMPLETE[0m
[0;34m  • Resources: 84 deployed[0m
[0;34m  • Duration: 145s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 CDK deployment to LocalStack completed successfully![0m
[0;32m🎉 Deployment completed successfully![0m
