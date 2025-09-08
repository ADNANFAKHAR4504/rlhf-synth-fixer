AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Multi-Environment AWS Infrastructure with Comprehensive Security Controls'

Parameters:
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'test', 'prod']
    Description: 'Environment designation for resource tagging and configuration'
    
  CloudTrailLogGroup:
    Type: String
    Default: '/aws/cloudtrail/production-trail-4829b638'
    Description: 'Cloudtrail name for the account'

  AmiID:
    Type: String
    Description: 'AMI ID for ec2'
    Default: 'ami-0c02fb55956c7d316'

  AdminEmail:
    Type: String
    Description: 'Email address for security alerts'
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    Default: "mithilesh.s@turing.com"

Mappings:
  EnvironmentMap:
    dev:
      VpcCidr: '10.0.0.0/16'
      PublicSubnetCidr: '10.0.1.0/24'
      PrivateSubnetCidr: '10.0.2.0/24'
      DatabaseSubnetCidr: '10.0.3.0/24'
    test:
      VpcCidr: '10.1.0.0/16'
      PublicSubnetCidr: '10.1.1.0/24'
      PrivateSubnetCidr: '10.1.2.0/24'
      DatabaseSubnetCidr: '10.1.3.0/24'
    prod:
      VpcCidr: '10.2.0.0/16'
      PublicSubnetCidr: '10.2.1.0/24'
      PrivateSubnetCidr: '10.2.2.0/24'
      DatabaseSubnetCidr: '10.2.3.0/24'

