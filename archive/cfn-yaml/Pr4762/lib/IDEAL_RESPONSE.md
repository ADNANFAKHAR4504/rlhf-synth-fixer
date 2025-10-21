# Production-Grade AWS Infrastructure Template

## Infrastructure Requirements Analysis

### 1. VPC & Networking Architecture
- VPC with configurable CIDR block
- Dual public and private subnets across AZs
- Internet Gateway configuration
- NAT Gateways with Elastic IPs
- Parameterized networking components

### 2. Load Balancer Configuration
- Network Load Balancer deployment in public subnets
- HTTP/HTTPS traffic routing
- Auto Scaling Group integration
- Automated Elastic IP management

### 3. Compute Layer Design
- Dynamic AMI selection via SSM Parameter Store
- Automated EC2 Key Pair generation
- Auto Scaling Group across public subnets
- Restricted security group configuration

### 4. Database Layer Setup
- Multi-AZ RDS deployment (MySQL/PostgreSQL)
- Private subnet placement
- Public access restrictions
- EC2-exclusive access control

### 5. Storage Configuration
- Encrypted S3 bucket deployment
- Private access enforcement

### 6. Monitoring & Observability
- VPC Flow Logs enablement
- Comprehensive resource tagging strategy

### 7. Cross-Account Compatibility
- Dynamic resource referencing
- Parameter and pseudo parameter utilization

## CloudFormation Template Implementation

The following template provides a production-ready infrastructure implementation following AWS best practices and security standards.
### Template Definition

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-grade multi-tier infrastructure with VPC, NLB, Auto Scaling, RDS, and S3'

# ==================== PARAMETERS ====================
Parameters:
  ProjectName:
    Type: String
    Default: 'multi-tier-app'
    Description: 'Project name for resource naming and tagging'
    MinLength: 1
    MaxLength: 50
    AllowedPattern: '^[a-zA-Z0-9\-]+$'

  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name'
    AllowedValues:
      - development
      - staging
      - production

  Owner:
    Type: String
    Default: 'devops-team'
    Description: 'Owner tag for all resources'

  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments'
    Default: "dev"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for the VPC'
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
    Default: '10.0.11.0/24'
    Description: 'CIDR block for private subnet 1'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  PrivateSubnet2Cidr:
    Type: String
    Default: '10.0.12.0/24'
    Description: 'CIDR block for private subnet 2'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'

  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - t3.xlarge
      - m5.large
      - m5.xlarge

  AutoScalingMinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in Auto Scaling Group'
    MinValue: 1

  AutoScalingMaxSize:
    Type: Number
    Default: 6
    Description: 'Maximum number of instances in Auto Scaling Group'
    MinValue: 1

  AutoScalingDesiredCapacity:
    Type: Number
    Default: 2
    Description: 'Desired number of instances in Auto Scaling Group'
    MinValue: 1

  DatabaseEngine:
    Type: String
    Default: 'mysql'
    Description: 'Database engine type'
    AllowedValues:
      - mysql
      - postgres

  DatabaseInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'Database instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.m5.large
      - db.m5.xlarge

  DatabaseMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DatabaseAllocatedStorage:
    Type: Number
    Default: 20
    Description: 'Database storage size in GB'
    MinValue: 20
    MaxValue: 1000

  SourceAmiIdSsmParameter:
    Type: String
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: SSM parameter name holding the AMI ID (keeps template free of hard-coded AMI IDs)

# ==================== MAPPINGS ====================
Mappings:
  DatabaseEngineMap:
    mysql:
      Engine: 'mysql'
      EngineVersion: '8.0'
      Port: 3306
      Family: 'mysql8.0'
    postgres:
      Engine: 'postgres'
      EngineVersion: '14'
      Port: 5432
      Family: 'postgres14'

# ==================== CONDITIONS ====================
Conditions:
  IsMySQL: !Equals [!Ref DatabaseEngine, 'mysql']
  IsPostgreSQL: !Equals [!Ref DatabaseEngine, 'postgres']

