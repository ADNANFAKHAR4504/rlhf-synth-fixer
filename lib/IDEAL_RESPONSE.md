# IDEAL RESPONSE - High-Availability VPC Infrastructure

## CloudFormation Template Solution

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub 'TapVPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'TapIGW-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: 10.0.0.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicSubnet3-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # Private Subnets (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs ""]
      CidrBlock: 10.0.3.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet1-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs ""]
      CidrBlock: 10.0.4.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet2-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs ""]
      CidrBlock: 10.0.5.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateSubnet3-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # NAT Gateways with Elastic IPs
  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGatewayEIP1-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  NatGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGatewayEIP2-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  NatGatewayEIP3:
    Type: AWS::EC2::EIP
    DependsOn: VPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGatewayEIP3-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGateway1-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGateway2-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP3.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'TapNatGateway3-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicRouteTable1-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PublicRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicRouteTable2-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PublicRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPublicRouteTable3-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateRouteTable1-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateRouteTable2-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'TapPrivateRouteTable3-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # Routes
  PublicRoute1:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicRoute2:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicRoute3:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  # Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable2

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable3

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP inbound
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS inbound
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'TapALBSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  BastionHostSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion Host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: Allow SSH inbound
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'TapBastionHostSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Web Servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP inbound from ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTPS inbound from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionHostSecurityGroup
          Description: Allow SSH inbound from Bastion Host
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'TapWebServerSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL inbound from Web Servers
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub 'TapDatabaseSecurityGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # RDS Configuration
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS DB
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'TapDBSubnetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'TapRDSCredentials-${EnvironmentSuffix}'
      Description: RDS database credentials
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: "password"
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub 'TapRDSSecret-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBName: tap
      Engine: mysql
      EngineVersion: 8.0.39  # Updated to supported version
      DBInstanceClass: db.t3.small
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      AutoMinorVersionUpgrade: true
      BackupRetentionPeriod: 7
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !GetAtt DatabaseSecurityGroup.GroupId
      MasterUsername: !Sub '{{resolve:secretsmanager:TapRDSCredentials-${EnvironmentSuffix}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:TapRDSCredentials-${EnvironmentSuffix}:SecretString:password}}'
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'TapRDSInstance-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production
    DeletionPolicy: Delete  # Changed from Snapshot to allow destruction

  # Bastion Host Configuration
  BastionHostRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Tags:
        - Key: Name
          Value: !Sub 'TapBastionHostRole-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  BastionHostInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref BastionHostRole

  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0dee22c13ea7a9a67  # Amazon Linux 2 AMI for ap-south-1
      InstanceType: t3.micro
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !GetAtt BastionHostSecurityGroup.GroupId
      IamInstanceProfile: !Ref BastionHostInstanceProfile
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp2
            VolumeSize: 8
            Encrypted: true
            DeleteOnTermination: true
      Tags:
        - Key: Name
          Value: !Sub 'TapBastionHost-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      SecurityGroups:
        - !GetAtt ALBSecurityGroup.GroupId
      Scheme: internet-facing
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: deletion_protection.enabled
          Value: 'false'  # Changed to allow destruction
      Tags:
        - Key: Name
          Value: !Sub 'TapALB-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'TapALBTargetGroup-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # VPC Flow Logs
  VPCFlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub 'TapVPCFlowLogsBucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

  VPCFlowLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref VPCFlowLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSLogDeliveryWrite
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${VPCFlowLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
          - Sid: AWSLogDeliveryCheck
            Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action:
              - s3:GetBucketAcl
              - s3:ListBucket
            Resource: !GetAtt VPCFlowLogsBucket.Arn

  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: vpc-flow-logs-s3-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                Resource: !Sub '${VPCFlowLogsBucket.Arn}/*'

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      LogDestinationType: s3
      LogDestination: !GetAtt VPCFlowLogsBucket.Arn
      TrafficType: ALL
      MaxAggregationInterval: 60
      Tags:
        - Key: Name
          Value: !Sub 'TapVPCFlowLog-${EnvironmentSuffix}'
        - Key: Environment
          Value: Production

Outputs:
  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

  VPC:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCID'

  PublicSubnets:
    Description: 'List of public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnets'

  PrivateSubnets:
    Description: 'List of private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'

  ALBDNSName:
    Description: 'DNS name for the Application Load Balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNSName'

  BastionHostPublicIP:
    Description: 'Public IP address of the Bastion Host'
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-BastionHostIP'

  RDSEndpoint:
    Description: 'Endpoint for the RDS instance'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  VPCFlowLogsBucket:
    Description: 'S3 bucket for VPC flow logs'
    Value: !Ref VPCFlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-VPCFlowLogsBucket'
```

## Key Improvements Made

1. **Fixed YAML Syntax Error**: Corrected 'value' to 'Value' in PublicRouteTable2 tags
2. **Updated MySQL Version**: Changed from 8.0.28 to 8.0.39 (supported in ap-south-1)
3. **Made Resources Destroyable**: 
   - Changed RDS DeletionPolicy from 'Snapshot' to 'Delete'
   - Set ALB deletion_protection to 'false'
4. **Updated AMI for Region**: Changed Bastion Host AMI to ap-south-1 specific AMI
5. **All Resources Include Environment Suffix**: Ensures no naming conflicts
6. **Production Environment Tags**: All resources tagged with Environment: Production

## Infrastructure Components

- **VPC**: 10.0.0.0/16 with DNS support enabled
- **Subnets**: 3 public and 3 private across 3 availability zones
- **NAT Gateways**: One per private subnet for high availability
- **Security Groups**: Least privilege access with specific rules
- **RDS**: Multi-AZ MySQL with encryption and automated backups
- **Bastion Host**: Secure SSH access to private instances
- **Application Load Balancer**: Public-facing with health checks
- **VPC Flow Logs**: To encrypted S3 bucket for monitoring
- **Secrets Manager**: Secure credential management for RDS

## Security Best Practices

- No hardcoded credentials - using AWS Secrets Manager
- Encryption at rest for all storage (EBS, RDS, S3)
- Private subnets for database resources
- Security groups with least privilege access
- VPC Flow Logs for network monitoring
- Public access blocked on S3 bucket
- Bastion host for secure SSH access