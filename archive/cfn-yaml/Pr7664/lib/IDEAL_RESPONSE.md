# ideal_response.md

# Project Title

TapStack — Serverless REST API Infrastructure (us-west-2)

# Functional scope (build everything new)

Produce a single CloudFormation template named `TapStack.yml` in YAML that provisions a fresh, serverless REST backend in the us-west-2 region. The stack must create and connect all resources end-to-end: API Gateway REST API with caching and CORS, Lambda (Python 3.13), DynamoDB with Application Auto Scaling, Secrets Manager for API keys, S3 for durable Lambda object logs, CloudWatch Logs and alarms, and SNS for alarm notifications. No resources may reference or depend on pre-existing infrastructure. All logical and physical identifiers must be collision-resilient without hardcoding explicit physical names.

# Deliverable

Return only the `TapStack.yml` template, fully self-contained with initialized parameters, conditions, resources, and outputs. It must deploy in one attempt through a non-interactive pipeline.

# In-template parameters

Provide defaults for all parameters so no CLI input is required. Include at minimum:

* ProjectName with a safe naming regex
* EnvironmentSuffix with a safe naming regex
* AllowedOrigins as a comma-separated list
* AllowedIpCidrs as a comma-separated list
* AlarmEmail which may be empty
* ApiCacheTtlSeconds and LogRetentionDays
* LifecycleDaysToGlacier and LifecycleExpireDays
* LambdaMemoryMb, LambdaTimeoutSeconds, LambdaReservedConcurrency
* DdbReadMin, DdbReadMax, DdbWriteMin, DdbWriteMax
* Owner and CostCenter

# Core requirements

* Region fixed to us-west-2 by pipeline environment
* Lambda runtime set to Python 3.13
* API Gateway REST with IP allowlist via resource policy, API key with usage plan, stage-level caching, access logs, and CORS for specified origins
* DynamoDB in provisioned mode with read and write Application Auto Scaling targets and target-tracking policies
* Secrets Manager secret for API key material retrievable by Lambda only
* S3 bucket for Lambda object logs with encryption at rest, versioning, TLS enforcement, lifecycle rules, and public access block
* CloudWatch Logs groups for API and Lambda with retention
* CloudWatch alarms on API 4XX and 5XX, Lambda errors and throttles, and DynamoDB throttles, publishing to an SNS topic with optional email subscription
* IAM least privilege for Lambda to write logs, read the secret, CRUD only on its table, and write objects to the log bucket
* Security Group present with ICMP and TCP ports 80 and 443 allowed to satisfy the stated constraint, attached to a new VPC
* All resources tagged with ProjectName, Environment, Owner, CostCenter and include EnvironmentSuffix in names via Fn::Sub

# Anti-conflict and early validation safeguards

* Do not set explicit physical names for buckets, tables, secrets, or functions
* Use EnvironmentSuffix in all name strings without introducing hard allowed-value enumerations
* Avoid circular references in API Gateway policies by using a wildcard execute-api ARN in the resource policy

# Observability and operations

* Access logs enabled on the API stage
* Alarms wired to SNS with optional email subscription when AlarmEmail is non-empty
* Clear outputs for invoke URL, stage name, API key id, Lambda name, DynamoDB name and ARN, S3 bucket name and ARN, Secret ARN, and SNS topic ARN

# Acceptance criteria

* Template passes cfn-lint without warnings that indicate misconfiguration
* Changeset creation succeeds under early validation
* Stack deploys in one attempt and returns successful health checks on the REST endpoint
* DynamoDB autoscaling targets and policies are present and active
* S3 bucket shows encryption and versioning; public access is blocked and TLS policy enforced
* Lambda can read Secrets Manager, perform CRUD on the table, write to S3, and emit logs
* All resources are tagged and include EnvironmentSuffix in their names

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack - Serverless REST API Infrastructure (us-west-2).
  Builds everything new: API Gateway (REST with caching + CORS + IP allowlist + API Key/UsagePlan),
  Lambda (Python 3.13), DynamoDB (PROVISIONED with Auto Scaling), S3 log bucket (versioned, encrypted, TLS-only),
  Secrets Manager secret (API key), CloudWatch Logs + Alarms (API 4XX/5XX, Lambda errors/throttles, DDB throttles),
  SNS notifications, and a placeholder Security Group with ICMP/TCP 80/443 for future VPCLink ingress enforcement.
  To avoid Early Validation conflicts, the template does NOT set explicit physical names.

