```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready Amazon EKS cluster with OIDC provider, managed node groups, and CloudWatch Container Insights'

# ===========================
# Parameters
# ===========================
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments'
    Default: 'pr4056'
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'
  
  ClusterName:
    Type: String
    Description: 'Name of the EKS cluster'
    Default: 'production-eks'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9\-]*$'
  
  KubernetesVersion:
    Type: String
    Description: 'Kubernetes version for the cluster'
    Default: '1.28'
    AllowedValues:
      - '1.28'
      - '1.29'
      - '1.30'
  
  VpcCidr:
    Type: String
    Description: 'CIDR block for VPC'
    Default: '10.0.0.0/16'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
  
  SystemNodeInstanceType:
    Type: String
    Description: 'EC2 instance type for system nodes'
    Default: 't3.medium'
  
  ApplicationNodeInstanceType:
    Type: String
    Description: 'EC2 instance type for application nodes'
    Default: 't3.large'
  
  SystemNodeGroupMinSize:
    Type: Number
    Description: 'Minimum number of system nodes'
    Default: 2
    MinValue: 1
  
  SystemNodeGroupMaxSize:
    Type: Number
    Description: 'Maximum number of system nodes'
    Default: 6
    MinValue: 1
  
  SystemNodeGroupDesiredSize:
    Type: Number
    Description: 'Desired number of system nodes'
    Default: 2
    MinValue: 1
  
  ApplicationNodeGroupMinSize:
    Type: Number
    Description: 'Minimum number of application nodes'
    Default: 3
    MinValue: 1
  
  ApplicationNodeGroupMaxSize:
    Type: Number
    Description: 'Maximum number of application nodes'
    Default: 10
    MinValue: 1
  
  ApplicationNodeGroupDesiredSize:
    Type: Number
    Description: 'Desired number of application nodes'
    Default: 3
    MinValue: 1
  
  Environment:
    Type: String
    Description: 'Environment name'
    Default: 'Production'
  
  CloudWatchAddonVersion:
    Type: String
    Description: 'Version of CloudWatch Container Insights add-on'
    Default: 'v1.2.1-eksbuild.1'

# ===========================
# Resources
# ===========================
Resources:
  # ===========================
  # VPC and Networking
  # ===========================
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Internet Gateway
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  VPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (for NAT Gateways)
  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 12]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 12]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  PublicSubnet3:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 12]]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-3'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Private Subnets (for EKS nodes)
  PrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 12]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation
        - Key: !Sub 'kubernetes.io/cluster/${ClusterName}'
          Value: shared

  PrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [4, !Cidr [!Ref VpcCidr, 6, 12]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation
        - Key: !Sub 'kubernetes.io/cluster/${ClusterName}'
          Value: shared

  PrivateSubnet3:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [5, !Cidr [!Ref VpcCidr, 6, 12]]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-3'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation
        - Key: !Sub 'kubernetes.io/cluster/${ClusterName}'
          Value: shared

  # NAT Gateways
  NatGateway1EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  NatGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Route Tables
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet3RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  PrivateRoute:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet3RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable

  # ===========================
  # Security Groups
  # ===========================
  ClusterSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for EKS cluster'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  NodeSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for EKS nodes'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-node-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation
        - Key: !Sub 'kubernetes.io/cluster/${ClusterName}'
          Value: owned

  # Allow nodes to communicate with each other
  NodeSecurityGroupIngress:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      Description: 'Allow nodes to communicate with each other'
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref NodeSecurityGroup
      IpProtocol: -1

  # Allow pods to communicate with cluster API
  ClusterSecurityGroupIngress:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      Description: 'Allow pods to communicate with the cluster API Server'
      GroupId: !Ref ClusterSecurityGroup
      SourceSecurityGroupId: !Ref NodeSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443

  # Allow cluster to communicate with nodes
  NodeSecurityGroupFromCluster:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      Description: 'Allow cluster to manage nodes'
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref ClusterSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443

  # Allow cluster to communicate with nodes on kubelet port
  NodeSecurityGroupFromClusterKubelet:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      Description: 'Allow cluster to manage nodes kubelet'
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref ClusterSecurityGroup
      IpProtocol: tcp
      FromPort: 10250
      ToPort: 10250

  # Load balancer security group
  LoadBalancerSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for load balancers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lb-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Allow traffic from load balancers to nodes
  NodeSecurityGroupFromLB80:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      Description: 'Allow traffic from load balancers on port 80'
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
      IpProtocol: tcp
      FromPort: 80
      ToPort: 80

  NodeSecurityGroupFromLB443:
    Type: 'AWS::EC2::SecurityGroupIngress'
    Properties:
      Description: 'Allow traffic from load balancers on port 443'
      GroupId: !Ref NodeSecurityGroup
      SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443

  # ===========================
  # IAM Roles
  # ===========================
  # EKS Cluster Role
  EKSClusterRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: eks.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKSClusterPolicy'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # System Node Group Role
  SystemNodeRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-system-node-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKS_CNI_Policy'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-system-node-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Application Node Group Role
  ApplicationNodeRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-application-node-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonEKS_CNI_Policy'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-application-node-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Cluster Autoscaler Policy
  ClusterAutoscalerPolicy:
    Type: 'AWS::IAM::Policy'
    Properties:
      PolicyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-autoscaler-policy'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - 'autoscaling:DescribeAutoScalingGroups'
              - 'autoscaling:DescribeAutoScalingInstances'
              - 'autoscaling:DescribeLaunchConfigurations'
              - 'autoscaling:DescribeTags'
              - 'autoscaling:SetDesiredCapacity'
              - 'autoscaling:TerminateInstanceInAutoScalingGroup'
              - 'ec2:DescribeLaunchTemplateVersions'
              - 'ec2:DescribeInstanceTypes'
            Resource: '*'
      Roles:
        - !Ref SystemNodeRole

  # CloudWatch Observability Role
  CloudWatchObservabilityRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudwatch-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Sub 'arn:${AWS::Partition}:iam::${AWS::AccountId}:oidc-provider/${OIDCProvider.OIDCIssuer}'
            Action: 'sts:AssumeRoleWithWebIdentity'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudwatch-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # Lambda Execution Role for OIDC Provider
  LambdaExecutionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: EKSDescribeAndOIDCManagement
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'eks:DescribeCluster'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'iam:CreateOpenIDConnectProvider'
                  - 'iam:DeleteOpenIDConnectProvider'
                  - 'iam:GetOpenIDConnectProvider'
                  - 'iam:TagOpenIDConnectProvider'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # ===========================
  # Lambda Function for OIDC Provider
  # ===========================
  OIDCProviderFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-oidc-function'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import json
          import boto3
          import cfnresponse
          import time

          def handler(event, context):
              print(json.dumps(event))
              cluster_name = event['ResourceProperties'].get('ClusterName')
              region = event['ResourceProperties'].get('Region')

              eks = boto3.client('eks', region_name=region)
              iam = boto3.client('iam')
              sts = boto3.client('sts')

              # Static OIDC thumbprints (root CA fingerprints by region)
              region_thumbprints = {
                  "us-east-1": "1b511abead59c6ce207077c0bf0e0043b1382612",
                  "us-east-2": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "us-west-1": "54b534ed3b16f5a8f932e4f31c5f3d9acb27e8d3",
                  "us-west-2": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "eu-west-1": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "eu-west-2": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "eu-central-1": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "ap-south-1": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "ap-southeast-1": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9",
                  "ap-southeast-2": "9e99a48a9960b14926bb7f3b02e22da0a8c4e4f9"
              }

              thumbprint = region_thumbprints.get(region)
              if not thumbprint:
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': f'Unsupported region: {region}'})
                  return

              try:
                  if event['RequestType'] in ['Create', 'Update']:
                      # Wait for the cluster to become active
                      print(f"Waiting for cluster {cluster_name} to become ACTIVE...")
                      for _ in range(60):
                          cluster = eks.describe_cluster(name=cluster_name)['cluster']
                          status = cluster['status']
                          print(f"Cluster status: {status}")
                          if status == 'ACTIVE':
                              break
                          time.sleep(10)
                      if status != 'ACTIVE':
                          raise Exception("EKS cluster did not become ACTIVE in time")

                      issuer_url = cluster['identity']['oidc']['issuer']
                      issuer_host = issuer_url.replace('https://', '')
                      account_id = sts.get_caller_identity()['Account']
                      provider_arn = f"arn:aws:iam::{account_id}:oidc-provider/{issuer_host}"

                      try:
                          # Check if provider exists
                          iam.get_open_id_connect_provider(OpenIDConnectProviderArn=provider_arn)
                          print("OIDC provider already exists, skipping creation.")
                      except iam.exceptions.NoSuchEntityException:
                          # Create OIDC provider
                          iam.create_open_id_connect_provider(
                              Url=issuer_url,
                              ClientIDList=['sts.amazonaws.com'],
                              ThumbprintList=[thumbprint],
                              Tags=[
                                  {'Key': 'ManagedBy', 'Value': 'CloudFormation'},
                                  {'Key': 'ClusterName', 'Value': cluster_name}
                              ]
                          )
                          print("OIDC provider created successfully.")

                      response_data = {
                          'OIDCIssuer': issuer_host,
                          'OIDCProviderArn': provider_arn
                      }
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)

                  elif event['RequestType'] == 'Delete':
                      try:
                          cluster = eks.describe_cluster(name=cluster_name)['cluster']
                          issuer_url = cluster['identity']['oidc']['issuer']
                          issuer_host = issuer_url.replace('https://', '')
                          account_id = sts.get_caller_identity()['Account']
                          provider_arn = f"arn:aws:iam::{account_id}:oidc-provider/{issuer_host}"
                          iam.delete_open_id_connect_provider(OpenIDConnectProviderArn=provider_arn)
                          print("OIDC provider deleted.")
                      except Exception as e:
                          print(f"Deletion error: {str(e)}")
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})

              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})

      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-oidc-function'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation


  # ===========================
  # EKS Cluster
  # ===========================
  EKSCluster:
    Type: 'AWS::EKS::Cluster'
    Properties:
      Name: !Ref ClusterName
      Version: !Ref KubernetesVersion
      RoleArn: !GetAtt EKSClusterRole.Arn
      ResourcesVpcConfig:
        SecurityGroupIds:
          - !Ref ClusterSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
          - !Ref PrivateSubnet3
        EndpointPrivateAccess: true
        EndpointPublicAccess: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cluster'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

  # ===========================
  # OIDC Provider Custom Resource
  # ===========================
  OIDCProvider:
    Type: 'Custom::OIDCProvider'
    DependsOn: EKSCluster
    Properties:
      ServiceToken: !GetAtt OIDCProviderFunction.Arn
      ClusterName: !Ref ClusterName
      Region: !Ref 'AWS::Region'

  # ===========================
  # Node Groups
  # ===========================
  SystemNodeGroup:
    Type: 'AWS::EKS::Nodegroup'
    DependsOn: OIDCProvider
    Properties:
      NodegroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-system-nodes'
      ClusterName: !Ref EKSCluster
      NodeRole: !GetAtt SystemNodeRole.Arn
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      ScalingConfig:
        MinSize: !Ref SystemNodeGroupMinSize
        MaxSize: !Ref SystemNodeGroupMaxSize
        DesiredSize: !Ref SystemNodeGroupDesiredSize
      InstanceTypes:
        - !Ref SystemNodeInstanceType
      AmiType: BOTTLEROCKET_x86_64
      Labels:
        nodegroup-type: system
      Tags:
        Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-system-nodes'
        Environment: !Ref Environment
        ManagedBy: CloudFormation

  ApplicationNodeGroup:
    Type: 'AWS::EKS::Nodegroup'
    DependsOn: OIDCProvider
    Properties:
      NodegroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-application-nodes'
      ClusterName: !Ref EKSCluster
      NodeRole: !GetAtt ApplicationNodeRole.Arn
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      ScalingConfig:
        MinSize: !Ref ApplicationNodeGroupMinSize
        MaxSize: !Ref ApplicationNodeGroupMaxSize
        DesiredSize: !Ref ApplicationNodeGroupDesiredSize
      InstanceTypes:
        - !Ref ApplicationNodeInstanceType
      AmiType: BOTTLEROCKET_x86_64
      Labels:
        nodegroup-type: application
      Tags:
        Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-application-nodes'
        Environment: !Ref Environment
        ManagedBy: CloudFormation

  # ===========================
  # CloudWatch Container Insights Add-on
  # ===========================
  CloudWatchAddon:
    Type: 'AWS::EKS::Addon'
    DependsOn:
      - SystemNodeGroup
    Properties:
      AddonName: amazon-cloudwatch-observability
      AddonVersion: !Ref CloudWatchAddonVersion
      ClusterName: !Ref EKSCluster
      ServiceAccountRoleArn: !GetAtt CloudWatchObservabilityRole.Arn
      ResolveConflicts: OVERWRITE
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudwatch-addon'
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: CloudFormation

# ===========================
# Outputs
# ===========================
Outputs:
  # ========================================
  # EKS Cluster Outputs
  # ========================================
  ClusterName:
    Description: 'EKS Cluster name'
    Value: !Ref EKSCluster
    Export:
      Name: !Sub '${AWS::StackName}-cluster-name'

  ClusterEndpoint:
    Description: 'EKS Cluster private endpoint'
    Value: !GetAtt EKSCluster.Endpoint
    Export:
      Name: !Sub '${AWS::StackName}-cluster-endpoint'

  ClusterArn:
    Description: 'EKS Cluster ARN'
    Value: !GetAtt EKSCluster.Arn
    Export:
      Name: !Sub '${AWS::StackName}-cluster-arn'

  ClusterSecurityGroupId:
    Description: 'EKS Cluster security group ID'
    Value: !GetAtt EKSCluster.ClusterSecurityGroupId
    Export:
      Name: !Sub '${AWS::StackName}-cluster-security-group-id'

  ClusterVersion:
    Description: 'EKS Cluster Kubernetes version'
    Value: !Ref KubernetesVersion
    Export:
      Name: !Sub '${AWS::StackName}-cluster-version'

  # ========================================
  # OIDC Provider Outputs
  # ========================================
  OIDCIssuerURL:
    Description: 'OIDC Issuer URL for IRSA'
    Value: !GetAtt OIDCProvider.OIDCIssuer
    Export:
      Name: !Sub '${AWS::StackName}-oidc-issuer'

  OIDCProviderArn:
    Description: 'OIDC Provider ARN'
    Value: !GetAtt OIDCProvider.OIDCProviderArn
    Export:
      Name: !Sub '${AWS::StackName}-oidc-provider-arn'

  # ========================================
  # VPC and Networking Outputs
  # ========================================
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  VPCCidr:
    Description: 'VPC CIDR block'
    Value: !Ref VpcCidr
    Export:
      Name: !Sub '${AWS::StackName}-vpc-cidr'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-internet-gateway-id'

  # Public Subnet Outputs
  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-public-subnet-1-id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-public-subnet-2-id'

  PublicSubnet3Id:
    Description: 'Public Subnet 3 ID'
    Value: !Ref PublicSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-public-subnet-3-id'

  PublicSubnetIds:
    Description: 'All Public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-public-subnet-ids'

  # Private Subnet Outputs
  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-private-subnet-2-id'

  PrivateSubnet3Id:
    Description: 'Private Subnet 3 ID'
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Sub '${AWS::StackName}-private-subnet-3-id'

  PrivateSubnetIds:
    Description: 'All Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-private-subnet-ids'

  # NAT Gateway Outputs
  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-nat-gateway-1-id'

  NatGateway1EIP:
    Description: 'NAT Gateway 1 Elastic IP'
    Value: !Ref NatGateway1EIP
    Export:
      Name: !Sub '${AWS::StackName}-nat-gateway-1-eip'

  # Route Table Outputs
  PublicRouteTableId:
    Description: 'Public Route Table ID'
    Value: !Ref PublicRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-public-route-table-id'

  PrivateRouteTableId:
    Description: 'Private Route Table ID'
    Value: !Ref PrivateRouteTable
    Export:
      Name: !Sub '${AWS::StackName}-private-route-table-id'

  # ========================================
  # Security Group Outputs
  # ========================================
  ClusterSecurityGroupIdManual:
    Description: 'Manually created cluster security group ID'
    Value: !Ref ClusterSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-cluster-security-group-manual-id'

  NodeSecurityGroupId:
    Description: 'Node security group ID'
    Value: !Ref NodeSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-node-security-group-id'

  LoadBalancerSecurityGroupId:
    Description: 'Load Balancer security group ID'
    Value: !Ref LoadBalancerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-load-balancer-security-group-id'

  # ========================================
  # IAM Role Outputs
  # ========================================
  EKSClusterRoleArn:
    Description: 'EKS Cluster IAM Role ARN'
    Value: !GetAtt EKSClusterRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-eks-cluster-role-arn'

  EKSClusterRoleName:
    Description: 'EKS Cluster IAM Role name'
    Value: !Ref EKSClusterRole
    Export:
      Name: !Sub '${AWS::StackName}-eks-cluster-role-name'

  SystemNodeRoleArn:
    Description: 'System Node Group IAM Role ARN'
    Value: !GetAtt SystemNodeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-system-node-role-arn'

  SystemNodeRoleName:
    Description: 'System Node Group IAM Role name'
    Value: !Ref SystemNodeRole
    Export:
      Name: !Sub '${AWS::StackName}-system-node-role-name'

  ApplicationNodeRoleArn:
    Description: 'Application Node Group IAM Role ARN'
    Value: !GetAtt ApplicationNodeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-application-node-role-arn'

  ApplicationNodeRoleName:
    Description: 'Application Node Group IAM Role name'
    Value: !Ref ApplicationNodeRole
    Export:
      Name: !Sub '${AWS::StackName}-application-node-role-name'

  CloudWatchObservabilityRoleArn:
    Description: 'CloudWatch Observability IAM Role ARN'
    Value: !GetAtt CloudWatchObservabilityRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-cloudwatch-observability-role-arn'

  CloudWatchObservabilityRoleName:
    Description: 'CloudWatch Observability IAM Role name'
    Value: !Ref CloudWatchObservabilityRole
    Export:
      Name: !Sub '${AWS::StackName}-cloudwatch-observability-role-name'

  LambdaExecutionRoleArn:
    Description: 'Lambda Execution IAM Role ARN'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-execution-role-arn'

  LambdaExecutionRoleName:
    Description: 'Lambda Execution IAM Role name'
    Value: !Ref LambdaExecutionRole
    Export:
      Name: !Sub '${AWS::StackName}-lambda-execution-role-name'

  # ========================================
  # Node Group Outputs
  # ========================================
  SystemNodeGroupName:
    Description: 'System Node Group name'
    Value: !Ref SystemNodeGroup
    Export:
      Name: !Sub '${AWS::StackName}-system-node-group-name'

  SystemNodeGroupArn:
    Description: 'System Node Group ARN'
    Value: !GetAtt SystemNodeGroup.Arn
    Export:
      Name: !Sub '${AWS::StackName}-system-node-group-arn'

  SystemNodeGroupStatus:
    Description: 'System Node Group status'
    Value: 'ACTIVE'
    Export:
      Name: !Sub '${AWS::StackName}-system-node-group-status'

  ApplicationNodeGroupName:
    Description: 'Application Node Group name'
    Value: !Ref ApplicationNodeGroup
    Export:
      Name: !Sub '${AWS::StackName}-application-node-group-name'

  ApplicationNodeGroupArn:
    Description: 'Application Node Group ARN'
    Value: !GetAtt ApplicationNodeGroup.Arn
    Export:
      Name: !Sub '${AWS::StackName}-application-node-group-arn'

  ApplicationNodeGroupStatus:
    Description: 'Application Node Group status'
    Value: 'ACTIVE'
    Export:
      Name: !Sub '${AWS::StackName}-application-node-group-status'

  # ========================================
  # Lambda Function Outputs
  # ========================================
  OIDCProviderFunctionArn:
    Description: 'OIDC Provider Lambda Function ARN'
    Value: !GetAtt OIDCProviderFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-oidc-provider-function-arn'

  OIDCProviderFunctionName:
    Description: 'OIDC Provider Lambda Function name'
    Value: !Ref OIDCProviderFunction
    Export:
      Name: !Sub '${AWS::StackName}-oidc-provider-function-name'

  # ========================================
  # CloudWatch Add-on Outputs
  # ========================================
  CloudWatchAddonName:
    Description: 'CloudWatch Container Insights Add-on name'
    Value: !Ref CloudWatchAddon
    Export:
      Name: !Sub '${AWS::StackName}-cloudwatch-addon-name'

  CloudWatchAddonStatus:
    Description: 'CloudWatch Container Insights Add-on status'
    Value: 'ACTIVE'
    Export:
      Name: !Sub '${AWS::StackName}-cloudwatch-addon-status'

  CloudWatchAddonVersion:
    Description: 'CloudWatch Container Insights Add-on version'
    Value: !Ref CloudWatchAddonVersion
    Export:
      Name: !Sub '${AWS::StackName}-cloudwatch-addon-version'

  # ========================================
  # Configuration and Environment Outputs
  # ========================================
  StackName:
    Description: 'CloudFormation Stack name'
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-stack-name'

  Region:
    Description: 'AWS Region where the stack is deployed'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-region'

  Environment:
    Description: 'Environment name'
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-environment'

  EnvironmentSuffix:
    Description: 'Environment suffix used in resource names'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-environment-suffix'

  # ========================================
  # Instance and Scaling Configuration Outputs
  # ========================================
  SystemNodeInstanceType:
    Description: 'System Node Group instance type'
    Value: !Ref SystemNodeInstanceType
    Export:
      Name: !Sub '${AWS::StackName}-system-node-instance-type'

  ApplicationNodeInstanceType:
    Description: 'Application Node Group instance type'
    Value: !Ref ApplicationNodeInstanceType
    Export:
      Name: !Sub '${AWS::StackName}-application-node-instance-type'

  SystemNodeGroupScaling:
    Description: 'System Node Group scaling configuration'
    Value: !Sub '${SystemNodeGroupMinSize}/${SystemNodeGroupDesiredSize}/${SystemNodeGroupMaxSize}'
    Export:
      Name: !Sub '${AWS::StackName}-system-node-group-scaling'

  ApplicationNodeGroupScaling:
    Description: 'Application Node Group scaling configuration'
    Value: !Sub '${ApplicationNodeGroupMinSize}/${ApplicationNodeGroupDesiredSize}/${ApplicationNodeGroupMaxSize}'
    Export:
      Name: !Sub '${AWS::StackName}-application-node-group-scaling'