### Reasoning Trace
---

I need to create a comprehensive CloudFormation template that meets all the specified requirements. Let me break down what I need to include:

1. **VPC with CIDR 10.0.0.0/16**
2. **Public Subnets** (2) in different AZs - 10.0.1.0/24 and 10.0.2.0/24
3. **Private Subnets** (2) in different AZs - 10.0.3.0/24 and 10.0.4.0/24
4. **Internet Gateway** attached to VPC
5. **Elastic IP** and **NAT Gateway** in one public subnet
6. **Route Tables** - public (to IGW) and private (to NAT)
7. **Security Group** - HTTP/HTTPS inbound, all outbound
8. **IAM Role** with S3 access
9. **S3 Bucket** with versioning and public access blocked
10. **RDS MySQL** in private subnets with Multi-AZ
11. **DynamoDB Table** with specified capacity

Key constraints:
- No hardcoding - use parameters and pseudo parameters
- Must work in any account/region
- All configurable values as parameters
- Security best practices

Let me create the template step by step.
### Answer 
---

I'll create a comprehensive CloudFormation template that meets all your requirements. This template will be fully parameterized and deployable across any AWS account without modification.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade AWS infrastructure with VPC, subnets, security, compute, storage, and database components'

# Parameters for user configuration
Parameters:
  # VPC Parameters
  VPCCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet1Cidr:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for public subnet 1'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PublicSubnet2Cidr:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for public subnet 2'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnet1Cidr:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for private subnet 1'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for private subnet 2'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  # RDS Parameters
  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

  DBMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Master username for RDS MySQL'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  DBMasterPassword:
    Type: String
    NoEcho: true
    Description: 'Master password for RDS MySQL (min 8 characters)'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  DBBackupRetentionPeriod:
    Type: Number
    Default: 7
    Description: 'Number of days to retain automated backups'
    MinValue: 1
    MaxValue: 35

  MySQLEngineVersion:
    Type: String
    Default: '8.0.35'
    Description: 'MySQL engine version'
    AllowedValues:
      - '8.0.35'
      - '8.0.34'
      - '8.0.33'
      - '8.0.32'

  # S3 Parameters
  S3BucketNamePrefix:
    Type: String
    Default: 'myapp-data'
    Description: 'Prefix for S3 bucket name (will be appended with account ID and region)'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    MaxLength: 40

  # DynamoDB Parameters
  DynamoDBTableName:
    Type: String
    Default: 'MyAppTable'
    Description: 'Name for DynamoDB table'
    AllowedPattern: '[a-zA-Z0-9_.-]+'
    MinLength: 3
    MaxLength: 255

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet2'

  # Elastic IP for NAT Gateway
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP'

  # NAT Gateway
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTable'

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  # Subnet Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

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

  # Security Group
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebSecurityGroup'
      GroupDescription: 'Security group for web traffic'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTPS from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebSecurityGroup'

  # RDS Security Group
  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-RDSSecurityGroup'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'Allow MySQL from Web Security Group'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDSSecurityGroup'

  # IAM Role for EC2
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                Resource:
                  - !GetAtt S3Bucket.Arn
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource:
                  - !Sub '${S3Bucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2Role'

  # Instance Profile
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2InstanceProfile'
      Roles:
        - !Ref EC2Role

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${S3BucketNamePrefix}-${AWS::AccountId}-${AWS::Region}'
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
          Value: !Sub '${AWS::StackName}-S3Bucket'

  # RDS Subnet Group
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-rds-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDSSubnetGroup'

  # RDS MySQL Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-mysql-db'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: !Ref MySQLEngineVersion
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      AllocatedStorage: '20'
      StorageType: gp3
      StorageEncrypted: true
      BackupRetentionPeriod: !Ref DBBackupRetentionPeriod
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      PubliclyAccessible: false
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref RDSSubnetGroup
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDSInstance'

  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Ref DynamoDBTableName
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DynamoDBTable'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  WebSecurityGroupId:
    Description: 'Web Security Group ID'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebSecurityGroup-ID'

  S3BucketName:
    Description: 'S3 Bucket Name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket-Name'

  RDSEndpoint:
    Description: 'RDS MySQL Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  DynamoDBTableName:
    Description: 'DynamoDB Table Name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-TableName'

  EC2RoleArn:
    Description: 'EC2 Role ARN'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2Role-ARN'

  EC2InstanceProfileArn:
    Description: 'EC2 Instance Profile ARN'
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceProfile-ARN'
```

## Key Features of This Template:

### 1. **Complete Parameterization**
- All configurable values are parameters with sensible defaults
- No hardcoded values that would prevent cross-account deployment
- Uses AWS pseudo parameters (`AWS::AccountId`, `AWS::Region`, `AWS::StackName`)

### 2. **Security Best Practices**
- RDS deployed in private subnets with no public access
- S3 bucket has all public access blocked and encryption enabled
- Security groups follow principle of least privilege
- RDS and DynamoDB have encryption enabled
- Sensitive parameters (DB password) use `NoEcho`

### 3. **High Availability**
- Subnets span multiple Availability Zones
- RDS configured with Multi-AZ deployment
- NAT Gateway provides outbound internet access for private resources

### 4. **Resource Organization**
- Clear naming conventions using stack name prefix
- Comprehensive tagging for resource identification
- Logical grouping of related resources

### 5. **Outputs for Integration**
- Exports key resource IDs and endpoints for use by other stacks
- All outputs use stack name prefix to avoid conflicts

### 6. **Additional Security Features**
- RDS security group only allows access from web security group
- Instance profile allows EC2 instances to access only the created S3 bucket
- DynamoDB table has server-side encryption enabled

## Deployment Instructions:

1. Save the template to a file (e.g., `infrastructure.yaml`)

2. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name my-infrastructure \
  --template-body file://infrastructure.yaml \
  --parameters ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. Monitor the stack creation:
```bash
aws cloudformation describe-stacks \
  --stack-name my-infrastructure \
  --region us-east-1
```

This template meets all your requirements and can be deployed without modification in any AWS account. The parameterized design allows for easy customization while maintaining security and availability best practices.