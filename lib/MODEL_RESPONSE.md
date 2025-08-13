Model Provided Response is as below
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  IaC-AWS-Nova-Model-Breaking: Security-first multi-tier web application infrastructure
  for deployment in us-west-2. This template includes comprehensive security controls
  covering network isolation, IAM, encryption, WAF, logging, automated patching,
  credential management, auditing, monitoring, and MFA enforcement.

# ============================================================================
# PARAMETERS
# ============================================================================
# Parameters section for customizable values
Parameters:
  # CIDR block for SSH access to web servers
  SSHAccessCIDR:
    Type: String
    Description: 'The IPv4 CIDR block allowed for SSH access to the web-tier EC2 instances. Please restrict this to your IP.'
    Default: '0.0.0.0/0' # WARNING: Not secure for production. Change to a specific IP.
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid IP CIDR range (e.g., 192.168.1.0/24).'

  # Database master username
  DBMasterUsername:
    Type: String
    Default: 'dbadmin'
    Description: 'Master username for the RDS database. Stored in AWS Secrets Manager.'
    NoEcho: true
    MinLength: 4
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters.'

  # Project name for consistent resource naming
  ProjectName:
    Type: String
    Default: 'IaC-AWS-Nova-Model-Breaking'
    Description: 'A unique project name used for resource naming and tagging.'

  # Email address for security alarm notifications
  OperatorEmail:
    Type: String
    Description: 'Email address to receive security alarm notifications from the SNS topic.'
    AllowedPattern: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    ConstraintDescription: 'Must be a valid email address.'

# ============================================================================
# METADATA
# ============================================================================
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Network Configuration'
        Parameters:
          - ProjectName
          - SSHAccessCIDR
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBMasterUsername
      - Label:
          default: 'Monitoring & Notifications'
        Parameters:
          - OperatorEmail
    ParameterLabels:
      ProjectName:
        default: 'Project Name'
      SSHAccessCIDR:
        default: 'SSH Access CIDR'
      DBMasterUsername:
        default: 'Database Admin Username'
      OperatorEmail:
        default: 'Operator Email for Alarms'

