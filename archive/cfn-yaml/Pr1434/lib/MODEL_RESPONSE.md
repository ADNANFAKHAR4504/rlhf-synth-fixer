# Model Response - TapStack CloudFormation Template

This file contains the CloudFormation template response from the model for the high-availability web application infrastructure.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC - AWS Nova Model Breaking - High Availability Web Application Infrastructure'

Parameters:
  ProjectName:
    Type: String
    Default: 'IaC - AWS Nova Model Breaking'
    Description: 'Project name for resource tagging'

  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']
    Description: 'Environment type'

  InstanceType:
    Type: String
    Default: 't3.medium'
    AllowedValues: ['t3.small', 't3.medium', 't3.large', 't3.xlarge']
    Description: 'EC2 instance type for web servers'

  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    AllowedValues: ['db.t3.micro', 'db.t3.small', 'db.t3.medium']
    Description: 'RDS instance class'

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'

  AllowedCIDR:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed to access the application'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-2:
      AMI: ami-008fe2fc65df48dac
    eu-west-1:
      AMI: ami-0a8e758f5e873d1c1

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'
        - Key: Project
          Value: !Ref ProjectName
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
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes'
        - Key: Project
          Value: !Ref ProjectName
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
          Value: !Sub '${ProjectName}-Private-Routes-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDR
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDR
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB-SecurityGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-WebServer-SG'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP from Load Balancer'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: 'SSH from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-WebServer-SecurityGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-Database-SG'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Database-SecurityGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # IAM Roles and Policies
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-*/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-*'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2-InstanceProfile'
      Roles:
        - !Ref EC2Role

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-DB-SubnetGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-database'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Database'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Secrets Manager for DB Password
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-db-credentials'
      Description: 'Database credentials for the web application'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-ALB'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ApplicationLoadBalancer'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Target Group
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-TargetGroup'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # Load Balancer Listener
  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd mysql
            systemctl start httpd
            systemctl enable httpd

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Create a simple health check endpoint
            echo "OK" > /var/www/html/health

            # Create a simple index page
            cat << 'EOF' > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head>
                <title>IaC - AWS Nova Model Breaking</title>
            </head>
            <body>
                <h1>Welcome to IaC - AWS Nova Model Breaking</h1>
                <p>This is a highly available web application deployed using AWS CloudFormation.</p>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            </body>
            </html>
            EOF

            # Configure CloudWatch agent
            cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
                "metrics": {
                    "namespace": "AWS/EC2/Custom",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer-Volume'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-CPU-High'
      AlarmDescription: 'Alarm when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy
        - !Ref SNSTopicAlarms
      TreatMissingData: notBreaching

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-CPU-Low'
      AlarmDescription: 'Alarm when CPU is below 25%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy
      TreatMissingData: notBreaching

  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-Database-CPU-High'
      AlarmDescription: 'Alarm when database CPU exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref Database
      AlarmActions:
        - !Ref SNSTopicAlarms
      TreatMissingData: notBreaching

  # SNS Topic for Alarms
  SNSTopicAlarms:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${ProjectName}-Alarms'
      DisplayName: !Sub '${ProjectName} System Alarms'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

  # CloudWatch Log Group
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${ProjectName}'
      RetentionInDays: 30
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  LoadBalancerURL:
    Description: 'Application Load Balancer URL'
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'

  LoadBalancerDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNSName'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DatabasePort:
    Description: 'RDS Database Port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DB-Port'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  SNSTopicArn:
    Description: 'SNS Topic ARN for Alarms'
    Value: !Ref SNSTopicAlarms
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic-ARN'

  PublicSubnets:
    Description: 'Public Subnet IDs'
    Value: !Sub '${PublicSubnet1},${PublicSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: 'Private Subnet IDs'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  Region:
    Description: 'AWS Region'
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'
```

## Notes

This CloudFormation template represents the initial model response for the TapStack infrastructure. It includes most of the core components but may require additional fixes and enhancements as identified during testing and deployment.
MapPublicIpOnLaunch: true
Tags: - Key: Name
Value: !Sub '${ProjectName}-Public-Subnet-AZ2' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# Private Subnets

PrivateSubnet1:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
AvailabilityZone: !Select [0, !GetAZs '']
CidrBlock: 10.0.10.0/24
Tags: - Key: Name
Value: !Sub '${ProjectName}-Private-Subnet-AZ1' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

PrivateSubnet2:
Type: AWS::EC2::Subnet
Properties:
VpcId: !Ref VPC
AvailabilityZone: !Select [1, !GetAZs '']
CidrBlock: 10.0.11.0/24
Tags: - Key: Name
Value: !Sub '${ProjectName}-Private-Subnet-AZ2' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# NAT Gateways

NatGateway1EIP:
Type: AWS::EC2::EIP
DependsOn: InternetGatewayAttachment
Properties:
Domain: vpc
Tags: - Key: Name
Value: !Sub '${ProjectName}-NAT-EIP-AZ1' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

NatGateway2EIP:
Type: AWS::EC2::EIP
DependsOn: InternetGatewayAttachment
Properties:
Domain: vpc
Tags: - Key: Name
Value: !Sub '${ProjectName}-NAT-EIP-AZ2' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

NatGateway1:
Type: AWS::EC2::NatGateway
Properties:
AllocationId: !GetAtt NatGateway1EIP.AllocationId
SubnetId: !Ref PublicSubnet1
Tags: - Key: Name
Value: !Sub '${ProjectName}-NAT-AZ1' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

NatGateway2:
Type: AWS::EC2::NatGateway
Properties:
AllocationId: !GetAtt NatGateway2EIP.AllocationId
SubnetId: !Ref PublicSubnet2
Tags: - Key: Name
Value: !Sub '${ProjectName}-NAT-AZ2' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# Route Tables

PublicRouteTable:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Name
Value: !Sub '${ProjectName}-Public-Routes' - Key: Project
Value: !Ref ProjectName - Key: Environment
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
Tags: - Key: Name
Value: !Sub '${ProjectName}-Private-Routes-AZ1' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

DefaultPrivateRoute1:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PrivateRouteTable1
DestinationCidrBlock: 0.0.0.0/0
NatGatewayId: !Ref NatGateway1

PrivateSubnet1RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
RouteTableId: !Ref PrivateRouteTable1
SubnetId: !Ref PrivateSubnet1

PrivateRouteTable2:
Type: AWS::EC2::RouteTable
Properties:
VpcId: !Ref VPC
Tags: - Key: Name
Value: !Sub '${ProjectName}-Private-Routes-AZ2' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

DefaultPrivateRoute2:
Type: AWS::EC2::Route
Properties:
RouteTableId: !Ref PrivateRouteTable2
DestinationCidrBlock: 0.0.0.0/0
NatGatewayId: !Ref NatGateway2

PrivateSubnet2RouteTableAssociation:
Type: AWS::EC2::SubnetRouteTableAssociation
Properties:
RouteTableId: !Ref PrivateRouteTable2
SubnetId: !Ref PrivateSubnet2

# Security Groups

LoadBalancerSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub '${ProjectName}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDR
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDR
          Description: 'HTTPS access'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ALB-SecurityGroup' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

WebServerSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub '${ProjectName}-WebServer-SG'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: 'HTTP from Load Balancer'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: 'SSH from VPC'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-WebServer-SecurityGroup' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

DatabaseSecurityGroup:
Type: AWS::EC2::SecurityGroup
Properties:
GroupName: !Sub '${ProjectName}-Database-SG'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Database-SecurityGroup' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# IAM Roles and Policies

EC2Role:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub '${ProjectName}-EC2-Role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${ProjectName}-_/_' - Effect: Allow
Action: - s3:ListBucket
Resource: !Sub 'arn:aws:s3:::${ProjectName}-\*'
Tags: - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

EC2InstanceProfile:
Type: AWS::IAM::InstanceProfile
Properties:
InstanceProfileName: !Sub '${ProjectName}-EC2-InstanceProfile'
Roles: - !Ref EC2Role

# RDS Subnet Group

DBSubnetGroup:
Type: AWS::RDS::DBSubnetGroup
Properties:
DBSubnetGroupName: !Sub '${ProjectName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-DB-SubnetGroup' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# RDS Database

Database:
Type: AWS::RDS::DBInstance
DeletionPolicy: Snapshot
Properties:
DBInstanceIdentifier: !Sub '${ProjectName}-database'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
AllocatedStorage: 20
StorageType: gp2
StorageEncrypted: true
MultiAZ: true
VPCSecurityGroups: - !Ref DatabaseSecurityGroup
DBSubnetGroupName: !Ref DBSubnetGroup
BackupRetentionPeriod: 7
PreferredBackupWindow: '03:00-04:00'
PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
DeletionProtection: true
Tags: - Key: Name
Value: !Sub '${ProjectName}-Database' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# Secrets Manager for DB Password

DBSecret:
Type: AWS::SecretsManager::Secret
Properties:
Name: !Sub '${ProjectName}-db-credentials'
Description: 'Database credentials for the web application'
GenerateSecretString:
SecretStringTemplate: '{"username": "admin"}'
GenerateStringKey: 'password'
PasswordLength: 16
ExcludeCharacters: '"@/\'
Tags: - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# Application Load Balancer

ApplicationLoadBalancer:
Type: AWS::ElasticLoadBalancingV2::LoadBalancer
Properties:
Name: !Sub '${ProjectName}-ALB'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ApplicationLoadBalancer' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# Target Group

TargetGroup:
Type: AWS::ElasticLoadBalancingV2::TargetGroup
Properties:
Name: !Sub '${ProjectName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-TargetGroup' - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# Load Balancer Listener

LoadBalancerListener:
Type: AWS::ElasticLoadBalancingV2::Listener
Properties:
DefaultActions: - Type: forward
TargetGroupArn: !Ref TargetGroup
LoadBalancerArn: !Ref ApplicationLoadBalancer
Port: 80
Protocol: HTTP

# Launch Template

LaunchTemplate:
Type: AWS::EC2::LaunchTemplate
Properties:
LaunchTemplateName: !Sub '${ProjectName}-LaunchTemplate'
LaunchTemplateData:
ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
InstanceType: !Ref InstanceType
KeyName: !Ref KeyPairName
IamInstanceProfile:
Arn: !GetAtt EC2InstanceProfile.Arn
SecurityGroupIds: - !Ref WebServerSecurityGroup
UserData:
Fn::Base64: !Sub |
#!/bin/bash
yum update -y
yum install -y httpd mysql
systemctl start httpd
systemctl enable httpd

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Create a simple health check endpoint
            echo "OK" > /var/www/html/health

            # Create a simple index page
            cat << 'EOF' > /var/www/html/index.html
            <!DOCTYPE html>
            <html>
            <head>
                <title>IaC - AWS Nova Model Breaking</title>
            </head>
            <body>
                <h1>Welcome to IaC - AWS Nova Model Breaking</h1>
                <p>This is a highly available web application deployed using AWS CloudFormation.</p>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            </body>
            </html>
            EOF

            # Configure CloudWatch agent
            cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
            {
                "metrics": {
                    "namespace": "AWS/EC2/Custom",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            EOF

            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebServer-Volume'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment

# Auto Scaling Group

AutoScalingGroup:
Type: AWS::AutoScaling::AutoScalingGroup
Properties:
AutoScalingGroupName: !Sub '${ProjectName}-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-ASG-Instance'
PropagateAtLaunch: true - Key: Project
Value: !Ref ProjectName
PropagateAtLaunch: true - Key: Environment
Value: !Ref Environment
PropagateAtLaunch: true

# Auto Scaling Policies

ScaleUpPolicy:
Type: AWS::AutoScaling::ScalingPolicy
Properties:
AdjustmentType: ChangeInCapacity
AutoScalingGroupName: !Ref AutoScalingGroup
Cooldown: 300
ScalingAdjustment: 1
PolicyType: SimpleScaling

ScaleDownPolicy:
Type: AWS::AutoScaling::ScalingPolicy
Properties:
AdjustmentType: ChangeInCapacity
AutoScalingGroupName: !Ref AutoScalingGroup
Cooldown: 300
ScalingAdjustment: -1
PolicyType: SimpleScaling

# CloudWatch Alarms

CPUAlarmHigh:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmName: !Sub '${ProjectName}-CPU-High'
AlarmDescription: 'Alarm when CPU exceeds 70%'
MetricName: CPUUtilization
Namespace: AWS/EC2
Statistic: Average
Period: 300
EvaluationPeriods: 2
Threshold: 70
ComparisonOperator: GreaterThanThreshold
Dimensions: - Name: AutoScalingGroupName
Value: !Ref AutoScalingGroup
AlarmActions: - !Ref ScaleUpPolicy - !Ref SNSTopicAlarms
TreatMissingData: notBreaching

CPUAlarmLow:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmName: !Sub '${ProjectName}-CPU-Low'
AlarmDescription: 'Alarm when CPU is below 25%'
MetricName: CPUUtilization
Namespace: AWS/EC2
Statistic: Average
Period: 300
EvaluationPeriods: 2
Threshold: 25
ComparisonOperator: LessThanThreshold
Dimensions: - Name: AutoScalingGroupName
Value: !Ref AutoScalingGroup
AlarmActions: - !Ref ScaleDownPolicy
TreatMissingData: notBreaching

DatabaseCPUAlarm:
Type: AWS::CloudWatch::Alarm
Properties:
AlarmName: !Sub '${ProjectName}-Database-CPU-High'
AlarmDescription: 'Alarm when database CPU exceeds 80%'
MetricName: CPUUtilization
Namespace: AWS/RDS
Statistic: Average
Period: 300
EvaluationPeriods: 2
Threshold: 80
ComparisonOperator: GreaterThanThreshold
Dimensions: - Name: DBInstanceIdentifier
Value: !Ref Database
AlarmActions: - !Ref SNSTopicAlarms
TreatMissingData: notBreaching

# SNS Topic for Alarms

SNSTopicAlarms:
Type: AWS::SNS::Topic
Properties:
TopicName: !Sub '${ProjectName}-Alarms'
      DisplayName: !Sub '${ProjectName} System Alarms'
Tags: - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

# CloudWatch Log Group

ApplicationLogGroup:
Type: AWS::Logs::LogGroup
Properties:
LogGroupName: !Sub '/aws/ec2/${ProjectName}'
RetentionInDays: 30
Tags: - Key: Project
Value: !Ref ProjectName - Key: Environment
Value: !Ref Environment

Outputs:
VPCId:
Description: 'VPC ID'
Value: !Ref VPC
Export:
Name: !Sub '${AWS::StackName}-VPC-ID'

LoadBalancerURL:
Description: 'Application Load Balancer URL'
Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-ALB-URL'

LoadBalancerDNSName:
Description: 'Application Load Balancer DNS Name'
Value: !GetAtt ApplicationLoadBalancer.DNSName
Export:
Name: !Sub '${AWS::StackName}-ALB-DNSName'

DatabaseEndpoint:
Description: 'RDS Database Endpoint'
Value: !GetAtt Database.Endpoint.Address
Export:
Name: !Sub '${AWS::StackName}-DB-Endpoint'

DatabasePort:
Description: 'RDS Database Port'
Value: !GetAtt Database.Endpoint.Port
Export:
Name: !Sub '${AWS::StackName}-DB-Port'

AutoScalingGroupName:
Description: 'Auto Scaling Group Name'
Value: !Ref AutoScalingGroup
Export:
Name: !Sub '${AWS::StackName}-ASG-Name'

SNSTopicArn:
Description: 'SNS Topic ARN for Alarms'
Value: !Ref SNSTopicAlarms
Export:
Name: !Sub '${AWS::StackName}-SNS-Topic-ARN'

PublicSubnets:
Description: 'Public Subnet IDs'
Value: !Sub '${PublicSubnet1},${PublicSubnet2}'
Export:
Name: !Sub '${AWS::StackName}-Public-Subnets'

PrivateSubnets:
Description: 'Private Subnet IDs'
Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
Export:
Name: !Sub '${AWS::StackName}-Private-Subnets'

Region:
Description: 'AWS Region'
Value: !Ref 'AWS::Region'
Export:
Name: !Sub '${AWS::StackName}-Region'
