# Amazon EKS Cluster CloudFormation Template

This CloudFormation template creates a production-ready Amazon EKS cluster with managed node groups for a payment processing platform.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Amazon EKS Cluster with Managed Node Groups for Payment Processing Platform

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix to append to resource names for uniqueness
    Default: dev
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: VPC ID where EKS cluster will be deployed

  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: List of private subnet IDs for EKS cluster (minimum 2 AZs)

  ClusterVersion:
    Type: String
    Description: Kubernetes version for EKS cluster
    Default: '1.28'
    AllowedValues:
      - '1.28'
      - '1.27'
      - '1.26'

  NodeGroupMinSize:
    Type: Number
    Description: Minimum number of nodes in the node group
    Default: 2
    MinValue: 2

  NodeGroupMaxSize:
    Type: Number
    Description: Maximum number of nodes in the node group
    Default: 6
    MinValue: 2

  NodeGroupDesiredSize:
    Type: Number
    Description: Desired number of nodes in the node group
    Default: 2
    MinValue: 2

  NodeInstanceType1:
    Type: String
    Description: First instance type for Spot node group
    Default: t3.medium

  NodeInstanceType2:
    Type: String
    Description: Second instance type for Spot node group
    Default: t3a.medium

Resources:
  # CloudWatch Log Group for EKS Control Plane Logs
  EKSClusterLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/eks/eks-cluster-${EnvironmentSuffix}/cluster'
      RetentionInDays: 30

  # IAM Role for EKS Cluster
  EKSClusterRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eks-cluster-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: eks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy'
        - 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'

  # IAM Role for EKS Node Group
  EKSNodeRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'eks-node-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
        - 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy'
        - 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'

  # EKS Cluster
  EKSCluster:
    Type: AWS::EKS::Cluster
    DeletionPolicy: Retain
    DependsOn: EKSClusterLogGroup
    Properties:
      Name: !Sub 'eks-cluster-${EnvironmentSuffix}'
      Version: !Ref ClusterVersion
      RoleArn: !GetAtt EKSClusterRole.Arn
      ResourcesVpcConfig:
        SubnetIds: !Ref PrivateSubnetIds
        EndpointPrivateAccess: true
        EndpointPublicAccess: false
      Logging:
        ClusterLogging:
          EnabledTypes:
            - Type: api
            - Type: audit
            - Type: authenticator
            - Type: controllerManager
            - Type: scheduler

  # OIDC Provider for IRSA
  EKSOIDCProvider:
    Type: AWS::IAM::OIDCProvider
    Properties:
      ClientIdList:
        - sts.amazonaws.com
      ThumbprintList:
        - 9e99a48a9960b14926bb7f3b02e22da2b0ab7280
      Url: !GetAtt EKSCluster.OpenIdConnectIssuerUrl

  # Launch Template for Node Group with EBS Encryption
  NodeGroupLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'eks-node-template-${EnvironmentSuffix}'
      LaunchTemplateData:
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 2
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'eks-node-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix

  # Managed Node Group with Spot Instances
  EKSNodeGroup:
    Type: AWS::EKS::Nodegroup
    DependsOn: EKSCluster
    Properties:
      NodegroupName: !Sub 'eks-nodegroup-payment-${EnvironmentSuffix}'
      ClusterName: !Ref EKSCluster
      NodeRole: !GetAtt EKSNodeRole.Arn
      Subnets: !Ref PrivateSubnetIds
      ScalingConfig:
        MinSize: !Ref NodeGroupMinSize
        MaxSize: !Ref NodeGroupMaxSize
        DesiredSize: !Ref NodeGroupDesiredSize
      UpdateConfig:
        MaxUnavailable: 1
      CapacityType: SPOT
      InstanceTypes:
        - !Ref NodeInstanceType1
        - !Ref NodeInstanceType2
      AmiType: AL2_x86_64
      LaunchTemplate:
        Id: !Ref NodeGroupLaunchTemplate
      Taints:
        - Key: workload
          Value: payment
          Effect: NO_SCHEDULE
      Tags:
        Name: !Sub 'eks-nodegroup-${EnvironmentSuffix}'
        Environment: !Ref EnvironmentSuffix

Outputs:
  ClusterName:
    Description: EKS Cluster Name
    Value: !Ref EKSCluster
    Export:
      Name: !Sub '${AWS::StackName}-ClusterName'

  ClusterArn:
    Description: EKS Cluster ARN
    Value: !GetAtt EKSCluster.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ClusterArn'

  ClusterEndpoint:
    Description: EKS Cluster API Endpoint
    Value: !GetAtt EKSCluster.Endpoint
    Export:
      Name: !Sub '${AWS::StackName}-ClusterEndpoint'

  ClusterSecurityGroupId:
    Description: Security Group ID for the cluster control plane
    Value: !GetAtt EKSCluster.ClusterSecurityGroupId
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  OIDCProviderArn:
    Description: ARN of the OIDC Provider for IRSA
    Value: !Ref EKSOIDCProvider
    Export:
      Name: !Sub '${AWS::StackName}-OIDCProviderArn'

  OIDCProviderUrl:
    Description: URL of the OIDC Provider
    Value: !GetAtt EKSCluster.OpenIdConnectIssuerUrl
    Export:
      Name: !Sub '${AWS::StackName}-OIDCProviderUrl'

  NodeGroupName:
    Description: Name of the EKS Node Group
    Value: !Ref EKSNodeGroup
    Export:
      Name: !Sub '${AWS::StackName}-NodeGroupName'

  NodeRoleArn:
    Description: ARN of the Node IAM Role
    Value: !GetAtt EKSNodeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-NodeRoleArn'

  LogGroupName:
    Description: CloudWatch Log Group Name
    Value: !Ref EKSClusterLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroupName'
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. VPC with at least 2 private subnets in different availability zones
3. NAT Gateways configured for private subnet internet access

### Deployment Steps

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name eks-payment-platform-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxxxx,subnet-yyyyy" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name eks-payment-platform-dev \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name eks-payment-platform-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name eks-cluster-dev \
  --region us-east-1

# Verify cluster access
kubectl get nodes
kubectl get pods -A
```

## Key Features Implemented

1. EKS Cluster version 1.28 with private API endpoint only
2. Managed node group with 2-6 t3.medium Spot instances
3. Control plane logging enabled for all log types (api, audit, authenticator, controllerManager, scheduler)
4. OIDC identity provider for IRSA support
5. Node group taints for workload isolation (Key=workload, Value=payment, Effect=NoSchedule)
6. IAM roles with least privilege permissions
7. EBS volume encryption using AWS-managed KMS keys
8. CloudWatch log group with 30-day retention
9. Update policy with MaxUnavailable=1
10. Deletion protection using DeletionPolicy: Retain for EKS cluster

## Security Considerations

- Private endpoint access only (no public access)
- EBS volumes encrypted at rest
- IMDSv2 required for EC2 instances
- Least privilege IAM roles
- All control plane logs exported to CloudWatch
- Node groups use Amazon Linux 2 EKS-optimized AMIs

## Cost Optimization

- Spot instances for node groups (up to 90% cost savings)
- Multiple instance types for better Spot availability
- Scaling configuration (2-6 nodes) based on workload
- 30-day log retention (balance compliance and cost)