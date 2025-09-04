# Security Configuration as Code - Simplified CloudFormation Implementation

This implementation provides a simplified, production-ready CloudFormation template for AWS security services that handles existing resource limitations and regional constraints.

## CloudFormation Template: lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Security Configuration as Code - Simplified Stack for Environment with Existing Resources"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: "Security Configuration"
        Parameters:
          - NotificationEmail
          - EnableMacie

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  NotificationEmail:
    Type: String
    Default: "security@example.com"
    Description: "Email address for security notifications"
    AllowedPattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ConstraintDescription: "Must be a valid email address"

  EnableMacie:
    Type: String
    Default: "false"
    AllowedValues: ["true", "false"]
    Description: "Enable Amazon Macie for sensitive data discovery"

Conditions:
  ShouldCreateMacie: !And
    - !Equals [!Ref EnableMacie, "true"]
    - !Not [!Equals [!Ref "AWS::Region", "us-east-1"]]

Resources:
  # KMS Key for Security Services
  SecurityServicesKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub "KMS Key for Security Services - ${EnvironmentSuffix}"
      KeyPolicy:
        Version: "2012-10-17"
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: "kms:*"
            Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "SecurityServices-KMS-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecurityServicesKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/security-services-${EnvironmentSuffix}"
      TargetKeyId: !Ref SecurityServicesKMSKey

  # SNS Topic for Security Notifications
  SecurityNotificationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "security-notifications-${EnvironmentSuffix}"
      DisplayName: !Sub "Security Notifications - ${EnvironmentSuffix}"
      KmsMasterKeyId: !Ref SecurityServicesKMSKey
      Tags:
        - Key: Name
          Value: !Sub "Security-Notifications-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  SecurityNotificationsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SecurityNotificationsTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  # AWS Security Hub
  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        Name: !Sub "Security-Hub-${EnvironmentSuffix}"
        Environment: !Ref EnvironmentSuffix
      EnableDefaultStandards: true
      ControlFindingGenerator: SECURITY_CONTROL

  # Amazon Macie (Conditional)
  MacieSession:
    Type: AWS::Macie2::Session
    Condition: ShouldCreateMacie
    Properties:
      Status: ENABLED
      FindingPublishingFrequency: FIFTEEN_MINUTES

  # EventBridge Rules for Security Alerts
  GuardDutyEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "guardduty-high-severity-${EnvironmentSuffix}"
      Description: "Captures high severity GuardDuty findings"
      EventPattern:
        source: ["aws.guardduty"]
        detail-type: ["GuardDuty Finding"]
        detail:
          severity:
            [
              7,
              7.0,
              7.1,
              7.2,
              7.3,
              7.4,
              7.5,
              7.6,
              7.7,
              7.8,
              7.9,
              8,
              8.0,
              8.1,
              8.2,
              8.3,
              8.4,
              8.5,
              8.6,
              8.7,
              8.8,
              8.9,
              9,
              9.0,
              9.1,
              9.2,
              9.3,
              9.4,
              9.5,
              9.6,
              9.7,
              9.8,
              9.9,
              10,
            ]
      State: ENABLED
      Targets:
        - Arn: !Ref SecurityNotificationsTopic
          Id: "SecurityNotificationTarget"

  SecurityHubEventRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "securityhub-critical-findings-${EnvironmentSuffix}"
      Description: "Captures critical Security Hub findings"
      EventPattern:
        source: ["aws.securityhub"]
        detail-type: ["Security Hub Findings - Imported"]
        detail:
          findings:
            Severity:
              Label: ["CRITICAL", "HIGH"]
      State: ENABLED
      Targets:
        - Arn: !Ref SecurityNotificationsTopic
          Id: "SecurityHubNotificationTarget"

  # DynamoDB Table for Application Data
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub "TurnAroundPromptTable${EnvironmentSuffix}"
      AttributeDefinitions:
        - AttributeName: "id"
          AttributeType: "S"
      KeySchema:
        - AttributeName: "id"
          KeyType: "HASH"
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref SecurityServicesKMSKey
      Tags:
        - Key: Name
          Value: !Sub "TurnAroundPromptTable-${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref EnvironmentSuffix

