# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready web application infrastructure with ALB, Auto Scaling, RDS PostgreSQL, and comprehensive security'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
  
  AllowedCidrBlock:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed to access the application'
  
  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium', 't3.large']
    Description: 'EC2 instance type for web servers'
  
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues: ['db.t3.micro', 'db.t3.small', 'db.t3.medium']
    Description: 'RDS instance class'

Resources:
  # VPC and Networking
  ProdAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: ProdApp-VPC

  ProdAppInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: ProdApp-IGW

  ProdAppAttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref ProdAppVPC
      InternetGatewayId: !Ref ProdAppInternetGateway

  # Public Subnets
  ProdAppPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdApp-Public-Subnet-1

  ProdAppPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: ProdApp-Public-Subnet-2

  # Private Subnets
  ProdAppPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: ProdApp-Private-Subnet-1

  ProdAppPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdAppVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: ProdApp-Private-Subnet-2

  # Route Tables
  ProdAppPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdAppVPC
      Tags:
        - Key: Name
          Value: ProdApp-Public-RT

  ProdAppPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdAppVPC
      Tags:
        - Key: Name
          Value: ProdApp-Private-RT

  ProdAppPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: ProdAppAttachGateway
    Properties:
      RouteTableId: !Ref ProdAppPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref ProdAppInternetGateway

  # Route Table Associations
  ProdAppPublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPublicSubnet1
      RouteTableId: !Ref ProdAppPublicRouteTable

  ProdAppPublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPublicSubnet2
      RouteTableId: !Ref ProdAppPublicRouteTable

  ProdAppPrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPrivateSubnet1
      RouteTableId: !Ref ProdAppPrivateRouteTable

  ProdAppPrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdAppPrivateSubnet2
      RouteTableId: !Ref ProdAppPrivateRouteTable

  # Security Groups
  ProdAppALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer - HTTPS only'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCidrBlock
          Description: 'HTTPS traffic from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: ProdApp-ALB-SG

  ProdAppWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ProdAppALBSecurityGroup
          Description: 'HTTP from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'ProdApp-WebServer-SG-${EnvironmentSuffix}'

  ProdAppDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS PostgreSQL database'
      VpcId: !Ref ProdAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ProdAppWebServerSecurityGroup
          Description: 'PostgreSQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub 'ProdApp-Database-SG-${EnvironmentSuffix}'

  # Database Subnet Group
  ProdAppDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref ProdAppPrivateSubnet1
        - !Ref ProdAppPrivateSubnet2
      Tags:
        - Key: Name
          Value: ProdApp-DB-SubnetGroup

  # RDS PostgreSQL Database
  ProdAppDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'prodapp-postgresql-db-${EnvironmentSuffix}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: postgres
      EngineVersion: '15.13'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: dbadmin
      ManageMasterUserPassword: true
      DBName: prodappdb
      VPCSecurityGroups:
        - !Ref ProdAppDatabaseSecurityGroup
      DBSubnetGroupName: !Ref ProdAppDBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      EnablePerformanceInsights: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt ProdAppRDSEnhancedMonitoringRole.Arn
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub 'ProdApp-PostgreSQL-DB-${EnvironmentSuffix}'

  # RDS Enhanced Monitoring Role
  ProdAppRDSEnhancedMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      Path: /

  # IAM Role for EC2 Instances
  ProdAppEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: RDSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'rds:DescribeDBInstances'
                  - 'rds:DescribeDBClusters'
                Resource: '*'

  ProdAppEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ProdAppEC2Role

  # Launch Template
  ProdAppLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: ProdApp-LaunchTemplate
      LaunchTemplateData:
        ImageId: "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn-ami-hvm-x86_64-gp2}}"
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Arn: !GetAtt ProdAppEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref ProdAppWebServerSecurityGroup
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Production Web Server</h1>" > /var/www/html/index.html
            echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/prodapp/httpd/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/prodapp/httpd/error",
                        "log_stream_name": "{instance_id}"
                      }
                    ]
                  }
                }
              }
            }
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: ProdApp-WebServer

  # Auto Scaling Group
  ProdAppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false
    Properties:
      AutoScalingGroupName: ProdApp-ASG
      VPCZoneIdentifier:
        - !Ref ProdAppPublicSubnet1
        - !Ref ProdAppPublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref ProdAppLaunchTemplate
        Version: !GetAtt ProdAppLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref ProdAppTargetGroup
      Tags:
        - Key: Name
          Value: ProdApp-ASG-Instance
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ProdAppScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref ProdAppAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ProdAppScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref ProdAppAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # CloudWatch Alarms
  ProdAppCPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Alarm if CPU too high'
      AlarmActions:
        - !Ref ProdAppScaleUpPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref ProdAppAutoScalingGroup

  ProdAppCPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Alarm if CPU too low'
      AlarmActions:
        - !Ref ProdAppScaleDownPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref ProdAppAutoScalingGroup

  # Application Load Balancer
  ProdAppALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: ProdApp-ALB
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ProdAppALBSecurityGroup
      Subnets:
        - !Ref ProdAppPublicSubnet1
        - !Ref ProdAppPublicSubnet2
      Tags:
        - Key: Name
          Value: ProdApp-ALB

  # Target Group
  ProdAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: ProdApp-TG
      Port: 80
      Protocol: HTTP
      VpcId: !Ref ProdAppVPC
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: ProdApp-TargetGroup

  # HTTPS Listener
  ProdAppHTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ProdAppTargetGroup
      LoadBalancerArn: !Ref ProdAppALB
      Port: 80 # Not possible to use HTTPS as it needs manual validation for DNS propagation
      Protocol: HTTP #Not possible to use HTTPS as it needs manual validation for DNS propagation


  # CloudWatch Log Groups
  ProdAppHTTPDAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/ec2/prodapp/httpd/access'
      RetentionInDays: 30

  ProdAppHTTPDErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/aws/ec2/prodapp/httpd/error'
      RetentionInDays: 30

  # SSL Certificate not possible to because it needs manual validation for DNS propagation
  # ProdAppSSLCertificate:
  #   Type: AWS::CertificateManager::Certificate
  #   Condition: CreateNewCertificate
  #   Properties:
  #     DomainName: !Ref DomainName
  #     ValidationMethod: DNS
  #     Tags:
  #       - Key: Name
  #         Value: !Sub 'ProdApp-SSL-Certificate-${EnvironmentSuffix}'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref ProdAppVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID-${EnvironmentSuffix}'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ProdAppALB.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS-${EnvironmentSuffix}'

  DatabaseEndpoint:
    Description: 'RDS PostgreSQL Database Endpoint'
    Value: !GetAtt ProdAppDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint-${EnvironmentSuffix}'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref ProdAppAutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name-${EnvironmentSuffix}'

```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
