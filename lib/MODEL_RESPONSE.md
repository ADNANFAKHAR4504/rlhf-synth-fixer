```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure AWS environment setup using two Availability Zones.
  This template will only work in regions that have at least two AZs.

Parameters:
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC.
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for the first private subnet.
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for the second private subnet.
  CriticalCpuThreshold:
    Type: Number
    Default: 80
    Description: CPU utilization percentage for CloudWatch alarm.

Resources:
  KmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Key for encrypting resources
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: kms:*
            Resource: '*'
      Tags:
        - Key: Name
          Value: SecureKMSKey

  KmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/secureKey
      TargetKeyId: !Ref KmsKey

  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: SecureVPC

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: PrivateSubnet2

  SecretsBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      Tags:
        - Key: Name
          Value: SecureSecretsBucket

  ALBAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      Tags:
        - Key: Name
          Value: ALBAccessLogsBucket

  ALBAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${ALBAccessLogsBucket.Arn}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref AWS::AccountId
          - Effect: Allow
            Principal:
              Service: delivery.logs.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt ALBAccessLogsBucket.Arn
            Condition:
              StringEquals:
                'aws:SourceAccount': !Ref AWS::AccountId

  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn:
      - ALBAccessLogsBucketPolicy
    Properties:
      Subnets:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Type: application
      Scheme: internal
      SecurityGroups:
        - !Ref ALBHttpSecurityGroup
      Tags:
        - Key: Name
          Value: SecureLoadBalancer

  ALBHttpSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: ALBHttpSecurityGroup

  LambdaExecutionRole:
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
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: SecretAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Ref MySecret
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*:log-stream:*'
      Tags:
        - Key: Name
          Value: LambdaExecutionRole

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Lambda security group
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !GetAtt ALBHttpSecurityGroup.GroupId
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: LambdaSecurityGroup

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs20.x
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const secretsManager = new AWS.SecretsManager();
          exports.handler = async function(event, context) {
            try {
              const secretResponse = await secretsManager.getSecretValue({ SecretId: process.env.SECRET_NAME }).promise();
              const secret = JSON.parse(secretResponse.SecretString);
              console.log('Successfully retrieved secret:', secret.username);
              return {
                statusCode: 200,
                body: "Hello, secure world! We retrieved the secret."
              };
            } catch (error) {
              console.error('Error retrieving secret:', error);
              return {
                statusCode: 500,
                body: "Error: " + error.message
              };
            }
          };
      VpcConfig:
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          SECRET_NAME: !Ref MySecret
      Tags:
        - Key: Name
          Value: SecureLambdaFunction

  CloudWatchAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: High CPU usage
      Namespace: AWS/EC2
      MetricName: CPUUtilization
      ComparisonOperator: GreaterThanThreshold
      EvaluationPeriods: 1
      Period: 300
      Statistic: Average
      Threshold: !Ref CriticalCpuThreshold
      Dimensions: []
      AlarmActions: []

  MySecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: SecureAppSecret
      Description: Secret used by Lambda
      SecretString: '{"username":"admin","password":"SecureP@ssw0rd"}'
      KmsKeyId: !Ref KmsKey

  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: SecureAPI
      Tags:
        - Key: Name
          Value: SecureAPI

  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: secure

  ApiMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: ''
      MethodResponses:
        - StatusCode: 200

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt LambdaFunction.Arn
      Action: 'lambda:InvokeFunction'
      Principal: 'apigateway.amazonaws.com'
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*'

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiMethod
    Properties:
      RestApiId: !Ref ApiGateway

  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref ApiGateway
      DeploymentId: !Ref ApiDeployment
      StageName: prod

  WAFWebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Name: WAFProtectAPI
      Scope: REGIONAL
      DefaultAction:
        Allow: {}
      VisibilityConfig:
        SampledRequestsEnabled: true
        CloudWatchMetricsEnabled: true
        MetricName: WAFMetrics
      Rules:
        - Name: AWS-AWSManagedRulesCommonRuleSet
          Priority: 1
          OverrideAction:
            None: {}
          VisibilityConfig:
            SampledRequestsEnabled: true
            CloudWatchMetricsEnabled: true
            MetricName: CommonRules
          Statement:
            ManagedRuleGroupStatement:
              VendorName: AWS
              Name: AWSManagedRulesCommonRuleSet
      Tags:
        - Key: Name
          Value: WAFWebACL

  WAFAssociation:
    Type: AWS::WAFv2::WebACLAssociation
    Properties:
      WebACLArn: !GetAtt WAFWebACL.Arn
      ResourceArn: !Sub 'arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGateway}/stages/${ApiStage}'

Outputs:
  LoadBalancerDNS:
    Value: !GetAtt LoadBalancer.DNSName
  LambdaFunctionArn:
    Value: !Ref LambdaFunction
  SecretArn:
    Value: !Ref MySecret
  ApiGatewayInvokeURL:
    Description: The URL to invoke the API Gateway endpoint
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/secure'

```