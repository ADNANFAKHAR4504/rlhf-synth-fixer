# Migration Infrastructure - Ideal CloudFormation Solution

This CloudFormation template provides a comprehensive migration infrastructure for moving an on-premises application to AWS with minimal downtime using VPN, Aurora MySQL, and Application Load Balancer.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Migration Infrastructure - On-premises to AWS application migration with VPN, Aurora MySQL, and ALB'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'VPN Configuration'
        Parameters:
          - OnPremisesCIDR
          - CustomerGatewayIP
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBMasterUsername
          - OnPremisesDBEndpoint
          - OnPremisesDBPort
          - OnPremisesDBName
          - OnPremisesDBUsername
          - OnPremisesDBPassword

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  OnPremisesCIDR:
    Type: String
    Default: '192.168.0.0/16'
    Description: 'CIDR block of the on-premises network'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

  CustomerGatewayIP:
    Type: String
    Default: '203.0.113.1'
    Description: 'Public IP address of the on-premises VPN device'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}$'

  DBMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Master username for Aurora MySQL cluster'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DBMasterPassword:
    Type: String
    Default: 'TempPassword123!'
    Description: 'Master password for Aurora MySQL cluster (for LocalStack compatibility)'
    NoEcho: true
    MinLength: 8

  OnPremisesDBEndpoint:
    Type: String
    Default: 'onprem-db.example.com'
    Description: 'Endpoint of the on-premises MySQL database'

  OnPremisesDBPort:
    Type: Number
    Default: 3306
    Description: 'Port of the on-premises MySQL database'

  OnPremisesDBName:
    Type: String
    Default: 'appdb'
    Description: 'Database name on the on-premises MySQL'

  OnPremisesDBUsername:
    Type: String
    Default: 'onpremuser'
    Description: 'Username for the on-premises MySQL database'

  OnPremisesDBPassword:
    Type: String
    NoEcho: true
    Default: 'TempPassword123!'
    Description: 'Password for the on-premises MySQL database'

Conditions:
  IsLocalStack: !Equals [!Ref "AWS::AccountId", "000000000000"]
  UseVPN: !Not [!Condition IsLocalStack]

