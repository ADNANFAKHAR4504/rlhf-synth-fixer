### Reasoning Trace
---

Let me create a CloudFormation template in YAML that meets all the requirements outlined. I'll structure this systematically:

1. Start with the template format version and description
2. Define parameters
3. Define resources by category (networking, compute, database, etc.)
4. Define outputs

Here's the detailed template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DevEnvironment deployment template for us-east-1'

Parameters:
  # Network Parameters
  AvailabilityZone1:
    Type: AWS::EC2::AvailabilityZone::Name
    Default: us-east-1a
    Description: First Availability Zone
    
  AvailabilityZone2:
    Type: AWS::EC2::AvailabilityZone::Name
    Default: us-east-1b
    Description: Second Availability Zone
    
  OfficeIpCidr:
    Type: String
    Description: CIDR block for office IPs that can SSH to the bastion host
    Default: 0.0.0.0/0
    
  # Compute Parameters
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: SSH Key for EC2 instances
    
  # Database Parameters
  DbUsername:
    Type: String
    Description: Username for RDS PostgreSQL
    Default: postgres
    
  DbPassword:
    Type: String
    Description: Password for RDS PostgreSQL
    NoEcho: true
    
  DbSnapshotOnDelete:
    Type: String
    Description: Create DB snapshot on deletion
    Default: true
    AllowedValues:
      - true
      - false
      
  # Environment Parameters
  Environment:
    Type: String
    Description: Environment name
    Default: dev
    
  NumberOfDevelopers:
    Type: Number
    Description: Number of developers
    Default: 10
    
  AlarmEmail:
    Type: String
    Description: Email for alarm notifications
    
Resources:
  # NETWORKING RESOURCES
  DevVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.20.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-VPC"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
        - Key: NumberOfDevelopers
          Value: !Ref NumberOfDevelopers
          
  # Subnets
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: 10.20.1.0/24
      AvailabilityZone: !Ref AvailabilityZone1
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Public-Subnet"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: 10.20.10.0/24
      AvailabilityZone: !Ref AvailabilityZone1
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Private-Subnet-1"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DevVPC
      CidrBlock: 10.20.20.0/24
      AvailabilityZone: !Ref AvailabilityZone2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Private-Subnet-2"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-IGW"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref DevVPC
      InternetGatewayId: !Ref InternetGateway
      
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Public-Route-Table"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
      
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable
      
  # NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      
  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-NAT-Gateway"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DevVPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Private-Route-Table"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway
      
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable
      
  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable
      
  # SECURITY GROUPS
  BastionSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion host
      VpcId: !Ref DevVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIpCidr
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Bastion-SG"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  AppSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application servers
      VpcId: !Ref DevVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSG
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-App-SG"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  DbSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS PostgreSQL
      VpcId: !Ref DevVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSG
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-DB-SG"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  # COMPUTE RESOURCES
  BastionInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      KeyName: !Ref KeyName
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref BastionSG
      ImageId: !Ref LatestAmiId
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Bastion"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  # Wait, we need an AMI ID parameter for the bastion instance.
  # Let me add that:
  
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
  
  # DATABASE RESOURCES
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-DB-Subnet-Group"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  PostgreSQLInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-postgres"
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: !Ref DbUsername
      MasterUserPassword: !Ref DbPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DbSG
      CopyTagsToSnapshot: true
      DeleteAutomatedBackups: !Ref DbSnapshotOnDelete
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-PostgreSQL"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  # STORAGE RESOURCES
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-S3-Bucket"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
          
  # MONITORING RESOURCES
  BastionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/ec2/${BastionInstance}"
      RetentionInDays: 7
      
  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/rds/${PostgreSQLInstance}"
      RetentionInDays: 7
      
  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: DevEnvironment Alarms
      TopicName: !Sub "${AWS::StackName}-alarms"
      Subscription:
        - Endpoint: !Ref AlarmEmail
          Protocol: email
          
  BastionCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if Bastion CPU exceeds 80% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref BastionInstance
      AlarmActions:
        - !Ref AlarmTopic
      OKActions:
        - !Ref AlarmTopic
        
  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm if RDS CPU exceeds 80% for 5 minutes
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PostgreSQLInstance
      AlarmActions:
        - !Ref AlarmTopic
      OKActions:
        - !Ref AlarmTopic
        
Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref DevVPC
    
  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    
  PrivateSubnet1Id:
    Description: First Private Subnet ID
    Value: !Ref PrivateSubnet1
    
  PrivateSubnet2Id:
    Description: Second Private Subnet ID
    Value: !Ref PrivateSubnet2
    
  BastionSecurityGroupId:
    Description: Bastion Security Group ID
    Value: !Ref BastionSG
    
  AppSecurityGroupId:
    Description: Application Security Group ID
    Value: !Ref AppSG
    
  DbSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DbSG
    
  BastionPublicIP:
    Description: Public IP of Bastion host
    Value: !GetAtt BastionInstance.PublicIp
    
  RDSEndpoint:
    Description: Endpoint of the RDS instance
    Value: !GetAtt PostgreSQLInstance.Endpoint.Address
    
  S3BucketName:
    Description: Name of S3 bucket for shared files
    Value: !Ref S3Bucket
