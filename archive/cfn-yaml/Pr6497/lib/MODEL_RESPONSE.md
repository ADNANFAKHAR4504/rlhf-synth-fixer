### Reasoning Trace
---

This is a comprehensive request for a production-ready EKS CloudFormation template. Let me break down what's needed:

1. **Parameters**: Multiple parameters for flexibility including EnvironmentSuffix, ClusterName, KubernetesVersion, VPC CIDR, Instance types, Node group sizes, etc.

2. **Networking**: VPC with private subnets across 3 AZs, route tables, NAT gateways for outbound internet access from private subnets

3. **IAM Roles**:
   - EKS cluster role
   - Node group roles (separate for system and application)
   - Lambda execution role
   - CloudWatch observability role

4. **Security Groups**:
   - Cluster security group
   - Node security group with inter-node communication and LB ingress

5. **Lambda Custom Resource**: To dynamically fetch OIDC info and create OIDC provider

6. **EKS Resources**:
   - EKS Cluster with private endpoint only
   - Two managed node groups (system and application) with Bottlerocket AMI
   - CloudWatch Container Insights add-on

7. **Outputs**: Cluster endpoint, OIDC URL, IAM role ARNs

Key considerations:
- Use intrinsic functions for cross-region/account compatibility
- Follow the naming convention strictly
- Ensure proper dependencies between resources
- Lambda needs to handle CloudFormation custom resource lifecycle (Create/Update/Delete)

Let me create a comprehensive template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that deploys a production-ready EKS cluster with all the requirements. Here's the complete YAML template:

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
# Mappings for subnet calculations
# ===========================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PrivateSubnet1:
      CIDR: '10.0.0.0/20'
    PrivateSubnet2:
      CIDR: '10.0.16.0/20'
    PrivateSubnet3:
      CIDR: '10.0.32.0/20'
    PublicSubnet1:
      CIDR: '10.0.48.0/20'
    PublicSubnet2:
      CIDR: '10.0.64.0/20'
    PublicSubnet3:
      CIDR: '10.0.80.0/20'

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
            Condition:
              StringEquals:
                !Sub '${OIDCProvider.OIDCIssuer}:sub': 'system:serviceaccount:amazon-cloudwatch:cloudwatch-agent'
                !Sub '${OIDCProvider.OIDCIssuer}:aud': 'sts.amazonaws.com'
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
          import urllib.request
          import ssl
          import hashlib
          import cfnresponse
          import time
          
          def handler(event, context):
              print(json.dumps(event))
              
              # Extract parameters
              cluster_name = event['ResourceProperties'].get('ClusterName')
              region = event['ResourceProperties'].get('Region')
              
              # Initialize clients
              eks = boto3.client('eks', region_name=region)
              iam = boto3.client('iam')
              
              try:
                  if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
                      # Wait for cluster to be active
                      max_attempts = 60
                      attempt = 0
                      while attempt < max_attempts:
                          response = eks.describe_cluster(name=cluster_name)
                          status = response['cluster']['status']
                          print(f"Cluster status: {status}")
                          
                          if status == 'ACTIVE':
                              break
                          
                          time.sleep(10)
                          attempt += 1
                      
                      if status != 'ACTIVE':
                          raise Exception(f"Cluster did not become active within {max_attempts * 10} seconds")
                      
                      # Get OIDC issuer URL
                      issuer_url = response['cluster']['identity']['oidc']['issuer']
                      print(f"OIDC Issuer URL: {issuer_url}")
                      
                      # Extract issuer host
                      issuer_host = issuer_url.replace('https://', '')
                      
                      # Get TLS thumbprint
                      thumbprint = get_thumbprint(issuer_url)
                      print(f"Thumbprint: {thumbprint}")
                      
                      # Create or update OIDC provider
                      provider_arn = f"arn:aws:iam::{boto3.client('sts').get_caller_identity()['Account']}:oidc-provider/{issuer_host}"
                      
                      try:
                          # Check if provider exists
                          iam.get_open_id_connect_provider(OpenIDConnectProviderArn=provider_arn)
                          print("OIDC provider already exists")
                      except iam.exceptions.NoSuchEntityException:
                          # Create new provider
                          iam.create_open_id_connect_provider(
                              Url=issuer_url,
                              ClientIDList=['sts.amazonaws.com'],
                              ThumbprintList=[thumbprint],
                              Tags=[
                                  {'Key': 'ManagedBy', 'Value': 'CloudFormation'},
                                  {'Key': 'ClusterName', 'Value': cluster_name}
                              ]
                          )
                          print("Created OIDC provider")
                      
                      # Return success with outputs
                      response_data = {
                          'OIDCIssuer': issuer_host,
                          'OIDCProviderArn': provider_arn
                      }
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
                      
                  elif event['RequestType'] == 'Delete':
                      # Get cluster info for OIDC provider deletion
                      try:
                          response = eks.describe_cluster(name=cluster_name)
                          issuer_url = response['cluster']['identity']['oidc']['issuer']
                          issuer_host = issuer_url.replace('https://', '')
                          provider_arn = f"arn:aws:iam::{boto3.client('sts').get_caller_identity()['Account']}:oidc-provider/{issuer_host}"
                          
                          # Delete OIDC provider
                          iam.delete_open_id_connect_provider(OpenIDConnectProviderArn=provider_arn)
                          print("Deleted OIDC provider")
                      except Exception as e:
                          print(f"Error during deletion: {str(e)}")
                      
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                      
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
          
          def get_thumbprint(url):
              # Extract hostname from URL
              hostname = url.replace('https://', '').split('/')[0]
              
              # Create SSL context
              context = ssl.create_default_context()
              
              # Connect and get certificate
              with urllib.request.urlopen(url, context=context) as response:
                  cert_der = response.fp._sock.getpeercert_bin()
              
              # Calculate SHA1 thumbprint
              sha1 = hashlib.sha1(cert_der)
              thumbprint = sha1.hexdigest()
              
              return thumbprint
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
      - CloudWatchObservabilityRole
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
  ClusterEndpoint:
    Description: 'EKS Cluster private endpoint'
    Value: !GetAtt EKSCluster.Endpoint
    Export:
      Name: !Sub '${AWS::StackName}-cluster-endpoint'

  OIDCIssuerURL:
    Description: 'OIDC Issuer URL for IRSA'
    Value: !GetAtt OIDCProvider.OIDCIssuer
    Export:
      Name: !Sub '${AWS::StackName}-oidc-issuer'

  SystemNodeRoleARN:
    Description: 'IAM Role ARN for system node group'
    Value: !GetAtt SystemNodeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-system-node-role-arn'

  ApplicationNodeRoleARN:
    Description: 'IAM Role ARN for application node group'
    Value: !GetAtt ApplicationNodeRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-application-node-role-arn'

  ClusterName:
    Description: 'EKS Cluster name'
    Value: !Ref EKSCluster
    Export:
      Name: !Sub '${AWS::StackName}-cluster-name'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  PrivateSubnetIds:
    Description: 'Private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-private-subnet-ids'

  NodeSecurityGroupId:
    Description: 'Security group ID for nodes'
    Value: !Ref NodeSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-node-security-group-id'