Resources:
  # ================================
  # KMS Key
  # ================================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${Environment} environment encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail to encrypt logs
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
            Resource: '*'
          - Sid: Allow logs to use the key
            Effect: Allow
            Principal:
              Service: logs.us-east-1.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey*
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: 'Data Encryption'

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-encryption-key'
      TargetKeyId: !Ref KMSKey

  # ================================
  # VPC & Networking
  # ================================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentMap, !Ref Environment, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'
        - Key: Environment
          Value: !Ref Environment

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentMap, !Ref Environment, PublicSubnetCidr]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentMap, !Ref Environment, PrivateSubnetCidr]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentMap, !Ref Environment, DatabaseSubnetCidr]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-subnet'
        - Key: Environment
          Value: !Ref Environment

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-eip'

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-rt'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-rt'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet

  DatabaseRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-rt'

  DatabaseSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref DatabaseRouteTable
      SubnetId: !Ref DatabaseSubnet

  # ================================
  # Security Groups & Rules
  # ================================
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-bastion-sg'
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8  # tighten in production
          Description: 'SSH access from internet'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-bastion-sg'
        - Key: Environment
          Value: !Ref Environment

  PrivateSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-private-sg'
      GroupDescription: 'Security group for private instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH from bastion host'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-sg'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${Environment}-database-sg'
      GroupDescription: 'Security group for database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref PrivateSecurityGroup
          Description: 'MySQL from private instances'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database-sg'
        - Key: Environment
          Value: !Ref Environment

  BastionEgressToPrivate:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref BastionSecurityGroup
      IpProtocol: tcp
      FromPort: 22
      ToPort: 22
      DestinationSecurityGroupId: !Ref PrivateSecurityGroup
      Description: 'SSH to private instances'

  PrivateEgressToDB:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref PrivateSecurityGroup
      IpProtocol: tcp
      FromPort: 3306
      ToPort: 3306
      DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
      Description: 'MySQL to database'

  # ================================
  # Network ACLs
  # ================================
  PrivateNetworkAcl:
    Type: AWS::EC2::NetworkAcl
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-nacl'

  PrivateInboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      RuleAction: allow
      CidrBlock: !FindInMap [EnvironmentMap, !Ref Environment, VpcCidr]

  PrivateOutboundRule:
    Type: AWS::EC2::NetworkAclEntry
    Properties:
      NetworkAclId: !Ref PrivateNetworkAcl
      RuleNumber: 100
      Protocol: -1
      Egress: true
      RuleAction: allow
      CidrBlock: 0.0.0.0/0

  PrivateSubnetNetworkAclAssociation:
    Type: AWS::EC2::SubnetNetworkAclAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      NetworkAclId: !Ref PrivateNetworkAcl

  # ================================
  # IAM and Bastion Host
  # ================================
  BastionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-bastion-role-latest'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: BastionPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/${Environment}/*'
      Tags:
        - Key: Environment
          Value: !Ref Environment

  BastionInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref BastionRole]

  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiID ami-0c02fb55956c7d316  # Update per region
      InstanceType: t3.micro
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds: [!Ref BastionSecurityGroup]
      IamInstanceProfile: !Ref BastionInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y awslogs
          cat > /etc/awslogs/awslogs.conf << EOF
          [general]
          state_file = /var/lib/awslogs/agent-state

          [/var/log/messages]
          file = /var/log/messages
          log_group_name = /aws/ec2/bastion/${Environment}
          log_stream_name = {instance_id}/messages
          datetime_format = %b %d %H:%M:%S

          [/var/log/secure]
          file = /var/log/secure
          log_group_name = /aws/ec2/bastion/${Environment}
          log_stream_name = {instance_id}/secure
          datetime_format = %b %d %H:%M:%S
          EOF
          service awslogs start
          chkconfig awslogs on
          sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
          sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
          service sshd restart
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-bastion-host'
        - Key: Environment
          Value: !Ref Environment

  # ================================
  # RDS & Secrets Manager
  # ================================
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${Environment}-db-subnet-group-lat'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds: [!Ref DatabaseSubnet, !Ref PrivateSubnet]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}/database/credentials-testing'
      Description: 'Database credentials'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\\'
      KmsKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment

  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-database-lat'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.42'  # Supported — up to at least 8.0.42 :contentReference[oaicite:0]{index=0}
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      VPCSecurityGroups: [!Ref DatabaseSecurityGroup]
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      EnableCloudwatchLogsExports: [error]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-database'
        - Key: Environment
          Value: !Ref Environment


  # ================================
  # Monitoring & Alerts
  # ================================
  SecurityAlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${Environment}-security-alert'
      KmsMasterKeyId: !Ref KMSKey
      Tags:
        - Key: Environment
          Value: !Ref Environment

  SecurityAlertsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref SecurityAlertsTopic
      Endpoint: !Ref AdminEmail

  UnauthorizedAccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-unauthorized-access-attempt'
      AlarmDescription: 'Alarm for unauthorized access attempts'
      MetricName: ErrorCount
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref SecurityAlertsTopic]
      TreatMissingData: notBreaching

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-root-account-usages'
      AlarmDescription: 'Alarm for root account usage'
      MetricName: RootAccountUsageCount
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions: [!Ref SecurityAlertsTopic]
      TreatMissingData: notBreaching

  UnauthorizedAccessMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricNamespace: CloudTrailMetrics
          MetricName: ErrorCount
          MetricValue: '1'

  RootAccountUsageMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroup
      FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      MetricTransformations:
        - MetricNamespace: CloudTrailMetrics
          MetricName: RootAccountUsageCount
          MetricValue: '1'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-vpc-id'

  PublicSubnetId:
    Description: 'Public Subnet ID'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${Environment}-public-subnet-id'

  PrivateSubnetId:
    Description: 'Private Subnet ID'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${Environment}-private-subnet-id'

  BastionHostId:
    Description: 'Bastion Host Instance ID'
    Value: !Ref BastionHost

  BastionPublicIP:
    Description: 'Bastion Host Public IP'
    Value: !GetAtt BastionHost.PublicIp

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt DatabaseInstance.Endpoint.Address

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref KMSKey
    Export:
      Name: !Sub '${Environment}-kms-key-id'

  SecurityAlertsTopic:
    Description: 'SNS Topic for Security Alerts'
    Value: !Ref SecurityAlertsTopic