Metadata:
  TemplateAuthor: TapStack
  Version: 1.0.3
  Notes:
    - Uses DynamoDB Application Auto Scaling with the service-linked role (no custom IAM role required).
    - All Parameters have defaults for non-interactive pipeline deploys.
    - Region targeting us-west-2 expected by pipeline.

Parameters:
  ProjectName:
    Type: String
    Default: tapstack
    Description: Logical project prefix used in names/tags.
    AllowedPattern: '^[a-z0-9-]{3,32}$'
    ConstraintDescription: Lowercase letters, numbers, hyphens; 3–32 chars.

  EnvironmentSuffix:
    Type: String
    Default: dev-us
    Description: Environment suffix included in all names/tags (no hard enums).
    AllowedPattern: '^[a-z0-9-]{3,32}$'
    ConstraintDescription: Lowercase letters, numbers, hyphens; 3–32 chars.

  AllowedOrigins:
    Type: String
    Default: 'https://example.com,https://admin.example.com'
    Description: Comma-separated CORS origins.

  AllowedIpCidrs:
    Type: String
    Default: '203.0.113.0/24,198.51.100.0/24'
    Description: Comma-separated CIDR ranges allowed to invoke the API.

  AlarmEmail:
    Type: String
    Default: ''
    Description: Optional email for SNS alarm subscription. Leave empty to skip.

  ApiCacheTtlSeconds:
    Type: Number
    Default: 300
    MinValue: 1
    MaxValue: 3600
    Description: API Gateway stage cache TTL seconds.

  LogRetentionDays:
    Type: Number
    Default: 30
    AllowedValues: [1,3,5,7,14,30,60,90,120,150,180,365,400,545,731,1827,3653]
    Description: CloudWatch Logs retention in days.

  LifecycleDaysToGlacier:
    Type: Number
    Default: 60
    MinValue: 1
    Description: Days before log objects transition to GLACIER.

  LifecycleExpireDays:
    Type: Number
    Default: 365
    MinValue: 30
    Description: Days before old log objects expire.

  LambdaMemoryMb:
    Type: Number
    Default: 256
    MinValue: 128
    MaxValue: 10240
    Description: Lambda memory size in MB.

  LambdaTimeoutSeconds:
    Type: Number
    Default: 15
    MinValue: 1
    MaxValue: 900
    Description: Lambda timeout in seconds.

  LambdaReservedConcurrency:
    Type: Number
    Default: 5
    MinValue: 0
    MaxValue: 1000
    Description: Reserved concurrency (0 = unreserved).

  DdbReadMin:
    Type: Number
    Default: 1
    MinValue: 1
    Description: DynamoDB min read capacity (Auto Scaling lower bound).

  DdbReadMax:
    Type: Number
    Default: 20
    MinValue: 1
    Description: DynamoDB max read capacity (Auto Scaling upper bound).

  DdbWriteMin:
    Type: Number
    Default: 1
    MinValue: 1
    Description: DynamoDB min write capacity (Auto Scaling lower bound).

  DdbWriteMax:
    Type: Number
    Default: 20
    MinValue: 1
    Description: DynamoDB max write capacity (Auto Scaling upper bound).

  Owner:
    Type: String
    Default: 'platform-team'
    Description: Owner tag value.

  CostCenter:
    Type: String
    Default: 'ENG-API'
    Description: Cost center tag value.

Mappings: {}

