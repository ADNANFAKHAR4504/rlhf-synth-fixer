```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'High-availability web application infrastructure with ALB, VPC, and RDS'

Parameters:
  DBInstanceType:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance type'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium

  DBMasterPassword:
    Type: String
    NoEcho: true
    Default: 'g00newrdstestJin'
    Description: 'Master password for RDS instance'
    MinLength: 8
    MaxLength: 128
    ConstraintDescription: 'Must be between 8 and 128 characters'

  EC2InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type for web application'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large

  MinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Type: Number
    Default: 6
    Description: 'Maximum number of instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 20

  DesiredCapacity:
    Type: Number
    Default: 2
    Description: 'Desired number of instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 10

  Environment:
    Type: String
    Default: 'dev'
    Description: 'Environment name (dev, staging, prod)'
    AllowedValues:
      - dev
      - staging
      - prod

Mappings:
  # AMI mappings for different regions (Amazon Linux 2023)
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-vpc'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-igw'

  IGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets for ALB
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-subnet-2'

  # Private Subnets for RDS
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.10.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-subnet-2'

  # NAT Gateway for private subnet outbound access
  NATGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: IGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway-eip'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat-gateway'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-route-table'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: IGWAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-route-table'

  NATRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  # ALB Security Group - allows HTTP/HTTPS from internet
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access from internet'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-alb-security-group'

  # EC2 Instance Security Group - allows traffic only from ALB, placed in private subnets
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for EC2 instances in private subnets'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP access from ALB only'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS access from ALB only'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic for updates and packages'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-ec2-instance-security-group'

  # RDS Security Group - allows database access only from application instances
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL access from EC2 instances only'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-rds-security-group'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-webapp-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-alb'

  # Target Group for future application instances
  WebAppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-webapp-targets'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: '/'
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-targets'

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebAppTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-db-subnet-group'

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${Environment}-rds-credentials-${AWS::AccountId}-${AWS::Region}'
      Description: RDS credentials
      SecretString: !Sub |
        {
          "username": "admin",
          "password": "${DBMasterPassword}"
        }

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-webapp-db'
      DBInstanceClass: !Ref DBInstanceType
      Engine: mysql
      EngineVersion: '8.0.41'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref RDSSecret,
            ':SecretString:username}}',
          ],
        ]
      MasterUserPassword:
        !Join [
          '',
          [
            '{{resolve:secretsmanager:',
            !Ref RDSSecret,
            ':SecretString:password}}',
          ],
        ]
      DBSubnetGroupName: !Ref RDSSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 7
      MultiAZ: true
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-db'

  # IAM Role for EC2 instances with enhanced permissions
  EC2InstanceRole:
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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: EC2InstancePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                  - logs:DescribeLogGroups
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*'
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ec2:DescribeTags
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                  - s3:GetObject
                Resource:
                  - !Sub 'arn:aws:s3:::${Environment}-webapp-assets'
                  - !Sub 'arn:aws:s3:::${Environment}-webapp-assets/*'
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-ec2-role'

  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Launch Template for Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${Environment}-webapp-launch-template'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref AWS::Region, AMI]
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y nginx
            systemctl start nginx
            systemctl enable nginx

            # Create a simple health check endpoint
            echo "<html><body><h1>Health Check OK</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /usr/share/nginx/html/health

            # Create a simple index page
            echo "<html><body><h1>Welcome to ${Environment} Web App</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /usr/share/nginx/html/index.html

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
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/${Environment}-webapp/nginx/access",
                        "log_stream_name": "{instance_id}"
                      },
                      {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/ec2/${Environment}-webapp/nginx/error",
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
                Value: !Sub '${Environment}-webapp-instance'
              - Key: Environment
                Value: !Ref Environment

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${Environment}-webapp-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: '$Latest'
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref WebAppTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-webapp-asg'
          PropagateAtLaunch: false
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

  # CloudWatch Alarms for Auto Scaling
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-webapp-high-cpu'
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

  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-webapp-low-cpu'
      AlarmDescription: 'Alarm when CPU falls below 25%'
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

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-vpc-id'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${Environment}-public-subnet-1-id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${Environment}-public-subnet-2-id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${Environment}-private-subnet-1-id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${Environment}-private-subnet-2-id'

  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-alb-dns-name'

  ALBHostedZoneID:
    Description: 'Application Load Balancer Hosted Zone ID'
    Value: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub '${Environment}-alb-hosted-zone-id'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint Address'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-rds-endpoint'

  RDSPort:
    Description: 'RDS Instance Port'
    Value: !GetAtt RDSInstance.Endpoint.Port
    Export:
      Name: !Sub '${Environment}-rds-port'

  EC2InstanceSecurityGroupId:
    Description: 'Security Group ID for EC2 Instances'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${Environment}-ec2-instance-sg-id'

  EC2InstanceRoleArn:
    Description: 'IAM Role ARN for EC2 Instances'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${Environment}-ec2-instance-role-arn'

  EC2InstanceProfileArn:
    Description: 'Instance Profile ARN for EC2 Instances'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${Environment}-ec2-instance-profile-arn'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${Environment}-asg-name'

  LaunchTemplateId:
    Description: 'Launch Template ID'
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${Environment}-launch-template-id'

  ALBSecurityGroupId:
    Description: 'Security Group ID for Application Load Balancer'
    Value: !Ref ALBSecurityGroup
    Export:
      Name: !Sub '${Environment}-alb-sg-id'

  RDSSecurityGroupId:
    Description: 'Security Group ID for RDS Database'
    Value: !Ref RDSSecurityGroup
    Export:
      Name: !Sub '${Environment}-rds-sg-id'

  WebAppTargetGroupArn:
    Description: 'Target Group ARN for Web Application'
    Value: !Ref WebAppTargetGroup
    Export:
      Name: !Sub '${Environment}-webapp-target-group-arn'

  NATGatewayId:
    Description: 'NAT Gateway ID'
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${Environment}-nat-gateway-id'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${Environment}-igw-id'

  RDSSubnetGroupName:
    Description: 'RDS DB Subnet Group Name'
    Value: !Ref RDSSubnetGroup
    Export:
      Name: !Sub '${Environment}-rds-subnet-group-name'

  ScaleUpPolicyArn:
    Description: 'Scale Up Policy ARN'
    Value: !Ref ScaleUpPolicy
    Export:
      Name: !Sub '${Environment}-scale-up-policy-arn'

  ScaleDownPolicyArn:
    Description: 'Scale Down Policy ARN'
    Value: !Ref ScaleDownPolicy
    Export:
      Name: !Sub '${Environment}-scale-down-policy-arn'

  HighCPUAlarmArn:
    Description: 'High CPU Alarm ARN'
    Value: !Ref HighCPUAlarm
    Export:
      Name: !Sub '${Environment}-high-cpu-alarm-arn'

  LowCPUAlarmArn:
    Description: 'Low CPU Alarm ARN'
    Value: !Ref LowCPUAlarm
    Export:
      Name: !Sub '${Environment}-low-cpu-alarm-arn'
```
