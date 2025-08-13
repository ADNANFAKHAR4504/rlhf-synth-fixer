Model Provided Response is as below
``` yaml
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'IaC-AWS-Nova-Model-Breaking: Secure multi-tier web application infrastructure with comprehensive security controls'

# ====================================
# PARAMETERS SECTION
# ====================================
Parameters:
  # SSH access CIDR block for EC2 instances
  SSHAccessCIDR:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed to SSH to EC2 instances'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  
  # Database master username
  DBMasterUsername:
    Type: String
    Default: 'admin'
    Description: 'Master username for RDS database'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
  
  # Environment name for resource naming
  EnvironmentName:
    Type: String
    Default: 'IaC-AWS-Nova-Model-Breaking'
    Description: 'Environment name for resource naming'

# ====================================
# RESOURCES SECTION
# ====================================
Resources:
  
  # ====================================
  # 1. VPC AND NETWORK ISOLATION
  # ====================================
  
  # Main VPC with 10.0.0.0/16 CIDR
  MainVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Project
          Value: !Ref EnvironmentName

  # Internet Gateway for public subnet internet access
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'
        - Key: Project
          Value: !Ref EnvironmentName

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref MainVPC

  # Public Subnet in AZ-1 for ALB and NAT Gateway
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'
        - Key: Project
          Value: !Ref EnvironmentName

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
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'
        - Key: Project
          Value: !Ref EnvironmentName

  # Private App Subnet in AZ-1 for EC2 instances
  PrivateAppSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-App-Subnet-AZ1'
        - Key: Project
          Value: !Ref EnvironmentName

  # Private App Subnet in AZ-2 for high availability
  PrivateAppSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-App-Subnet-AZ2'
        - Key: Project
          Value: !Ref EnvironmentName

  # Private Data Subnet in AZ-1 for RDS
  PrivateDataSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.21.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Data-Subnet-AZ1'
        - Key: Project
          Value: !Ref EnvironmentName

  # Private Data Subnet in AZ-2 for RDS high availability
  PrivateDataSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MainVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.22.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Data-Subnet-AZ2'
        - Key: Project
          Value: !Ref EnvironmentName

  # Elastic IP for NAT Gateway 1
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP-1'
        - Key: Project
          Value: !Ref EnvironmentName

  # Elastic IP for NAT Gateway 2
  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP-2'
        - Key: Project
          Value: !Ref EnvironmentName

  # NAT Gateway 1 for private subnet outbound internet access
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway-1'
        - Key: Project
          Value: !Ref EnvironmentName

  # NAT Gateway 2 for high availability
  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway-2'
        - Key: Project
          Value: !Ref EnvironmentName

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'
        - Key: Project
          Value: !Ref EnvironmentName

  # Default public route to Internet Gateway
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Associate public subnets with public route table
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

  # Private Route Table 1 for AZ-1
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ1'
        - Key: Project
          Value: !Ref EnvironmentName

  # Default private route to NAT Gateway 1
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  # Associate private subnets in AZ-1 with private route table 1
  PrivateAppSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateAppSubnet1

  PrivateDataSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateDataSubnet1

  # Private Route Table 2 for AZ-2
  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MainVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes-AZ2'
        - Key: Project
          Value: !Ref EnvironmentName

  # Default private route to NAT Gateway 2
  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  # Associate private subnets in AZ-2 with private route table 2
  PrivateAppSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateAppSubnet2

  PrivateDataSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateDataSubnet2

  # ====================================
  # 2. IAM ROLE FOR TAG-BASED S3 ACCESS
  # ====================================
  
  # S3 bucket for application data
  ApplicationDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-app-data-${AWS::AccountId}-${AWS::Region}'
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
          Value: !Sub '${EnvironmentName}-AppData'
        - Key: Project
          Value: !Ref EnvironmentName

  # IAM Role for EC2 instances with tag-based S3 access
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        # Tag-based S3 access policy - only allows access if EC2 instance has S3Access=Approved tag
        - PolicyName: TagBasedS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${ApplicationDataBucket}/*'
                Condition:
                  StringEquals:
                    'ec2:ResourceTag/S3Access': 'Approved'
        # Secrets Manager access for database credentials
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseCredentials
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Role'
        - Key: Project
          Value: !Ref EnvironmentName

  # Instance Profile for EC2 instances
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-Profile'
      Roles:
        - !Ref EC2InstanceRole

  # ====================================
  # 3. APPLICATION AND DATABASE SECURITY GROUPS
  # ====================================
  
  # Security Group for Application Load Balancer
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-ALB-SG'
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access from internet'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB-SG'
        - Key: Project
          Value: !Ref EnvironmentName

  # Web Security Group for EC2 instances - only allows HTTPS from ALB and SSH from specific CIDR
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Web-SG'
      GroupDescription: 'Security group for web application EC2 instances'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS access from ALB only'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAccessCIDR
          Description: 'SSH access from specified CIDR'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Web-SG'
        - Key: Project
          Value: !Ref EnvironmentName

  # Database Security Group - only allows MySQL access from Web Security Group
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-Database-SG'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref MainVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
          Description: 'MySQL access from web tier only'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Database-SG'
        - Key: Project
          Value: !Ref EnvironmentName

  # ====================================
  # 4. DATA ENCRYPTION IN TRANSIT (SSL/TLS)
  # ====================================
  
  # RDS Parameter Group enforcing SSL/TLS connections
  DatabaseParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      DBParameterGroupName: !Sub '${EnvironmentName}-mysql-ssl-params'
      Description: 'Parameter group enforcing SSL/TLS for MySQL'
      Family: mysql8.0
      Parameters:
        require_secure_transport: 'ON'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-MySQL-SSL-Params'
        - Key: Project
          Value: !Ref EnvironmentName

  # DB Subnet Group for RDS
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub '${EnvironmentName}-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref PrivateDataSubnet1
        - !Ref PrivateDataSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-SubnetGroup'
        - Key: Project
          Value: !Ref EnvironmentName

  # ====================================
  # 8. SECURE CREDENTIAL MANAGEMENT
  # ====================================
  
  # Secrets Manager secret for database credentials
  DatabaseCredentials:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}/database/credentials'
      Description: 'RDS database master credentials'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-DB-Credentials'
        - Key: Project
          Value: !Ref EnvironmentName

  # RDS MySQL Database Instance with SSL enforcement
  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-mysql-db'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      DBParameterGroupName: !Ref DatabaseParameterGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseCredentials}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseCredentials}:SecretString:password}}'
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-MySQL-DB'
        - Key: Project
          Value: !Ref EnvironmentName

  # ====================================
  # 5. AWS WAF INTEGRATION
  # ====================================
  
  # WAFv2 WebACL with OWASP Top 10 protection
  WebApplicationFirewall:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: !Sub '${EnvironmentName}-WebACL'
      Description: 'WAF WebACL for OWASP Top 10 protection'
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      Rules:
        # AWS Managed Common Rule Set
        - Name: AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRuleSetMetric
        # AWS Managed SQL Injection Rule Set
        - Name: AWSManagedRulesSQLiRuleSet
          Priority: 2
          OverrideAction:
            None: {}
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesSQLiRuleSet
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: SQLiRuleSetMetric
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: !Sub '${EnvironmentName}-WebACL'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebACL'
        - Key: Project
          Value: !Ref EnvironmentName

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-ALB'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-ALB'
        - Key: Project
          Value: !Ref EnvironmentName

  # Associate WAF WebACL with ALB
  WebACLAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      ResourceArn: !Ref ApplicationLoadBalancer
      WebACLArn: !GetAtt WebApplicationFirewall.Arn

  # Target Group for ALB
  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-TG'
      Port: 443
      Protocol: HTTPS
      VpcId: !Ref MainVPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTPS
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-TargetGroup'
        - Key: Project
          Value: !Ref EnvironmentName

  # ALB Listener
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ====================================
  # 6. API GATEWAY LOGGING
  # ====================================
  
  # CloudWatch Log Group for API Gateway
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/${EnvironmentName}'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-APIGateway-Logs'
        - Key: Project
          Value: !Ref EnvironmentName

  # IAM Role for API Gateway logging
  APIGatewayLoggingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-APIGateway-Logging-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-APIGateway-Logging-Role'
        - Key: Project
          Value: !Ref EnvironmentName

  # API Gateway Account configuration for logging
  APIGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn: !GetAtt APIGatewayLoggingRole.Arn

  # Sample REST API Gateway
  SampleAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${EnvironmentName}-Sample-API'
      Description: 'Sample REST API with comprehensive logging'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Sample-API'
        - Key: Project
          Value: !Ref EnvironmentName

  # API Gateway Resource
  APIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref SampleAPI
      ParentId: !GetAtt SampleAPI.RootResourceId
      PathPart: 'sample'

  # API Gateway Method
  APIMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref SampleAPI
      ResourceId: !Ref APIResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: '{"message": "Hello from API Gateway"}'
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIMethod
    Properties:
      RestApiId: !Ref SampleAPI
      StageName: prod
      StageDescription:
        AccessLogSetting:
          DestinationArn: !GetAtt APIGatewayLogGroup.Arn
          Format: '$requestId $requestTime $httpMethod $resourcePath $status $responseLength'
        LoggingLevel: INFO
        DataTraceEnabled: true
        MetricsEnabled: true

  # ====================================
  # 7. AUTOMATED SECURITY PATCHING VIA LAMBDA
  # ====================================
  
  # IAM Role for Lambda patching function
  LambdaPatchingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-Lambda-Patching-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SSMPatchingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:SendCommand
                  - ssm:DescribeInstanceInformation
                  - ssm:DescribeCommandInvocations
                  - ec2:DescribeInstances
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Lambda-Patching-Role'
        - Key: Project
          Value: !Ref EnvironmentName

  # Lambda function for automated patching
  PatchingLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-AutoPatch-Function'
      Description: 'Automated security patching for EC2 instances'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaPatchingRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import boto3
          import json
          
          def lambda_handler(event, context):
              ssm = boto3.client('ssm')
              ec2 = boto3.client('ec2')
              
              try:
                  # Get instances with PatchGroup=WebApp tag
                  response = ec2.describe_instances(
                      Filters=[
                          {
                              'Name': 'tag:PatchGroup',
                              'Values': ['WebApp']
                          },
                          {
                              'Name': 'instance-state-name',
                              'Values': ['running']
                          }
                      ]
                  )
                  
                  instance_ids = []
                  for reservation in response['Reservations']:
                      for instance in reservation['Instances']:
                          instance_ids.append(instance['InstanceId'])
                  
                  if not instance_ids:
                      print("No instances found with PatchGroup=WebApp tag")
                      return {
                          'statusCode': 200,
                          'body': json.dumps('No instances found for patching')
                      }
                  
                  # Send patch command
                  command_response = ssm.send_command(
                      InstanceIds=instance_ids,
                      DocumentName='AWS-RunPatchBaseline',
                      Parameters={
                          'Operation': ['Install']
                      }
                  )
                  
                  print(f"Patch command sent to instances: {instance_ids}")
                  print(f"Command ID: {command_response['Command']['CommandId']}")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps(f'Patching initiated for {len(instance_ids)} instances')
                  }
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps(f'Error: {str(e)}')
                  }
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-AutoPatch-Function'
        - Key: Project
          Value: !Ref EnvironmentName
```