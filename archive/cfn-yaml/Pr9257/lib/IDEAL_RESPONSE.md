# Ideal CloudFormation Template for Secure Web Application Infrastructure

## Overview

This AWS CloudFormation template deploys a highly available, scalable, and secure web application infrastructure on AWS, implementing a classic three-tier architecture with the following components:

- **Presentation Tier**: Application Load Balancer in public subnets
- **Application Tier**: Auto Scaling Group with EC2 instances in private subnets  
- **Data Tier**: RDS PostgreSQL Multi-AZ database in private subnets

## Architecture Components

### VPC Configuration
```yaml
# VPC with 10.0.0.0/16 CIDR
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    EnableDnsHostnames: true
    EnableDnsSupport: true

# Public Subnets (10.0.1.0/24, 10.0.2.0/24) across 2 AZs
PublicSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    CidrBlock: 10.0.1.0/24
    AvailabilityZone: !Select [0, !GetAZs '']
    MapPublicIpOnLaunch: true

PublicSubnet2:
  Type: AWS::EC2::Subnet
  Properties:
    CidrBlock: 10.0.2.0/24
    AvailabilityZone: !Select [1, !GetAZs '']
    MapPublicIpOnLaunch: true

# Private Subnets (10.0.10.0/24, 10.0.11.0/24) across 2 AZs
PrivateSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    CidrBlock: 10.0.10.0/24
    AvailabilityZone: !Select [0, !GetAZs '']

PrivateSubnet2:
  Type: AWS::EC2::Subnet
  Properties:
    CidrBlock: 10.0.11.0/24
    AvailabilityZone: !Select [1, !GetAZs '']
```

### Internet Connectivity
```yaml
# Internet Gateway for public internet access
InternetGateway:
  Type: AWS::EC2::InternetGateway

# NAT Gateways for private subnet outbound connectivity
NatGateway1:
  Type: AWS::EC2::NatGateway
  Properties:
    AllocationId: !GetAtt NatGateway1EIP.AllocationId
    SubnetId: !Ref PublicSubnet1

NatGateway2:
  Type: AWS::EC2::NatGateway
  Properties:
    AllocationId: !GetAtt NatGateway2EIP.AllocationId
    SubnetId: !Ref PublicSubnet2
```

### Security Groups (Least Privilege)
```yaml
# ALB Security Group - Allow HTTP/HTTPS from internet
ALBSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0

# Web Server Security Group - Allow HTTP from ALB only + SSH for admin
WebServerSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        SourceSecurityGroupId: !Ref ALBSecurityGroup
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: !Ref SSHAccessCIDR

# Database Security Group - Allow PostgreSQL from web servers only
DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        SourceSecurityGroupId: !Ref WebServerSecurityGroup
```

### Application Load Balancer
```yaml
# Internet-facing ALB in public subnets
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Scheme: internet-facing
    Type: application
    SecurityGroups:
      - !Ref ALBSecurityGroup
    Subnets:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2

# Target Group for EC2 instances
TargetGroup:
  Type: AWS::ElasticLoadBalancingV2::TargetGroup
  Properties:
    Port: 80
    Protocol: HTTP
    VpcId: !Ref VPC
    TargetType: instance

# ALB Listener for HTTP traffic
ALBListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    DefaultActions:
      - Type: forward
        TargetGroupArn: !Ref TargetGroup
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 80
    Protocol: HTTP
```

### Auto Scaling Group
```yaml
# Launch Template with t3.micro instances
LaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateData:
      ImageId: !FindInMap [AWSRegionAMI, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
      IamInstanceProfile:
        Arn: !GetAtt EC2InstanceProfile.Arn
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "Welcome to the secure web app" > /var/www/html/index.html

# Auto Scaling Group in private subnets
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    VPCZoneIdentifier:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    LaunchTemplate:
      LaunchTemplateId: !Ref LaunchTemplate
      Version: !GetAtt LaunchTemplate.LatestVersionNumber
    MinSize: 2
    DesiredCapacity: 2
    MaxSize: 6
    TargetGroupARNs:
      - !Ref TargetGroup
```

### RDS Database
```yaml
# Secrets Manager for database password
DatabasePasswordSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    GenerateSecretString:
      SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
      GenerateStringKey: 'password'
      PasswordLength: 16
      ExcludeCharacters: '"@/\\'

# Database Subnet Group for private subnets
DatabaseSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Properties:
    DBSubnetGroupDescription: Subnet group for RDS
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2

# PostgreSQL Multi-AZ Database
Database:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Snapshot
  UpdateReplacePolicy: Snapshot
  Properties:
    DBInstanceClass: db.t3.medium
    Engine: postgres
    EngineVersion: '13.21'
    AllocatedStorage: 20
    StorageType: gp2
    StorageEncrypted: true
    MultiAZ: true
    PubliclyAccessible: false
    VPCSecurityGroups:
      - !Ref DatabaseSecurityGroup
    DBSubnetGroupName: !Ref DatabaseSubnetGroup
    MasterUsername: !Ref DBUsername
    MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabasePasswordSecret}::password}}'
    BackupRetentionPeriod: 7
    PreferredBackupWindow: '03:00-04:00'
    PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
```

### IAM Roles (Least Privilege)
```yaml
# EC2 Role with minimal permissions
EC2Role:
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
    Policies:
      - PolicyName: CloudWatchLogsPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: '*'
      - PolicyName: SecretsManagerAccessPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - secretsmanager:GetSecretValue
              Resource: !Ref DatabasePasswordSecret

# Instance Profile for EC2 instances
EC2InstanceProfile:
  Type: AWS::IAM::InstanceProfile
  Properties:
    Roles:
      - !Ref EC2Role
```

## Security Best Practices Implemented

1. **Network Isolation**: 
   - Private subnets for application and database tiers
   - Public subnets only for load balancer

2. **Least Privilege Access**:
   - Security groups with minimal required permissions
   - IAM roles with specific policy attachments
   - Database accessible only from web servers

3. **Encryption**:
   - RDS storage encryption enabled
   - Secrets Manager for password management

4. **High Availability**:
   - Multi-AZ RDS deployment
   - Resources distributed across 2 Availability Zones
   - Auto Scaling Group ensures minimum 2 instances

5. **Monitoring and Management**:
   - SSM access for instance management
   - CloudWatch Logs integration
   - Backup retention and maintenance windows

## Parameters

- `DBUsername`: Master username for PostgreSQL database
- `SSHAccessCIDR`: CIDR block for SSH access (should be restricted in production)

## Outputs

- `VPCId`: VPC identifier
- `LoadBalancerURL`: HTTP endpoint for the application
- `DatabaseEndpoint`: RDS database endpoint
- `DatabasePort`: Database port (5432)

## Complete Template File

The complete implementation is available in `lib/TapStack.yml` and `lib/TapStack.json`.

This is an AWS CloudFormation template (AWSTemplateFormatVersion: '2010-09-09') that provisions infrastructure as code using YAML syntax.