### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that needs to include:

1. VPC with 2 AZs in us-west-2
2. 4 subnets (2 public, 2 private)
3. EC2 instances in public subnets
4. Security groups (HTTP on 80, SSH on 22)
5. NAT Gateway for private subnet internet access
6. RDS Multi-AZ in private subnets
7. CloudWatch monitoring
8. S3 bucket for templates
9. IAM role for EC2 with S3 read-only access
10. Well-structured YAML with parameters and outputs

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

# Enterprise-Grade CloudFormation Template for Modern Web Application

Below is a comprehensive CloudFormation template that orchestrates a production-ready infrastructure with high availability, security, and monitoring capabilities.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enterprise-grade infrastructure for modern web application with HA and security'

# ====================
# Parameters Section
# ====================
Parameters:
  EnvironmentName:
    Description: Environment name prefix for resource naming
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production
    
  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be a valid EC2 key pair name
    
  InstanceType:
    Description: EC2 instance type for web servers
    Type: String
    Default: t3.medium
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    
  DBInstanceClass:
    Description: RDS instance class
    Type: String
    Default: db.t3.small
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
    
  DBMasterUsername:
    Description: Database master username
    Type: String
    Default: dbadmin
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    
  DBMasterPassword:
    Description: Database master password
    Type: String
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

# ====================
# Mappings Section
# ====================
Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.11.0/24'
    PrivateSubnet2:
      CIDR: '10.0.12.0/24'

