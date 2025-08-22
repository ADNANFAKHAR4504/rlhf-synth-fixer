```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Highly available and secure Node.js web application stack with VPC, Elastic Beanstalk, RDS PostgreSQL, and Route 53'

Parameters:
  DomainName:
    Type: String
    Description: 'Domain name for the application (e.g., myapp.example.com)'
    AllowedPattern: '^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid domain name'

  CertificateArn:
    Type: String
    Description: 'ARN of the ACM SSL certificate for HTTPS'
    AllowedPattern: '^arn:aws:acm:[a-z0-9-]+:[0-9]{12}:certificate\/[a-f0-9-]+$'
    ConstraintDescription: 'Must be a valid ACM certificate ARN'

  DBUsername:
    Type: String
    Description: 'Master username for the RDS PostgreSQL database'
    Default: 'dbadmin'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters'

  DBPassword:
    Type: String
    Description: 'Master password for the RDS PostgreSQL database'
    MinLength: 8
    MaxLength: 41
    NoEcho: true
    AllowedPattern: '^[a-zA-Z0-9!@#$%^&*()_+=-]+$'
    ConstraintDescription: 'Must be 8-41 characters and contain only alphanumeric and special characters'

  S3BucketName:
    Type: String
    Description: 'Name of the S3 bucket that the application can read from'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must be a valid S3 bucket name'

  ApplicationName:
    Type: String
    Description: 'Name of the Elastic Beanstalk application'
    Default: 'nodejs-webapp'
    MinLength: 1
    MaxLength: 100

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

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
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-AZ1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP-AZ2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Routes'

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
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
          Value: !Sub '${AWS::StackName}-Private-Routes-AZ2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB-SG'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebServer-SG'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-Database-SG'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'PostgreSQL from web servers'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database-SG'

  # IAM Role for Elastic Beanstalk
  ElasticBeanstalkServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: ''
            Effect: Allow
            Principal:
              Service: elasticbeanstalk.amazonaws.com
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': elasticbeanstalk
      Path: /
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy

  ElasticBeanstalkInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Path: /
      Policies:
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/elasticbeanstalk/*'
        - PolicyName: S3BucketReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub 'arn:aws:s3:::${S3BucketName}'
                  - !Sub 'arn:aws:s3:::${S3BucketName}/*'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker
        - arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier

  ElasticBeanstalkInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref ElasticBeanstalkInstanceRole

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-db-subnet-group'

  # RDS PostgreSQL Database
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-postgres-db'
      DBName: 'webapp'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'postgres'
      EngineVersion: '14.9'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: 20
      StorageType: 'gp2'
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
          Value: !Sub '${AWS::StackName}-postgres-db'

  # Elastic Beanstalk Application
  ElasticBeanstalkApplication:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: !Ref ApplicationName
      Description: 'Node.js web application'

  # Elastic Beanstalk Environment
  ElasticBeanstalkEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      EnvironmentName: !Sub '${ApplicationName}-prod'
      Description: 'Production environment for Node.js application'
      SolutionStackName: '64bit Amazon Linux 2 v5.8.4 running Node.js 18'
      OptionSettings:
        # VPC Configuration
        - Namespace: aws:ec2:vpc
          OptionName: VPCId
          Value: !Ref VPC
        - Namespace: aws:ec2:vpc
          OptionName: Subnets
          Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
        - Namespace: aws:ec2:vpc
          OptionName: ELBSubnets
          Value: !Sub '${PublicSubnet1},${PublicSubnet2}'
        - Namespace: aws:ec2:vpc
          OptionName: ELBScheme
          Value: public
        - Namespace: aws:ec2:vpc
          OptionName: AssociatePublicIpAddress
          Value: false

        # Load Balancer Configuration
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: EnvironmentType
          Value: LoadBalanced
        - Namespace: aws:elasticbeanstalk:environment
          OptionName: LoadBalancerType
          Value: application
        - Namespace: aws:elbv2:loadbalancer
          OptionName: SecurityGroups
          Value: !Ref ALBSecurityGroup
        - Namespace: aws:elbv2:loadbalancer
          OptionName: ManagedSecurityGroup
          Value: !Ref ALBSecurityGroup

        # HTTPS Configuration
        - Namespace: aws:elbv2:listener:443
          OptionName: Protocol
          Value: HTTPS
        - Namespace: aws:elbv2:listener:443
          OptionName: SSLCertificateArns
          Value: !Ref CertificateArn
        - Namespace: aws:elbv2:listener:80
          OptionName: Protocol
          Value: HTTP
        - Namespace: aws:elbv2:listener:80
          OptionName: Rules
          Value: 'default'

        # Auto Scaling Configuration
        - Namespace: aws:autoscaling:asg
          OptionName: MinSize
          Value: 2
        - Namespace: aws:autoscaling:asg
          OptionName: MaxSize
          Value: 6
        - Namespace: aws:autoscaling:trigger
          OptionName: MeasureName
          Value: CPUUtilization
        - Namespace: aws:autoscaling:trigger
          OptionName: Statistic
          Value: Average
        - Namespace: aws:autoscaling:trigger
          OptionName: Unit
          Value: Percent
        - Namespace: aws:autoscaling:trigger
          OptionName: UpperThreshold
          Value: 70
        - Namespace: aws:autoscaling:trigger
          OptionName: LowerThreshold
          Value: 20

        # Instance Configuration
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: InstanceType
          Value: t3.small
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: IamInstanceProfile
          Value: !Ref ElasticBeanstalkInstanceProfile
        - Namespace: aws:autoscaling:launchconfiguration
          OptionName: SecurityGroups
          Value: !Ref WebServerSecurityGroup

        # Health Check Configuration
        - Namespace: aws:elasticbeanstalk:healthreporting:system
          OptionName: SystemType
          Value: enhanced
        - Namespace: aws:elasticbeanstalk:healthreporting:system
          OptionName: HealthCheckSuccessThreshold
          Value: Ok
        - Namespace: aws:elbv2:healthcheck
          OptionName: HealthCheckPath
          Value: /health
        - Namespace: aws:elbv2:healthcheck
          OptionName: HealthyThresholdCount
          Value: 2
        - Namespace: aws:elbv2:healthcheck
          OptionName: UnhealthyThresholdCount
          Value: 5
        - Namespace: aws:elbv2:healthcheck
          OptionName: Timeout
          Value: 5
        - Namespace: aws:elbv2:healthcheck
          OptionName: Interval
          Value: 30

        # CloudWatch Logs Configuration
        - Namespace: aws:elasticbeanstalk:cloudwatch:logs
          OptionName: StreamLogs
          Value: true
        - Namespace: aws:elasticbeanstalk:cloudwatch:logs
          OptionName: DeleteOnTerminate
          Value: false
        - Namespace: aws:elasticbeanstalk:cloudwatch:logs
          OptionName: RetentionInDays
          Value: 7

        # Environment Variables
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: NODE_ENV
          Value: production
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: DB_HOST
          Value: !GetAtt Database.Endpoint.Address
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: DB_PORT
          Value: !GetAtt Database.Endpoint.Port
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: DB_NAME
          Value: webapp
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: DB_USER
          Value: !Ref DBUsername
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: DB_PASSWORD
          Value: !Ref DBPassword
        - Namespace: aws:elasticbeanstalk:application:environment
          OptionName: S3_BUCKET
          Value: !Ref S3BucketName

      ServiceRole: !Ref ElasticBeanstalkServiceRole

  # Route 53 DNS Configuration
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Sub '${DomainName}.'
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt ElasticBeanstalkEnvironment.EndpointURL
        HostedZoneId: !GetAtt ElasticBeanstalkEnvironment.LoadBalancerHostedZoneId
        EvaluateTargetHealth: true

Outputs:
  ApplicationURL:
    Description: 'URL of the deployed application'
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationURL'

  RDSEndpoint:
    Description: 'RDS PostgreSQL database endpoint'
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ElasticBeanstalkEnvironmentURL:
    Description: 'Elastic Beanstalk environment URL'
    Value: !GetAtt ElasticBeanstalkEnvironment.EndpointURL
    Export:
      Name: !Sub '${AWS::StackName}-EB-URL'

  DatabasePort:
    Description: 'RDS PostgreSQL database port'
    Value: !GetAtt Database.Endpoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-DatabasePort'
```
