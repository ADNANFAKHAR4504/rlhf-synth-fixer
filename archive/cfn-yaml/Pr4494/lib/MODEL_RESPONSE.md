# Model Response

### Reasoning Trace
---


The user is asking for a comprehensive CloudFormation template for deploying a Node.js web application using Elastic Beanstalk. Let me break down the requirements:


1. **Networking**: VPC with 10.0.0.0/16 CIDR, 2+ public subnets in different AZs, Internet Gateway, Route Tables
2. **Security**: Security Groups with HTTP (80) only, parameterized CIDR ranges
3. **Compute**: Elastic Beanstalk for Node.js with auto-scaling (1-4 instances)
4. **Storage**: S3 bucket with parameterized name
5. **Monitoring**: CloudWatch monitoring with CPU utilization alarms
6. **IAM**: Least-privilege IAM roles and instance profiles
7. **Cross-Account**: No hardcoded values, use intrinsic functions
8. **Outputs**: App URL, Environment name, S3 bucket name, Security Group ID
9. **Best Practices**: Proper naming, tagging, descriptions, comments


Let me create a comprehensive CloudFormation template that addresses all these requirements:
### Answer
---


Here's a complete CloudFormation YAML template that meets all your requirements for deploying a scalable Node.js web application:


```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready Node.js web application deployment using Elastic Beanstalk with VPC, Auto-scaling, S3, and CloudWatch monitoring'


# Template Parameters
Parameters:
  ApplicationName:
    Type: String
    Description: 'Name of the Elastic Beanstalk application'
    Default: 'nodejs-web-app'
    MinLength: 1
    MaxLength: 100
    ConstraintDescription: 'Must be between 1 and 100 characters'


  EnvironmentName:
    Type: String
    Description: 'Name of the Elastic Beanstalk environment'
    Default: 'nodejs-web-app-env'
    MinLength: 1
    MaxLength: 40
    ConstraintDescription: 'Must be between 1 and 40 characters'


  SolutionStackName:
    Type: String
    Description: 'Elastic Beanstalk solution stack (Node.js version)'
    Default: '64bit Amazon Linux 2 v5.8.0 running Node.js 18'
    AllowedValues:
      - '64bit Amazon Linux 2 v5.8.0 running Node.js 18'
      - '64bit Amazon Linux 2 v5.7.0 running Node.js 16'
      - '64bit Amazon Linux 2 v5.6.0 running Node.js 14'


  InstanceType:
    Type: String
    Description: 'EC2 instance type for the application'
    Default: 't3.small'
    AllowedValues:
      - 't3.micro'
      - 't3.small'
      - 't3.medium'
      - 't3.large'
      - 'm5.large'
      - 'm5.xlarge'
    ConstraintDescription: 'Must be a valid EC2 instance type'


  S3BucketNamePrefix:
    Type: String
    Description: 'Prefix for the S3 bucket name (will be suffixed with account ID and region)'
    Default: 'nodejs-static-assets'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    MinLength: 3
    MaxLength: 40
    ConstraintDescription: 'Must be lowercase letters, numbers, and hyphens only'


  AllowedIngressCIDR:
    Type: String
    Description: 'CIDR block allowed to access the application (0.0.0.0/0 for public access)'
    Default: '0.0.0.0/0'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid CIDR block'


  MinInstances:
    Type: Number
    Description: 'Minimum number of instances for auto-scaling'
    Default: 1
    MinValue: 1
    MaxValue: 4


  MaxInstances:
    Type: Number
    Description: 'Maximum number of instances for auto-scaling'
    Default: 4
    MinValue: 1
    MaxValue: 10


  CPUAlarmThreshold:
    Type: Number
    Description: 'CPU utilization percentage threshold for CloudWatch alarm'
    Default: 80
    MinValue: 50
    MaxValue: 95


Resources:
  # VPC Configuration
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName


  # Internet Gateway
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'


  VPCGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway


  # Public Subnet 1 (AZ1)
  PublicSubnet1:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select
        - 0
        - !GetAZs
          Ref: 'AWS::Region'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet1'
        - Key: Type
          Value: 'Public'


  # Public Subnet 2 (AZ2)
  PublicSubnet2:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select
        - 1
        - !GetAZs
          Ref: 'AWS::Region'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet2'
        - Key: Type
          Value: 'Public'


  # Route Table for Public Subnets
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicRouteTable'


  PublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: VPCGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway


  # Subnet Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable


  PublicSubnet2RouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable


  # Security Group for Elastic Beanstalk Environment
  ApplicationSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: 'Security group for Node.js Elastic Beanstalk application'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIngressCIDR
          Description: 'Allow HTTP traffic from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ApplicationSG'


  # IAM Role for Elastic Beanstalk Service
  ElasticBeanstalkServiceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-EBServiceRole'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - elasticbeanstalk.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth'
        - 'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EBServiceRole'


  # IAM Role for EC2 Instances
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2InstanceRole'
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
        - 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3Bucket.Arn
                  - !Sub '${S3Bucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2InstanceRole'


  # EC2 Instance Profile
  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2InstanceProfile'
      Roles:
        - !Ref EC2InstanceRole


  # S3 Bucket for Static Assets
  S3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${S3BucketNamePrefix}-${AWS::AccountId}-${AWS::Region}'
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
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-S3Bucket'
        - Key: Environment
          Value: !Ref EnvironmentName


  # Elastic Beanstalk Application
  ElasticBeanstalkApplication:
    Type: 'AWS::ElasticBeanstalk::Application'
    Properties:
      ApplicationName: !Ref ApplicationName
      Description: !Sub 'Node.js web application deployed by ${AWS::StackName}'


  # Elastic Beanstalk Application Version (placeholder)
  ElasticBeanstalkApplicationVersion:
    Type: 'AWS::ElasticBeanstalk::ApplicationVersion'
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      Description: 'Initial application version'
      SourceBundle:
        S3Bucket: !Sub 'elasticbeanstalk-${AWS::Region}-${AWS::AccountId}'
        S3Key: 'nodejs-sample.zip'


  # Elastic Beanstalk Configuration Template
  ElasticBeanstalkConfigurationTemplate:
    Type: 'AWS::ElasticBeanstalk::ConfigurationTemplate'
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      Description: 'Configuration template for Node.js application'
      SolutionStackName: !Ref SolutionStackName
      OptionSettings:
        # Auto Scaling Configuration
        - Namespace: 'aws:autoscaling:asg'
          OptionName: MinSize
          Value: !Ref MinInstances
        - Namespace: 'aws:autoscaling:asg'
          OptionName: MaxSize
          Value: !Ref MaxInstances
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: MeasureName
          Value: CPUUtilization
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: Statistic
          Value: Average
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: Unit
          Value: Percent
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: UpperThreshold
          Value: '80'
        - Namespace: 'aws:autoscaling:trigger'
          OptionName: LowerThreshold
          Value: '20'
        # VPC Configuration
        - Namespace: 'aws:ec2:vpc'
          OptionName: VPCId
          Value: !Ref VPC
        - Namespace: 'aws:ec2:vpc'
          OptionName: Subnets
          Value: !Join
            - ','
            - - !Ref PublicSubnet1
              - !Ref PublicSubnet2
        - Namespace: 'aws:ec2:vpc'
          OptionName: AssociatePublicIpAddress
          Value: 'true'
        # Instance Configuration
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: InstanceType
          Value: !Ref InstanceType
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: IamInstanceProfile
          Value: !Ref EC2InstanceProfile
        - Namespace: 'aws:autoscaling:launchconfiguration'
          OptionName: SecurityGroups
          Value: !Ref ApplicationSecurityGroup
        # Environment Properties
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: NODE_ENV
          Value: 'production'
        - Namespace: 'aws:elasticbeanstalk:application:environment'
          OptionName: S3_BUCKET_NAME
          Value: !Ref S3Bucket
        # Health and Monitoring
        - Namespace: 'aws:elasticbeanstalk:environment'
          OptionName: ServiceRole
          Value: !Ref ElasticBeanstalkServiceRole
        - Namespace: 'aws:elasticbeanstalk:healthreporting:system'
          OptionName: SystemType
          Value: 'enhanced'
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: StreamLogs
          Value: 'true'
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: DeleteOnTerminate
          Value: 'false'
        - Namespace: 'aws:elasticbeanstalk:cloudwatch:logs'
          OptionName: RetentionInDays
          Value: '7'


  # Elastic Beanstalk Environment
  ElasticBeanstalkEnvironment:
    Type: 'AWS::ElasticBeanstalk::Environment'
    Properties:
      ApplicationName: !Ref ElasticBeanstalkApplication
      EnvironmentName: !Ref EnvironmentName
      Description: !Sub 'Node.js web application environment for ${AWS::StackName}'
      TemplateName: !Ref ElasticBeanstalkConfigurationTemplate
      VersionLabel: !Ref ElasticBeanstalkApplicationVersion
      Tier:
        Name: WebServer
        Type: Standard
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Application
          Value: !Ref ApplicationName


  # CloudWatch CPU Alarm
  HighCPUAlarm:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub '${AWS::StackName}-HighCPU'
      AlarmDescription: !Sub 'Triggers when CPU utilization exceeds ${CPUAlarmThreshold}%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: !Ref CPUAlarmThreshold
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: EnvironmentName
          Value: !Ref ElasticBeanstalkEnvironment
      TreatMissingData: notBreaching


# Template Outputs
Outputs:
  ApplicationURL:
    Description: 'URL of the Elastic Beanstalk application'
    Value: !Sub 'http://${ElasticBeanstalkEnvironment.EndpointURL}'
    Export:
      Name: !Sub '${AWS::StackName}-ApplicationURL'


  EnvironmentName:
    Description: 'Name of the Elastic Beanstalk environment'
    Value: !Ref ElasticBeanstalkEnvironment
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentName'


  S3BucketName:
    Description: 'Name of the S3 bucket for static assets'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'


  SecurityGroupId:
    Description: 'ID of the application security group'
    Value: !Ref ApplicationSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'


  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'
```