```

I've addressed all the requirements:

1. **Networking**:
   - Created VPC with CIDR `10.20.0.0/16`
   - Created public subnet `10.20.1.0/24` for the bastion host
   - Created two private subnets (`10.20.10.0/24` and `10.20.20.0/24`) in different AZs
   - Set up an Internet Gateway with route table for the public subnet
   - Set up a NAT Gateway with Elastic IP for private subnet outbound access

2. **Compute**:
   - Created a t3.micro bastion instance in the public subnet
   - Added a parameter for KeyName for SSH access
   - Set up security group to allow SSH (22) only from the OfficeIpCidr parameter

3. **Database**:
   - Created an RDS PostgreSQL db.t3.micro instance in private subnets
   - Set up a DB subnet group across the two private subnets
   - Added parameters for master username and password (with NoEcho)
   - Set up security group to allow PostgreSQL (5432) only from AppSG

4. **Security Groups**:
   - BastionSG: SSH from office IP
   - AppSG: For application servers, allowing SSH from BastionSG
   - DbSG: PostgreSQL access only from AppSG

5. **Storage**:
   - Created an S3 bucket with versioning enabled
   - Blocked public access
   - Enabled default server-side encryption with AES256

6. **Monitoring**:
   - Set up CloudWatch log groups for Bastion and RDS
   - Created CloudWatch alarms for Bastion and RDS CPU > 80%
   - Created an SNS topic for alarms with parameterized email subscription

7. **Tags**:
   - Added Environment: dev (parameterized)
   - Added Project: DevEnv
   - Added Owner: DevTeam
   - Added NumberOfDevelopers: 10 (parameter with default 10)

8. **Parameters & Outputs**:
   - Added parameters for AZs, office IP, snapshot behavior, etc.
   - Added outputs for VPC ID, Subnet IDs, Bastion public IP, RDS endpoint, S3 bucket name, Security Group IDs

The template is in valid YAML format and uses intrinsic functions like Ref and Fn::GetAtt correctly.

Let me do a final check to make sure I haven't missed anything:

Wait, let me check for `DbSnapshotOnDelete` - I see I'm referencing it in the RDS instance but the property in CloudFormation is actually called `DeleteAutomatedBackups`. I actually need to fix this as the right property should be checking for final DB snapshot behavior:

```yaml
PostgreSQLInstance:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Snapshot
  Properties:
    # ... other properties ...
    DeleteAutomatedBackups: !Ref DbSnapshotOnDelete  # This isn't quite right
```

The right property is:

```yaml
PostgreSQLInstance:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Snapshot
  Properties:
    # ... other properties ...
    DeletionProtection: false
    # For handling whether to create a final snapshot
    DeleteAutomatedBackups: false  # Different from snapshot on delete 
```

Actually, there isn't a direct property in RDS instance for this. The DeletionPolicy at the resource level controls whether AWS CloudFormation creates a snapshot or not when the stack is deleted.

Let me update this in my final template:

```yaml
PostgreSQLInstance:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: !If [CreateSnapshotOnDelete, Snapshot, Delete]
  Properties:
    # ... other properties
```

But then I'd need to create a condition:

```yaml
Conditions:
  CreateSnapshotOnDelete: !Equals [!Ref DbSnapshotOnDelete, 'true']
```

Let me finalize with these adjustments.

Actually, on second thought, let's simplify this and just use the DeletionPolicy with a conditional:

```yaml
PostgreSQLInstance:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: !If 
    - CreateSnapshotOnDelete
    - Snapshot 
    - Delete
  Properties:
    # ... other properties