# ============================================================================
# RESOURCES
# ============================================================================
Resources:

  # ============================================================================
  # 1. VPC AND NETWORK ISOLATION
  # ============================================================================

  # Main VPC with a /16 CIDR block for network isolation
  MainVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'

  # Internet Gateway to allow communication between the VPC and the internet
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'

  # Attach the Internet Gateway to the VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MainVPC

  # Public Subnet in AZ-1 for internet-facing resources like the ALB and NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1'

  # Public Subnet in AZ-2 for high availability
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2'

  # Private App Subnet in AZ-1 for application EC2 instances
  PrivateAppSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-App-Subnet-AZ1'

  # Private App Subnet in AZ-2 for high availability
  PrivateAppSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-App-Subnet-AZ2'

  # Private Data Subnet in AZ-1 for the RDS database
  PrivateDataSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.21.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Data-Subnet-AZ1'

  # Private Data Subnet in AZ-2 for high availability
  PrivateDataSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.22.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Data-Subnet-AZ2'

  # Elastic IP for NAT Gateway in AZ-1
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  # Elastic IP for NAT Gateway in AZ-2
  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  # NAT Gateway in Public Subnet 1 to allow outbound internet from private subnets
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-GW-AZ1'

  # NAT Gateway in Public Subnet 2 for redundancy
  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-GW-AZ2'

  # Route table for public subnets to route traffic to the Internet Gateway
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes'

  # Default public route to the Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate public subnet 1 with the public route table
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Associate public subnet 2 with the public route table
  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # Route table for private subnets in AZ-1 to route traffic to NAT Gateway 1
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ1'

  # Default private route in AZ-1 to NAT Gateway 1
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  # Associate private app subnet 1 with its route table
  PrivateAppSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateAppSubnet1

  # Associate private data subnet 1 with its route table
  PrivateDataSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateDataSubnet1

  # Route table for private subnets in AZ-2 to route traffic to NAT Gateway 2
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ2'

  # Default private route in AZ-2 to NAT Gateway 2
  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  # Associate private app subnet 2 with its route table
  PrivateAppSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateAppSubnet2

  # Associate private data subnet 2 with its route table
  PrivateDataSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateDataSubnet2

  # ============================================================================
  # 2. IAM ROLE FOR TAG-BASED S3 ACCESS & 8. SECURE CREDENTIAL MANAGEMENT
  # ============================================================================

  # S3 bucket for application data, encrypted and non-public
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-data-${ProjectName}-${AWS::AccountId}-${AWS::Region}'
      AccessControl: Private
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
        - Key: Project
          Value: !Ref ProjectName

  # IAM Role for EC2 instances to grant necessary permissions
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Instance-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Required for Systems Manager to manage the instance (e.g., for patching)
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        # Policy for tag-based access to the S3 bucket
        - PolicyName: S3TagBasedAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${ApplicationDataBucket}/*'
                Condition:
                  StringEquals:
                    'ec2:ResourceTag/S3Access': 'Approved'
        # Policy to allow retrieving the database password from Secrets Manager
        - PolicyName: SecretsManagerReadAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret

  # Instance profile to attach the role to EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2-Instance-Profile'
      Roles:
        - !Ref EC2InstanceRole

  # ============================================================================
  # 3. APPLICATION AND DATABASE SECURITY GROUPS
  # ============================================================================

  # Security group for the Application Load Balancer
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-ALB-SG'
      GroupDescription: 'Allow HTTP/HTTPS traffic to the ALB'
      VpcId: !Ref MainVPC
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
          Value: !Sub '${ProjectName}-ALB-SG'

  # Security group for the web application EC2 instances
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-Web-SG'
      GroupDescription: 'Allow HTTPS from ALB and SSH from specified CIDR'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        # Rule to allow inbound HTTPS traffic only from the ALB
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        # Rule to allow inbound SSH traffic only from the specified CIDR block
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAccessCIDR
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Web-SG'

  # Security group for the RDS database instance
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-DB-SG'
      GroupDescription: 'Allow DB traffic only from the Web Security Group'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        # Rule to allow inbound traffic on the MySQL port only from the web servers
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-DB-SG'

  # ============================================================================
  # 4. DATA ENCRYPTION IN TRANSIT (SSL/TLS) & 8. SECURE CREDENTIAL MANAGEMENT
  # ============================================================================

  # Secret in AWS Secrets Manager to store and auto-generate the database password
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}/rds/credentials'
      Description: 'RDS database credentials for the project.'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # RDS Parameter Group to enforce SSL/TLS connections
  DatabaseParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: 'Parameter group to enforce SSL connections'
      Family: mysql8.0
      Parameters:
        require_secure_transport: 'ON'
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # RDS Subnet Group to place the database in the private data subnets
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS instance'
      SubnetIds:
        - !Ref PrivateDataSubnet1
        - !Ref PrivateDataSubnet2
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # RDS MySQL instance with encryption at rest and in transit enforced
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-mysql-db'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      # Enforce Encryption at Rest
      StorageEncrypted: true
      DBParameterGroupName: !Ref DatabaseParameterGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      # Retrieve credentials securely from Secrets Manager
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      MultiAZ: false # Set to true for production HA
      PubliclyAccessible: false
      DeletionProtection: false # Set to true for production
      BackupRetentionPeriod: 7
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # 5. AWS WAF INTEGRATION
  # ============================================================================

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # ALB Target Group
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${ProjectName}-TG'
      VpcId: !Ref MainVPC
      Port: 443 # Target EC2 instances on HTTPS
      Protocol: HTTPS
      HealthCheckProtocol: HTTPS
      HealthCheckPath: /
      Matcher:
        HttpCode: 200,403 # A 403 response from a default web server is also healthy
      TargetType: instance
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # ALB Listener - Redirects HTTP to a fixed response; a real setup would have an HTTPS listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Protocol: HTTP
      Port: 80
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            ContentType: text/plain
            MessageBody: 'Cannot connect via HTTP. Please use HTTPS.'
            StatusCode: '403'
    # NOTE: A production listener for HTTPS on port 443 would be added here.
    # It requires a certificate ARN from ACM, which is outside the scope of this template.
    # Example:
    # ALBListenerHTTPS:
    #   Type: AWS::ElasticLoadBalancingV2::Listener
    #   Properties:
    #     LoadBalancerArn: !Ref ApplicationLoadBalancer
    #     Protocol: HTTPS
    #     Port: 443
    #     Certificates:
    #       - CertificateArn: 'arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/CERTIFICATE_ID'
    #     DefaultActions:
    #       - Type: forward
    #         TargetGroupArn: !Ref ALBTargetGroup

  # AWS WAFv2 WebACL with AWS Managed Rules for OWASP Top 10 threats
  WebApplicationFirewall:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${ProjectName}-WebACL'
      Description: 'WAF WebACL to protect the ALB from common web exploits'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${ProjectName}-WAF-Metric'
      Rules:
        - Name: AWS-Managed-Common-Rule-Set
          Priority: 1
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: WAF-Common-Rule-Metric
        - Name: AWS-Managed-SQLi-Rule-Set
          Priority: 2
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: WAF-SQLi-Rule-Metric
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # Associate the WAF WebACL with the Application Load Balancer
  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebApplicationFirewall.Arn

  # ============================================================================
  # 6. API GATEWAY LOGGING
  # ============================================================================

  # CloudWatch Log Group for API Gateway access and execution logs
  ApiGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/api-gateway/${ProjectName}'
      RetentionInDays: 14

  # IAM Role for API Gateway to write logs to CloudWatch
  ApiGatewayCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'

  # API Gateway Account settings to associate the logging role
  ApiGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt ApiGatewayCloudWatchRole.Arn

  # Sample REST API Gateway
  SampleRestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-SampleAPI'
      Description: 'Sample API with comprehensive logging enabled'
      EndpointConfiguration:
        Types:
          - REGIONAL

  # Sample API Method
  ApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SampleRestApi
      ResourceId: !GetAtt SampleRestApi.RootResourceId
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK

  # API Gateway Deployment to make the API callable
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiMethod
    Properties:
      RestApiId: !Ref SampleRestApi

  # API Gateway Stage with logging fully configured
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: 'prod'
      RestApiId: !Ref SampleRestApi
      DeploymentId: !Ref ApiDeployment
      # Enable full request/response logging
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      # Configure access logging format and destination
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayLogGroup.Arn
        Format: >-
          {
          "requestId": "$context.requestId",
          "ip": "$context.identity.sourceIp",
          "caller": "$context.identity.caller",
          "user": "$context.identity.user",
          "requestTime": "$context.requestTime",
          "httpMethod": "$context.httpMethod",
          "resourcePath": "$context.resourcePath",
          "status": "$context.status",
          "protocol": "$context.protocol",
          "responseLength": "$context.responseLength"
          }

  # ============================================================================
  # 7. AUTOMATED SECURITY PATCHING VIA LAMBDA
  # ============================================================================

  # IAM Role for the Lambda patch-automation function
  LambdaPatchingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        # Basic Lambda execution permissions (for logging)
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: SSMSendCommandPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:DescribeInstances
                  - ssm:SendCommand
                Resource: '*' # Scoped to all resources for simplicity; can be restricted

  # Lambda function to trigger SSM Patch Manager
  AutomatedPatchingFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-Auto-Patcher'
      Description: 'Triggers SSM Run Command to patch EC2 instances tagged for patching.'
      Handler: 'index.lambda_handler'
      Role: !GetAtt LambdaPatchingRole.Arn
      Runtime: python3.9
      Timeout: 120
      Code:
        ZipFile: |
          import boto3
          import logging
          import os

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)
          ssm_client = boto3.client('ssm')

          def lambda_handler(event, context):
              tag_key = 'PatchGroup'
              tag_value = 'WebApp'
              document_name = 'AWS-RunPatchBaseline'

              try:
                  logger.info(f"Searching for running instances with tag '{tag_key}:{tag_value}'")
                  # Using resourcegroupstaggingapi is more efficient than describe_instances
                  paginator = boto3.client('resourcegroupstaggingapi').get_paginator('get_resources')
                  pages = paginator.paginate(
                      TagFilters=[{'Key': tag_key, 'Values': [tag_value]}],
                      ResourceTypeFilters=['ec2:instance']
                  )

                  instance_ids = []
                  for page in pages:
                      for resource in page['ResourceTagMappingList']:
                          instance_ids.append(resource['ResourceARN'].split('/')[-1])
                  
                  if not instance_ids:
                      logger.info("No instances found with the specified patch tag. Exiting.")
                      return {'statusCode': 200, 'body': 'No instances to patch.'}

                  logger.info(f"Found {len(instance_ids)} instance(s): {', '.join(instance_ids)}")
                  
                  response = ssm_client.send_command(
                      InstanceIds=instance_ids,
                      DocumentName=document_name,
                      Parameters={'Operation': ['Install']},
                      Comment=f'Automated patching triggered by Lambda function {context.function_name}'
                  )
                  command_id = response['Command']['CommandId']
                  logger.info(f"Successfully sent command {command_id} to {len(instance_ids)} instance(s).")
                  
                  return {'statusCode': 200, 'body': f"Patch command {command_id} sent."}

              except Exception as e:
                  logger.error(f"An error occurred: {str(e)}")
                  raise e

  # EventBridge (CloudWatch Events) Rule to trigger the Lambda weekly
  PatchingEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${ProjectName}-Weekly-Patch-Schedule'
      Description: 'Triggers the auto-patching Lambda function every Sunday at 2 AM UTC.'
      # cron(Minutes Hours Day-of-month Month Day-of-week Year)
      ScheduleExpression: 'cron(0 2 ? * SUN *)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt AutomatedPatchingFunction.Arn
          Id: 'AutoPatchingLambdaTarget'

  # Permission for EventBridge to invoke the Lambda function
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt AutomatedPatchingFunction.Arn
      Action: 'lambda:InvokeFunction'
      Principal: 'events.amazonaws.com'
      SourceArn: !GetAtt PatchingEventRule.Arn

  # ============================================================================
  # 9. COMPREHENSIVE AUDITING WITH CLOUDTRAIL
  # ============================================================================

  # S3 bucket to store CloudTrail logs securely
  CloudTrailLogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cloudtrail-logs-${ProjectName}-${AWS::AccountId}-${AWS::Region}'
      AccessControl: Private
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  # S3 Bucket Policy to allow CloudTrail service to write logs
  CloudTrailLogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailLogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogBucket.Arn
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal:
              Service: 'cloudtrail.amazonaws.com'
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # CloudWatch Log Group for the CloudTrail trail
  CloudTrailLogGroupForTrail:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-Trail'
      RetentionInDays: 365

  # IAM Role for CloudTrail to send logs to CloudWatch Logs
  CloudTrailToCloudWatchRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailToCloudWatchPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudTrailLogGroupForTrail.Arn

  # Organization-wide, multi-region CloudTrail trail for comprehensive auditing
  AuditTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailLogBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-Audit-Trail'
      S3BucketName: !Ref CloudTrailLogBucket
      IsLogging: true
      # Enable for all regions
      IsMultiRegionTrail: true
      # Include management events from all services
      IncludeGlobalServiceEvents: true
      # Send logs to CloudWatch Logs for real-time analysis
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroupForTrail.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailToCloudWatchRole.Arn
      # Enable log file validation to ensure integrity
      EnableLogFileValidation: true
      # Log S3 and Lambda data events for deeper visibility
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub 'arn:aws:s3:::'
            - Type: 'AWS::Lambda::Function'
              Values:
                - 'arn:aws:lambda'
      Tags:
        - Key: Project
          Value: !Ref ProjectName

  # ============================================================================
  # 10. REAL-TIME MONITORING AND ALARMS
  # ============================================================================

  # SNS Topic for sending alarm notifications
  SecurityAlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: !Sub '${ProjectName} Security Alarms'
      TopicName: !Sub '${ProjectName}-Security-Alarms'
      Subscription:
        - Endpoint: !Ref OperatorEmail
          Protocol: email

  # CloudWatch Metric Filter to parse CloudTrail logs for unauthorized API calls
  AccessDeniedMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref CloudTrailLogGroupForTrail
      FilterPattern: '{ ($.errorCode = "*AccessDenied*") || ($.errorMessage = "Access Denied") || ($.errorCode = "UnauthorizedOperation") }'
      MetricTransformations:
        - MetricName: 'AccessDeniedCount'
          MetricNamespace: 'CloudTrailMetrics'
          MetricValue: '1'
          DefaultValue: 0

  # CloudWatch Alarm that triggers when too many unauthorized calls are detected
  AccessDeniedAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-Unauthorized-API-Calls-Alarm'
      AlarmDescription: 'Alarm triggers if 3 or more unauthorized API calls are detected in 5 minutes.'
      Namespace: 'CloudTrailMetrics'
      MetricName: 'AccessDeniedCount'
      Statistic: Sum
      Period: 300 # 5 minutes
      EvaluationPeriods: 1
      Threshold: 3
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref SecurityAlarmTopic
      TreatMissingData: notBreaching

  # ============================================================================
  # 11. ENFORCE MULTI-FACTOR AUTHENTICATION (MFA)
  # ============================================================================

  # Customer-managed IAM policy that denies actions if MFA is not present
  EnforceMFAPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub '${ProjectName}-Enforce-MFA-Policy'
      Description: 'Denies all actions if the principal is not authenticated with MFA.'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyAllIfNotMFA
            Effect: Deny
            Action: '*'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # IAM Group for users who must use MFA
  MFAEnforcedUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: 'MFA-Enforced-Users'
      ManagedPolicyArns:
        - !Ref EnforceMFAPolicy

# ============================================================================
# DUMMY WEB SERVER RESOURCES FOR DEMONSTRATION
# ============================================================================

  # Launch Template for the web servers
  AppLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-App-Launch-Template'
      LaunchTemplateData:
        ImageId: 'ami-09afc2a792c81ce2c' # Amazon Linux 2 AMI for us-west-2
        InstanceType: t2.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebSecurityGroup
        # Tagging is critical for our policies and automation
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${ProjectName}-WebApp-Instance'
              - Key: Project
                Value: !Ref ProjectName
              # Tag for the automated patching Lambda function
              - Key: PatchGroup
                Value: 'WebApp'
              # Tag for the tag-based S3 access policy
              - Key: S3Access
                Value: 'Approved'

  # Auto Scaling Group for the web servers
  AppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${ProjectName}-ASG'
      MinSize: '2'
      MaxSize: '4'
      DesiredCapacity: '2'
      VPCZoneIdentifier:
        - !Ref PrivateAppSubnet1
        - !Ref PrivateAppSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref AppLaunchTemplate
        Version: !GetAtt AppLaunchTemplate.LatestVersionNumber
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-WebApp-Instance'
          PropagateAtLaunch: true

# ============================================================================
# OUTPUTS
# ============================================================================
Outputs:
  VPCId:
    Description: 'ID of the newly created VPC'
    Value: !Ref MainVPC
  ALBDNSName:
    Description: 'DNS name of the Application Load Balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
  ApplicationDataBucketName:
    Description: 'Name of the S3 bucket for application data'
    Value: !Ref ApplicationDataBucket
  CloudTrailLogBucketName:
    Description: 'Name of the S3 bucket for CloudTrail logs'
    Value: !Ref CloudTrailLogBucket
  DatabaseEndpoint:
    Description: 'Endpoint address of the RDS database instance'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
  DatabaseSecretARN:
    Description: 'ARN of the Secrets Manager secret for DB credentials'
    Value: !Ref DatabaseSecret
  SecurityAlarmTopicARN:
    Description: 'ARN of the SNS topic for security alarms'
    Value: !Ref SecurityAlarmTopic
  MFAEnforcedGroupName:
    Description: 'Name of the IAM Group where MFA is enforced'
    Value: !Ref MFAEnforcedUsersGroup
```