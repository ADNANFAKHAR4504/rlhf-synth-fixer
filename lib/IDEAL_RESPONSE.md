```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Deploys a highly available, secure, and scalable Node.js application using Elastic Beanstalk,
  RDS for PostgreSQL, and a custom domain with HTTPS.

Metadata:
  cfn-lint:
    config:
      ignore_checks:
        - W1011 # Suppress warning about DBPasswordParameter - Secrets Manager is the default/recommended option

Parameters:
  DomainName:
    Type: String
    Description: The custom domain name for your application (e.g., myapp.example.com).
    Default: app.tap.us-west-2.meerio.com

  HostedZoneName:
    Type: String
    Description: The Route 53 Hosted Zone name for your domain (e.g., example.com.).
    Default: meerio.com.

  CertificateArn:
    Type: String
    Description: The ARN of the ACM SSL certificate for your domain.
    Default: arn:aws:acm:us-west-2:718240086340:certificate/c43e41ee-5b6c-4d2c-80e9-82c1db57289e

  DBUsername:
    Type: String
    Description: The master username for the RDS database.
    MinLength: '4'
    MaxLength: '16'
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: Must begin with a letter and contain only alphanumeric characters.
    Default: 'myappuser'

  DBPasswordParameter:
    Type: String
    Description: The master password for RDS (NOT RECOMMENDED - use Secrets Manager instead by leaving this empty).
    MinLength: '0'
    MaxLength: '41'
    AllowedPattern: '[a-zA-Z0-9]*'
    ConstraintDescription: Must contain only alphanumeric characters.
    NoEcho: true
    Default: ''

  S3BucketName:
    Type: String
    Description: Name of the S3 bucket for application artifacts (leave empty if not needed).
    Default: ''

  MinSize:
    Description: Minimum number of EC2 instances for the Auto Scaling group.
    Type: Number
    Default: 2
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Description: Maximum number of EC2 instances for the Auto Scaling group.
    Type: Number
    Default: 4
    MinValue: 1
    MaxValue: 20

  SolutionStackName:
    Type: String
    Description: Elastic Beanstalk solution stack name for Node.js.
    Default: '64bit Amazon Linux 2023 v6.2.0 running Node.js 20'

Conditions:
  UseSecretsManagerCondition: !Equals [!Ref DBPasswordParameter, '']
  HasS3Bucket: !Not [!Equals [!Ref S3BucketName, '']]

Mappings:
  # Hosted Zone IDs for Elastic Beanstalk environments in various regions
  EBHostedZoneIds:
    us-east-1:
      'Id': 'Z117KPS5GTRQ2G'
    us-east-2:
      'Id': 'Z14L4L79SAUB5T'
    us-west-1:
      'Id': 'Z1M58G0W56PQJA'
    us-west-2:
      'Id': 'Z38NKT9BP95V3O'
    eu-west-1:
      'Id': 'Z2NYPWQ7DFZAZH'
    eu-west-2:
      'Id': 'Z1BFK442Y2223G'
    eu-west-3:
      'Id': 'Z29O4M5B72C6T7'
    eu-central-1:
      'Id': 'Z1FR84AW7210X3'
    ap-northeast-1:
      'Id': 'Z1R25G3KIG2GBW'
    ap-northeast-2:
      'Id': 'Z3JE5OI70L4Z0Q'
    ap-southeast-1:
      'Id': 'Z16FZ9L249IFLT'
    ap-southeast-2:
      'Id': 'Z2PCDNR3VC2G1N'
    ap-south-1:
      'Id': 'Z18D5FSROUN65A'
    sa-east-1:
      'Id': 'Z10X7K2B4QSOFV'
    ca-central-1:
      'Id': 'ZJFCZL7SSZB5I'

Resources:
  # ------------------------------------------------------------#
  #  VPC and Networking
  # ------------------------------------------------------------#
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnetA'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnetB'

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnetA'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnetB'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  EIPA:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  EIPB:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  NatGatewayA:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPA.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NatGatewayA'

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NatGatewayB'

  PrivateRouteTableA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTableA'

  PrivateRouteA:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableA
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayA

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTableA

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateRouteTableB'

  PrivateRouteB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGatewayB

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  # ------------------------------------------------------------#
  #  Security Groups
  # ------------------------------------------------------------#
  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP and HTTPS traffic to the load balancer
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
          Value: !Sub '${AWS::StackName}-LBSG'

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow traffic from the load balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-AppSG'

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow traffic from the application instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-DBSG'

  # ------------------------------------------------------------#
  #  Secrets Manager (Conditional)
  # ------------------------------------------------------------#
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Condition: UseSecretsManagerCondition
    Properties:
      Description: 'Database password for the application'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludePunctuation: true

  # ------------------------------------------------------------#
  #  IAM Roles
  # ------------------------------------------------------------#
  BeanstalkServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: elasticbeanstalk.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth'
        - 'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService'

  BeanstalkInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${AWS::StackName}-BeanstalkPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogStreams'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/elasticbeanstalk/${AWS::StackName}-Env*/*'
              - !If
                - HasS3Bucket
                - Effect: Allow
                  Action:
                    - 's3:GetObject'
                    - 's3:ListBucket'
                  Resource:
                    - !Sub 'arn:aws:s3:::${S3BucketName}'
                    - !Sub 'arn:aws:s3:::${S3BucketName}/*'
                - !Ref AWS::NoValue
              - !If
                - UseSecretsManagerCondition
                - Effect: Allow
                  Action: 'secretsmanager:GetSecretValue'
                  Resource: !Ref DBSecret
                - !Ref AWS::NoValue
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier'

  BeanstalkInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref BeanstalkInstanceRole

  # ------------------------------------------------------------#
  #  RDS Database
  # ------------------------------------------------------------#
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnets for the RDS instance
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBName: !Sub '${AWS::StackName}DB'
      Engine: postgres
      EngineVersion: '14.12'
      DBInstanceClass: db.t3.medium
      AllocatedStorage: '20'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !If
        - UseSecretsManagerCondition
        - !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
        - !Ref DBPasswordParameter
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: true
      StorageEncrypted: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-RDS'

  # ------------------------------------------------------------#
  #  Elastic Beanstalk
  # ------------------------------------------------------------#
  BeanstalkApplication:
    Type: AWS::ElasticBeanstalk::Application
    Properties:
      ApplicationName: !Sub '${AWS::StackName}-App'
      Description: !Sub 'Node.js application for ${AWS::StackName}'

  BeanstalkEnvironment:
    Type: AWS::ElasticBeanstalk::Environment
    Properties:
      ApplicationName: !Ref BeanstalkApplication
      EnvironmentName: !Sub '${AWS::StackName}-Env'
      SolutionStackName: !Ref SolutionStackName
      OptionSettings:
        # Instance Configuration
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: 'IamInstanceProfile'
          Value: !Ref BeanstalkInstanceProfile
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: 'InstanceType'
          Value: 't3.small'

        # VPC Configuration
        - Namespace: 'aws:ec2:vpc'
          OptionName: 'VPCId'
          Value: !Ref VPC
        - Namespace: 'aws:ec2:vpc'
          OptionName: 'Subnets'
          Value: !Join [',', [!Ref PrivateSubnetA, !Ref PrivateSubnetB]]
        - Namespace: 'aws:ec2:vpc'
          OptionName: 'ELBSubnets'
          Value: !Join [',', [!Ref PublicSubnetA, !Ref PublicSubnetB]]
        - Namespace: 'aws:ec2:vpc'
          OptionName: 'AssociatePublicIpAddress'
          Value: 'false'

        # Load Balancer Configuration
        - Namespace: 'aws:elasticbeanstalk:environment'
          OptionName: 'LoadBalancerType'
          Value: 'application'
        - Namespace: 'aws:elasticbeanstalk:environment'
          OptionName: 'ServiceRole'
          Value: !Ref BeanstalkServiceRole
        - Namespace: 'aws:elbv2:loadbalancer'
          OptionName: 'IdleTimeout'
          Value: '300'
        - Namespace: 'aws:elbv2:loadbalancer'
          OptionName: 'SecurityGroups'
          Value: !Ref LoadBalancerSecurityGroup

        # HTTPS Listener
        - Namespace: 'aws:elbv2:listener:443'
          OptionName: 'Protocol'
          Value: 'HTTPS'
        - Namespace: 'aws:elbv2:listener:443'
          OptionName: 'SSLCertificateArns'
          Value: !Ref CertificateArn

        # HTTP to HTTPS Redirect
        - Namespace: 'aws:elbv2:listener:80'
          OptionName: 'Protocol'
          Value: 'HTTP'
        - Namespace: 'aws:elbv2:listener:80'
          OptionName: 'ListenerEnabled'
          Value: 'true'
        - Namespace: 'aws:elasticbeanstalk:environment:process:default'
          OptionName: 'Protocol'
          Value: 'HTTP'
        - Namespace: 'aws:elasticbeanstalk:environment:process:default'
          OptionName: 'Port'
          Value: '80'

        # Auto Scaling Configuration
        - Namespace: 'aws:autoscaling:asg'
          OptionName: 'MinSize'
          Value: !Ref MinSize
        - Namespace: 'aws:autoscaling:asg'
          OptionName: 'MaxSize'
          Value: !Ref MaxSize
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: 'MeasureName'
          Value: 'CPUUtilization'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: 'Statistic'
          Value: 'Average'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: 'Unit'
          Value: 'Percent'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: 'UpperThreshold'
          Value: '70'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: 'LowerThreshold'
          Value: '30'

        # Health Monitoring
        - Namespace: 'aws:elasticbeanstalk:healthreporting:system'
          OptionName: 'SystemType'
          Value: 'enhanced'
        - Namespace: 'aws:elasticbeanstalk:environment:process:default'
          OptionName: 'HealthCheckPath'
          Value: '/'

        # CloudWatch Logs
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: 'StreamLogs'
          Value: 'true'
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: 'DeleteOnTerminate'
          Value: 'true'
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: 'RetentionInDays'
          Value: '7'

        # Environment Variables
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: 'DB_HOST'
          Value: !GetAtt RDSInstance.Endpoint.Address
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: 'DB_USER'
          Value: !Ref DBUsername
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: 'DB_NAME'
          Value: !Sub '${AWS::StackName}DB'
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: 'DB_PORT'
          Value: !GetAtt RDSInstance.Endpoint.Port
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: 'NODE_ENV'
          Value: 'production'
        - !If
          - UseSecretsManagerCondition
          - Namespace: 'aws:elasticbeanstalk:application:environment'
            OptionName: 'DB_SECRET_ARN'
            Value: !Ref DBSecret
          - Namespace: 'aws:elasticbeanstalk:application:environment'
            OptionName: 'DB_PASSWORD'
            Value: !Ref DBPasswordParameter

  # ------------------------------------------------------------#
  #  DNS
  # ------------------------------------------------------------#
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneName: !Ref HostedZoneName
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        HostedZoneId: !FindInMap [EBHostedZoneIds, !Ref 'AWS::Region', Id]
        DNSName: !GetAtt BeanstalkEnvironment.EndpointURL

Outputs:
  ApplicationURL:
    Description: The URL of the Elastic Beanstalk environment.
    Value: !Sub 'https://${DomainName}'
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationURL'

  ElasticBeanstalkURL:
    Description: The direct Elastic Beanstalk environment URL.
    Value: !GetAtt BeanstalkEnvironment.EndpointURL
    Export:
      Name: !Sub '${AWS::StackName}-EBEndpoint'

  RDSEndpoint:
    Description: The endpoint for the RDS database instance.
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  DBSecretARN:
    Description: The ARN of the database password secret in Secrets Manager (if used).
    Condition: UseSecretsManagerCondition
    Value: !Ref DBSecret
    Export:
      Name: !Sub '${AWS::StackName}-DBSecretARN'

  VPCId:
    Description: The VPC ID for the application stack.
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  PrivateSubnetIds:
    Description: Private subnet IDs for the application.
    Value: !Join [',', [!Ref PrivateSubnetA, !Ref PrivateSubnetB]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'
```
