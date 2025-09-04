# Improved AcmeWeb Highly Available Web Application Infrastructure

You're absolutely right about those issues. Here's the improved CloudFormation template that addresses all the portability and automation concerns:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AcmeWeb Highly Available Web Application Infrastructure - Production Ready'

Parameters:
  Environment:
    Type: String
    Default: prod
    AllowedValues: [dev, staging, prod]
    Description: Environment name for resource tagging

  CreateKeyPair:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']
    Description: Whether to create a new EC2 Key Pair (true) or use existing (false)

  ExistingKeyPairName:
    Type: String
    Default: ''
    Description: Name of existing EC2 KeyPair (only used if CreateKeyPair is false)

Conditions:
  ShouldCreateKeyPair: !Equals [!Ref CreateKeyPair, 'true']
  UseExistingKeyPair: !Equals [!Ref CreateKeyPair, 'false']

Resources:
  # Generate random password for RDS
  AcmeWebDBPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'AcmeWeb-${Environment}-DB-Password'
      Description: 'Auto-generated password for AcmeWeb RDS database'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-DB-Secret'
        - Key: Environment
          Value: !Ref Environment

  # Create EC2 Key Pair if needed
  AcmeWebKeyPair:
    Type: AWS::EC2::KeyPair
    Condition: ShouldCreateKeyPair
    Properties:
      KeyName: !Sub 'AcmeWeb-${Environment}-KeyPair'
      KeyType: rsa
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-KeyPair'
        - Key: Environment
          Value: !Ref Environment

  # VPC Configuration
  AcmeWebVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  AcmeWebInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebInternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref AcmeWebInternetGateway
      VpcId: !Ref AcmeWebVPC

  # Public Subnets - Dynamic AZ selection
  AcmeWebPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Public-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Public-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets - Dynamic AZ selection
  AcmeWebPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Private-Subnet-AZ1'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref AcmeWebVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Private-Subnet-AZ2'
        - Key: Environment
          Value: !Ref Environment

  # NAT Gateways
  AcmeWebNATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AcmeWebInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-NAT-Gateway-1-EIP'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebNATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AcmeWebInternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-NAT-Gateway-2-EIP'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt AcmeWebNATGateway1EIP.AllocationId
      SubnetId: !Ref AcmeWebPublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-NAT-Gateway-AZ1'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt AcmeWebNATGateway2EIP.AllocationId
      SubnetId: !Ref AcmeWebPublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-NAT-Gateway-AZ2'
        - Key: Environment
          Value: !Ref Environment

  # Route Tables
  AcmeWebPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AcmeWebVPC
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Public-Routes'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebDefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AcmeWebInternetGatewayAttachment
    Properties:
      RouteTableId: !Ref AcmeWebPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref AcmeWebInternetGateway

  AcmeWebPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPublicRouteTable
      SubnetId: !Ref AcmeWebPublicSubnet1

  AcmeWebPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPublicRouteTable
      SubnetId: !Ref AcmeWebPublicSubnet2

  AcmeWebPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AcmeWebVPC
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Private-Routes-AZ1'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebDefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref AcmeWebNATGateway1

  AcmeWebPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable1
      SubnetId: !Ref AcmeWebPrivateSubnet1

  AcmeWebPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref AcmeWebVPC
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Private-Routes-AZ2'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebDefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref AcmeWebNATGateway2

  AcmeWebPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref AcmeWebPrivateRouteTable2
      SubnetId: !Ref AcmeWebPrivateSubnet2

  # IAM Role for EC2 instances to access Systems Manager
  AcmeWebEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'AcmeWeb-${Environment}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref AcmeWebDBPasswordSecret
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-EC2-Role'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'AcmeWeb-${Environment}-EC2-Profile'
      Roles:
        - !Ref AcmeWebEC2Role

  # Security Groups
  AcmeWebLoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'AcmeWeb-${Environment}-LoadBalancer-SG'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref AcmeWebVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access from internet
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-LoadBalancer-SG'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'AcmeWeb-${Environment}-WebServer-SG'
      GroupDescription: Security group for web servers
      VpcId: !Ref AcmeWebVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref AcmeWebLoadBalancerSecurityGroup
          Description: HTTP from Load Balancer
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref AcmeWebLoadBalancerSecurityGroup
          Description: HTTPS from Load Balancer
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-WebServer-SG'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'AcmeWeb-${Environment}-Database-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref AcmeWebVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AcmeWebWebServerSecurityGroup
          Description: MySQL from Web Servers
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Database-SG'
        - Key: Environment
          Value: !Ref Environment

  # Application Load Balancer
  AcmeWebApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'AcmeWeb-${Environment}-ALB'
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref AcmeWebPublicSubnet1
        - !Ref AcmeWebPublicSubnet2
      SecurityGroups:
        - !Ref AcmeWebLoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-ALB'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'AcmeWeb-${Environment}-TG'
      Port: 80
      Protocol: HTTP
      ProtocolVersion: HTTP1
      VpcId: !Ref AcmeWebVPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Matcher:
        HttpCode: 200
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-TG'
        - Key: Environment
          Value: !Ref Environment

  AcmeWebLoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AcmeWebTargetGroup
      LoadBalancerArn: !Ref AcmeWebApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Launch Template with dynamic AMI
  AcmeWebLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'AcmeWeb-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: t3.micro
        KeyName: !If
          - ShouldCreateKeyPair
          - !Ref AcmeWebKeyPair
          - !If
            - UseExistingKeyPair
            - !Ref ExistingKeyPairName
            - !Ref 'AWS::NoValue'
        IamInstanceProfile:
          Arn: !GetAtt AcmeWebEC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref AcmeWebWebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd aws-cli

            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm

            # Start and enable httpd
            systemctl start httpd
            systemctl enable httpd

            # Create health check endpoint
            echo "OK" > /var/www/html/health

            # Create main page with instance info
            cat > /var/www/html/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head>
                <title>AcmeWeb Application</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
                    .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #2c3e50; }
                    .info { background-color: #ecf0f1; padding: 15px; border-radius: 4px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>AcmeWeb Application Server</h1>
                    <div class="info">
                        <strong>Environment:</strong> ${Environment}
                    </div>
                    <div class="info">
                        <strong>Instance ID:</strong> <span id="instance-id">Loading...</span>
                    </div>
                    <div class="info">
                        <strong>Availability Zone:</strong> <span id="az">Loading...</span>
                    </div>
                    <div class="info">
                        <strong>Region:</strong> ${AWS::Region}
                    </div>
                    <div class="info">
                        <strong>Timestamp:</strong> <span id="timestamp"></span>
                    </div>
                </div>
                
                <script>
                    // Fetch instance metadata
                    fetch('http://169.254.169.254/latest/meta-data/instance-id')
                        .then(response => response.text())
                        .then(data => document.getElementById('instance-id').textContent = data)
                        .catch(() => document.getElementById('instance-id').textContent = 'Unknown');
                    
                    fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
                        .then(response => response.text())
                        .then(data => document.getElementById('az').textContent = data)
                        .catch(() => document.getElementById('az').textContent = 'Unknown');
                    
                    document.getElementById('timestamp').textContent = new Date().toLocaleString();
                </script>
            </body>
            </html>
            EOF

            # Set proper permissions
            chown -R apache:apache /var/www/html
            chmod -R 644 /var/www/html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'AcmeWeb-${Environment}-WebServer'
              - Key: Environment
                Value: !Ref Environment
          - ResourceType: volume
            Tags:
              - Key: Name
                Value: !Sub 'AcmeWeb-${Environment}-WebServer-Volume'
              - Key: Environment
                Value: !Ref Environment

  # Auto Scaling Group
  AcmeWebAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'AcmeWeb-${Environment}-ASG'
      VPCZoneIdentifier:
        - !Ref AcmeWebPrivateSubnet1
        - !Ref AcmeWebPrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref AcmeWebLaunchTemplate
        Version: !GetAtt AcmeWebLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref AcmeWebTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      DefaultCooldown: 300
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # Auto Scaling Policies
  AcmeWebScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AcmeWebAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  AcmeWebScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AcmeWebAutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # CloudWatch Alarms
  AcmeWebCPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'AcmeWeb-${Environment}-CPU-High'
      AlarmDescription: Scale up on high CPU utilization
      AlarmActions:
        - !Ref AcmeWebScaleUpPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AcmeWebAutoScalingGroup
      TreatMissingData: notBreaching

  AcmeWebCPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'AcmeWeb-${Environment}-CPU-Low'
      AlarmDescription: Scale down on low CPU utilization
      AlarmActions:
        - !Ref AcmeWebScaleDownPolicy
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AcmeWebAutoScalingGroup
      TreatMissingData: notBreaching

  # Database Subnet Group
  AcmeWebDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'acmeweb-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: !Sub 'Subnet group for AcmeWeb ${Environment} RDS database'
      SubnetIds:
        - !Ref AcmeWebPrivateSubnet1
        - !Ref AcmeWebPrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-DB-SubnetGroup'
        - Key: Environment
          Value: !Ref Environment

  # RDS MySQL Database
  AcmeWebDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'acmeweb-${Environment}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      MaxAllocatedStorage: 100
      StorageType: gp2
      StorageEncrypted: true
      DBName: acmewebdb
      MasterUsername: !Sub '{{resolve:secretsmanager:${AcmeWebDBPasswordSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${AcmeWebDBPasswordSecret}:SecretString:password}}'
      VPCSecurityGroups:
        - !Ref AcmeWebDatabaseSecurityGroup
      DBSubnetGroupName: !Ref AcmeWebDBSubnetGroup
      PubliclyAccessible: false
      MultiAZ: false
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false
      EnablePerformanceInsights: false
      MonitoringInterval: 0
      Tags:
        - Key: Name
          Value: !Sub 'AcmeWeb-${Environment}-Database'
        - Key: Environment
          Value: !Ref Environment

Outputs:
  StackName:
    Description: Name of the CloudFormation stack
    Value: !Ref 'AWS::StackName'
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  Environment:
    Description: Environment name
    Value: !Ref Environment
    Export:
      Name: !Sub '${AWS::StackName}-Environment'

  VPCId:
    Description: ID of the VPC
    Value: !Ref AcmeWebVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  AvailabilityZones:
    Description: Availability Zones used
    Value: !Join
      - ', '
      - - !Select [0, !GetAZs '']
        - !Select [1, !GetAZs '']
    Export:
      Name: !Sub '${AWS::StackName}-AZs'

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${AcmeWebApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-URL'

  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt AcmeWebApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancer-DNS'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt AcmeWebDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Database-Endpoint'

  DatabaseSecretArn:
    Description: ARN of the database password secret
    Value: !Ref AcmeWebDBPasswordSecret
    Export:
      Name: !Sub '${AWS::StackName}-Database-Secret-ARN'

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AcmeWebAutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'

  KeyPairName:
    Description: Name of the EC2 Key Pair (if created)
    Value: !If
      - ShouldCreateKeyPair
      - !Ref AcmeWebKeyPair
      - !If
        - UseExistingKeyPair
        - !Ref ExistingKeyPairName
        - 'No Key Pair'
    Export:
      Name: !Sub '${AWS::StackName}-KeyPair-Name'

  PublicSubnets:
    Description: List of public subnets
    Value: !Join [',', [!Ref AcmeWebPublicSubnet1, !Ref AcmeWebPublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Public-Subnets'

  PrivateSubnets:
    Description: List of private subnets
    Value: !Join [',', [!Ref AcmeWebPrivateSubnet1, !Ref AcmeWebPrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-Private-Subnets'

  Region:
    Description: AWS Region where the stack is deployed
    Value: !Ref 'AWS::Region'
    Export:
      Name: !Sub '${AWS::StackName}-Region'
```

## Key Improvements Made

### ✅ **1. Dynamic Availability Zone Selection**

- **Before**: Hard-coded `us-west-2a` and `us-west-2b`
- **After**: Uses `!Select [0, !GetAZs '']` and `!Select [1, !GetAZs '']`
- **Benefit**: Template works in any AWS region automatically

### ✅ **2. Dynamic AMI Selection**

- **Before**: Hard-coded AMI ID in RegionMap
- **After**: Uses Systems Manager Parameter Store with `{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}`
- **Benefit**: Always uses the latest Amazon Linux 2 AMI

### ✅ **3. Automated Key Pair and Password Management**

- **Before**: Required manual KeyPair and password input
- **After**:
  - Auto-creates EC2 Key Pair or uses existing one
  - Auto-generates secure database password using AWS Secrets Manager
- **Benefit**: Fully automated deployment without manual intervention

### ✅ **4. Enhanced Security and Best Practices**

- Added IAM roles for EC2 instances
- Encrypted RDS storage
- Proper secret management
- Enhanced security group descriptions
- CloudWatch agent installation

### ✅ **5. Production-Ready Features**

- Environment-based naming (`dev`, `staging`, `prod`)
-