```

Let me finalize the entire template with these adjustments.
### Answer 
---

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Development Environment in us-east-1'

Parameters:
  EnvironmentName:
    Description: Environment name
    Type: String
    Default: dev

  OfficeIpCidr:
    Description: CIDR for office IP address range for SSH access
    Type: String
    Default: 0.0.0.0/0

  KeyName:
    Description: EC2 KeyPair for SSH access to bastion host
    Type: AWS::EC2::KeyPair::KeyName

  DBUsername:
    Description: Username for PostgreSQL database
    Type: String
    Default: postgres

  DBPassword:
    Description: Password for PostgreSQL database
    Type: String
    NoEcho: true

  AvailabilityZone1:
    Description: First Availability Zone
    Type: AWS::EC2::AvailabilityZone::Name
    Default: us-east-1a

  AvailabilityZone2:
    Description: Second Availability Zone
    Type: AWS::EC2::AvailabilityZone::Name
    Default: us-east-1b

  NumberOfDevelopers:
    Description: Number of developers in team
    Type: Number
    Default: 10

  CreateDBSnapshotOnDelete:
    Description: Create a DB snapshot when RDS instance is deleted
    Type: String
    Default: true
    AllowedValues:
      - true
      - false

  AlarmEmail:
    Description: Email address to receive CloudWatch alarm notifications
    Type: String

Conditions:
  CreateSnapshotOnDelete: !Equals [!Ref CreateDBSnapshotOnDelete, 'true']

Resources:
  # Networking Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.20.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-vpc
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
        - Key: NumberOfDevelopers
          Value: !Ref NumberOfDevelopers

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.20.1.0/24
      AvailabilityZone: !Ref AvailabilityZone1
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-public-subnet
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.20.10.0/24
      AvailabilityZone: !Ref AvailabilityZone1
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-private-subnet-1
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.20.20.0/24
      AvailabilityZone: !Ref AvailabilityZone2
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-private-subnet-2
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-igw
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-public-rt
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-nat-gateway
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-private-rt
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
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

  # Security Groups
  BastionSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Bastion host
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIpCidr
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-bastion-sg
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  AppSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSG
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-app-sg
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  DbSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS PostgreSQL
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSG
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-db-sg
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  # Compute Resources
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      KeyName: !Ref KeyName
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref BastionSG
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-bastion
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
        - Key: NumberOfDevelopers
          Value: !Ref NumberOfDevelopers

  # Database Resources
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS PostgreSQL
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-db-subnet-group
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam

  PostgresDB:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: !If [CreateSnapshotOnDelete, Snapshot, Delete]
    Properties:
      DBInstanceIdentifier: !Sub ${AWS::StackName}-postgres
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DbSG
      MultiAZ: false
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
        - Key: NumberOfDevelopers
          Value: !Ref NumberOfDevelopers

  # Storage Resources
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub ${AWS::StackName}-bucket
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: DevEnv
        - Key: Owner
          Value: DevTeam
        - Key: NumberOfDevelopers
          Value: !Ref NumberOfDevelopers

  # Monitoring Resources
  BastionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/ec2/${BastionHost}
      RetentionInDays: 30

  RDSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/rds/${PostgresDB}
      RetentionInDays: 30

  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: DevEnvironment Alarms
      Subscription:
        - Protocol: email
          Endpoint: !Ref AlarmEmail

  BastionCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm when Bastion CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      AlarmActions:
        - !Ref AlarmTopic
      Dimensions:
        - Name: InstanceId
          Value: !Ref BastionHost
      ComparisonOperator: GreaterThanThreshold

  RDSCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Alarm when RDS CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      AlarmActions:
        - !Ref AlarmTopic
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref PostgresDB
      ComparisonOperator: GreaterThanThreshold

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI in us-east-1

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet

  PrivateSubnet1Id:
    Description: First Private Subnet ID
    Value: !Ref PrivateSubnet1

  PrivateSubnet2Id:
    Description: Second Private Subnet ID
    Value: !Ref PrivateSubnet2

  BastionSecurityGroupId:
    Description: Bastion Security Group ID
    Value: !Ref BastionSG

  AppSecurityGroupId:
    Description: Application Security Group ID
    Value: !Ref AppSG

  DbSecurityGroupId:
    Description: Database Security Group ID
    Value: !Ref DbSG

  BastionPublicIP:
    Description: Bastion Host Public IP
    Value: !GetAtt BastionHost.PublicIp

  RDSEndpoint:
    Description: RDS PostgreSQL Endpoint
    Value: !GetAtt PostgresDB.Endpoint.Address

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
```