### Reasoning Trace
---

This is a comprehensive request for an enterprise-grade CloudFormation template. Let me break down the requirements:

1. **VPC and Network Architecture:**
   - Custom VPC with planned CIDR blocks
   - At least 2 Availability Zones
   - Internet Gateway with routing tables
   - Public and private subnets

2. **Application Tier:**
   - Public-facing Elastic Load Balancer (ALB)
   - Auto Scaling Group (min 2 t2.micro instances)
   - Proper integration between ASG and ALB

3. **Data Layer:**
   - RDS instance in private subnets
   - Automated backups
   - Security group allowing only app tier access

4. **Security & Compliance:**
   - Application logs to S3
   - VPC Flow Logs to separate S3 bucket
   - Bastion host for SSH access
   - IAM roles with least privilege
   - Encryption at rest for all data
   - Security groups for HTTP/HTTPS only to app tier

5. **Best Practices:**
   - Naming convention: webapp-[component]
   - Use Parameters for configurable values
   - Provide comprehensive Outputs
   - Production-ready YAML

Let me create a comprehensive CloudFormation template that meets all these requirements.
### Answer 
---

# Enterprise-Grade Web Application CloudFormation Template

Below is a comprehensive CloudFormation template that establishes a production-ready web application infrastructure with all the specified requirements. This template implements security best practices, high availability, and operational excellence.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enterprise-grade web application infrastructure with comprehensive security and operational excellence'

# ====================
# PARAMETERS
# ====================
Parameters:
  EnvironmentName:
    Description: Environment name prefix for resources
    Type: String
    Default: Production
    
  VpcCIDR:
    Description: CIDR block for the VPC
    Type: String
    Default: 10.0.0.0/16
    
  PublicSubnet1CIDR:
    Description: CIDR block for public subnet in AZ1
    Type: String
    Default: 10.0.1.0/24
    
  PublicSubnet2CIDR:
    Description: CIDR block for public subnet in AZ2
    Type: String
    Default: 10.0.2.0/24
    
  PrivateSubnet1CIDR:
    Description: CIDR block for private subnet in AZ1
    Type: String
    Default: 10.0.10.0/24
    
  PrivateSubnet2CIDR:
    Description: CIDR block for private subnet in AZ2
    Type: String
    Default: 10.0.11.0/24
    
  DatabaseSubnet1CIDR:
    Description: CIDR block for database subnet in AZ1
    Type: String
    Default: 10.0.20.0/24
    
  DatabaseSubnet2CIDR:
    Description: CIDR block for database subnet in AZ2
    Type: String
    Default: 10.0.21.0/24
    
  InstanceType:
    Description: EC2 instance type for application servers
    Type: String
    Default: t2.micro
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium
      - t3.micro
      - t3.small
      
  BastionInstanceType:
    Description: EC2 instance type for bastion host
    Type: String
    Default: t2.micro
    
  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
    
  DatabaseInstanceClass:
    Description: RDS database instance class
    Type: String
    Default: db.t3.micro
    
  DatabaseName:
    Description: Database name
    Type: String
    Default: webappdb
    MinLength: 1
    MaxLength: 64
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    
  DatabaseUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    NoEcho: true
    
  DatabasePassword:
    Description: Database master password
    Type: String
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    NoEcho: true
    
  MinSize:
    Description: Minimum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 2
    MinValue: 1
    
  MaxSize:
    Description: Maximum number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 4
    MinValue: 2
    
  DesiredCapacity:
    Description: Desired number of EC2 instances in Auto Scaling Group
    Type: Number
    Default: 2
    MinValue: 1

# ====================
# MAPPINGS
# ====================
Mappings:
  RegionAMI:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c