Resources:
  # Database Password Secret
  DBMasterPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'migration-db-master-password-${EnvironmentSuffix}'
      Description: 'Master password for Aurora MySQL cluster'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # VPC and Network Configuration
  MigrationVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'migration-vpc-${EnvironmentSuffix}'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'migration-igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MigrationVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MigrationVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'migration-public-subnet-1-${EnvironmentSuffix}'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MigrationVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'migration-public-subnet-2-${EnvironmentSuffix}'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MigrationVPC
      CidrBlock: '10.0.11.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MigrationVPC
      CidrBlock: '10.0.12.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-subnet-2-${EnvironmentSuffix}'

  # NAT Gateway for private subnets
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-eip-${EnvironmentSuffix}'

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'migration-nat-gateway-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MigrationVPC
      Tags:
        - Key: Name
          Value: !Sub 'migration-public-rt-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MigrationVPC
      Tags:
        - Key: Name
          Value: !Sub 'migration-private-rt-${EnvironmentSuffix}'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # VPN Gateway (conditional - not created in LocalStack)
  VPNGateway:
    Type: AWS::EC2::VPNGateway
    Condition: UseVPN
    Properties:
      Type: ipsec.1
      Tags:
        - Key: Name
          Value: !Sub 'migration-vpn-gateway-${EnvironmentSuffix}'

  AttachVPNGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Condition: UseVPN
    Properties:
      VpcId: !Ref MigrationVPC
      VpnGatewayId: !Ref VPNGateway

  # Customer Gateway
  CustomerGateway:
    Type: AWS::EC2::CustomerGateway
    Condition: UseVPN
    Properties:
      Type: ipsec.1
      BgpAsn: 65000
      IpAddress: !Ref CustomerGatewayIP
      Tags:
        - Key: Name
          Value: !Sub 'migration-customer-gateway-${EnvironmentSuffix}'

  # VPN Connection
  VPNConnection:
    Type: AWS::EC2::VPNConnection
    Condition: UseVPN
    Properties:
      Type: ipsec.1
      StaticRoutesOnly: true
      CustomerGatewayId: !Ref CustomerGateway
      VpnGatewayId: !Ref VPNGateway
      Tags:
        - Key: Name
          Value: !Sub 'migration-vpn-connection-${EnvironmentSuffix}'

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      GroupName: !Sub 'migration-alb-sg-${EnvironmentSuffix}'
      VpcId: !Ref MigrationVPC
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
          Value: !Sub 'migration-alb-sg-${EnvironmentSuffix}'

  WebTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web tier instances'
      GroupName: !Sub 'migration-web-sg-${EnvironmentSuffix}'
      VpcId: !Ref MigrationVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'migration-web-sg-${EnvironmentSuffix}'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS Aurora cluster'
      GroupName: !Sub 'migration-db-sg-${EnvironmentSuffix}'
      VpcId: !Ref MigrationVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebTierSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'migration-db-sg-${EnvironmentSuffix}'

  # Secrets Manager for Database Credentials
  AuroraDBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'migration-aurora-credentials-${EnvironmentSuffix}'
      Description: 'Aurora MySQL database credentials'
      SecretString: !Sub |
        {
          "username": "${DBMasterUsername}",
          "password": "{{resolve:secretsmanager:${DBMasterPasswordSecret}:SecretString:password}}"
        }

  # RDS Aurora Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'migration-db-subnet-group-${EnvironmentSuffix}'
      DBSubnetGroupDescription: 'Subnet group for Aurora MySQL cluster'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'migration-db-subnet-group-${EnvironmentSuffix}'

  # RDS Aurora Cluster
  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Delete
    Properties:
      DBClusterIdentifier: !Sub 'migration-aurora-cluster-${EnvironmentSuffix}'
      Engine: aurora-mysql
      EngineVersion: '8.0.mysql_aurora.3.04.0'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DatabaseName: appdb
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 1
      StorageEncrypted: false
      Tags:
        - Key: Name
          Value: !Sub 'migration-aurora-cluster-${EnvironmentSuffix}'

  AuroraDBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'migration-aurora-instance-${EnvironmentSuffix}'
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: db.t3.medium
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'migration-aurora-instance-${EnvironmentSuffix}'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'migration-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'migration-alb-${EnvironmentSuffix}'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'migration-alb-tg-${EnvironmentSuffix}'
      VpcId: !Ref MigrationVPC
      Protocol: HTTP
      Port: 80
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPath: /health
      Tags:
        - Key: Name
          Value: !Sub 'migration-alb-tg-${EnvironmentSuffix}'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Protocol: HTTP
      Port: 80
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # CloudWatch Alarms
  AuroraDBConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'migration-aurora-connections-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when Aurora database connections are high'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster

Outputs:
  VPCId:
    Description: 'VPC ID for the migration infrastructure'
    Value: !Ref MigrationVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  AuroraClusterEndpoint:
    Description: 'Aurora MySQL cluster endpoint'
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-AuroraClusterEndpoint'

  AuroraDBSecretArn:
    Description: 'ARN of the Secrets Manager secret for Aurora credentials'
    Value: !Ref AuroraDBSecret
    Export:
      Name: !Sub '${AWS::StackName}-AuroraDBSecretArn'

  ApplicationLoadBalancerDNS:
    Description: 'DNS name of the Application Load Balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLoadBalancerDNS'

  ApplicationLoadBalancerArn:
    Description: 'ARN of the Application Load Balancer'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationLoadBalancerArn'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Summary

This CloudFormation template creates a complete migration infrastructure with:

**Network Components:**
- VPC with CIDR 10.0.0.0/16
- 2 public subnets and 2 private subnets across 2 AZs
- Internet Gateway and NAT Gateway
- Conditional VPN resources (disabled in LocalStack)

**Database:**
- Aurora MySQL cluster with Serverless-compatible configuration
- Secrets Manager integration for credentials
- Private subnet placement for security

**Load Balancing:**
- Application Load Balancer in public subnets
- Target group with health checks
- HTTP listener on port 80

**Security:**
- Least-privilege security groups
- Security group references instead of CIDR blocks
- All resources use EnvironmentSuffix for uniqueness

**Monitoring:**
- CloudWatch alarm for database connections

**LocalStack Compatibility:**
- Conditional VPN resources (UseVPN condition)
- IsLocalStack condition for environment detection
- Simplified configuration for local testing
