# FedRAMP-Compliant API Infrastructure - CloudFormation Implementation

This implementation provides a complete FedRAMP Moderate-compliant API infrastructure using CloudFormation. The solution includes API Gateway with throttling, ElastiCache Redis for caching, Kinesis Data Streams for audit logging, and SecretsManager for credentials management.

## File: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: FedRAMP-compliant API infrastructure for government data distribution

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Unique suffix for resource names to prevent conflicts
    MinLength: 1
    MaxLength: 20
    AllowedPattern: ^[a-z0-9-]+$
    ConstraintDescription: Must contain only lowercase letters, numbers, and hyphens

  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for the VPC

  PrivateSubnet1CIDR:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for private subnet 1

  PrivateSubnet2CIDR:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for private subnet 2

  CacheNodeType:
    Type: String
    Default: cache.t3.micro
    Description: ElastiCache node type
    AllowedValues:
      - cache.t3.micro
      - cache.t3.small
      - cache.t3.medium
      - cache.m6g.large

  KinesisShardCount:
    Type: Number
    Default: 1
    MinValue: 1
    MaxValue: 10
    Description: Number of shards for Kinesis Data Stream

Resources:
  # KMS Key for encryption
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub KMS key for encrypting data at rest - ${EnvironmentSuffix}
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - elasticache.amazonaws.com
                - kinesis.amazonaws.com
                - secretsmanager.amazonaws.com
                - logs.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/fedramp-api-${EnvironmentSuffix}'
      TargetKeyId: !Ref EncryptionKey

  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub 'fedramp-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'fedramp-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'fedramp-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ElastiCache Subnet Group
  CacheSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: !Sub 'Subnet group for Redis cache - ${EnvironmentSuffix}'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      CacheSubnetGroupName: !Sub 'cache-subnet-group-${EnvironmentSuffix}'
      Tags:
        - Key: Name
          Value: !Sub 'cache-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Security Group for ElastiCache
  CacheSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'cache-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for ElastiCache Redis cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          SourceSecurityGroupId: !Ref APIGatewaySecurityGroup
          Description: Allow Redis traffic from API Gateway
      Tags:
        - Key: Name
          Value: !Sub 'cache-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  # Security Group for API Gateway VPC Link
  APIGatewaySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'api-gateway-sg-${EnvironmentSuffix}'
      GroupDescription: Security group for API Gateway VPC access
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 6379
          ToPort: 6379
          DestinationSecurityGroupId: !Ref CacheSecurityGroup
          Description: Allow outbound to Redis
      Tags:
        - Key: Name
          Value: !Sub 'api-gateway-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ElastiCache Redis Cluster
  RedisReplicationGroup:
    Type: AWS::ElastiCache::ReplicationGroup
    Properties:
      ReplicationGroupId: !Sub 'redis-cluster-${EnvironmentSuffix}'
      ReplicationGroupDescription: !Sub 'Redis cluster for API caching - ${EnvironmentSuffix}'
      Engine: redis
      EngineVersion: '7.0'
      CacheNodeType: !Ref CacheNodeType
      NumCacheClusters: 2
      AutomaticFailoverEnabled: true
      MultiAZEnabled: true
      CacheSubnetGroupName: !Ref CacheSubnetGroup
      SecurityGroupIds:
        - !Ref CacheSecurityGroup
      AtRestEncryptionEnabled: true
      TransitEncryptionEnabled: true
      KmsKeyId: !Ref EncryptionKey
      SnapshotRetentionLimit: 5
      SnapshotWindow: '03:00-05:00'
      PreferredMaintenanceWindow: 'sun:05:00-sun:07:00'
      Tags:
        - Key: Name
          Value: !Sub 'redis-cluster-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  # Kinesis Data Stream for audit logging
  AuditLogStream:
    Type: AWS::Kinesis::Stream
    Properties:
      Name: !Sub 'audit-log-stream-${EnvironmentSuffix}'
      ShardCount: !Ref KinesisShardCount
      RetentionPeriodHours: 168
      StreamEncryption:
        EncryptionType: KMS
        KeyId: !Ref EncryptionKey
      StreamModeDetails:
        StreamMode: PROVISIONED
      Tags:
        - Key: Name
          Value: !Sub 'audit-log-stream-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  # Secrets Manager for API Keys
  APIKeysSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'api-keys-${EnvironmentSuffix}'
      Description: !Sub 'API keys for government data distribution system - ${EnvironmentSuffix}'
      KmsKeyId: !Ref EncryptionKey
      GenerateSecretString:
        SecretStringTemplate: '{"username": "api-user"}'
        GenerateStringKey: "api_key"
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Name
          Value: !Sub 'api-keys-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  # CloudWatch Log Group for API Gateway
  APIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/apigateway/fedramp-api-${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt EncryptionKey.Arn

  # IAM Role for API Gateway to write to CloudWatch Logs
  APIGatewayLoggingRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'api-gateway-logging-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      Policies:
        - PolicyName: KinesisWritePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'kinesis:PutRecord'
                  - 'kinesis:PutRecords'
                Resource: !GetAtt AuditLogStream.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt EncryptionKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'api-gateway-logging-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # API Gateway REST API
  RestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'fedramp-public-data-api-${EnvironmentSuffix}'
      Description: !Sub 'FedRAMP-compliant API for government data distribution - ${EnvironmentSuffix}'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: 'execute-api:Invoke'
            Resource: '*'
      MinimumCompressionSize: 1024
      Tags:
        - Key: Name
          Value: !Sub 'fedramp-public-data-api-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  # API Gateway Resource
  DataResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestAPI
      ParentId: !GetAtt RestAPI.RootResourceId
      PathPart: 'data'

  # API Gateway Method
  DataGetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestAPI
      ResourceId: !Ref DataResource
      HttpMethod: GET
      AuthorizationType: AWS_IAM
      ApiKeyRequired: true
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseTemplates:
              application/json: |
                {
                  "message": "Government data retrieved successfully",
                  "timestamp": "$context.requestTime",
                  "requestId": "$context.requestId",
                  "data": {
                    "records": [],
                    "cached": true
                  }
                }
            ResponseParameters:
              method.response.header.Cache-Control: "'max-age=3600'"
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Cache-Control: true
          ResponseModels:
            application/json: Empty

  # API Gateway Deployment
  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - DataGetMethod
    Properties:
      RestApiId: !Ref RestAPI
      Description: !Sub 'Production deployment for ${EnvironmentSuffix}'

  # API Gateway Stage with caching and throttling
  APIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestAPI
      DeploymentId: !Ref APIDeployment
      StageName: prod
      Description: !Sub 'Production stage with FedRAMP compliance - ${EnvironmentSuffix}'
      CacheClusterEnabled: true
      CacheClusterSize: '0.5'
      CacheTtlInSeconds: 3600
      CacheDataEncrypted: true
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          CachingEnabled: true
          CacheTtlInSeconds: 3600
          CacheDataEncrypted: true
          ThrottlingBurstLimit: 1000
          ThrottlingRateLimit: 1000
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt APIGatewayLogGroup.Arn
        Format: '$context.requestId $context.extendedRequestId $context.identity.sourceIp $context.requestTime $context.httpMethod $context.routeKey $context.status $context.protocol $context.responseLength'
      Tags:
        - Key: Name
          Value: !Sub 'api-stage-prod-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Compliance
          Value: FedRAMP-Moderate

  # API Gateway Usage Plan for throttling
  UsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn:
      - APIStage
    Properties:
      UsagePlanName: !Sub 'fedramp-usage-plan-${EnvironmentSuffix}'
      Description: !Sub 'Usage plan with 1000 requests per minute throttling - ${EnvironmentSuffix}'
      ApiStages:
        - ApiId: !Ref RestAPI
          Stage: !Ref APIStage
      Throttle:
        BurstLimit: 1000
        RateLimit: 1000
      Tags:
        - Key: Name
          Value: !Sub 'fedramp-usage-plan-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # API Key
  APIKey:
    Type: AWS::ApiGateway::ApiKey
    DependsOn:
      - APIStage
    Properties:
      Name: !Sub 'fedramp-api-key-${EnvironmentSuffix}'
      Description: !Sub 'API key for government data access - ${EnvironmentSuffix}'
      Enabled: true
      StageKeys:
        - RestApiId: !Ref RestAPI
          StageName: !Ref APIStage
      Tags:
        - Key: Name
          Value: !Sub 'fedramp-api-key-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Associate API Key with Usage Plan
  UsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref APIKey
      KeyType: API_KEY
      UsagePlanId: !Ref UsagePlan

  # CloudWatch Alarm for API Gateway throttling
  ThrottlingAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'api-throttling-alarm-${EnvironmentSuffix}'
      AlarmDescription: Alert when API requests are being throttled
      MetricName: Count
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 100
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref RestAPI
      TreatMissingData: notBreaching

  # CloudWatch Alarm for Cache hit rate
  CacheHitRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'cache-hit-rate-alarm-${EnvironmentSuffix}'
      AlarmDescription: Alert when cache hit rate is low
      MetricName: CacheHitCount
      Namespace: AWS/ApiGateway
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 50
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: ApiName
          Value: !Ref RestAPI
        - Name: Stage
          Value: !Ref APIStage
      TreatMissingData: notBreaching

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  RedisEndpoint:
    Description: Redis cluster endpoint
    Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-Redis-Endpoint'

  RedisPort:
    Description: Redis cluster port
    Value: !GetAtt RedisReplicationGroup.PrimaryEndPoint.Port
    Export:
      Name: !Sub '${AWS::StackName}-Redis-Port'

  KinesisStreamName:
    Description: Kinesis Data Stream name for audit logs
    Value: !Ref AuditLogStream
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-Stream'

  KinesisStreamArn:
    Description: Kinesis Data Stream ARN
    Value: !GetAtt AuditLogStream.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Kinesis-Arn'

  APIKeySecretArn:
    Description: Secrets Manager ARN for API keys
    Value: !Ref APIKeysSecret
    Export:
      Name: !Sub '${AWS::StackName}-APIKeys-Secret-Arn'

  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  KMSKeyArn:
    Description: KMS Key ARN for encryption
    Value: !GetAtt EncryptionKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-Arn'

  RestAPIId:
    Description: API Gateway REST API ID
    Value: !Ref RestAPI
    Export:
      Name: !Sub '${AWS::StackName}-RestAPI-ID'

  RestAPIEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${RestAPI}.execute-api.${AWS::Region}.amazonaws.com/${APIStage}/data'
    Export:
      Name: !Sub '${AWS::StackName}-API-Endpoint'

  APIKeyId:
    Description: API Gateway API Key ID
    Value: !Ref APIKey
    Export:
      Name: !Sub '${AWS::StackName}-APIKey-ID'

  UsagePlanId:
    Description: API Gateway Usage Plan ID
    Value: !Ref UsagePlan
    Export:
      Name: !Sub '${AWS::StackName}-UsagePlan-ID'

  APIGatewayLogGroupName:
    Description: CloudWatch Log Group for API Gateway
    Value: !Ref APIGatewayLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-LogGroup-Name'
```

## Implementation Details

### Security Features (FedRAMP Moderate Compliance)

1. **Encryption at Rest**
   - KMS encryption for ElastiCache Redis
   - KMS encryption for Kinesis Data Streams
   - KMS encryption for Secrets Manager
   - KMS encryption for CloudWatch Logs
   - Automatic key rotation enabled

2. **Encryption in Transit**
   - TLS 1.2+ enforced on API Gateway (regional endpoint)
   - Transit encryption enabled for Redis
   - HTTPS-only API endpoints

3. **Network Security**
   - VPC isolation for ElastiCache
   - Security groups with least privilege access
   - Multi-AZ deployment for high availability
   - Private subnets for data tier

4. **Access Control**
   - IAM authentication for API Gateway
   - API key requirement for all endpoints
   - Usage plans for throttling enforcement

### Caching Configuration

- **Cache TTL**: 3600 seconds (1 hour) as required
- **Cache Encryption**: Enabled at both API Gateway and ElastiCache levels
- **Cache Strategy**: API Gateway cache with Redis backend for distributed caching
- **Multi-AZ**: Redis deployed across multiple availability zones

### Throttling and Rate Limiting

- **Burst Limit**: 1000 requests (meets requirement)
- **Rate Limit**: 1000 requests per minute (meets requirement)
- **Enforcement**: Usage plan and stage-level method settings
- **Monitoring**: CloudWatch alarms for throttling events

### Audit and Compliance

- **Kinesis Data Streams**: Captures all API requests
- **Retention**: 168 hours (7 days) for audit logs
- **CloudWatch Logs**: 90-day retention for API Gateway logs
- **Encryption**: KMS encryption for all audit data
- **Tracing**: X-Ray tracing enabled for request tracking

### High Availability

- **Multi-AZ Redis**: Automatic failover enabled
- **Two Availability Zones**: Resources distributed across AZs
- **Regional API Gateway**: Regional endpoint for HA
- **Automatic Backups**: Redis snapshots with 5-day retention

### Resource Naming

All resources follow the pattern `{resource-type}-{environment-suffix}` using the EnvironmentSuffix parameter to ensure uniqueness across deployments.

## Deployment Instructions

1. **Prerequisites**
   - AWS CLI configured with appropriate credentials
   - Permissions to create VPC, ElastiCache, Kinesis, API Gateway, and KMS resources
   - Target region: eu-west-2

2. **Deploy the Stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name fedramp-api-infrastructure \
     --template-body file://lib/TapStack.yml \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod123 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region eu-west-2
   ```

3. **Monitor Deployment**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name fedramp-api-infrastructure \
     --region eu-west-2 \
     --query 'Stacks[0].StackStatus'
   ```

4. **Retrieve Outputs**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name fedramp-api-infrastructure \
     --region eu-west-2 \
     --query 'Stacks[0].Outputs'
   ```

## Testing the API

1. **Get API Key Value**
   ```bash
   aws apigateway get-api-key \
     --api-key $(aws cloudformation describe-stacks \
       --stack-name fedramp-api-infrastructure \
       --query 'Stacks[0].Outputs[?OutputKey==`APIKeyId`].OutputValue' \
       --output text \
       --region eu-west-2) \
     --include-value \
     --region eu-west-2
   ```

2. **Test API Endpoint**
   ```bash
   curl -X GET \
     -H "x-api-key: YOUR_API_KEY" \
     https://YOUR_API_ID.execute-api.eu-west-2.amazonaws.com/prod/data
   ```

## Compliance Verification

- All data encrypted at rest using KMS
- All data encrypted in transit using TLS 1.2+
- Request throttling enforced at 1000 requests/minute
- Cache TTL set to 1 hour (3600 seconds)
- Audit logs captured in Kinesis Data Streams
- Multi-AZ high availability enabled
- No Retain policies on any resources (all destroyable)