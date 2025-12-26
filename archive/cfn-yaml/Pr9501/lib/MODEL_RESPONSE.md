I'll create a comprehensive CloudFormation template that meets all your requirements. Here's the complete YAML template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Highly available and resilient web application infrastructure deployed across multiple 
  Availability Zones with Auto Scaling, Load Balancing, RDS Multi-AZ database, and 
  CloudWatch monitoring. This template provisions EC2 instances with Apache web server,
  Application Load Balancer, Auto Scaling Group with scaling policies, and RDS MySQL 
  database with proper security groups and monitoring alarms.

# Parameters section for user inputs and configuration
Parameters:
  AppName:
    Type: String
    Description: Name of the application (used in resource naming convention)
    Default: WebApp
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters and hyphens

  Environment:
    Type: String
    Description: Environment name (dev, staging, prod)
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod

  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: ID of the existing VPC where resources will be deployed

  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: List of at least two subnet IDs in different Availability Zones

  DBSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: List of at least two private subnet IDs for RDS deployment

  InstanceType:
    Type: String
    Description: EC2 instance type for web servers
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t2.micro
      - t2.small
      - t2.medium

  DBMasterUsername:
    Type: String
    Description: Master username for RDS database
    Default: admin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters

  DBMasterPassword:
    Type: String
    Description: Master password for RDS database
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '^[a-zA-Z0-9]*$'
    ConstraintDescription: Must contain only alphanumeric characters and be 8-41 characters long

  ProjectTag:
    Type: String
    Description: Project tag for resource identification
    Default: HighAvailabilityWebApp

  OwnerTag:
    Type: String
    Description: Owner tag for resource identification
    Default: DevOpsTeam

# Mappings for AMI IDs by region
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890  # Amazon Linux 2 AMI (replace with current AMI ID)
    us-west-2:
      AMI: ami-0abcdef1234567890  # Amazon Linux 2 AMI (replace with current AMI ID)

# Resources section
Resources:
  # Security Group for Web Servers
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-${Environment}-WebServer-SG'
      GroupDescription: Security group for web servers allowing HTTP traffic from ALB
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTP traffic from Load Balancer
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8
          Description: SSH access from VPC
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-WebServer-SG'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # Security Group for Load Balancer
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-${Environment}-ALB-SG'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP traffic from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS traffic from internet
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-ALB-SG'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # Security Group for RDS Database
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AppName}-${Environment}-Database-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: MySQL access from web servers
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-Database-SG'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # IAM Role for EC2 instances
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AppName}-${Environment}-WebServer-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # Instance Profile for EC2 instances
  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AppName}-${Environment}-WebServer-Profile'
      Roles:
        - !Ref WebServerRole

  # Launch Template for Auto Scaling Group
  WebServerLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AppName}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: ami-0abcdef1234567890  # Replace with current Amazon Linux 2 AMI ID
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Name: !Ref WebServerInstanceProfile
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple Hello World page
            cat > /var/www/html/index.html << EOF
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hello from ${AppName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .container { max-width: 800px; margin: 0 auto; text-align: center; }
                    .header { color: #333; }
                    .info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="header">Hello World from ${AppName}!</h1>
                    <div class="info">
                        <h2>Instance Information</h2>
                        <p><strong>Environment:</strong> ${Environment}</p>
                        <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                        <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                        <p><strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
                        <p><strong>Timestamp:</strong> $(date)</p>
                    </div>
                    <p>This is a highly available web application deployed using AWS CloudFormation!</p>
                </div>
            </body>
            </html>
            EOF
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AppName}-${Environment}-WebServer'
              - Key: Project
                Value: !Ref ProjectTag
              - Key: Owner
                Value: !Ref OwnerTag

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AppName}-${Environment}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets: !Ref SubnetIds
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-ALB'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # Target Group for Load Balancer
  WebServerTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AppName}-${Environment}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-TG'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # Load Balancer Listener
  LoadBalancerListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref WebServerTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AppName}-${Environment}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLaunchTemplate
        Version: !GetAtt WebServerLaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      VPCZoneIdentifier: !Ref SubnetIds
      TargetGroupARNs:
        - !Ref WebServerTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-ASG-Instance'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectTag
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerTag
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M
        WaitOnResourceSignals: false

  # Scale Up Policy
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      ScalingAdjustment: 1
      AdjustmentType: ChangeInCapacity
      Cooldown: 300

  # Scale Down Policy
  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: SimpleScaling
      ScalingAdjustment: -1
      AdjustmentType: ChangeInCapacity
      Cooldown: 300

  # CloudWatch Alarm for High CPU (Scale Up)
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AppName}-${Environment}-HighCPU'
      AlarmDescription: Alarm when CPU exceeds 70%
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
      TreatMissingData: notBreaching

  # CloudWatch Alarm for Low CPU (Scale Down)
  LowCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AppName}-${Environment}-LowCPU'
      AlarmDescription: Alarm when CPU drops below 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy
      TreatMissingData: notBreaching

  # DB Subnet Group for RDS
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AppName}-${Environment}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds: !Ref DBSubnetIds
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-DBSubnetGroup'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

  # RDS Database Instance
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AppName}-${Environment}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MultiAZ: true
      DBName: webapp
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: false  # Set to true for production
      Tags:
        - Key: Name
          Value: !Sub '${AppName}-${Environment}-Database'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag

# Outputs section
Outputs:
  LoadBalancerDNSName:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AppName}-${Environment}-ALB-DNSName'

  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${AppName}-${Environment}-ALB-URL'

  DatabaseEndpoint:
    Description: RDS Database endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AppName}-${Environment}-DB-Endpoint'

  DatabasePort:
    Description: RDS Database port
    Value: !GetAtt DatabaseInstance.Endpoint.Port
    Export:
      Name: !Sub '${AppName}-${Environment}-DB-Port'

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AppName}-${Environment}-ASG-Name'

  WebServerSecurityGroupId:
    Description: Security Group ID for Web Servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AppName}-${Environment}-WebServer-SG-ID'

  DatabaseSecurityGroupId:
    Description: Security Group ID for Database
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AppName}-${Environment}-Database-SG-ID'

  HighCPUAlarmName:
    Description: Name of the High CPU CloudWatch Alarm
    Value: !Ref HighCPUAlarm
    Export:
      Name: !Sub '${AppName}-${Environment}-HighCPU-Alarm'

  LowCPUAlarmName:
    Description: Name of the Low CPU CloudWatch Alarm
    Value: !Ref LowCPUAlarm
    Export:
      Name: !Sub '${AppName}-${Environment}-LowCPU-Alarm'
```

## Key Features and Best Practices Implemented:

### 1. **High Availability Architecture**
- Multi-AZ deployment across specified subnets
- Auto Scaling Group with minimum 2 instances
- Application Load Balancer for traffic distribution
- RDS Multi-AZ for database redundancy

### 2. **Security Best Practices**
- Dedicated security groups with least privilege access
- Database accessible only from web servers
- IAM roles and instance profiles for EC2 instances
- Encrypted RDS storage

### 3. **Monitoring and Auto Scaling**
- CloudWatch alarms for CPU utilization
- Automatic scaling policies (scale up at 70% CPU, scale down at 30% CPU)
- Health checks on both ALB and ASG levels

### 4. **Naming Convention and Tagging**
- Consistent naming: `AppName-Environment-ResourceType`
- Comprehensive tagging with Project and Owner tags
- Resource identification through exports

### 5. **Configuration Management**
- Parameterized template for flexibility
- UserData script for web server setup
- Launch Template for consistent instance configuration

## Usage Instructions:

1. **Save the template** as `ha-web-app.yaml`

2. **Deploy using AWS CLI:**
```bash
aws cloudformation create-stack \
  --stack-name my-web-app-stack \
  --template-body file://ha-web-app.yaml \
  --parameters ParameterKey=VpcId,ParameterValue=vpc-12345678 \
               ParameterKey=SubnetIds,ParameterValue="subnet-12345678,subnet-87654321" \
               ParameterKey=DBSubnetIds,ParameterValue="subnet-11111111,subnet-22222222" \
               ParameterKey=DBMasterPassword,ParameterValue=MySecurePassword123 \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Important Notes:**
   - Replace the AMI ID in the Launch Template with the current Amazon Linux 2 AMI ID for us-east-1
   - Ensure the specified subnets are in different Availability Zones
   - Use strong passwords for the database
   - Consider enabling RDS deletion protection for production environments

This template provides a production-ready, highly available web application infrastructure that automatically scales based on demand and includes comprehensive monitoring and alerting capabilities.