# ==================== RESOURCES ====================
Resources:
  # ==================== VPC & NETWORKING ====================
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-route-table'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-route-table-1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute1:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-route-table-2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateRoute2:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # ==================== SECURITY GROUPS ====================
  NLBSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Network Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nlb-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'  
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'  # Optional if you enable HTTPS
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DatabaseSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Port]
          ToPort: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Port]
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ==================== EC2 KEY PAIR ====================
  EC2KeyPair:
    Type: 'AWS::EC2::KeyPair'
    Properties:
      KeyName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-keypair'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DBMasterSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-master-secret'
      Description: 'RDS master password'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DatabaseMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludePunctuation: true

  # ==================== LAUNCH TEMPLATE ====================
  LaunchTemplate:
    Type: 'AWS::EC2::LaunchTemplate'
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lt'
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:${SourceAmiIdSsmParameter}}}'
        InstanceType: !Ref InstanceType
        KeyName: !Ref EC2KeyPair
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData: !Base64 |
          #!/bin/bash
          
          # Run as root and set up logging
          exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
          echo "=========================================="
          echo "UserData script started at: $(date)"
          echo "Running as user: $(whoami)"
          echo "=========================================="
          
          # Update system
          echo "Updating system packages..."
          yum update -y
          
          # Install httpd instead of nginx for better compatibility
          echo "Installing httpd (Apache)..."
          yum install -y httpd
          
          # Enable and start httpd
          echo "Starting httpd service..."
          systemctl enable httpd
          systemctl start httpd
          
          # Verify httpd is running
          echo "Checking httpd status:"
          systemctl status httpd
          
          # Create a simple test page
          echo "Creating test HTML page..."
          echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
          echo "<p>Server running on Amazon Linux 2</p>" >> /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
          echo "<p>Server Time: $(date)</p>" >> /var/www/html/index.html
          
          # Set proper permissions
          chown apache:apache /var/www/html/index.html
          chmod 644 /var/www/html/index.html
          
          # Verify services are running
          echo "Final verification:"
          systemctl is-active httpd
          netstat -tlnp | grep :80
          
          echo "=========================================="
          echo "UserData script completed at: $(date)"
          echo "=========================================="
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-instance'
              - Key: Project
                Value: !Ref ProjectName
              - Key: Environment
                Value: !Ref Environment
              - Key: Owner
                Value: !Ref Owner

  # ==================== IAM ROLES ====================
  EC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
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
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/AmazonSSMManagedInstanceCore'
        - !Sub 'arn:${AWS::Partition}:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource:
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      Roles:
        - !Ref EC2Role

  # ==================== NETWORK LOAD BALANCER ====================
  NetworkLoadBalancer:
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    Properties:
      Type: network
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nlb'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NLBTargetGroup:
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup'
    Properties:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-tg'
      Port: 80
      Protocol: TCP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckEnabled: true
      HealthCheckPort: 80
      HealthCheckProtocol: TCP       # Use TCP for NLB
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 3
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${EnvironmentSuffix}-tg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NLBListener:
    Type: 'AWS::ElasticLoadBalancingV2::Listener'
    Properties:
      LoadBalancerArn: !Ref NetworkLoadBalancer
      Port: 80
      Protocol: TCP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref NLBTargetGroup

  # ==================== AUTO SCALING ====================
  AutoScalingGroup:
    Type: 'AWS::AutoScaling::AutoScalingGroup'
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg'
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref AutoScalingMinSize
      MaxSize: !Ref AutoScalingMaxSize
      DesiredCapacity: !Ref AutoScalingDesiredCapacity
      TargetGroupARNs:
        - !Ref NLBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 600
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-instance'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectName
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref Owner
          PropagateAtLaunch: true

  # ==================== RDS DATABASE ====================
  DBSubnetGroup:
    Type: 'AWS::RDS::DBSubnetGroup'
    Properties:
      DBSubnetGroupName: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  DBParameterGroup:
    Type: 'AWS::RDS::DBParameterGroup'
    Properties:
      Description: !Sub 'Parameter group for ${AWS::StackName} database in ${AWS::Region}'
      Family: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Family]
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-pg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  Database:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db'
      Engine: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, Engine]
      EngineVersion: !FindInMap [DatabaseEngineMap, !Ref DatabaseEngine, EngineVersion]
      DBInstanceClass: !Ref DatabaseInstanceClass
      AllocatedStorage: !Ref DatabaseAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DatabaseMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBMasterSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBParameterGroupName: !Ref DBParameterGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      MultiAZ: true
      EnableCloudwatchLogsExports:
        - !If [IsMySQL, 'error', !Ref 'AWS::NoValue']
        - !If [IsMySQL, 'general', !Ref 'AWS::NoValue']
        - !If [IsMySQL, 'slowquery', !Ref 'AWS::NoValue']
        - !If [IsPostgreSQL, 'postgresql', !Ref 'AWS::NoValue']
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # ==================== S3 BUCKET ====================
  S3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-bucket-${AWS::AccountId}-${AWS::Region}'
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
          - Id: ExpireOldVersions
            NoncurrentVersionExpirationInDays: 30
            Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3BucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub '${S3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ==================== VPC FLOW LOGS ====================
  VPCFlowLogRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}*'

  VPCFlowLogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}'
      RetentionInDays: 7

  VPCFlowLog:
    Type: 'AWS::EC2::FlowLog'
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc-flow-log'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