Conditions:
  HasAlarmEmail: !Not [ !Equals [ !Ref AlarmEmail, '' ] ]
  HasReservedConcurrency: !Not [ !Equals [ !Ref LambdaReservedConcurrency, 0 ] ]

Resources:

  ##############################################
  # Networking placeholder for API ingress SG  #
  ##############################################

  ApiVpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.80.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ApiSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'Ingress for API (ICMP, TCP/80, TCP/443) - ${ProjectName}-${EnvironmentSuffix}'
      VpcId: !Ref ApiVpc
      SecurityGroupIngress:
        - IpProtocol: icmp
          FromPort: -1
          ToPort: -1
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-api-sg'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ###########################
  # S3 - versioned log bucket
  ###########################

  LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault: { SSEAlgorithm: AES256 }
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: transition-and-expire
            Status: Enabled
            Transitions:
              - StorageClass: GLACIER
                TransitionInDays: !Ref LifecycleDaysToGlacier
            ExpirationInDays: !Ref LifecycleExpireDays
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-logs'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: EnforceTLS
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub '${LogBucket.Arn}'
              - !Sub '${LogBucket.Arn}/*'
            Condition:
              Bool:
                aws:SecureTransport: 'false'

  ##############################
  # DynamoDB - provisioned + AAS
  ##############################

  DynamoTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref DdbReadMin
        WriteCapacityUnits: !Ref DdbWriteMin
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-ddb'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Application Auto Scaling for DDB Read (uses service-linked role automatically)
  DdbReadScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: !Ref DdbReadMax
      MinCapacity: !Ref DdbReadMin
      ResourceId: !Sub 'table/${DynamoTable}'
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb

  DdbReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-ddb-read-target-tracking'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DdbReadScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
        ScaleInCooldown: 60
        ScaleOutCooldown: 60

  # Application Auto Scaling for DDB Write (uses service-linked role automatically)
  DdbWriteScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: !Ref DdbWriteMax
      MinCapacity: !Ref DdbWriteMin
      ResourceId: !Sub 'table/${DynamoTable}'
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  DdbWriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-ddb-write-target-tracking'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DdbWriteScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization
        ScaleInCooldown: 60
        ScaleOutCooldown: 60

  #################################
  # Secrets Manager - API key store
  #################################

  SecretsManagerSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Description: !Sub 'API credentials for ${ProjectName}-${EnvironmentSuffix}'
      GenerateSecretString:
        SecretStringTemplate: '{"apiKey":"changeme-soon"}'
        GenerateStringKey: 'token'
        PasswordLength: 32
        ExcludePunctuation: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-secret'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ##############################################
  # CloudWatch Logs - for API and Lambda logging
  ##############################################

  ApiAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      RetentionInDays: !Ref LogRetentionDays
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ##############################
  # Lambda - Python 3.13 function
  ##############################

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: 'sts:AssumeRole'
      Path: /
      Policies:
        - PolicyName: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-inline'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Logs: CreateLogGroup "*" and stream/events scoped to our group
              - Effect: Allow
                Action: logs:CreateLogGroup
                Resource: "*"
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !GetAtt LambdaLogGroup.Arn
                  - !Sub '${LambdaLogGroup.Arn}:*'
              # DynamoDB CRUD on our table
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DynamoTable.Arn
              # Secrets Manager read
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Ref SecretsManagerSecret
              # S3 write to log bucket
              - Effect: Allow
                Action: s3:PutObject
                Resource: !Sub '${LogBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-lambda-role'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.13
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: !Ref LambdaTimeoutSeconds
      MemorySize: !Ref LambdaMemoryMb
      ReservedConcurrentExecutions: !If
        - HasReservedConcurrency
        - !Ref LambdaReservedConcurrency
        - !Ref 'AWS::NoValue'
      Environment:
        Variables:
          TABLE_NAME: !Ref DynamoTable
          SECRET_ID: !Ref SecretsManagerSecret
          LOG_BUCKET: !Ref LogBucket
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
          PROJECT_NAME: !Ref ProjectName
          ALLOWED_ORIGINS: !Ref AllowedOrigins
      Code:
        ZipFile: |
          import os, json, boto3, base64, datetime
          ddb = boto3.resource('dynamodb')
          sm = boto3.client('secretsmanager')
          s3 = boto3.client('s3')

          TABLE_NAME = os.environ['TABLE_NAME']
          SECRET_ID = os.environ['SECRET_ID']
          LOG_BUCKET = os.environ['LOG_BUCKET']
          ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS','*')

          table = ddb.Table(TABLE_NAME)

          def _cors_headers():
              return {
                  "Access-Control-Allow-Origin": ALLOWED_ORIGINS,
                  "Access-Control-Allow-Headers": "Content-Type,X-API-Key",
                  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
              }

          def handler(event, context):
              method = event.get("httpMethod", "GET")
              if method == "OPTIONS":
                  return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

              sec = sm.get_secret_value(SecretId=SECRET_ID)
              secret_payload = sec.get("SecretString") or base64.b64decode(sec["SecretBinary"]).decode("utf-8")

              if method == "POST":
                  body = json.loads(event.get("body") or "{}")
                  pk = body.get("pk") or f"auto#{int(datetime.datetime.utcnow().timestamp())}"
                  item = {"pk": pk, "sk": "v1", "body": body, "ts": datetime.datetime.utcnow().isoformat()}
                  table.put_item(Item=item)
                  s3.put_object(Bucket=LOG_BUCKET, Key=f"lambda/{pk}.json", Body=json.dumps(item).encode("utf-8"))
                  resp = {"ok": True, "secret": bool(secret_payload), "item": item}
                  return {"statusCode": 200, "headers": _cors_headers(), "body": json.dumps(resp)}
              else:
                  items = table.scan(Limit=10).get("Items", [])
                  return {"statusCode": 200, "headers": _cors_headers(), "body": json.dumps({"items": items, "count": len(items)})}
    DependsOn:
      - LambdaLogGroup

  LambdaVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref LambdaFunction

  #################################
  # API Gateway - REST + CORS + ACL
  #################################

  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
      EndpointConfiguration:
        Types: [REGIONAL]
      Policy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowSpecificCidrsInvoke
            Effect: Allow
            Principal: "*"
            Action: execute-api:Invoke
            Resource: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:*/*/*/*'
            Condition:
              IpAddress:
                aws:SourceIp: !Split [ ",", !Ref AllowedIpCidrs ]
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: items
      RestApiId: !Ref RestApi

  ApiMethodOptions:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        RequestTemplates:
          application/json: '{"statusCode": 200}'
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-API-Key'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: !Sub "'${AllowedOrigins}'"
            ResponseTemplates:
              application/json: ''
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Origin: true

  ApiMethodAny:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: ANY
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub
          - arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${FuncArn}/invocations
          - { FuncArn: !GetAtt LambdaFunction.Arn }

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    Properties:
      RestApiId: !Ref RestApi
      Description: !Sub 'Deployment for ${ProjectName}-${EnvironmentSuffix}'
    DependsOn:
      - ApiMethodAny
      - ApiMethodOptions

  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestApi
      DeploymentId: !Ref ApiDeployment
      StageName: v1
      CacheClusterEnabled: true
      CacheClusterSize: '0.5'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          CachingEnabled: true
          CacheTtlInSeconds: !Ref ApiCacheTtlSeconds
          MetricsEnabled: true
          DataTraceEnabled: false
      AccessLogSetting:
        DestinationArn: !GetAtt ApiAccessLogGroup.Arn
        Format: >
          {"requestId":"$context.requestId","ip":"$context.identity.sourceIp",
          "caller":"$context.identity.caller","user":"$context.identity.user",
          "requestTime":"$context.requestTime","httpMethod":"$context.httpMethod",
          "path":"$context.path","status":"$context.status","protocol":"$context.protocol",
          "responseLength":"$context.responseLength"}
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  ApiApiKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Enabled: true
      Name: !Sub '${ProjectName}-${EnvironmentSuffix}-key'
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApiUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: !Sub '${ProjectName}-${EnvironmentSuffix}-plan'
      Throttle:
        RateLimit: 50
        BurstLimit: 100
      Quota:
        Limit: 100000
        Period: MONTH
      ApiStages:
        - ApiId: !Ref RestApi
          Stage: !Ref ApiStage
      Tags:
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApiUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref ApiApiKey
      KeyType: API_KEY
      UsagePlanId: !Ref ApiUsagePlan

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApi}/*/*/*'

  #####################################
  # Alarms + SNS for notifications
  #####################################

  AlarmTopic:
    Type: AWS::SNS::Topic
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-alarms'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  AlarmSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasAlarmEmail
    Properties:
      Protocol: email
      Endpoint: !Ref AlarmEmail
      TopicArn: !Ref AlarmTopic

  Api4xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'API 4XX error rate high'
      Namespace: 'AWS/ApiGateway'
      MetricName: '4XXError'
      Dimensions:
        - Name: ApiName
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
        - Name: Stage
          Value: !Ref ApiStage
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 5
      Threshold: 50
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref AlarmTopic ]

  Api5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'API 5XX error rate high'
      Namespace: 'AWS/ApiGateway'
      MetricName: '5XXError'
      Dimensions:
        - Name: ApiName
          Value: !Sub '${ProjectName}-${EnvironmentSuffix}-api'
        - Name: Stage
          Value: !Ref ApiStage
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref AlarmTopic ]

  LambdaErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Lambda error count high'
      Namespace: 'AWS/Lambda'
      MetricName: 'Errors'
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref AlarmTopic ]

  LambdaThrottlesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'Lambda throttles detected'
      Namespace: 'AWS/Lambda'
      MetricName: 'Throttles'
      Dimensions:
        - Name: FunctionName
          Value: !Ref LambdaFunction
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref AlarmTopic ]

  DynamoThrottlesAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'DynamoDB throttled requests'
      Namespace: 'AWS/DynamoDB'
      MetricName: 'ThrottledRequests'
      Dimensions:
        - Name: TableName
          Value: !Ref DynamoTable
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
      AlarmActions: [ !Ref AlarmTopic ]