# ====================
# Resources Section
# ====================
Resources:

  # =====================================
  # VPC and Core Networking Components
  # =====================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
          
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName
          
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # =====================================
  # Public Subnets Configuration
  # =====================================
  
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs 'us-west-2']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'
        - Key: Type
          Value: Public
          
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs 'us-west-2']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'
        - Key: Type
          Value: Public

  # =====================================
  # Private Subnets Configuration
  # =====================================
  
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs 'us-west-2']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ1'
        - Key: Type
          Value: Private
          
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs 'us-west-2']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet-AZ2'
        - Key: Type
          Value: Private

  # =====================================
  # NAT Gateway Configuration
  # =====================================
  
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP'
          
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway'

  # =====================================
  # Route Tables and Routes
  # =====================================
  
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'
          
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
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
          Value: !Sub '${EnvironmentName}-Private-Routes'
          
  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway
      
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

  # =====================================
  # Security Groups
  # =====================================
  
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-WebServer-SG'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: Allow HTTP traffic
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: Allow SSH access
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SG'
          
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Database-SG'
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: Allow MySQL/Aurora access from web servers
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SG'

  # =====================================
  # IAM Role for EC2 Instances
  # =====================================
  
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Role'
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
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt TemplateStorageBucket.Arn
                  - !Sub '${TemplateStorageBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Role'
          
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-Profile'
      Roles:
        - !Ref EC2Role

  # =====================================
  # EC2 Instances
  # =====================================
  
  WebServerInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd amazon-cloudwatch-agent
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Web Server 1 - ${EnvironmentName} Environment</h1>" > /var/www/html/index.html
          
          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
          {
            "metrics": {
              "namespace": "${EnvironmentName}/WebServer",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                    {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
                  ],
                  "totalcpu": false,
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": [
                    {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                  ],
                  "metrics_collection_interval": 60,
                  "resources": ["/"]
                },
                "mem": {
                  "measurement": [
                    {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                  ],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-1'
        - Key: Environment
          Value: !Ref EnvironmentName
          
  WebServerInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet2
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd amazon-cloudwatch-agent
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Web Server 2 - ${EnvironmentName} Environment</h1>" > /var/www/html/index.html
          
          # Configure CloudWatch agent (same configuration as WebServer1)
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
          {
            "metrics": {
              "namespace": "${EnvironmentName}/WebServer",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                    {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
                  ],
                  "totalcpu": false,
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": [
                    {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                  ],
                  "metrics_collection_interval": 60,
                  "resources": ["/"]
                },
                "mem": {
                  "measurement": [
                    {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                  ],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
          EOF
          
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-2'
        - Key: Environment
          Value: !Ref EnvironmentName

  # =====================================
  # RDS Database
  # =====================================
  
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-SubnetGroup'
          
  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-database'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.35'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RDSEnhancedMonitoringRole.Arn
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS-Database'
        - Key: Environment
          Value: !Ref EnvironmentName
          
  RDSEnhancedMonitoringRole:
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
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-RDS-Monitoring-Role'

  # =====================================
  # S3 Bucket for Template Storage
  # =====================================
  
  TemplateStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-cfn-templates-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Template-Storage'
        - Key: Environment
          Value: !Ref EnvironmentName
          
  TemplateStorageBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref TemplateStorageBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt TemplateStorageBucket.Arn
              - !Sub '${TemplateStorageBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # =====================================
  # CloudWatch Alarms
  # =====================================
  
  HighCPUAlarmWebServer1:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: !Sub 'High CPU usage on ${EnvironmentName} WebServer 1'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance1
      TreatMissingData: notBreaching
      
  HighCPUAlarmWebServer2:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: !Sub 'High CPU usage on ${EnvironmentName} WebServer 2'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance2
      TreatMissingData: notBreaching
      
  DatabaseCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: !Sub 'High CPU usage on ${EnvironmentName} RDS Database'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 75
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSDatabase
      TreatMissingData: notBreaching

# ====================
# Outputs Section
# ====================
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID'
      
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${EnvironmentName}-PublicSubnet1-ID'
      
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${EnvironmentName}-PublicSubnet2-ID'
      
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${EnvironmentName}-PrivateSubnet1-ID'
      
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${EnvironmentName}-PrivateSubnet2-ID'
      
  WebServer1PublicIP:
    Description: Public IP of Web Server 1
    Value: !GetAtt WebServerInstance1.PublicIp
    
  WebServer2PublicIP:
    Description: Public IP of Web Server 2
    Value: !GetAtt WebServerInstance2.PublicIp
    
  WebServer1URL:
    Description: URL of Web Server 1
    Value: !Sub 'http://${WebServerInstance1.PublicIp}'
    
  WebServer2URL:
    Description: URL of Web Server 2
    Value: !Sub 'http://${WebServerInstance2.PublicIp}'
    
  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    
  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt RDSDatabase.Endpoint.Port
    
  TemplateBucketName:
    Description: S3 Bucket for CloudFormation templates
    Value: !Ref TemplateStorageBucket
    
  NATGatewayIP:
    Description: Elastic IP address of NAT Gateway
    Value: !Ref NatGatewayEIP
    
  WebServerSecurityGroupId:
    Description: Security Group ID for Web Servers
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${EnvironmentName}-WebServer-SG-ID'
      
  DatabaseSecurityGroupId:
    Description: Security Group ID for Database
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${EnvironmentName}-Database-SG-ID'
```

## Key Architecture Decisions and Best Practices

### 1. **Network Architecture**
- **Multi-AZ Deployment**: Resources span across two availability zones for high availability
- **Subnet Segregation**: Clear separation between public (web tier) and private (database tier) subnets
- **NAT Gateway**: Provides secure outbound internet access for private subnet resources

### 2. **Security Implementation**
- **Security Groups**: Precisely configured to allow only necessary traffic (HTTP/80, SSH/22 for web servers)
- **Private RDS**: Database isolated in private subnets with no public access
- **IAM Least Privilege**: EC2 role grants only read access to the specific S3 bucket
- **Encryption**: S3 bucket encryption and RDS storage encryption enabled

### 3. **Monitoring and Observability**
- **CloudWatch Integration**: Enhanced monitoring for EC2 instances and RDS
- **Custom Metrics**: CloudWatch agent configured to collect CPU, memory, and disk metrics
- **Alarms**: Proactive monitoring with CPU utilization alarms

### 4. **Template Structure**
- **Parameters**: Flexible configuration options for different environments
- **Mappings**: Centralized subnet CIDR configuration
- **Outputs**: Comprehensive resource discovery with exported values for cross-stack references

### 5. **Operational Excellence**
- **Automated Updates**: UserData scripts handle initial configuration
- **Version Control**: S3 bucket versioning for template storage
- **Backup Strategy**: RDS automated backups with 7-day retention

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - EC2 Key Pair created in us-west-2 region
   - Sufficient AWS service limits

2. **Deploy the Stack**:
```bash
aws cloudformation create-stack \
  --stack-name production-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=your-key-pair \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

3. **Monitor Deployment**:
```bash
aws cloudformation describe-stacks \
  --stack-name production-infrastructure \
  --region us-west-2 \
  --query 'Stacks[0].StackStatus'
```

This template provides a robust, production-ready foundation that can be further customized based on specific application requirements while maintaining enterprise-grade security and availability standards.