# ==================== OUTPUTS ====================
Outputs:
  # VPC and Networking
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-VPC-ID'
      
  VPCCidrBlock:
    Description: 'VPC CIDR Block'
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-VPC-CIDR'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-IGW-ID'

  NatGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NatGateway1
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-NAT1-ID'

  NatGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NatGateway2
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-NAT2-ID'

  NLBDNSName:
    Description: 'Network Load Balancer DNS name'
    Value: !GetAtt NetworkLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-NLB-DNS'

  NLBHostedZoneId:
    Description: 'Network Load Balancer Hosted Zone ID'
    Value: !GetAtt NetworkLoadBalancer.CanonicalHostedZoneID
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-NLB-HostedZoneID'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-Endpoint'

  DatabasePort:
    Description: 'RDS database port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-Port'

  S3BucketName:
    Description: 'S3 bucket name'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-S3-Bucket'

  EC2KeyPairName:
    Description: 'EC2 Key Pair name'
    Value: !Ref EC2KeyPair
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-KeyPair'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet2-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-PublicSubnet2-ID'

  # Security Groups
  NLBSecurityGroupId:
    Description: 'Network Load Balancer Security Group ID'
    Value: !Ref NLBSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-NLB-SG-ID'

  EC2SecurityGroupId:
    Description: 'EC2 Security Group ID'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-EC2-SG-ID'

  DatabaseSecurityGroupId:
    Description: 'Database Security Group ID'
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-SG-ID'

  # Auto Scaling
  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-ASG-Name'

  LaunchTemplateId:
    Description: 'Launch Template ID'
    Value: !Ref LaunchTemplate
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-LT-ID'

  LaunchTemplateVersion:
    Description: 'Launch Template Latest Version'
    Value: !GetAtt LaunchTemplate.LatestVersionNumber
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-LT-Version'

  # Load Balancer
  NLBTargetGroupArn:
    Description: 'Network Load Balancer Target Group ARN'
    Value: !Ref NLBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-TG-ARN'

  # Database
  DBSubnetGroupName:
    Description: 'Database Subnet Group Name'
    Value: !Ref DBSubnetGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-SubnetGroup'

  DBParameterGroupName:
    Description: 'Database Parameter Group Name'
    Value: !Ref DBParameterGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-ParamGroup'

  DatabaseIdentifier:
    Description: 'Database Instance Identifier'
    Value: !Ref Database
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-ID'

  # IAM Roles
  EC2RoleArn:
    Description: 'EC2 IAM Role ARN'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-EC2-Role-ARN'

  VPCFlowLogRoleArn:
    Description: 'VPC Flow Log IAM Role ARN'
    Value: !GetAtt VPCFlowLogRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-FlowLog-Role-ARN'

  # CloudWatch Logs
  VPCFlowLogGroupName:
    Description: 'VPC Flow Log Group Name'
    Value: !Ref VPCFlowLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-FlowLog-Group'

  VPCFlowLogId:
    Description: 'VPC Flow Log ID'
    Value: !Ref VPCFlowLog
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-FlowLog-ID'

  # S3 Bucket
  S3BucketArn:
    Description: 'S3 Bucket ARN'
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-S3-Bucket-ARN'

  # Secret
  DBSecretArn:
    Description: 'Database Master Secret ARN'
    Value: !Ref DBMasterSecret
    Export:
      Name: !Sub '${AWS::StackName}-${EnvironmentSuffix}-DB-Secret-ARN'
    