Outputs:
  Project:
    Description: Project name used in this stack.
    Value: !Ref ProjectName

  EnvironmentSuffixOut:
    Description: Effective environment suffix.
    Value: !Ref EnvironmentSuffix

  ApiId:
    Description: API Gateway RestApi ID.
    Value: !Ref RestApi

  ApiStageName:
    Description: Deployed stage name.
    Value: !Ref ApiStage

  ApiInvokeUrl:
    Description: Invoke URL (attach /items).
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${ApiStage}/items'

  ApiKeyId:
    Description: API Key ID (retrieve value via console/SDK).
    Value: !Ref ApiApiKey

  LambdaName:
    Description: Lambda function name (auto-generated physical name).
    Value: !Ref LambdaFunction

  LambdaLogGroupArn:
    Description: CloudWatch Logs group ARN for Lambda.
    Value: !GetAtt LambdaLogGroup.Arn

  DynamoTableName:
    Description: DynamoDB table name (auto-generated).
    Value: !Ref DynamoTable

  DynamoTableArn:
    Description: DynamoDB table ARN.
    Value: !GetAtt DynamoTable.Arn

  LogBucketName:
    Description: S3 bucket for Lambda logs/objects (auto-generated).
    Value: !Ref LogBucket

  LogBucketArn:
    Description: S3 log bucket ARN.
    Value: !GetAtt LogBucket.Arn

  SecretArn:
    Description: Secrets Manager secret ARN.
    Value: !Ref SecretsManagerSecret

  AlarmTopicArn:
    Description: SNS Topic ARN for alarms.
    Value: !Ref AlarmTopic
```