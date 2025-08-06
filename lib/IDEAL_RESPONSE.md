#==============================================================================
# AWS CloudFormation Template: Highly Available Web Application Stack
#==============================================================================
# Description: This template creates a 3-tier highly available, scalable 
#              web application infrastructure with:
#              - VPC with public/private subnets across multiple AZs
#              - Auto Scaling Group with Application Load Balancer
#              - RDS MySQL database with Multi-AZ deployment
#              - S3 bucket for static assets
#              - CloudWatch monitoring and auto-scaling policies
#
# Author: Generated through debugging and optimization process
# Version: 1.0 (Production Ready)
# Last Updated: 2025-08-06
#==============================================================================
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly available, scalable web-application stack'

#==============================================================================
# PARAMETERS - Template input parameters for customization
#==============================================================================
Parameters:
  Environment:
    Type: String
    Default: 'prod'
    Description: 'Environment name for resource tagging'

  KeyPairName:
    Type: String
    Default: ''
    Description: 'Name of an existing EC2 KeyPair to enable SSH access to instances (leave empty to disable SSH access)'

#==============================================================================
# CONDITIONS - Logic for conditional resource creation
#==============================================================================
Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

Resources:
  #============================================================================
  # NETWORKING INFRASTRUCTURE
  # VPC, Subnets, Internet Gateway, NAT Gateways, Route Tables
  #============================================================================
  
  # VPC with CIDR 10.0.0.0/16
  ProdVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'prod-vpc'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway for public internet access
  ProdInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'prod-internet-gateway'
        - Key: Environment
          Value: !Ref Environment

  ProdVpcGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdVpc
      InternetGatewayId: !Ref ProdInternetGateway

  #============================================================================
  # PUBLIC SUBNETS - For ALB and NAT Gateways (Multi-AZ)
  #============================================================================
  
  ProdPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']  # AZ-b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'prod-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  ProdPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [2, !GetAZs '']  # AZ-c
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'prod-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment

  #============================================================================
  # PRIVATE SUBNETS - For EC2 instances and RDS database (Multi-AZ)
  #============================================================================
  
  ProdPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']  # AZ-a
      Tags:
        - Key: Name
          Value: 'prod-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment

  ProdPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdVpc
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']  # AZ-b
      Tags:
        - Key: Name
          Value: 'prod-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment

  #============================================================================
  # ROUTING INFRASTRUCTURE
  # Route Tables, Routes, and Subnet Associations
  #============================================================================
  
  # Public Route Table - Routes to Internet Gateway
  ProdPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVpc
      Tags:
        - Key: Name
          Value: 'prod-public-route-table'
        - Key: Environment
          Value: !Ref Environment

  ProdPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdVpcGatewayAttachment
    Properties:
      RouteTableId: !Ref ProdPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProdInternetGateway

  ProdPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet1
      RouteTableId: !Ref ProdPublicRouteTable

  ProdPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPublicSubnet2
      RouteTableId: !Ref ProdPublicRouteTable

  #============================================================================
  # NAT GATEWAYS - For private subnet internet access (High Availability)
  #============================================================================
  
  # Elastic IPs for NAT Gateways
  ProdNatGateway1Eip:
    Type: AWS::EC2::EIP
    DependsOn: ProdVpcGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'prod-nat-gateway-1-eip'
        - Key: Environment
          Value: !Ref Environment

  ProdNatGateway2Eip:
    Type: AWS::EC2::EIP
    DependsOn: ProdVpcGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'prod-nat-gateway-2-eip'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways in each public subnet
  ProdNatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdNatGateway1Eip.AllocationId
      SubnetId: !Ref ProdPublicSubnet1
      Tags:
        - Key: Name
          Value: 'prod-nat-gateway-1'
        - Key: Environment
          Value: !Ref Environment

  ProdNatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt ProdNatGateway2Eip.AllocationId
      SubnetId: !Ref ProdPublicSubnet2
      Tags:
        - Key: Name
          Value: 'prod-nat-gateway-2'
        - Key: Environment
          Value: !Ref Environment

  # Private Route Tables - Route to respective NAT Gateways
  ProdPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVpc
      Tags:
        - Key: Name
          Value: 'prod-private-route-table-1'
        - Key: Environment
          Value: !Ref Environment

  ProdPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdVpc
      Tags:
        - Key: Name
          Value: 'prod-private-route-table-2'
        - Key: Environment
          Value: !Ref Environment

  ProdPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProdNatGateway1

  ProdPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref ProdPrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref ProdNatGateway2

  ProdPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet1
      RouteTableId: !Ref ProdPrivateRouteTable1

  ProdPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdPrivateSubnet2
      RouteTableId: !Ref ProdPrivateRouteTable2

  #============================================================================
  # SECURITY GROUPS - Network-level security for different tiers
  #============================================================================
  
  # Security Group for Web Servers (EC2 instances)
  ProdWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref ProdVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ProdAlbSecurityGroup  # Only from ALB
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '10.0.0.0/16'  # SSH from VPC only
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'  # Allow all outbound
      Tags:
        - Key: Name
          Value: 'prod-web-security-group'
        - Key: Environment
          Value: !Ref Environment

  # Security Group for Application Load Balancer
  ProdAlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref ProdVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'  # HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'  # HTTPS from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: 'prod-alb-security-group'
        - Key: Environment
          Value: !Ref Environment

  # Security Group for RDS Database
  ProdRdsSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS MySQL instance'
      VpcId: !Ref ProdVpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref ProdWebSecurityGroup  # Only from web servers
      Tags:
        - Key: Name
          Value: 'prod-rds-security-group'
        - Key: Environment
          Value: !Ref Environment

  #============================================================================
  # IAM ROLES AND POLICIES - Service permissions and access control
  #============================================================================
  
  # IAM Role for EC2 instances
  ProdEc2Role:
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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy  # CloudWatch monitoring
      Policies:
        - PolicyName: 'prod-s3-access-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: "*"  # Wildcard for S3 access
      Tags:
        - Key: Name
          Value: 'prod-ec2-role'
        - Key: Environment
          Value: !Ref Environment

  ProdEc2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ProdEc2Role

  #============================================================================
  # COMPUTE INFRASTRUCTURE - Auto Scaling Group and Launch Template
  #============================================================================
  
  # Launch Template for EC2 instances
  ProdLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2023
        InstanceType: t3.micro
        KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']  # Conditional SSH key
        IamInstanceProfile:
          Arn: !GetAtt ProdEc2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ProdWebSecurityGroup
        UserData:  # Bootstrap script for web server setup
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from prod-web-server!</h1>" > /var/www/html/index.html
            /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource ProdAutoScalingGroup --region ${AWS::Region}
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: 'prod-web-server'
              - Key: Environment
                Value: !Ref Environment

  # Auto Scaling Group with health checks and scaling policies
  ProdAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref ProdLaunchTemplate
        Version: !GetAtt ProdLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      VPCZoneIdentifier:  # Deploy in public subnets for this example
        - !Ref ProdPublicSubnet1
        - !Ref ProdPublicSubnet2
      TargetGroupARNs:
        - !Ref ProdTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: 'prod-auto-scaling-group'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
    CreationPolicy:  # Wait for instances to signal successful startup
      ResourceSignal:
        Count: 2
        Timeout: PT10M

  #============================================================================
  # LOAD BALANCER - Application Load Balancer for high availability
  #============================================================================
  
  # Application Load Balancer
  ProdAlb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ProdAlbSecurityGroup
      Subnets:
        - !Ref ProdPublicSubnet1
        - !Ref ProdPublicSubnet2
      Tags:
        - Key: Name
          Value: 'prod-application-load-balancer'
        - Key: Environment
          Value: !Ref Environment

  # Target Group for health checks and traffic distribution
  ProdTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Protocol: HTTP
      Port: 80
      VpcId: !Ref ProdVpc
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: 'prod-target-group'
        - Key: Environment
          Value: !Ref Environment

  # Listener for HTTP traffic
  ProdListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ProdTargetGroup
      LoadBalancerArn: !Ref ProdAlb
      Port: 80
      Protocol: HTTP

  #============================================================================
  # DATABASE INFRASTRUCTURE - RDS MySQL with Multi-AZ deployment
  #============================================================================
  
  # RDS Subnet Group for database placement in private subnets
  ProdRdsSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS MySQL instance'
      SubnetIds:
        - !Ref ProdPrivateSubnet1
        - !Ref ProdPrivateSubnet2
      Tags:
        - Key: Name
          Value: 'prod-rds-subnet-group'
        - Key: Environment
          Value: !Ref Environment

  # RDS MySQL Instance with high availability and security
  ProdRdsInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.small  # Upgraded for better performance
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${ProdRdsPassword}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      DBSubnetGroupName: !Ref ProdRdsSubnetGroup
      VPCSecurityGroups:
        - !Ref ProdRdsSecurityGroup
      BackupRetentionPeriod: 7
      MultiAZ: true  # High availability
      StorageEncrypted: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt ProdRdsMonitoringRole.Arn
      EnablePerformanceInsights: false  # Disabled for t3.small compatibility
      Tags:
        - Key: Name
          Value: 'prod-rds-instance'
        - Key: Environment
          Value: !Ref Environment
    DeletionPolicy: Snapshot  # Create snapshot before deletion
    UpdateReplacePolicy: Snapshot

  # IAM Role for RDS Enhanced Monitoring
  ProdRdsMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Name
          Value: 'prod-rds-monitoring-role'
        - Key: Environment
          Value: !Ref Environment

  # Secrets Manager for secure password storage
  ProdRdsPassword:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: 'Password for RDS MySQL instance'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: 'prod-rds-password'
        - Key: Environment
          Value: !Ref Environment

  #============================================================================
  # STORAGE - S3 Bucket for static assets
  #============================================================================
  
  # S3 Bucket for static assets with public read access
  ProdS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false
      Tags:
        - Key: Name
          Value: 'prod-s3-bucket'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket Policy for public read access
  ProdS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: PublicReadGetObject
            Effect: Allow
            Principal: '*'
            Action: s3:GetObject
            Resource: !Sub 'arn:aws:s3:::${ProdS3Bucket}/*'  # Proper ARN format

  #============================================================================
  # MONITORING AND LOGGING - CloudWatch resources for observability
  #============================================================================
  
  # CloudWatch Log Groups for centralized logging
  ProdWebLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: 14  # 2 weeks retention
      Tags:
        - Key: Name
          Value: 'prod-web-log-group'
        - Key: Environment
          Value: !Ref Environment

  ProdRdsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: 'prod-rds-log-group'
        - Key: Environment
          Value: !Ref Environment

  #============================================================================
  # AUTO SCALING POLICIES AND ALARMS - Performance-based scaling
  #============================================================================
  
  # CloudWatch Alarms for Auto Scaling triggers
  ProdAsgCpuAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'High CPU utilization alarm for Auto Scaling Group'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300  # 5 minutes
      EvaluationPeriods: 2
      Threshold: 70  # Scale up when CPU > 70%
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref ProdAutoScalingGroup
      AlarmActions:
        - !Ref ProdScaleUpPolicy
      Tags:
        - Key: Name
          Value: 'prod-asg-cpu-alarm'
        - Key: Environment
          Value: !Ref Environment

  ProdRdsCpuAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'High CPU utilization alarm for RDS instance'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref ProdRdsInstance
      Tags:
        - Key: Name
          Value: 'prod-rds-cpu-alarm'
        - Key: Environment
          Value: !Ref Environment

  # Auto Scaling Policies
  ProdScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref ProdAutoScalingGroup
      Cooldown: 300  # 5 minutes cooldown
      ScalingAdjustment: 1  # Add 1 instance

  ProdScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref ProdAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1  # Remove 1 instance

  # Low CPU alarm for scale-down
  ProdAsgLowCpuAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Low CPU utilization alarm for Auto Scaling Group'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20  # Scale down when CPU < 20%
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref ProdAutoScalingGroup
      AlarmActions:
        - !Ref ProdScaleDownPolicy
      Tags:
        - Key: Name
          Value: 'prod-asg-low-cpu-alarm'
        - Key: Environment
          Value: !Ref Environment

#==============================================================================
# OUTPUTS - Important resource identifiers and endpoints
#==============================================================================
Outputs:
  VPCId:
    Description: 'VPC ID for network reference'
    Value: !Ref ProdVpc
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerDNS:
    Description: 'DNS name of the Application Load Balancer for web access'
    Value: !GetAtt ProdAlb.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'

  RDSEndpoint:
    Description: 'RDS MySQL database connection endpoint'
    Value: !GetAtt ProdRdsInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  S3BucketName:
    Description: 'S3 bucket name for static assets storage'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'
```
#==============================================================================
# END OF TEMPLATE
#==============================================================================
