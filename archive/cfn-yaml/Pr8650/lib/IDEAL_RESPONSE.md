# Secure Web Application Infrastructure - CloudFormation Template

This CloudFormation YAML template creates a secure, resilient, and compliant web application infrastructure that meets all the specified requirements for AWS security best practices and operational compliance.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure, resilient, and compliant web application infrastructure with VPC, Lambda, S3, and comprehensive security controls'

Parameters:
  ProjectName:
    Type: String
    Default: 'SecureWebApp'
    Description: 'Name of the project for resource tagging'

  Environment:
    Type: String
    Default: 'Dev'
    AllowedValues: ['Dev', 'Test', 'Prod']
    Description: 'Environment type for resource tagging'

  Owner:
    Type: String
    Default: 'DevOps-Team'
    Description: 'Owner of the resources for tagging'

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnetAZ1:
      CIDR: '10.0.1.0/24'
    PublicSubnetAZ2:
      CIDR: '10.0.2.0/24'
    PrivateSubnetAZ1:
      CIDR: '10.0.11.0/24'
    PrivateSubnetAZ2:
      CIDR: '10.0.12.0/24'

Resources:
  # =====================================================
  # VPC Infrastructure
  # =====================================================

  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-IGW'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref SecureVPC

  # Public Subnets
  PublicSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Subnet-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PublicSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetAZ2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Subnet-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Private Subnets
  PrivateSubnetAZ1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ1, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Subnet-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnetAZ2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetAZ2, CIDR]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Subnet-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-EIP-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-EIP-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnetAZ1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-Gateway-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnetAZ2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NAT-Gateway-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Public-Routes'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

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
      SubnetId: !Ref PublicSubnetAZ1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnetAZ2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Routes-AZ1'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

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
      SubnetId: !Ref PrivateSubnetAZ1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Private-Routes-AZ2'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

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
      SubnetId: !Ref PrivateSubnetAZ2

  # =====================================================
  # Security Groups
  # =====================================================

  WebApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-WebApp-SG'
      GroupDescription: 'Security group for web application with HTTP/HTTPS access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP traffic from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS traffic from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-WebApp-SG'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-Lambda-SG'
      GroupDescription: 'Security group for Lambda functions in private subnets'
      VpcId: !Ref SecureVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTPS outbound for AWS API calls'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'Allow HTTP outbound if needed'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Lambda-SG'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =====================================================
  # S3 Bucket with Security Configuration
  # =====================================================

  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Secure-Bucket'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
              - !Sub 'arn:aws:s3:::${SecureS3Bucket}'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowLambdaAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
            Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
          - Sid: AllowLambdaListBucket
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action: 's3:ListBucket'
            Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}'

  # =====================================================
  # IAM Role and Policies
  # =====================================================

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-Lambda-Execution-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
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
                Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !Sub 'arn:aws:s3:::${SecureS3Bucket}'
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Lambda-Role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =====================================================
  # Lambda Function
  # =====================================================

  SecureLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-${Environment}-Secure-Function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import logging

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              logger.info(f"Lambda function invoked with event: {json.dumps(event)}")
              
              # Example S3 interaction
              s3_client = boto3.client('s3')
              bucket_name = event.get('bucket_name', 'default-bucket')
              
              try:
                  # List objects in bucket
                  response = s3_client.list_objects_v2(Bucket=bucket_name)
                  logger.info(f"Successfully accessed S3 bucket: {bucket_name}")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Lambda function executed successfully',
                          'bucket': bucket_name,
                          'object_count': response.get('KeyCount', 0)
                      })
                  }
              except Exception as e:
                  logger.error(f"Error accessing S3: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': str(e)
                      })
                  }
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnetAZ1
          - !Ref PrivateSubnetAZ2
      Environment:
        Variables:
          S3_BUCKET_NAME: !Ref SecureS3Bucket
          ENVIRONMENT: !Ref Environment
      Timeout: 60
      MemorySize: 256
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Lambda-Function'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # =====================================================
  # CloudWatch Monitoring and Logging
  # =====================================================

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${SecureLambdaFunction}'
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Lambda-Logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  S3AccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/s3/${ProjectName}-${Environment}-access-logs'
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-S3-Access-Logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  VPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
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
                Resource: '*'

  VPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${ProjectName}-${Environment}-${AWS::StackName}'
      RetentionInDays: 30

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref SecureVPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC-FlowLogs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # CloudWatch Alarms for Security Monitoring
  UnauthorizedS3AccessAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-Unauthorized-S3-Access'
      AlarmDescription: 'Alarm for unauthorized S3 access attempts'
      MetricName: 4xxError
      Namespace: AWS/S3
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: BucketName
          Value: !Ref SecureS3Bucket
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-S3-Access-Alarm'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-Lambda-Errors'
      AlarmDescription: 'Alarm for Lambda function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 3
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref SecureLambdaFunction
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Lambda-Error-Alarm'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

  # Metric Filter for VPC Flow Logs to detect suspicious activity
  SuspiciousNetworkActivityMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref VPCFlowLogsGroup
      FilterPattern: '[version, account, eni, source, destination, srcport, destport="22", protocol="6", packets, bytes, windowstart, windowend, action="REJECT", flowlogstatus]'
      MetricTransformations:
        - MetricNamespace: !Sub '${ProjectName}/Security'
          MetricName: SuspiciousSSHAttempts
          MetricValue: '1'
          DefaultValue: 0

  SuspiciousSSHAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-${Environment}-Suspicious-SSH-Attempts'
      AlarmDescription: 'Alarm for suspicious SSH connection attempts'
      MetricName: SuspiciousSSHAttempts
      Namespace: !Sub '${ProjectName}/Security'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-SSH-Alarm'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner

# =====================================================
# Outputs
# =====================================================

Outputs:
  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-ID'

  PublicSubnetIds:
    Description: 'IDs of the public subnets'
    Value: !Join [',', [!Ref PublicSubnetAZ1, !Ref PublicSubnetAZ2]]
    Export:
      Name: !Sub '${ProjectName}-${Environment}-Public-Subnet-IDs'

  PrivateSubnetIds:
    Description: 'IDs of the private subnets'
    Value: !Join [',', [!Ref PrivateSubnetAZ1, !Ref PrivateSubnetAZ2]]
    Export:
      Name: !Sub '${ProjectName}-${Environment}-Private-Subnet-IDs'

  S3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-S3-Bucket-Name'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt SecureLambdaFunction.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-Lambda-Function-ARN'

  WebApplicationSecurityGroupId:
    Description: 'ID of the web application security group'
    Value: !Ref WebApplicationSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-WebApp-SG-ID'

  LambdaSecurityGroupId:
    Description: 'ID of the Lambda security group'
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-Lambda-SG-ID'
```