## Template Overview


This CloudFormation template creates a complete infrastructure for deploying a Node.js web application with the following components:


### Key Features:


1. **Networking**:
   - Custom VPC with 10.0.0.0/16 CIDR block
   - Two public subnets in different availability zones
   - Internet Gateway and routing configured for public access


2. **Security**:
   - Security group allowing only HTTP traffic on port 80
   - Parameterized CIDR ranges for flexible access control
   - IAM roles with least-privilege access


3. **Application Deployment**:
   - Elastic Beanstalk application and environment
   - Auto-scaling configured (1-4 instances)
   - Enhanced health monitoring enabled


4. **Storage**:
   - S3 bucket with server-side encryption
   - Versioning enabled for asset management
   - Public access blocked by default


5. **Monitoring**:
   - CloudWatch logs enabled for the application
   - CPU utilization alarm configured
   - Enhanced health reporting


6. **Cross-Account Compatibility**:
   - No hardcoded values
   - Uses intrinsic functions throughout
   - Region-agnostic design


### Deployment Instructions:


1. **AWS Console**:
   ```
   1. Navigate to CloudFormation
   2. Click "Create Stack"
   3. Upload the template
   4. Fill in parameters
   5. Review and create
   ```


2. **AWS CLI**:
   ```bash
   aws cloudformation create-stack \
     --stack-name nodejs-app-stack \
     --template-body file://template.yaml \
     --parameters ParameterKey=ApplicationName,ParameterValue=my-nodejs-app \
     --capabilities CAPABILITY_NAMED_IAM
   ```


### Post-Deployment:


After deployment, you'll need to:
1. Upload your Node.js application code to Elastic Beanstalk
2. Configure any additional environment variables
3. Set up your domain name (if required)
4. Configure SSL/TLS (recommended for production)


The template provides a solid foundation that can handle approximately 4,000 daily users with room for scaling based on actual traffic patterns.