```

## Template Overview

This CloudFormation template creates a production-ready EKS cluster with the following components:

### Key Features:

1. **VPC and Networking**:
   - VPC with customizable CIDR
   - 3 public subnets (for NAT Gateways)
   - 3 private subnets (for EKS nodes)
   - NAT Gateway for outbound internet access
   - Proper route tables and associations

2. **Security Groups**:
   - Cluster security group
   - Node security group with inter-node communication
   - Load balancer security group
   - Ingress rules for ports 80 and 443 from load balancers

3. **IAM Roles**:
   - EKS cluster role
   - Separate node group roles (system and application)
   - Lambda execution role for OIDC provider management
   - CloudWatch observability role for IRSA

4. **Lambda Function**:
   - Automatically creates OIDC provider
   - Waits for cluster to be active
   - Retrieves TLS thumbprint dynamically
   - Handles CloudFormation lifecycle (Create/Update/Delete)

5. **EKS Resources**:
   - EKS cluster with private API endpoint only
   - Two managed node groups using Bottlerocket AMI
   - CloudWatch Container Insights add-on
   - Cluster Autoscaler IAM policy attached to system nodes

6. **Naming Convention**:
   - Follows the pattern: `${StackName}-${Region}-${EnvironmentSuffix}-[resource-type]`
   - Consistent tagging with Environment and ManagedBy tags

### Usage:

```bash
# Deploy the stack
aws cloudformation deploy \
  --template-file eks-cluster.yaml \
  --stack-name my-eks-cluster \
  --parameter-overrides \
    EnvironmentSuffix=pr4056 \
    ClusterName=production-eks \
    KubernetesVersion=1.28 \
  --capabilities CAPABILITY_NAMED_IAM

# Get outputs
aws cloudformation describe-stacks \
  --stack-name my-eks-cluster \
  --query "Stacks[0].Outputs"
```

### Notes:

- The template is fully automated with no manual steps required
- The OIDC provider is created dynamically by the Lambda function
- All resources are properly tagged and follow the naming convention
- The template is cross-region and cross-account compatible
- Node groups use Bottlerocket AMI for enhanced security
- CloudWatch Container Insights is enabled for monitoring
- The Lambda function handles proper cleanup on stack deletion