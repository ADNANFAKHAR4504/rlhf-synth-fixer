
> tap@0.1.0 localstack:cdk:deploy
> ./scripts/localstack-cdk-deploy.sh

[0;32m🚀 Starting CDK Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[1;33m🧹 Cleaning LocalStack resources...[0m
[0;34m  🗑️  Deleting existing CDK stack: CDKToolkit[0m
[0;34m  🗑️  Deleting existing CDK stack: TapStackdev[0m
[0;32m✅ LocalStack state reset[0m
[1;33m📁 Working directory: /home/drank/Turing/iac-test-automations[0m
[0;32m✅ CDK project found: cdk.json[0m
[0;34m🔧 Using CDK Local: cdklocal[0m
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
[1;33m[WARNING] aws-cdk-lib.aws_ecs.ClusterProps#containerInsights is deprecated.[0m
[1;33m  See {@link containerInsightsV2 }[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[WARNING] aws-cdk-lib.aws_dynamodb.TableOptionsV2#pointInTimeRecovery is deprecated.[0m
[1;33m  use `pointInTimeRecoverySpecification` instead[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.[0m
[1;33m  use `logGroup` instead[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.[0m
[1;33m  use `logGroup` instead[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.[0m
[1;33m  use `logGroup` instead[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.[0m
[1;33m  use `logGroup` instead[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.[0m
[1;33m  use `logGroup` instead[0m
[1;33m  This API will be removed in the next major release.[0m
[1;33m[0m
[1;33m✨  Synthesis time: 3.56s[0m
[1;33m[0m
[1;33mTapStackdev: start: Building TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code[0m
[1;33mTapStackdev: success: Built TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code[0m
[1;33mTapStackdev: start: Building LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code[0m
[1;33mTapStackdev: success: Built LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code[0m
[1;33mTapStackdev: start: Building TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code[0m
[1;33mTapStackdev: success: Built TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code[0m
[1;33mTapStackdev: start: Publishing TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)[0m
[1;33mTapStackdev: start: Building TapStackdev Template[0m
[1;33mTapStackdev: success: Built TapStackdev Template[0m
[1;33mTapStackdev: start: Publishing TapStackdev Template (000000000000-us-east-1-67e81fea)[0m
[1;33mTapStackdev: start: Publishing LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code (000000000000-us-east-1-17f9718a)[0m
[1;33mTapStackdev: start: Publishing TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (000000000000-us-east-1-bbba35f2)[0m
[1;33mTapStackdev: success: Published TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (000000000000-us-east-1-bbba35f2)[0m
[1;33mTapStackdev: success: Published TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)[0m
[1;33mTapStackdev: success: Published LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code (000000000000-us-east-1-17f9718a)[0m
[1;33mTapStackdev: success: Published TapStackdev Template (000000000000-us-east-1-67e81fea)[0m
[1;33mTapStackdev: deploying... [1/1][0m
[1;33mTapStackdev: creating CloudFormation changeset...[0m
[1;33mTapStackdev |   0/138 | 2:01:23 PM | REVIEW_IN_PROGRESS   | AWS::CloudFormation::Stack                  | TapStackdev User Initiated[0m
[0;34m🔄 TapStackdev |   0/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::CloudFormation::Stack                  | TapStackdev [0m
[0;34m🔄 TapStackdev |   0/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::VPC                               | Network/VPC (NetworkVPC962EC14D) [0m
[0;32m✅ TapStackdev |   1/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::CDK::Metadata                          | CDKMetadata/Default (CDKMetadata) [0m
[0;34m🔄 TapStackdev |   1/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::CDK::Metadata                          | CDKMetadata/Default (CDKMetadata) [0m
[0;34m🔄 TapStackdev |   1/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/PublicSubnet2/RouteTable (NetworkVPCPublicSubnet2RouteTable40E8A765) [0m
[0;32m✅ TapStackdev |   2/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::VPC                               | Network/VPC (NetworkVPC962EC14D) [0m
[0;34m🔄 TapStackdev |   2/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/PublicSubnet2/Subnet (NetworkVPCPublicSubnet2SubnetF5D10D0A) [0m
[0;32m✅ TapStackdev |   3/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/PublicSubnet2/RouteTable (NetworkVPCPublicSubnet2RouteTable40E8A765) [0m
[0;34m🔄 TapStackdev |   3/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PublicSubnet2/RouteTableAssociation (NetworkVPCPublicSubnet2RouteTableAssociation75697915) [0m
[0;32m✅ TapStackdev |   4/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/PublicSubnet2/Subnet (NetworkVPCPublicSubnet2SubnetF5D10D0A) [0m
[0;32m✅ TapStackdev |   5/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PublicSubnet2/RouteTableAssociation (NetworkVPCPublicSubnet2RouteTableAssociation75697915) [0m
[0;34m🔄 TapStackdev |   5/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::InternetGateway                   | Network/VPC/IGW (NetworkVPCIGWF93F4916) [0m
[0;34m🔄 TapStackdev |   5/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::VPCGatewayAttachment              | Network/VPC/VPCGW (NetworkVPCVPCGW990C1587) [0m
[0;32m✅ TapStackdev |   6/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::InternetGateway                   | Network/VPC/IGW (NetworkVPCIGWF93F4916) [0m
[0;34m🔄 TapStackdev |   6/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/PublicSubnet1/RouteTable (NetworkVPCPublicSubnet1RouteTable1DFC5E00) [0m
[0;32m✅ TapStackdev |   7/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::VPCGatewayAttachment              | Network/VPC/VPCGW (NetworkVPCVPCGW990C1587) [0m
[0;34m🔄 TapStackdev |   7/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Route                             | Network/VPC/PublicSubnet1/DefaultRoute (NetworkVPCPublicSubnet1DefaultRoute08D2D596) [0m
[0;32m✅ TapStackdev |   8/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/PublicSubnet1/RouteTable (NetworkVPCPublicSubnet1RouteTable1DFC5E00) [0m
[0;34m🔄 TapStackdev |   8/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/PublicSubnet3/RouteTable (NetworkVPCPublicSubnet3RouteTable9A7773C9) [0m
[0;32m✅ TapStackdev |   9/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Route                             | Network/VPC/PublicSubnet1/DefaultRoute (NetworkVPCPublicSubnet1DefaultRoute08D2D596) [0m
[0;34m🔄 TapStackdev |   9/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/PublicSubnet3/Subnet (NetworkVPCPublicSubnet3Subnet60D12A3C) [0m
[0;32m✅ TapStackdev |  10/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/PublicSubnet3/RouteTable (NetworkVPCPublicSubnet3RouteTable9A7773C9) [0m
[0;34m🔄 TapStackdev |  10/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PublicSubnet3/RouteTableAssociation (NetworkVPCPublicSubnet3RouteTableAssociationE7D2E6CC) [0m
[0;32m✅ TapStackdev |  11/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/PublicSubnet3/Subnet (NetworkVPCPublicSubnet3Subnet60D12A3C) [0m
[0;34m🔄 TapStackdev |  11/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Route                             | Network/VPC/PublicSubnet2/DefaultRoute (NetworkVPCPublicSubnet2DefaultRoute176C4CD9) [0m
[0;32m✅ TapStackdev |  12/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PublicSubnet3/RouteTableAssociation (NetworkVPCPublicSubnet3RouteTableAssociationE7D2E6CC) [0m
[0;34m🔄 TapStackdev |  12/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/PublicSubnet1/Subnet (NetworkVPCPublicSubnet1Subnet8E5CCBD1) [0m
[0;32m✅ TapStackdev |  13/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Route                             | Network/VPC/PublicSubnet2/DefaultRoute (NetworkVPCPublicSubnet2DefaultRoute176C4CD9) [0m
[0;34m🔄 TapStackdev |  13/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PublicSubnet1/RouteTableAssociation (NetworkVPCPublicSubnet1RouteTableAssociation4DAD73DC) [0m
[0;32m✅ TapStackdev |  14/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/PublicSubnet1/Subnet (NetworkVPCPublicSubnet1Subnet8E5CCBD1) [0m
[0;34m🔄 TapStackdev |  14/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Route                             | Network/VPC/PublicSubnet3/DefaultRoute (NetworkVPCPublicSubnet3DefaultRoute52B72BA4) [0m
[0;32m✅ TapStackdev |  15/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PublicSubnet1/RouteTableAssociation (NetworkVPCPublicSubnet1RouteTableAssociation4DAD73DC) [0m
[0;32m✅ TapStackdev |  16/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Route                             | Network/VPC/PublicSubnet3/DefaultRoute (NetworkVPCPublicSubnet3DefaultRoute52B72BA4) [0m
[0;34m🔄 TapStackdev |  16/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup                     | Network/ALBSecurityGroup (NetworkALBSecurityGroupA9DF196C) [0m
[0;34m🔄 TapStackdev |  16/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::LoadBalancer   | Compute/ALB (ComputeALB00A47009) [0m
[0;32m✅ TapStackdev |  17/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::SecurityGroup                     | Network/ALBSecurityGroup (NetworkALBSecurityGroupA9DF196C) [0m
[0;34m🔄 TapStackdev |  17/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::TargetGroup    | Compute/TargetGroup (ComputeTargetGroupBC784054) [0m
[0;32m✅ TapStackdev |  18/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::LoadBalancer   | Compute/ALB (ComputeALB00A47009) [0m
[0;34m🔄 TapStackdev |  18/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ElasticLoadBalancingV2::Listener       | Compute/ALB/HTTPListener (ComputeALBHTTPListener23EC8B10) [0m
[0;32m✅ TapStackdev |  19/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::TargetGroup    | Compute/TargetGroup (ComputeTargetGroupBC784054) [0m
[0;32m✅ TapStackdev |  20/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::Listener       | Compute/ALB/HTTPListener (ComputeALBHTTPListener23EC8B10) [0m
[0;34m🔄 TapStackdev |  20/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                         | Compute/ContainerLogGroup (ComputeContainerLogGroup63DD31C5) [0m
[0;34m🔄 TapStackdev |  20/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ECS::Cluster                           | Compute/ECSCluster (ComputeECSCluster8B528103) [0m
[0;32m✅ TapStackdev |  21/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::Logs::LogGroup                         | Compute/ContainerLogGroup (ComputeContainerLogGroup63DD31C5) [0m
[0;34m🔄 TapStackdev |  21/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ServiceDiscovery::PrivateDnsNamespace  | Compute/ECSCluster/DefaultServiceDiscoveryNamespace (ComputeECSClusterDefaultServiceDiscoveryNamespaceFCA1E9D2) [0m
[0;32m✅ TapStackdev |  22/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ECS::Cluster                           | Compute/ECSCluster (ComputeECSCluster8B528103) [0m
[0;34m🔄 TapStackdev |  22/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Compute/TaskDefinition/TaskRole (ComputeTaskDefinitionTaskRoleD5579FD6) [0m
[0;32m✅ TapStackdev |  23/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ServiceDiscovery::PrivateDnsNamespace  | Compute/ECSCluster/DefaultServiceDiscoveryNamespace (ComputeECSClusterDefaultServiceDiscoveryNamespaceFCA1E9D2) [0m
[0;34m🔄 TapStackdev |  23/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Compute/TaskDefinition/TaskRole/DefaultPolicy (ComputeTaskDefinitionTaskRoleDefaultPolicyC44C9C5C) [0m
[0;32m✅ TapStackdev |  24/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Compute/TaskDefinition/TaskRole (ComputeTaskDefinitionTaskRoleD5579FD6) [0m
[0;34m🔄 TapStackdev |  24/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup                     | Network/ECSSecurityGroup (NetworkECSSecurityGroup37FD3565) [0m
[0;32m✅ TapStackdev |  25/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Compute/TaskDefinition/TaskRole/DefaultPolicy (ComputeTaskDefinitionTaskRoleDefaultPolicyC44C9C5C) [0m
[0;34m🔄 TapStackdev |  25/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/PrivateSubnet1/Subnet (NetworkVPCPrivateSubnet1SubnetDFDCBA02) [0m
[0;32m✅ TapStackdev |  26/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::SecurityGroup                     | Network/ECSSecurityGroup (NetworkECSSecurityGroup37FD3565) [0m
[0;34m🔄 TapStackdev |  26/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/PrivateSubnet2/Subnet (NetworkVPCPrivateSubnet2Subnet09CB847C) [0m
[0;32m✅ TapStackdev |  27/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/PrivateSubnet1/Subnet (NetworkVPCPrivateSubnet1SubnetDFDCBA02) [0m
[0;34m🔄 TapStackdev |  27/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/PrivateSubnet3/Subnet (NetworkVPCPrivateSubnet3Subnet03D602DE) [0m
[0;32m✅ TapStackdev |  28/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/PrivateSubnet2/Subnet (NetworkVPCPrivateSubnet2Subnet09CB847C) [0m
[0;32m✅ TapStackdev |  29/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/PrivateSubnet3/Subnet (NetworkVPCPrivateSubnet3Subnet03D602DE) [0m
[0;34m🔄 TapStackdev |  29/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ServiceDiscovery::Service              | Compute/FargateService/CloudmapService (ComputeFargateServiceCloudmapServiceE06788C3) [0m
[0;32m✅ TapStackdev |  30/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ServiceDiscovery::Service              | Compute/FargateService/CloudmapService (ComputeFargateServiceCloudmapServiceE06788C3) [0m
[0;34m🔄 TapStackdev |  30/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Compute/TaskDefinition/ExecutionRole (ComputeTaskDefinitionExecutionRoleF925A2AB) [0m
[0;34m🔄 TapStackdev |  30/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ECS::TaskDefinition                    | Compute/TaskDefinition (ComputeTaskDefinition30D3D6DD) [0m
[0;32m✅ TapStackdev |  31/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Compute/TaskDefinition/ExecutionRole (ComputeTaskDefinitionExecutionRoleF925A2AB) [0m
[0;34m🔄 TapStackdev |  31/138 | 2:01:23 PM | CREATE_IN_PROGRESS   | AWS::ECS::Service                           | Compute/FargateService/Service (ComputeFargateService8DC6B733) [0m
[0;32m✅ TapStackdev |  32/138 | 2:01:23 PM | CREATE_COMPLETE      | AWS::ECS::TaskDefinition                    | Compute/TaskDefinition (ComputeTaskDefinition30D3D6DD) [0m
[0;34m🔄 TapStackdev |  32/138 | 2:01:26 PM | CREATE_IN_PROGRESS   | AWS::ApplicationAutoScaling::ScalableTarget | Compute/FargateService/TaskCount/Target (ComputeFargateServiceTaskCountTarget25EB4250) [0m
[0;32m✅ TapStackdev |  33/138 | 2:01:26 PM | CREATE_COMPLETE      | AWS::ECS::Service                           | Compute/FargateService/Service (ComputeFargateService8DC6B733) [0m
[0;34m🔄 TapStackdev |  33/138 | 2:01:26 PM | CREATE_IN_PROGRESS   | AWS::ApplicationAutoScaling::ScalingPolicy  | Compute/FargateService/TaskCount/Target/CPUScaling (ComputeFargateServiceTaskCountTargetCPUScaling87F44E33) [0m
[0;32m✅ TapStackdev |  34/138 | 2:01:26 PM | CREATE_COMPLETE      | AWS::ApplicationAutoScaling::ScalableTarget | Compute/FargateService/TaskCount/Target (ComputeFargateServiceTaskCountTarget25EB4250) [0m
[0;34m🔄 TapStackdev |  34/138 | 2:01:26 PM | CREATE_IN_PROGRESS   | AWS::ApplicationAutoScaling::ScalingPolicy  | Compute/FargateService/TaskCount/Target/MemoryScaling (ComputeFargateServiceTaskCountTargetMemoryScaling404F421B) [0m
[0;32m✅ TapStackdev |  35/138 | 2:01:26 PM | CREATE_COMPLETE      | AWS::ApplicationAutoScaling::ScalingPolicy  | Compute/FargateService/TaskCount/Target/CPUScaling (ComputeFargateServiceTaskCountTargetCPUScaling87F44E33) [0m
[0;34m🔄 TapStackdev |  35/138 | 2:01:26 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Compute/TaskDefinition/ExecutionRole/DefaultPolicy (ComputeTaskDefinitionExecutionRoleDefaultPolicy1E206A30) [0m
[0;32m✅ TapStackdev |  36/138 | 2:01:26 PM | CREATE_COMPLETE      | AWS::ApplicationAutoScaling::ScalingPolicy  | Compute/FargateService/TaskCount/Target/MemoryScaling (ComputeFargateServiceTaskCountTargetMemoryScaling404F421B) [0m
[0;34m🔄 TapStackdev |  36/138 | 2:01:26 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Custom::S3AutoDeleteObjectsCustomResourceProvider/Role (CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092) [0m
[0;32m✅ TapStackdev |  37/138 | 2:01:26 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Compute/TaskDefinition/ExecutionRole/DefaultPolicy (ComputeTaskDefinitionExecutionRoleDefaultPolicy1E206A30) [0m
[0;34m🔄 TapStackdev |  37/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                             | Storage/DataBucket (StorageDataBucketB1B922FA) [0m
[0;32m✅ TapStackdev |  38/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Custom::S3AutoDeleteObjectsCustomResourceProvider/Role (CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092) [0m
[0;34m🔄 TapStackdev |  38/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | Custom::S3AutoDeleteObjectsCustomResourceProvider/Handler (CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F) [0m
[0;32m✅ TapStackdev |  39/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::S3::Bucket                             | Storage/DataBucket (StorageDataBucketB1B922FA) [0m
[0;32m✅ TapStackdev |  40/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | Custom::S3AutoDeleteObjectsCustomResourceProvider/Handler (CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F) [0m
[0;34m🔄 TapStackdev |  40/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) [0m
[0;34m🔄 TapStackdev |  40/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) [0m
[0;32m✅ TapStackdev |  41/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) [0m
[0;32m✅ TapStackdev |  42/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) [0m
[0;34m🔄 TapStackdev |  42/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/IsolatedSubnet1/Subnet (NetworkVPCIsolatedSubnet1SubnetBF807499) [0m
[0;34m🔄 TapStackdev |  42/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/IsolatedSubnet2/Subnet (NetworkVPCIsolatedSubnet2Subnet91A3EC7D) [0m
[0;32m✅ TapStackdev |  43/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/IsolatedSubnet1/Subnet (NetworkVPCIsolatedSubnet1SubnetBF807499) [0m
[0;34m🔄 TapStackdev |  43/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                            | Network/VPC/IsolatedSubnet3/Subnet (NetworkVPCIsolatedSubnet3Subnet41E2F95A) [0m
[0;32m✅ TapStackdev |  44/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/IsolatedSubnet2/Subnet (NetworkVPCIsolatedSubnet2Subnet91A3EC7D) [0m
[0;34m🔄 TapStackdev |  44/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::RDS::DBSubnetGroup                     | Database/Cluster/Subnets/Default (DatabaseClusterSubnets5540150D) [0m
[0;32m✅ TapStackdev |  45/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::EC2::Subnet                            | Network/VPC/IsolatedSubnet3/Subnet (NetworkVPCIsolatedSubnet3Subnet41E2F95A) [0m
[0;34m🔄 TapStackdev |  45/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::SecretsManager::Secret                 | Database/Cluster/Secret (DatabaseClusterSecretD1FB634F) [0m
[0;32m✅ TapStackdev |  46/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::RDS::DBSubnetGroup                     | Database/Cluster/Subnets/Default (DatabaseClusterSubnets5540150D) [0m
[0;32m✅ TapStackdev |  47/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::SecretsManager::Secret                 | Database/Cluster/Secret (DatabaseClusterSecretD1FB634F) [0m
[0;34m🔄 TapStackdev |  47/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup                     | Network/DatabaseSecurityGroup (NetworkDatabaseSecurityGroup2B3F4679) [0m
[0;34m🔄 TapStackdev |  47/138 | 2:01:27 PM | CREATE_IN_PROGRESS   | AWS::RDS::DBCluster                         | Database/Cluster (DatabaseCluster5B53A178) [0m
[0;32m✅ TapStackdev |  48/138 | 2:01:27 PM | CREATE_COMPLETE      | AWS::EC2::SecurityGroup                     | Network/DatabaseSecurityGroup (NetworkDatabaseSecurityGroup2B3F4679) [0m
[0;34m🔄 TapStackdev |  48/138 | 2:01:30 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole (LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRole9741ECFB) [0m
[0;32m✅ TapStackdev |  49/138 | 2:01:30 PM | CREATE_COMPLETE      | AWS::RDS::DBCluster                         | Database/Cluster (DatabaseCluster5B53A178) [0m
[0;34m🔄 TapStackdev |  49/138 | 2:01:30 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy (LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRoleDefaultPolicyADDA7DEB) [0m
[0;32m✅ TapStackdev |  50/138 | 2:01:30 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole (LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRole9741ECFB) [0m
[0;34m🔄 TapStackdev |  50/138 | 2:01:30 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a (LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A) [0m
[0;32m✅ TapStackdev |  51/138 | 2:01:30 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy (LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aServiceRoleDefaultPolicyADDA7DEB) [0m
[0;34m🔄 TapStackdev |  51/138 | 2:01:30 PM | CREATE_IN_PROGRESS   | Custom::LogRetention                        | Database/Cluster/LogRetentionpostgresql (DatabaseClusterLogRetentionpostgresql025D39CE) [0m
[0;32m✅ TapStackdev |  52/138 | 2:01:30 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a (LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A) [0m
[0;32m✅ TapStackdev |  53/138 | 2:01:37 PM | CREATE_COMPLETE      | Custom::LogRetention                        | Database/Cluster/LogRetentionpostgresql (DatabaseClusterLogRetentionpostgresql025D39CE) [0m
[0;34m🔄 TapStackdev |  53/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::SecretsManager::SecretTargetAttachment | Database/Cluster/Secret/Attachment (DatabaseClusterSecretAttachmentDC8466C0) [0m
[0;34m🔄 TapStackdev |  53/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/IsolatedSubnet3/RouteTable (NetworkVPCIsolatedSubnet3RouteTable896AABB9) [0m
[0;32m✅ TapStackdev |  54/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::SecretsManager::SecretTargetAttachment | Database/Cluster/Secret/Attachment (DatabaseClusterSecretAttachmentDC8466C0) [0m
[0;32m✅ TapStackdev |  55/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/IsolatedSubnet3/RouteTable (NetworkVPCIsolatedSubnet3RouteTable896AABB9) [0m
[0;34m🔄 TapStackdev |  55/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/IsolatedSubnet3/RouteTableAssociation (NetworkVPCIsolatedSubnet3RouteTableAssociation0B647F95) [0m
[0;34m🔄 TapStackdev |  55/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/IsolatedSubnet1/RouteTable (NetworkVPCIsolatedSubnet1RouteTable30C2693B) [0m
[0;32m✅ TapStackdev |  56/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/IsolatedSubnet3/RouteTableAssociation (NetworkVPCIsolatedSubnet3RouteTableAssociation0B647F95) [0m
[0;34m🔄 TapStackdev |  56/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/IsolatedSubnet1/RouteTableAssociation (NetworkVPCIsolatedSubnet1RouteTableAssociation19B1642A) [0m
[0;32m✅ TapStackdev |  57/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/IsolatedSubnet1/RouteTable (NetworkVPCIsolatedSubnet1RouteTable30C2693B) [0m
[0;32m✅ TapStackdev |  58/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/IsolatedSubnet1/RouteTableAssociation (NetworkVPCIsolatedSubnet1RouteTableAssociation19B1642A) [0m
[0;34m🔄 TapStackdev |  58/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/IsolatedSubnet2/RouteTable (NetworkVPCIsolatedSubnet2RouteTable461D486E) [0m
[0;34m🔄 TapStackdev |  58/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/IsolatedSubnet2/RouteTableAssociation (NetworkVPCIsolatedSubnet2RouteTableAssociationFECA7C6A) [0m
[0;32m✅ TapStackdev |  59/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/IsolatedSubnet2/RouteTable (NetworkVPCIsolatedSubnet2RouteTable461D486E) [0m
[0;34m🔄 TapStackdev |  59/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::RDS::DBInstance                        | Database/Cluster/writer (DatabaseClusterwriterF225C73E) [0m
[0;32m✅ TapStackdev |  60/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/IsolatedSubnet2/RouteTableAssociation (NetworkVPCIsolatedSubnet2RouteTableAssociationFECA7C6A) [0m
[0;32m✅ TapStackdev |  61/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::RDS::DBInstance                        | Database/Cluster/writer (DatabaseClusterwriterF225C73E) [0m
[0;34m🔄 TapStackdev |  61/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::RDS::DBInstance                        | Database/Cluster/reader (DatabaseClusterreader47184CDA) [0m
[0;34m🔄 TapStackdev |  61/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::SNS::Topic                             | Database/DatabaseAlarmTopic (DatabaseDatabaseAlarmTopicECB4E563) [0m
[0;32m✅ TapStackdev |  62/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::RDS::DBInstance                        | Database/Cluster/reader (DatabaseClusterreader47184CDA) [0m
[0;32m✅ TapStackdev |  63/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::SNS::Topic                             | Database/DatabaseAlarmTopic (DatabaseDatabaseAlarmTopicECB4E563) [0m
[0;34m🔄 TapStackdev |  63/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                      | Database/DatabaseCPUAlarm (DatabaseDatabaseCPUAlarm17E31067) [0m
[0;34m🔄 TapStackdev |  63/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                      | Database/DatabaseConnectionsAlarm (DatabaseDatabaseConnectionsAlarm5361E47C) [0m
[0;32m✅ TapStackdev |  64/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                      | Database/DatabaseCPUAlarm (DatabaseDatabaseCPUAlarm17E31067) [0m
[0;34m🔄 TapStackdev |  64/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::Events::EventBus                       | EventBridge/CustomEventBus (EventBridgeCustomEventBus39E329A6) [0m
[0;32m✅ TapStackdev |  65/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                      | Database/DatabaseConnectionsAlarm (DatabaseDatabaseConnectionsAlarm5361E47C) [0m
[0;34m🔄 TapStackdev |  65/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                             | EventBridge/EventDLQ (EventBridgeEventDLQD8286430) [0m
[0;32m✅ TapStackdev |  66/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::Events::EventBus                       | EventBridge/CustomEventBus (EventBridgeCustomEventBus39E329A6) [0m
[0;34m🔄 TapStackdev |  66/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                             | EventBridge/EventTargetQueue (EventBridgeEventTargetQueue87A956B3) [0m
[0;32m✅ TapStackdev |  67/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::SQS::Queue                             | EventBridge/EventDLQ (EventBridgeEventDLQD8286430) [0m
[0;34m🔄 TapStackdev |  67/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::Events::Rule                           | EventBridge/ApplicationEventRule (EventBridgeApplicationEventRule58126747) [0m
[0;32m✅ TapStackdev |  68/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::SQS::Queue                             | EventBridge/EventTargetQueue (EventBridgeEventTargetQueue87A956B3) [0m
[0;32m✅ TapStackdev |  69/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::Events::Archive                        | EventBridge/EventArchive/Archive (EventBridgeEventArchiveFE1D36E0) Resource type AWS::Events::Archive is not supported but was deployed as a fallback[0m
[0;34m🔄 TapStackdev |  69/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::Events::Archive                        | EventBridge/EventArchive/Archive (EventBridgeEventArchiveFE1D36E0) [0m
[0;32m✅ TapStackdev |  70/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::Events::Rule                           | EventBridge/ApplicationEventRule (EventBridgeApplicationEventRule58126747) [0m
[0;34m🔄 TapStackdev |  70/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::SQS::QueuePolicy                       | EventBridge/EventDLQ/Policy (EventBridgeEventDLQPolicy591266E9) [0m
[0;32m✅ TapStackdev |  71/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::SQS::QueuePolicy                       | EventBridge/EventDLQ/Policy (EventBridgeEventDLQPolicy591266E9) [0m
[0;34m🔄 TapStackdev |  71/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::SQS::QueuePolicy                       | EventBridge/EventTargetQueue/Policy (EventBridgeEventTargetQueuePolicy75E2EEA9) [0m
[0;34m🔄 TapStackdev |  71/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Failover/AuroraFailoverFunction/ServiceRole (FailoverAuroraFailoverFunctionServiceRole99054FE7) [0m
[0;32m✅ TapStackdev |  72/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::SQS::QueuePolicy                       | EventBridge/EventTargetQueue/Policy (EventBridgeEventTargetQueuePolicy75E2EEA9) [0m
[0;34m🔄 TapStackdev |  72/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Failover/AuroraFailoverFunction/ServiceRole/DefaultPolicy (FailoverAuroraFailoverFunctionServiceRoleDefaultPolicy2A5A2286) [0m
[0;32m✅ TapStackdev |  73/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Failover/AuroraFailoverFunction/ServiceRole (FailoverAuroraFailoverFunctionServiceRole99054FE7) [0m
[0;34m🔄 TapStackdev |  73/138 | 2:01:37 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | Failover/AuroraFailoverFunction (FailoverAuroraFailoverFunctionF43866F0) [0m
[0;32m✅ TapStackdev |  74/138 | 2:01:37 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Failover/AuroraFailoverFunction/ServiceRole/DefaultPolicy (FailoverAuroraFailoverFunctionServiceRoleDefaultPolicy2A5A2286) [0m
[0;34m🔄 TapStackdev |  74/138 | 2:01:38 PM | CREATE_IN_PROGRESS   | Custom::LogRetention                        | Failover/AuroraFailoverFunction/LogRetention (FailoverAuroraFailoverFunctionLogRetention15C936D6) [0m
[0;32m✅ TapStackdev |  75/138 | 2:01:38 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | Failover/AuroraFailoverFunction (FailoverAuroraFailoverFunctionF43866F0) [0m
[0;32m✅ TapStackdev |  76/138 | 2:01:45 PM | CREATE_COMPLETE      | Custom::LogRetention                        | Failover/AuroraFailoverFunction/LogRetention (FailoverAuroraFailoverFunctionLogRetention15C936D6) [0m
[0;34m🔄 TapStackdev |  76/138 | 2:01:45 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Failover/ECSScalingFunction/ServiceRole (FailoverECSScalingFunctionServiceRoleE0656765) [0m
[0;34m🔄 TapStackdev |  76/138 | 2:01:45 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Failover/ECSScalingFunction/ServiceRole/DefaultPolicy (FailoverECSScalingFunctionServiceRoleDefaultPolicy4BB4186B) [0m
[0;32m✅ TapStackdev |  77/138 | 2:01:45 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Failover/ECSScalingFunction/ServiceRole (FailoverECSScalingFunctionServiceRoleE0656765) [0m
[0;34m🔄 TapStackdev |  77/138 | 2:01:45 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | Failover/ECSScalingFunction (FailoverECSScalingFunction579BC7BF) [0m
[0;32m✅ TapStackdev |  78/138 | 2:01:45 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Failover/ECSScalingFunction/ServiceRole/DefaultPolicy (FailoverECSScalingFunctionServiceRoleDefaultPolicy4BB4186B) [0m
[0;34m🔄 TapStackdev |  78/138 | 2:01:46 PM | CREATE_IN_PROGRESS   | Custom::LogRetention                        | Failover/ECSScalingFunction/LogRetention (FailoverECSScalingFunctionLogRetention25406467) [0m
[0;32m✅ TapStackdev |  79/138 | 2:01:46 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | Failover/ECSScalingFunction (FailoverECSScalingFunction579BC7BF) [0m
[0;34m🔄 TapStackdev |  79/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::SNS::Topic                             | Failover/FailoverNotificationTopic (FailoverFailoverNotificationTopicE4BE5644) [0m
[0;32m✅ TapStackdev |  80/138 | 2:01:53 PM | CREATE_COMPLETE      | Custom::LogRetention                        | Failover/ECSScalingFunction/LogRetention (FailoverECSScalingFunctionLogRetention25406467) [0m
[0;32m✅ TapStackdev |  81/138 | 2:01:53 PM | CREATE_COMPLETE      | AWS::SNS::Topic                             | Failover/FailoverNotificationTopic (FailoverFailoverNotificationTopicE4BE5644) [0m
[0;34m🔄 TapStackdev |  81/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Failover/FailoverStateMachine/Role (FailoverFailoverStateMachineRoleFBEE186A) [0m
[0;34m🔄 TapStackdev |  81/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Failover/HealthCheckFunction/ServiceRole (FailoverHealthCheckFunctionServiceRole44BB11F1) [0m
[0;32m✅ TapStackdev |  82/138 | 2:01:53 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Failover/FailoverStateMachine/Role (FailoverFailoverStateMachineRoleFBEE186A) [0m
[0;34m🔄 TapStackdev |  82/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | Failover/HealthCheckFunction (FailoverHealthCheckFunctionC19B489D) [0m
[0;32m✅ TapStackdev |  83/138 | 2:01:53 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Failover/HealthCheckFunction/ServiceRole (FailoverHealthCheckFunctionServiceRole44BB11F1) [0m
[0;34m🔄 TapStackdev |  83/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Failover/Route53UpdateFunction/ServiceRole (FailoverRoute53UpdateFunctionServiceRole8CCC9929) [0m
[0;32m✅ TapStackdev |  84/138 | 2:01:53 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | Failover/HealthCheckFunction (FailoverHealthCheckFunctionC19B489D) [0m
[0;34m🔄 TapStackdev |  84/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Failover/Route53UpdateFunction/ServiceRole/DefaultPolicy (FailoverRoute53UpdateFunctionServiceRoleDefaultPolicy6A939F97) [0m
[0;32m✅ TapStackdev |  85/138 | 2:01:53 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Failover/Route53UpdateFunction/ServiceRole (FailoverRoute53UpdateFunctionServiceRole8CCC9929) [0m
[0;32m✅ TapStackdev |  86/138 | 2:01:53 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Failover/Route53UpdateFunction/ServiceRole/DefaultPolicy (FailoverRoute53UpdateFunctionServiceRoleDefaultPolicy6A939F97) [0m
[0;34m🔄 TapStackdev |  86/138 | 2:01:53 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | Failover/Route53UpdateFunction (FailoverRoute53UpdateFunctionD22D0AE5) [0m
[0;32m✅ TapStackdev |  87/138 | 2:01:54 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | Failover/Route53UpdateFunction (FailoverRoute53UpdateFunctionD22D0AE5) [0m
[0;34m🔄 TapStackdev |  87/138 | 2:01:54 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Failover/FailoverStateMachine/Role/DefaultPolicy (FailoverFailoverStateMachineRoleDefaultPolicyB414C625) [0m
[0;34m🔄 TapStackdev |  87/138 | 2:01:54 PM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                         | Failover/StateMachineLogGroup (FailoverStateMachineLogGroup28AC1C8B) [0m
[0;32m✅ TapStackdev |  88/138 | 2:01:54 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Failover/FailoverStateMachine/Role/DefaultPolicy (FailoverFailoverStateMachineRoleDefaultPolicyB414C625) [0m
[0;34m🔄 TapStackdev |  88/138 | 2:01:54 PM | CREATE_IN_PROGRESS   | AWS::StepFunctions::StateMachine            | Failover/FailoverStateMachine (FailoverFailoverStateMachine15BF1736) [0m
[0;32m✅ TapStackdev |  89/138 | 2:01:54 PM | CREATE_COMPLETE      | AWS::Logs::LogGroup                         | Failover/StateMachineLogGroup (FailoverStateMachineLogGroup28AC1C8B) [0m
[0;32m✅ TapStackdev |  90/138 | 2:01:54 PM | CREATE_COMPLETE      | AWS::StepFunctions::StateMachine            | Failover/FailoverStateMachine (FailoverFailoverStateMachine15BF1736) [0m
[0;34m🔄 TapStackdev |  90/138 | 2:01:54 PM | CREATE_IN_PROGRESS   | Custom::LogRetention                        | Failover/HealthCheckFunction/LogRetention (FailoverHealthCheckFunctionLogRetention240D9BF1) [0m
[0;34m🔄 TapStackdev |  90/138 | 2:02:01 PM | CREATE_IN_PROGRESS   | Custom::LogRetention                        | Failover/Route53UpdateFunction/LogRetention (FailoverRoute53UpdateFunctionLogRetention823E196E) [0m
[0;32m✅ TapStackdev |  91/138 | 2:02:01 PM | CREATE_COMPLETE      | Custom::LogRetention                        | Failover/HealthCheckFunction/LogRetention (FailoverHealthCheckFunctionLogRetention240D9BF1) [0m
[0;34m🔄 TapStackdev |  91/138 | 2:02:08 PM | CREATE_IN_PROGRESS   | AWS::SNS::Topic                             | Monitoring/CanaryAlarmTopic (MonitoringCanaryAlarmTopic846CF7A5) [0m
[0;32m✅ TapStackdev |  92/138 | 2:02:08 PM | CREATE_COMPLETE      | Custom::LogRetention                        | Failover/Route53UpdateFunction/LogRetention (FailoverRoute53UpdateFunctionLogRetention823E196E) [0m
[0;34m🔄 TapStackdev |  92/138 | 2:02:08 PM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                             | Monitoring/CanaryArtifactsBucket (MonitoringCanaryArtifactsBucketAE86F2E1) [0m
[0;32m✅ TapStackdev |  93/138 | 2:02:08 PM | CREATE_COMPLETE      | AWS::SNS::Topic                             | Monitoring/CanaryAlarmTopic (MonitoringCanaryAlarmTopic846CF7A5) [0m
[0;34m🔄 TapStackdev |  93/138 | 2:02:08 PM | CREATE_IN_PROGRESS   | AWS::S3::BucketPolicy                       | Monitoring/CanaryArtifactsBucket/Policy (MonitoringCanaryArtifactsBucketPolicy7E4FA331) [0m
[0;32m✅ TapStackdev |  94/138 | 2:02:08 PM | CREATE_COMPLETE      | AWS::S3::Bucket                             | Monitoring/CanaryArtifactsBucket (MonitoringCanaryArtifactsBucketAE86F2E1) [0m
[0;34m🔄 TapStackdev |  94/138 | 2:02:08 PM | CREATE_IN_PROGRESS   | Custom::S3AutoDeleteObjects                 | Monitoring/CanaryArtifactsBucket/AutoDeleteObjectsCustomResource/Default (MonitoringCanaryArtifactsBucketAutoDeleteObjectsCustomResourceFD7C8F2E) [0m
[0;32m✅ TapStackdev |  95/138 | 2:02:08 PM | CREATE_COMPLETE      | AWS::S3::BucketPolicy                       | Monitoring/CanaryArtifactsBucket/Policy (MonitoringCanaryArtifactsBucketPolicy7E4FA331) [0m
[0;32m✅ TapStackdev |  96/138 | 2:02:15 PM | CREATE_COMPLETE      | Custom::S3AutoDeleteObjects                 | Monitoring/CanaryArtifactsBucket/AutoDeleteObjectsCustomResource/Default (MonitoringCanaryArtifactsBucketAutoDeleteObjectsCustomResourceFD7C8F2E) [0m
[0;34m🔄 TapStackdev |  96/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Monitoring/CanaryRole (MonitoringCanaryRoleAFBCE305) [0m
[0;32m✅ TapStackdev |  97/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Monitoring/CanaryRole (MonitoringCanaryRoleAFBCE305) [0m
[0;34m🔄 TapStackdev |  97/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                      | Monitoring/CanaryDurationAlarm (MonitoringCanaryDurationAlarmCB31F106) [0m
[0;32m✅ TapStackdev |  98/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::Synthetics::Canary                     | Monitoring/EndpointCanary (MonitoringEndpointCanaryBD8A8295) Resource type AWS::Synthetics::Canary is not supported but was deployed as a fallback[0m
[0;34m🔄 TapStackdev |  98/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::Synthetics::Canary                     | Monitoring/EndpointCanary (MonitoringEndpointCanaryBD8A8295) [0m
[0;34m🔄 TapStackdev |  98/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::CloudWatch::Alarm                      | Monitoring/CanaryFailureAlarm (MonitoringCanaryFailureAlarm81B1981B) [0m
[0;32m✅ TapStackdev |  99/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                      | Monitoring/CanaryDurationAlarm (MonitoringCanaryDurationAlarmCB31F106) [0m
[0;34m🔄 TapStackdev |  99/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Monitoring/CanaryRole/DefaultPolicy (MonitoringCanaryRoleDefaultPolicy12E575D3) [0m
[0;32m✅ TapStackdev | 100/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::CloudWatch::Alarm                      | Monitoring/CanaryFailureAlarm (MonitoringCanaryFailureAlarm81B1981B) [0m
[0;34m🔄 TapStackdev | 100/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroupIngress              | Network/DatabaseSecurityGroup/from TapStackdevNetworkECSSecurityGroup54D93F62:5432 (NetworkDatabaseSecurityGroupfromTapStackdevNetworkECSSecurityGroup54D93F625432A8EBEFF8) [0m
[0;32m✅ TapStackdev | 101/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Monitoring/CanaryRole/DefaultPolicy (MonitoringCanaryRoleDefaultPolicy12E575D3) [0m
[0;34m🔄 TapStackdev | 101/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroupIngress              | Network/ECSSecurityGroup/from TapStackdevNetworkALBSecurityGroup8BEAE0FC:8080 (NetworkECSSecurityGroupfromTapStackdevNetworkALBSecurityGroup8BEAE0FC8080844F6089) [0m
[0;32m✅ TapStackdev | 102/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::EC2::SecurityGroupIngress              | Network/DatabaseSecurityGroup/from TapStackdevNetworkECSSecurityGroup54D93F62:5432 (NetworkDatabaseSecurityGroupfromTapStackdevNetworkECSSecurityGroup54D93F625432A8EBEFF8) [0m
[0;34m🔄 TapStackdev | 102/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroupIngress              | Network/ECSSecurityGroup/from TapStackdevNetworkALBSecurityGroup8BEAE0FC:80 (NetworkECSSecurityGroupfromTapStackdevNetworkALBSecurityGroup8BEAE0FC80F0D44ECB) [0m
[0;32m✅ TapStackdev | 103/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::EC2::SecurityGroupIngress              | Network/ECSSecurityGroup/from TapStackdevNetworkALBSecurityGroup8BEAE0FC:8080 (NetworkECSSecurityGroupfromTapStackdevNetworkALBSecurityGroup8BEAE0FC8080844F6089) [0m
[0;34m🔄 TapStackdev | 103/138 | 2:02:15 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | Network/VPCFlowLog/IAMRole (NetworkVPCFlowLogIAMRole4DFB294E) [0m
[0;32m✅ TapStackdev | 104/138 | 2:02:15 PM | CREATE_COMPLETE      | AWS::EC2::SecurityGroupIngress              | Network/ECSSecurityGroup/from TapStackdevNetworkALBSecurityGroup8BEAE0FC:80 (NetworkECSSecurityGroupfromTapStackdevNetworkALBSecurityGroup8BEAE0FC80F0D44ECB) [0m
[0;32m✅ TapStackdev | 105/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | Network/VPCFlowLog/IAMRole (NetworkVPCFlowLogIAMRole4DFB294E) [0m
[0;34m🔄 TapStackdev | 105/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                         | Network/VPCFlowLogGroup (NetworkVPCFlowLogGroupB1819E47) [0m
[0;34m🔄 TapStackdev | 105/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | Network/VPCFlowLog/IAMRole/DefaultPolicy (NetworkVPCFlowLogIAMRoleDefaultPolicyF5D8ADA2) [0m
[0;32m✅ TapStackdev | 106/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::FlowLog                           | Network/VPCFlowLog/FlowLog (NetworkVPCFlowLogFC6CBD90) Resource type AWS::EC2::FlowLog is not supported but was deployed as a fallback[0m
[0;34m🔄 TapStackdev | 106/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::FlowLog                           | Network/VPCFlowLog/FlowLog (NetworkVPCFlowLogFC6CBD90) [0m
[0;32m✅ TapStackdev | 107/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::Logs::LogGroup                         | Network/VPCFlowLogGroup (NetworkVPCFlowLogGroupB1819E47) [0m
[0;34m🔄 TapStackdev | 107/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                               | Network/VPC/PublicSubnet1/EIP (NetworkVPCPublicSubnet1EIPA6BC988D) [0m
[0;32m✅ TapStackdev | 108/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | Network/VPCFlowLog/IAMRole/DefaultPolicy (NetworkVPCFlowLogIAMRoleDefaultPolicyF5D8ADA2) [0m
[0;34m🔄 TapStackdev | 108/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                        | Network/VPC/PublicSubnet1/NATGateway (NetworkVPCPublicSubnet1NATGateway3EC80B04) [0m
[0;32m✅ TapStackdev | 109/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::EIP                               | Network/VPC/PublicSubnet1/EIP (NetworkVPCPublicSubnet1EIPA6BC988D) [0m
[0;34m🔄 TapStackdev | 109/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/PrivateSubnet1/RouteTable (NetworkVPCPrivateSubnet1RouteTableBA4C5B00) [0m
[0;32m✅ TapStackdev | 110/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::NatGateway                        | Network/VPC/PublicSubnet1/NATGateway (NetworkVPCPublicSubnet1NATGateway3EC80B04) [0m
[0;34m🔄 TapStackdev | 110/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::Route                             | Network/VPC/PrivateSubnet1/DefaultRoute (NetworkVPCPrivateSubnet1DefaultRoute3D2C8F97) [0m
[0;32m✅ TapStackdev | 111/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/PrivateSubnet1/RouteTable (NetworkVPCPrivateSubnet1RouteTableBA4C5B00) [0m
[0;34m🔄 TapStackdev | 111/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PrivateSubnet1/RouteTableAssociation (NetworkVPCPrivateSubnet1RouteTableAssociationF6FFFF95) [0m
[0;32m✅ TapStackdev | 112/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::Route                             | Network/VPC/PrivateSubnet1/DefaultRoute (NetworkVPCPrivateSubnet1DefaultRoute3D2C8F97) [0m
[0;34m🔄 TapStackdev | 112/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                               | Network/VPC/PublicSubnet2/EIP (NetworkVPCPublicSubnet2EIPA4C1D46E) [0m
[0;32m✅ TapStackdev | 113/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PrivateSubnet1/RouteTableAssociation (NetworkVPCPrivateSubnet1RouteTableAssociationF6FFFF95) [0m
[0;34m🔄 TapStackdev | 113/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                        | Network/VPC/PublicSubnet2/NATGateway (NetworkVPCPublicSubnet2NATGateway436741C2) [0m
[0;32m✅ TapStackdev | 114/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::EIP                               | Network/VPC/PublicSubnet2/EIP (NetworkVPCPublicSubnet2EIPA4C1D46E) [0m
[0;34m🔄 TapStackdev | 114/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/PrivateSubnet2/RouteTable (NetworkVPCPrivateSubnet2RouteTable0C1DD852) [0m
[0;32m✅ TapStackdev | 115/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::NatGateway                        | Network/VPC/PublicSubnet2/NATGateway (NetworkVPCPublicSubnet2NATGateway436741C2) [0m
[0;34m🔄 TapStackdev | 115/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::Route                             | Network/VPC/PrivateSubnet2/DefaultRoute (NetworkVPCPrivateSubnet2DefaultRoute448F285C) [0m
[0;32m✅ TapStackdev | 116/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/PrivateSubnet2/RouteTable (NetworkVPCPrivateSubnet2RouteTable0C1DD852) [0m
[0;32m✅ TapStackdev | 117/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::Route                             | Network/VPC/PrivateSubnet2/DefaultRoute (NetworkVPCPrivateSubnet2DefaultRoute448F285C) [0m
[0;34m🔄 TapStackdev | 117/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PrivateSubnet2/RouteTableAssociation (NetworkVPCPrivateSubnet2RouteTableAssociation07D70763) [0m
[0;32m✅ TapStackdev | 118/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PrivateSubnet2/RouteTableAssociation (NetworkVPCPrivateSubnet2RouteTableAssociation07D70763) [0m
[0;34m🔄 TapStackdev | 118/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                        | Network/VPC/PrivateSubnet3/RouteTable (NetworkVPCPrivateSubnet3RouteTable69ACC5A7) [0m
[0;34m🔄 TapStackdev | 118/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::Route                             | Network/VPC/PrivateSubnet3/DefaultRoute (NetworkVPCPrivateSubnet3DefaultRouteE14405CA) [0m
[0;32m✅ TapStackdev | 119/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::RouteTable                        | Network/VPC/PrivateSubnet3/RouteTable (NetworkVPCPrivateSubnet3RouteTable69ACC5A7) [0m
[0;34m🔄 TapStackdev | 119/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PrivateSubnet3/RouteTableAssociation (NetworkVPCPrivateSubnet3RouteTableAssociation65D6198D) [0m
[0;32m✅ TapStackdev | 120/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::Route                             | Network/VPC/PrivateSubnet3/DefaultRoute (NetworkVPCPrivateSubnet3DefaultRouteE14405CA) [0m
[0;34m🔄 TapStackdev | 120/138 | 2:02:16 PM | CREATE_IN_PROGRESS   | Custom::VpcRestrictDefaultSG                | Network/VPC/RestrictDefaultSecurityGroupCustomResource/Default (NetworkVPCRestrictDefaultSecurityGroupCustomResourceF93F8EF4) [0m
[0;32m✅ TapStackdev | 121/138 | 2:02:16 PM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation       | Network/VPC/PrivateSubnet3/RouteTableAssociation (NetworkVPCPrivateSubnet3RouteTableAssociation65D6198D) [0m
[0;34m🔄 TapStackdev | 121/138 | 2:02:23 PM | CREATE_IN_PROGRESS   | AWS::SSM::Parameter                         | ParameterStore/APIKeyParam (ParameterStoreAPIKeyParam76D4067E) [0m
[0;32m✅ TapStackdev | 122/138 | 2:02:23 PM | CREATE_COMPLETE      | Custom::VpcRestrictDefaultSG                | Network/VPC/RestrictDefaultSecurityGroupCustomResource/Default (NetworkVPCRestrictDefaultSecurityGroupCustomResourceF93F8EF4) [0m
[0;34m🔄 TapStackdev | 122/138 | 2:02:23 PM | CREATE_IN_PROGRESS   | AWS::SSM::Parameter                         | ParameterStore/AppConfigParam (ParameterStoreAppConfigParamC57E6C34) [0m
[0;32m✅ TapStackdev | 123/138 | 2:02:23 PM | CREATE_COMPLETE      | AWS::SSM::Parameter                         | ParameterStore/APIKeyParam (ParameterStoreAPIKeyParam76D4067E) [0m
[0;34m🔄 TapStackdev | 123/138 | 2:02:23 PM | CREATE_IN_PROGRESS   | AWS::SSM::Parameter                         | ParameterStore/DBConfigParam (ParameterStoreDBConfigParamB01AC71A) [0m
[0;32m✅ TapStackdev | 124/138 | 2:02:23 PM | CREATE_COMPLETE      | AWS::SSM::Parameter                         | ParameterStore/AppConfigParam (ParameterStoreAppConfigParamC57E6C34) [0m
[0;32m✅ TapStackdev | 125/138 | 2:02:23 PM | CREATE_COMPLETE      | AWS::SSM::Parameter                         | ParameterStore/DBConfigParam (ParameterStoreDBConfigParamB01AC71A) [0m
[0;34m🔄 TapStackdev | 125/138 | 2:02:23 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role                              | ParameterStore/ParameterReplicationFunction/ServiceRole (ParameterStoreParameterReplicationFunctionServiceRoleED6D0434) [0m
[0;34m🔄 TapStackdev | 125/138 | 2:02:23 PM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                            | ParameterStore/ParameterReplicationFunction/ServiceRole/DefaultPolicy (ParameterStoreParameterReplicationFunctionServiceRoleDefaultPolicy242B4C5A) [0m
[0;32m✅ TapStackdev | 126/138 | 2:02:23 PM | CREATE_COMPLETE      | AWS::IAM::Role                              | ParameterStore/ParameterReplicationFunction/ServiceRole (ParameterStoreParameterReplicationFunctionServiceRoleED6D0434) [0m
[0;34m🔄 TapStackdev | 126/138 | 2:02:23 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                       | ParameterStore/ParameterReplicationFunction (ParameterStoreParameterReplicationFunction54B02DC7) [0m
[0;32m✅ TapStackdev | 127/138 | 2:02:23 PM | CREATE_COMPLETE      | AWS::IAM::Policy                            | ParameterStore/ParameterReplicationFunction/ServiceRole/DefaultPolicy (ParameterStoreParameterReplicationFunctionServiceRoleDefaultPolicy242B4C5A) [0m
[0;34m🔄 TapStackdev | 127/138 | 2:02:24 PM | CREATE_IN_PROGRESS   | AWS::Events::Rule                           | ParameterStore/ParameterChangeRule (ParameterStoreParameterChangeRule7736D702) [0m
[0;32m✅ TapStackdev | 128/138 | 2:02:24 PM | CREATE_COMPLETE      | AWS::Lambda::Function                       | ParameterStore/ParameterReplicationFunction (ParameterStoreParameterReplicationFunction54B02DC7) [0m
[0;34m🔄 TapStackdev | 128/138 | 2:02:24 PM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission                     | ParameterStore/ParameterChangeRule/AllowEventRuleTapStackdevParameterStoreParameterReplicationFunction9B02C33E (ParameterStoreParameterChangeRuleAllowEventRuleTapStackdevParameterStoreParameterReplicationFunction9B02C33EAED68F85) [0m
[0;32m✅ TapStackdev | 129/138 | 2:02:24 PM | CREATE_COMPLETE      | AWS::Events::Rule                           | ParameterStore/ParameterChangeRule (ParameterStoreParameterChangeRule7736D702) [0m
[0;34m🔄 TapStackdev | 129/138 | 2:02:24 PM | CREATE_IN_PROGRESS   | Custom::LogRetention                        | ParameterStore/ParameterReplicationFunction/LogRetention (ParameterStoreParameterReplicationFunctionLogRetention06A70CCE) [0m
[0;32m✅ TapStackdev | 130/138 | 2:02:24 PM | CREATE_COMPLETE      | AWS::Lambda::Permission                     | ParameterStore/ParameterChangeRule/AllowEventRuleTapStackdevParameterStoreParameterReplicationFunction9B02C33E (ParameterStoreParameterChangeRuleAllowEventRuleTapStackdevParameterStoreParameterReplicationFunction9B02C33EAED68F85) [0m
[0;34m🔄 TapStackdev | 130/138 | 2:02:31 PM | CREATE_IN_PROGRESS   | AWS::Route53::HostedZone                    | Route53/HostedZone (Route53HostedZoneBA40ECB3) [0m
[0;32m✅ TapStackdev | 131/138 | 2:02:31 PM | CREATE_COMPLETE      | Custom::LogRetention                        | ParameterStore/ParameterReplicationFunction/LogRetention (ParameterStoreParameterReplicationFunctionLogRetention06A70CCE) [0m
[0;34m🔄 TapStackdev | 131/138 | 2:02:31 PM | CREATE_IN_PROGRESS   | AWS::Route53::RecordSet                     | Route53/AppRecord (Route53AppRecord7B944693) [0m
[0;32m✅ TapStackdev | 132/138 | 2:02:31 PM | CREATE_COMPLETE      | AWS::Route53::HostedZone                    | Route53/HostedZone (Route53HostedZoneBA40ECB3) [0m
[0;34m🔄 TapStackdev | 132/138 | 2:02:31 PM | CREATE_IN_PROGRESS   | AWS::Route53::HealthCheck                   | Route53/HealthCheck (Route53HealthCheckE7919D71) [0m
[0;32m✅ TapStackdev | 133/138 | 2:02:31 PM | CREATE_COMPLETE      | AWS::Route53::RecordSet                     | Route53/AppRecord (Route53AppRecord7B944693) [0m
[0;34m🔄 TapStackdev | 133/138 | 2:02:31 PM | CREATE_IN_PROGRESS   | AWS::S3::BucketPolicy                       | Storage/DataBucket/Policy (StorageDataBucketPolicyC997B69E) [0m
[0;32m✅ TapStackdev | 134/138 | 2:02:31 PM | CREATE_COMPLETE      | AWS::Route53::HealthCheck                   | Route53/HealthCheck (Route53HealthCheckE7919D71) [0m
[0;34m🔄 TapStackdev | 134/138 | 2:02:31 PM | CREATE_IN_PROGRESS   | Custom::S3AutoDeleteObjects                 | Storage/DataBucket/AutoDeleteObjectsCustomResource/Default (StorageDataBucketAutoDeleteObjectsCustomResource4BB14FB3) [0m
[0;32m✅ TapStackdev | 135/138 | 2:02:31 PM | CREATE_COMPLETE      | AWS::S3::BucketPolicy                       | Storage/DataBucket/Policy (StorageDataBucketPolicyC997B69E) [0m
[0;34m🔄 TapStackdev | 135/138 | 2:02:38 PM | CREATE_IN_PROGRESS   | AWS::DynamoDB::GlobalTable                  | Storage/SessionTable (StorageSessionTable45B5C5F7) [0m
[0;32m✅ TapStackdev | 136/138 | 2:02:38 PM | CREATE_COMPLETE      | Custom::S3AutoDeleteObjects                 | Storage/DataBucket/AutoDeleteObjectsCustomResource/Default (StorageDataBucketAutoDeleteObjectsCustomResource4BB14FB3) [0m
[0;32m✅ TapStackdev | 137/138 | 2:02:39 PM | CREATE_COMPLETE      | AWS::DynamoDB::GlobalTable                  | Storage/SessionTable (StorageSessionTable45B5C5F7) [0m
[0;32m✅ TapStackdev | 138/138 | 2:02:39 PM | CREATE_COMPLETE      | AWS::CloudFormation::Stack                  | TapStackdev [0m
[1;33m[0m
[1;33m ✅  TapStackdev[0m
[1;33m[0m
[1;33m✨  Deployment time: 76.87s[0m
[1;33m[0m
[0;36m📋 Outputs:[0m
[1;33mTapStackdev.BackupBackupStatus7E7DE627 = Skipped (LocalStack does not fully support AWS Backup)[0m
[1;33mTapStackdev.ComputeClusterArnAF3DAB3A = arn:aws:ecs:us-east-1:000000000000:cluster/TapStackdevClusterus-east-1[0m
[1;33mTapStackdev.ComputeLoadBalancerArn90386098 = arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/TapStackdevALBus-east-1/b61d6a8c8e261b42[0m
[1;33mTapStackdev.ComputeLoadBalancerDNSA9DD8FDB = TapStackdevALBus-east-1.elb.localhost.localstack.cloud[0m
[1;33mTapStackdev.ComputeServiceName454090EE = TapStackdevServiceus-east-1[0m
[1;33mTapStackdev.EnvironmentSuffix = dev[0m
[1;33mTapStackdev.EventBridgeDLQUrl991EA512 = http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TapStackdevEventDLQus-east-1[0m
[1;33mTapStackdev.EventBridgeEventBusArn44514A25 = arn:aws:events:us-east-1:000000000000:event-bus/TapStackdevEventBusus-east-1[0m
[1;33mTapStackdev.EventBridgeEventBusNameB104F7A2 = TapStackdevEventBusus-east-1[0m
[1;33mTapStackdev.EventBridgeTargetQueueUrlE76487CC = http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TapStackdevEventQueueus-east-1[0m
[1;33mTapStackdev.FailoverStateMachineArnA1684404 = arn:aws:states:us-east-1:000000000000:stateMachine:TapStackdevFailoverOrchestration[0m
[1;33mTapStackdev.FailoverStateMachineNameBA59E53F = TapStackdevFailoverOrchestration[0m
[1;33mTapStackdev.MonitoringArtifactsBucketName3E5FAD33 = tapstackdevcanaryuseast1[0m
[1;33mTapStackdev.MonitoringCanaryId39D7E13E = unknown[0m
[1;33mTapStackdev.MonitoringCanaryName056E95A7 = unknown[0m
[1;33mTapStackdev.ParameterStoreAppConfigParameterName849D503C = /TapStackdev/app/config[0m
[1;33mTapStackdev.ParameterStoreDBConfigParameterName4B64D43A = /TapStackdev/db/config[0m
[1;33mTapStackdev.ParameterStoreReplicationFunctionArn9E4EB907 = arn:aws:lambda:us-east-1:000000000000:function:TapStackdevParamReplication[0m
[1;33mTapStackdev.Region = us-east-1[0m
[1;33mTapStackdev.Route53DNSNameAE125B80 = app.tapstackdev.internal[0m
[1;33mTapStackdev.Route53HealthCheckId05FD9321 = a26f0ff8-d4f3-4d88-b57b-17ab3cd9a2d4[0m
[1;33mTapStackdev.Route53HostedZoneId0798BCF4 = /hostedzone/PZ6ZEMIOR833R4I9H2UXPE[0m
[1;33mTapStackdev.Route53LoadBalancerDNS5B9BECA0 = TapStackdevALBus-east-1.elb.localhost.localstack.cloud[0m
[1;33mTapStackdev.StorageBucketArn98D89688 = arn:aws:s3:::tapstackdevdatauseast1[0m
[1;33mTapStackdev.StorageBucketName37AA483C = tapstackdevdatauseast1[0m
[1;33mTapStackdev.StorageSessionTableArn7EF6A183 = arn:aws:dynamodb:us-east-1:000000000000:table/TapStackdevSessions[0m
[1;33mTapStackdev.StorageSessionTableName14EC6095 = TapStackdevSessions[0m
[1;33mStack ARN:[0m
[1;33marn:aws:cloudformation:us-east-1:000000000000:stack/TapStackdev/5eb914f5-7192-4303-a802-34c68852a5c9[0m
[1;33m[0m
[1;33m✨  Total time: 80.43s[0m
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
[0;32m⏱️  Total deployment time: 81s[0m
[1;33m🔍 Verifying deployment...[0m
[0;32m✅ Stack status: CREATE_COMPLETE[0m
[0;36m📊 Final Resource Summary:[0m
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
[0;32m✅ Successfully deployed resources: 137[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json[0m
[0;34m📋 Stack Outputs:[0m
  • BackupBackupStatus7E7DE627: Skipped (LocalStack does not fully support AWS Backup)
  • ComputeClusterArnAF3DAB3A: arn:aws:ecs:us-east-1:000000000000:cluster/TapStackdevClusterus-east-1
  • ComputeLoadBalancerArn90386098: arn:aws:elasticloadbalancing:us-east-1:000000000000:loadbalancer/app/TapStackdevALBus-east-1/b61d6a8c8e261b42
  • ComputeLoadBalancerDNSA9DD8FDB: TapStackdevALBus-east-1.elb.localhost.localstack.cloud
  • ComputeServiceName454090EE: TapStackdevServiceus-east-1
  • EnvironmentSuffix: dev
  • EventBridgeDLQUrl991EA512: http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TapStackdevEventDLQus-east-1
  • EventBridgeEventBusArn44514A25: arn:aws:events:us-east-1:000000000000:event-bus/TapStackdevEventBusus-east-1
  • EventBridgeEventBusNameB104F7A2: TapStackdevEventBusus-east-1
  • EventBridgeTargetQueueUrlE76487CC: http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TapStackdevEventQueueus-east-1
  • FailoverStateMachineArnA1684404: arn:aws:states:us-east-1:000000000000:stateMachine:TapStackdevFailoverOrchestration
  • FailoverStateMachineNameBA59E53F: TapStackdevFailoverOrchestration
  • MonitoringArtifactsBucketName3E5FAD33: tapstackdevcanaryuseast1
  • MonitoringCanaryId39D7E13E: unknown
  • MonitoringCanaryName056E95A7: unknown
  • ParameterStoreAppConfigParameterName849D503C: /TapStackdev/app/config
  • ParameterStoreDBConfigParameterName4B64D43A: /TapStackdev/db/config
  • ParameterStoreReplicationFunctionArn9E4EB907: arn:aws:lambda:us-east-1:000000000000:function:TapStackdevParamReplication
  • Region: us-east-1
  • Route53DNSNameAE125B80: app.tapstackdev.internal
  • Route53HealthCheckId05FD9321: a26f0ff8-d4f3-4d88-b57b-17ab3cd9a2d4
  • Route53HostedZoneId0798BCF4: /hostedzone/PZ6ZEMIOR833R4I9H2UXPE
  • Route53LoadBalancerDNS5B9BECA0: TapStackdevALBus-east-1.elb.localhost.localstack.cloud
  • StorageBucketArn98D89688: arn:aws:s3:::tapstackdevdatauseast1
  • StorageBucketName37AA483C: tapstackdevdatauseast1
  • StorageSessionTableArn7EF6A183: arn:aws:dynamodb:us-east-1:000000000000:table/TapStackdevSessions
  • StorageSessionTableName14EC6095: TapStackdevSessions
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: TapStackdev[0m
[0;34m  • Status: CREATE_COMPLETE[0m
[0;34m  • Resources: 137 deployed[0m
[0;34m  • Duration: 81s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 CDK deployment to LocalStack completed successfully![0m