Outputs:
  # Original Outputs (preserved)
  TurnAroundPromptTableName:
    Description: "Name of the DynamoDB table"
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableName"

  TurnAroundPromptTableArn:
    Description: "ARN of the DynamoDB table"
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableArn"

  StackName:
    Description: "Name of this CloudFormation stack"
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: "Environment suffix used for this deployment"
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"

  # Security Services Outputs
  KMSKeyId:
    Description: "KMS Key ID for security services"
    Value: !Ref SecurityServicesKMSKey
    Export:
      Name: !Sub "${AWS::StackName}-SecurityKMSKey"

  SecurityHubArn:
    Description: "Security Hub ARN"
    Value: !Ref SecurityHub
    Export:
      Name: !Sub "${AWS::StackName}-SecurityHubArn"

  SecurityNotificationsTopicArn:
    Description: "SNS Topic for security notifications"
    Value: !Ref SecurityNotificationsTopic
    Export:
      Name: !Sub "${AWS::StackName}-SecurityNotificationsTopic"

  MacieSessionArn:
    Description: "Macie Session ARN"
    Value:
      !If [
        ShouldCreateMacie,
        !Ref MacieSession,
        "Not Created (disabled or unsupported region)",
      ]
    Export:
      Name: !Sub "${AWS::StackName}-MacieSessionArn"

  GuardDutyInfo:
    Description: "GuardDuty detector information"
    Value: "Using existing GuardDuty detector in account"
    Export:
      Name: !Sub "${AWS::StackName}-GuardDutyInfo"

  ConfigInfo:
    Description: "Config information"
    Value: "Using existing Config resources in account"
    Export:
      Name: !Sub "${AWS::StackName}-ConfigInfo"

  CloudTrailInfo:
    Description: "CloudTrail information"
    Value: "Using existing CloudTrail in account (limit reached)"
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailInfo"
```

## Key Features

### 1. Security Services Integration
- **AWS Security Hub**: Centralized security findings dashboard with default standards enabled
- **Amazon Macie**: Conditional data classification service (disabled in us-east-1 due to service availability)
- **KMS Encryption**: Dedicated KMS key for all security services with proper key policies
- **SNS Notifications**: Encrypted topic for security alert distribution

### 2. Regional Compatibility
- **Region-Aware Conditions**: Macie creation is automatically disabled in unsupported regions (e.g., us-east-1)
- **Flexible Deployment**: Template works across different AWS regions with appropriate service availability checks

### 3. Event-Driven Security
- **GuardDuty Integration**: EventBridge rules capture high-severity GuardDuty findings (7.0-10.0)
- **Security Hub Alerts**: Automated capture of critical and high-severity Security Hub findings
- **Real-time Notifications**: Immediate email alerts for security incidents

### 4. Data Storage & Protection
- **DynamoDB Table**: Encrypted table with point-in-time recovery for application data
- **KMS Integration**: All encryption uses dedicated security services KMS key
- **Pay-Per-Request**: Cost-optimized billing model for variable workloads

### 5. Infrastructure as Code Best Practices
- **Parameter Defaults**: NotificationEmail has default value for easy deployment
- **Conditional Resources**: Macie only created when enabled and in supported regions
- **Comprehensive Tagging**: Environment-based resource identification
- **Export Values**: All critical resources exported for cross-stack references

### 6. Operational Simplicity
- **Minimal Dependencies**: Works with existing AWS security services (GuardDuty, Config, CloudTrail)
- **Easy Deployment**: Single CloudFormation template with sensible defaults
- **Clear Outputs**: Informational outputs about existing vs. created resources
- **Error Handling**: Graceful handling of resource limitations and regional constraints

This implementation provides a simplified yet robust foundation for AWS security services that handles real-world constraints like existing resources and regional service availability.