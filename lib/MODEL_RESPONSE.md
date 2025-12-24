```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Modular multi-environment infrastructure template with VPC, EC2, RDS, and ALB'

# ============================================================================
# PARAMETERS - Environment-specific inputs
# ============================================================================
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, test, stage, prod]
    Description: 'Target deployment environment'
  
  ProjectName:
    Type: String
    Default: 'MyApp'
    Description: 'Project name for resource naming and tagging'
  
  Owner:
    Type: String
    Default: 'DevOps-Team'
    Description: 'Resource owner for tagging'
  
  CostCenter:
    Type: String
    Default: 'Engineering'
    Description: 'Cost center for billing allocation'

# ============================================================================
# MAPPINGS - Environment-specific configurations
# ============================================================================
Mappings:
  EnvironmentConfig:
    dev:
      VpcCidr: '10.0.0.0/16'
      PublicSubnet1Cidr: '10.0.1.0/24'
      PublicSubnet2Cidr: '10.0.2.0/24'
      PrivateSubnet1Cidr: '10.0.3.0/24'
      PrivateSubnet2Cidr: '10.0.4.0/24'
      InstanceType: 't3.micro'
      MinSize: 1
      MaxSize: 2
      DesiredCapacity: 1
      DBInstanceClass: 'db.t3.micro'
      DBAllocatedStorage: 20
      MultiAZ: false
    test:
      VpcCidr: '10.1.0.0/16'
      PublicSubnet1Cidr: '10.1.1.0/24'
      PublicSubnet2Cidr: '10.1.2.0/24'
      PrivateSubnet1Cidr: '10.1.3.0/24'
      PrivateSubnet2Cidr: '10.1.4.0/24'
      InstanceType: 't3.small'
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 2
      DBInstanceClass: 'db.t3.micro'
      DBAllocatedStorage: 20
      MultiAZ: false
    stage:
      VpcCidr: '10.2.0.0/16'
      PublicSubnet1Cidr: '10.2.1.0/24'
      PublicSubnet2Cidr: '10.2.2.0/24'
      PrivateSubnet1Cidr: '10.2.3.0/24'
      PrivateSubnet2Cidr: '10.2.4.0/24'
      InstanceType: 't3.medium'
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      DBInstanceClass: 'db.t3.small'
      DBAllocatedStorage: 50
      MultiAZ: true
    prod:
      VpcCidr: '10.3.0.0/16'
      PublicSubnet1Cidr: '10.3.1.0/24'
      PublicSubnet2Cidr: '10.3.2.0/24'
      PrivateSubnet1Cidr: '10.3.3.0/24'
      PrivateSubnet2Cidr: '10.3.4.0/24'
      InstanceType: 't3.large'
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 3
      DBInstanceClass: 'db.t3.medium'
      DBAllocatedStorage: 100
      MultiAZ: true

  # AMI mappings by region (Amazon Linux 2)
  RegionMap:
    us-east-1:
      AMI: 'ami-0abcdef1234567890'
    us-west-2:
      AMI: 'ami-0fedcba0987654321'
    eu-west-1:
      AMI: 'ami-0123456789abcdef0'

# ============================================================================
# RESOURCES - Infrastructure components
# ============================================================================
Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCidr]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, PublicSubnet1Cidr]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, PublicSubnet2Cidr]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, PrivateSubnet1Cidr]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ1-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [EnvironmentConfig, !Ref Environment, PrivateSubnet2Cidr]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ2-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways (only for stage/prod)
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    Condition: IsProductionLike
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP1-${Environment}'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Condition: IsProductionLike
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-Gateway1-${Environment}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ1-${Environment}'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Condition: IsProductionLike
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-ALB-SG-${Environment}'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB-SG-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-WebServer-SG-${Environment}'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCidr]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-WebServer-SG-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-Database-SG-${Environment}'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Database-SG-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-ALB-${Environment}'
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-TG-${Environment}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-TG-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-LaunchTemplate-${Environment}'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${Environment} environment!</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer-${Environment}'
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner
              - Key: Project
                Value: !Ref ProjectName
              - Key: CostCenter
                Value: !Ref CostCenter

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-ASG-${Environment}'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]
      DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, DesiredCapacity]
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ASG-${Environment}'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenter
          PropagateAtLaunch: true

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-DB-SubnetGroup-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-db-${Environment}'
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, DBAllocatedStorage]
      StorageType: gp2
      DBName: !Sub '${ProjectName}${Environment}'
      MasterUsername: admin
      MasterUserPassword: '{{resolve:secretsmanager:rds-password::password}}'
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: !FindInMap [EnvironmentConfig, !Ref Environment, MultiAZ]
      BackupRetentionPeriod: !If [IsProductionLike, 7, 1]
      DeletionProtection: !If [IsProductionLike, true, false]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Database-${Environment}'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref ProjectName
        - Key: CostCenter
          Value: !Ref CostCenter

# ============================================================================
# CONDITIONS - Environment-based logic
# ============================================================================
Conditions:
  IsProductionLike: !Or
    - !Equals [!Ref Environment, 'stage']
    - !Equals [!Ref Environment, 'prod']

# ============================================================================
# OUTPUTS - Cross-stack references and debugging
# ============================================================================
Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-VPC-${Environment}'

  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${ProjectName}-ALB-URL-${Environment}'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${ProjectName}-DB-Endpoint-${Environment}'

  Environment:
    Description: 'Deployed Environment'
    Value: !Ref Environment

# ============================================================================
# DEPLOYMENT COMMANDS (as YAML comments):
# 
# Development:
# aws cloudformation deploy --template-file template.yaml --stack-name myapp-dev --parameter-overrides Environment=dev ProjectName=MyApp Owner=DevTeam CostCenter=Engineering --capabilities CAPABILITY_IAM
#
# Testing:
# aws cloudformation deploy --template-file template.yaml --stack-name myapp-test --parameter-overrides Environment=test ProjectName=MyApp Owner=QATeam CostCenter=Engineering --capabilities CAPABILITY_IAM
#
# Staging:
# aws cloudformation deploy --template-file template.yaml --stack-name myapp-stage --parameter-overrides Environment=stage ProjectName=MyApp Owner=DevOps CostCenter=Engineering --capabilities CAPABILITY_IAM
#
# Production:
# aws cloudformation deploy --template-file template.yaml --stack-name myapp-prod --parameter-overrides Environment=prod ProjectName=MyApp Owner=DevOps CostCenter=Engineering --capabilities CAPABILITY_IAM
# ============================================================================
```

## Key Features:

**🎯 Environment Abstraction**: Single template deploys to all environments (dev/test/stage/prod) with different configurations via `Parameters` and `Mappings`.

**🏗️ Modular Design**: Organized sections for networking, security, compute, and database components with clear separation of concerns.

**🏷️ Consistent Tagging**: All resources tagged with Environment, Owner, Project, and CostCenter for proper governance.

**📊 Environment-Specific Scaling**: 
- Dev: 1 micro instance, basic RDS
- Test: 2 small instances, basic RDS  
- Stage: 2-4 medium instances, Multi-AZ RDS
- Prod: 3-6 large instances, Multi-AZ RDS with backups

**🔒 Security Best Practices**: Layered security groups, private subnets for compute/database, NAT gateways for production-like environments.

**🔄 Cross-Stack Integration**: Outputs enable stack composition and debugging.

Deploy with different parameters to create environment-specific infrastructure while maintaining consistency and avoiding code duplication.