# ====================
# RESOURCES
# ====================
Resources:
  # ====================
  # VPC AND NETWORKING
  # ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: webapp-vpc
          
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: webapp-igw
          
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
      CidrBlock: !Ref PublicSubnet1CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: webapp-public-subnet-az1
          
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PublicSubnet2CIDR
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: webapp-public-subnet-az2
          
  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1CIDR
      Tags:
        - Key: Name
          Value: webapp-private-subnet-az1
          
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2CIDR
      Tags:
        - Key: Name
          Value: webapp-private-subnet-az2
          
  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref DatabaseSubnet1CIDR
      Tags:
        - Key: Name
          Value: webapp-database-subnet-az1
          
  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref DatabaseSubnet2CIDR
      Tags:
        - Key: Name
          Value: webapp-database-subnet-az2
          
  # NAT Gateways for Private Subnets
  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      
  NatGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: webapp-nat-gateway-az1
          
  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: webapp-nat-gateway-az2
          
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-public-routes
          
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
          Value: webapp-private-routes-az1
          
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
      
  DatabaseSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref DatabaseSubnet1
      
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: webapp-private-routes-az2
          
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
      
  DatabaseSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref DatabaseSubnet2
      
  # ====================
  # SECURITY GROUPS
  # ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: webapp-alb-sg
      GroupDescription: Security group for Application Load Balancer
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
          Value: webapp-alb-sg
          
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: webapp-webserver-sg
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
      Tags:
        - Key: Name
          Value: webapp-webserver-sg
          
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: webapp-database-sg
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: webapp-database-sg
          
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: webapp-bastion-sg
      GroupDescription: Security group for bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: webapp-bastion-sg
          
  # ====================
  # S3 BUCKETS
  # ====================
  ApplicationLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-application-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: webapp-application-logs
          
  VPCFlowLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'webapp-vpc-flow-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 30
      Tags:
        - Key: Name
          Value: webapp-vpc-flow-logs
          
  # ====================
  # VPC FLOW LOGS
  # ====================
  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: webapp-vpc-flow-logs-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: webapp-vpc-flow-logs-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetBucketLocation'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt VPCFlowLogsBucket.Arn
                  - !Sub '${VPCFlowLogsBucket.Arn}/*'
                  
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: s3
      LogDestination: !GetAtt VPCFlowLogsBucket.Arn
      LogFormat: '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${action}'
      Tags:
        - Key: Name
          Value: webapp-vpc-flow-log
          
  # ====================
  # IAM ROLES
  # ====================
  WebServerRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: webapp-webserver-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: webapp-s3-logs-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt ApplicationLogsBucket.Arn
                  - !Sub '${ApplicationLogsBucket.Arn}/*'
        - PolicyName: webapp-ssm-policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ssm:GetParameter'
                  - 'ssm:GetParameters'
                  - 'ssm:GetParametersByPath'
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/webapp/*'
                
  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: webapp-webserver-profile
      Roles:
        - !Ref WebServerRole
        
  # ====================
  # LOAD BALANCER
  # ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: webapp-alb
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: webapp-alb
          
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: webapp-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: webapp-target-group
          
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      
  # ====================
  # AUTO SCALING
  # ====================
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: webapp-launch-template
      LaunchTemplateData:
        ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt WebServerInstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Configure application
            echo "<h1>Web Application - Instance $(hostname)</h1>" > /var/www/html/index.html
            
            # Configure logging to S3
            aws configure set region ${AWS::Region}
            
            # Start services
            systemctl start httpd
            systemctl enable httpd
            
            # Create log rotation script
            cat > /etc/cron.daily/upload-logs.sh << 'EOF'
            #!/bin/bash
            LOG_DATE=$(date +%Y-%m-%d)
            aws s3 cp /var/log/httpd/access_log s3://${ApplicationLogsBucket}/httpd/access_log-$LOG_DATE
            aws s3 cp /var/log/httpd/error_log s3://${ApplicationLogsBucket}/httpd/error_log-$LOG_DATE
            EOF
            chmod +x /etc/cron.daily/upload-logs.sh
            
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: webapp-asg
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref DesiredCapacity
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: webapp-instance
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true
          
  ScalingPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70.0
        
  # ====================
  # RDS DATABASE
  # ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: webapp-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2
      Tags:
        - Key: Name
          Value: webapp-db-subnet-group
          
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: webapp-database
      DBName: !Ref DatabaseName
      Engine: MySQL
      EngineVersion: '8.0.33'
      DBInstanceClass: !Ref DatabaseInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DatabaseUsername
      MasterUserPassword: !Ref DatabasePassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: false
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: webapp-database
          
  # ====================
  # BASTION HOST
  # ====================
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref BastionInstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          # Install SSM agent
          yum install -y amazon-ssm-agent
          systemctl start amazon-ssm-agent
          systemctl enable amazon-ssm-agent
      Tags:
        - Key: Name
          Value: webapp-bastion-host
          
# ====================
# OUTPUTS
# ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
      
  LoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'
      
  ApplicationLogsBucketName:
    Description: Name of S3 bucket for application logs
    Value: !Ref ApplicationLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-AppLogs-Bucket'
      
  VPCFlowLogsBucketName:
    Description: Name of S3 bucket for VPC flow logs
    Value: !Ref VPCFlowLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-FlowLogs-Bucket'
      
  DatabaseEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt DatabaseInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
      
  BastionHostPublicIP:
    Description: Public IP of bastion host
    Value: !GetAtt BastionHost.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-Bastion-IP'
      
  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASG-Name'
      
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'
      
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'
      
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'
      
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'
```

## Template Overview and Key Features

### Architecture Components

1. **Network Architecture**
   - Custom VPC with configurable CIDR blocks
   - 6 subnets across 2 availability zones (public, private, database)
   - NAT Gateways for high availability in each AZ
   - Internet Gateway for public subnet connectivity
   - Comprehensive routing tables for traffic management

2. **Security Implementation**
   - Layered security groups with minimal required permissions
   - Bastion host for secure SSH access
   - VPC Flow Logs for network monitoring
   - All data encrypted at rest (S3, RDS, EBS)
   - IAM roles following least privilege principle

3. **Application Tier**
   - Application Load Balancer distributing traffic
   - Auto Scaling Group maintaining minimum 2 instances
   - Launch Template with encrypted EBS volumes
   - Automated log shipping to S3

4. **Database Layer**
   - RDS MySQL instance in private subnets
   - Automated backups with 7-day retention
   - CloudWatch logs export enabled
   - Security group restricting access to app tier only

5. **Operational Excellence**
   - S3 lifecycle policies for log retention
   - CloudWatch integration for monitoring
   - Consistent naming convention (webapp-*)
   - Comprehensive outputs for integration

### Deployment Instructions

1. **Prerequisites**
   - AWS CLI configured with appropriate credentials
   - An existing EC2 Key Pair in the target region
   - Sufficient service limits for the resources

2. **Deploy the Stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name webapp-infrastructure \
     --template-body file://webapp-infrastructure.yaml \
     --parameters \
       ParameterKey=KeyPairName,ParameterValue=your-key-pair \
       ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword123 \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Monitor Stack Creation**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name webapp-infrastructure \
     --query 'Stacks[0].StackStatus'
   ```

4. **Access the Application**
   - Once deployed, retrieve the Load Balancer DNS from the stack outputs
   - Access your application at: `http://<LoadBalancerDNS>`

### Security Best Practices Implemented

- **Network Segmentation**: Public, private, and database tiers isolated
- **Encryption**: All data at rest encrypted using AWS managed keys
- **Access Control**: Bastion host for SSH, no direct access to private resources
- **Logging**: Comprehensive logging to S3 with retention policies
- **Least Privilege**: IAM roles with minimal required permissions
- **Security Groups**: Restrictive ingress rules, only necessary ports open

This template provides a production-ready, scalable, and secure foundation for enterprise web applications while maintaining operational excellence and AWS best practices.