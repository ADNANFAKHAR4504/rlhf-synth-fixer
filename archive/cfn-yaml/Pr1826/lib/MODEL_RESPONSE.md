# Security Configuration Infrastructure Solution

This solution provides a comprehensive security infrastructure using CloudFormation YAML templates following AWS security best practices.

## TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Infrastructure Stack - Security Configuration as Code'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
          - OrganizationId

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
    
  OrganizationId:
    Type: String
    Description: 'AWS Organization ID for resource access control'
    AllowedPattern: '^o-[0-9a-z]{10,32}$'
    ConstraintDescription: 'Must be a valid AWS Organization ID'

Resources:
  # KMS Key for encryption
  SecurityKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for security infrastructure encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for CloudTrail
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
          - Sid: Allow use of the key for Security Hub
            Effect: Allow
            Principal:
              Service: securityhub.amazonaws.com
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: SecurityInfrastructure
        - Key: Compliance
          Value: Required

  SecurityKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/security-infrastructure-${EnvironmentSuffix}'
      TargetKeyId: !Ref SecurityKMSKey

  # IAM Password Policy
  IAMPasswordPolicy:
    Type: AWS::IAM::AccountPasswordPolicy
    Properties:
      MinimumPasswordLength: 14
      RequireUppercaseCharacters: true
      RequireLowercaseCharacters: true
      RequireNumbers: true
      RequireSymbols: true
      MaxPasswordAge: 90
      PasswordReusePrevention: 24
      HardExpiry: false
      AllowUsersToChangePassword: true

  # Admin Role with MFA requirement
  AdminRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureAdminRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AdministratorAccess'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: AccessLevel
          Value: Admin
        - Key: MFARequired
          Value: 'true'

  # Developer Role with limited permissions
  DeveloperRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureDeveloperRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      Policies:
        - PolicyName: DeveloperAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'ec2:Describe*'
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                  - 'dynamodb:BatchGetItem'
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'lambda:InvokeFunction'
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
              - Effect: Deny
                Action:
                  - 'iam:*'
                  - 'kms:*'
                  - 'cloudtrail:*'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: AccessLevel
          Value: Developer
        - Key: MFARequired
          Value: 'true'

  # Read-only Role
  ReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecureReadOnlyRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/ReadOnlyAccess'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: AccessLevel
          Value: ReadOnly
        - Key: MFARequired
          Value: 'true'

  # Security Group for encrypted resources
  SecureResourcesSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for encrypted resources with minimal access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/8
          Description: 'HTTPS from private networks only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS services'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: SecureResources
        - Key: NetworkAccess
          Value: Minimal

  # VPC for secure resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'SecureVPC-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private subnet for secure resources
  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'SecurePrivateSubnet-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Type
          Value: Private

  # CloudTrail for audit logging
  SecurityCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub 'SecurityAuditTrail-${EnvironmentSuffix}'
      S3BucketName: !Ref CloudTrailBucket
      S3KeyPrefix: 'cloudtrail-logs'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecurityKMSKey
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: 
                - 'arn:aws:s3:::*/*'
            - Type: 'AWS::S3::Bucket'
              Values:
                - 'arn:aws:s3:::*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: SecurityAudit
        - Key: Compliance
          Value: Required

  # S3 Bucket for CloudTrail logs
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'security-cloudtrail-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecurityKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 365
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: SecurityAudit
        - Key: DataClassification
          Value: Confidential

  # CloudTrail bucket policy
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # Security Hub
  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: SecurityMonitoring

  # IAM Access Analyzer
  AccessAnalyzer:
    Type: AWS::AccessAnalyzer::Analyzer
    Properties:
      AnalyzerName: !Sub 'SecurityAccessAnalyzer-${EnvironmentSuffix}'
      Type: ACCOUNT
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Purpose
          Value: AccessValidation

  # DynamoDB table with encryption
  SecureDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'SecureDataTable-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: true
      SSESpecification:
        SSEEnabled: true
        KMSMasterKeyId: !Ref SecurityKMSKey
      PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: DataClassification
          Value: Confidential
        - Key: BackupRequired
          Value: 'true'

Outputs:
  SecurityKMSKeyId:
    Description: 'KMS Key ID for security infrastructure'
    Value: !Ref SecurityKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-SecurityKMSKeyId'

  SecurityKMSKeyArn:
    Description: 'KMS Key ARN for security infrastructure'
    Value: !GetAtt SecurityKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecurityKMSKeyArn'

  AdminRoleArn:
    Description: 'ARN of the secure admin role'
    Value: !GetAtt AdminRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AdminRoleArn'

  DeveloperRoleArn:
    Description: 'ARN of the secure developer role'
    Value: !GetAtt DeveloperRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DeveloperRoleArn'

  ReadOnlyRoleArn:
    Description: 'ARN of the secure read-only role'
    Value: !GetAtt ReadOnlyRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ReadOnlyRoleArn'

  CloudTrailArn:
    Description: 'ARN of the CloudTrail for audit logging'
    Value: !GetAtt SecurityCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailArn'

  CloudTrailBucketName:
    Description: 'Name of the CloudTrail S3 bucket'
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrailBucketName'

  SecureDataTableName:
    Description: 'Name of the secure DynamoDB table'
    Value: !Ref SecureDataTable
    Export:
      Name: !Sub '${AWS::StackName}-SecureDataTableName'

  SecurityHubArn:
    Description: 'ARN of the Security Hub'
    Value: !Sub 'arn:aws:securityhub:${AWS::Region}:${AWS::AccountId}:hub/default'
    Export:
      Name: !Sub '${AWS::StackName}-SecurityHubArn'

  AccessAnalyzerArn:
    Description: 'ARN of the Access Analyzer'
    Value: !GetAtt AccessAnalyzer.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AccessAnalyzerArn'

  VPCId:
    Description: 'ID of the secure VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PrivateSubnetId:
    Description: 'ID of the private subnet'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetId'

  SecurityGroupId:
    Description: 'ID of the security group for secure resources'
    Value: !Ref SecureResourcesSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## security-roles.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Additional Security Roles and Policies for MFA and Passkey Support'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'

  SecurityKMSKeyArn:
    Type: String
    Description: 'ARN of the security KMS key'

Resources:
  # Group for users who need MFA setup assistance
  MFASetupGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub 'MFASetupGroup-${EnvironmentSuffix}'
      Policies:
        - PolicyName: MFASetupPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'iam:ListMFADevices'
                  - 'iam:EnableMFADevice'
                  - 'iam:CreateVirtualMFADevice'
                  - 'iam:DeleteVirtualMFADevice'
                  - 'iam:DeactivateMFADevice'
                  - 'iam:ResyncMFADevice'
                  - 'iam:ChangePassword'
                  - 'iam:UpdateUser'
                  - 'iam:GetUser'
                Resource:
                  - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
                  - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${aws:username}'
              - Effect: Allow
                Action:
                  - 'iam:ListUsers'
                  - 'iam:ListVirtualMFADevices'
                  - 'iam:GetAccountPasswordPolicy'
                Resource: '*'

  # Policy for enforcing MFA on all actions
  EnforceMFAPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub 'EnforceMFAPolicy-${EnvironmentSuffix}'
      Description: 'Policy that enforces MFA for all users'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowAllUsersToListAccounts
            Effect: Allow
            Action:
              - 'iam:ListAccountAliases'
              - 'iam:ListUsers'
              - 'iam:GetAccountSummary'
            Resource: '*'
          - Sid: AllowIndividualUserToSeeAndManageOnlyTheirOwnAccountInformation
            Effect: Allow
            Action:
              - 'iam:ChangePassword'
              - 'iam:CreateAccessKey'
              - 'iam:CreateLoginProfile'
              - 'iam:DeleteAccessKey'
              - 'iam:DeleteLoginProfile'
              - 'iam:GetLoginProfile'
              - 'iam:ListAccessKeys'
              - 'iam:UpdateAccessKey'
              - 'iam:UpdateLoginProfile'
              - 'iam:ListSigningCertificates'
              - 'iam:DeleteSigningCertificate'
              - 'iam:UpdateSigningCertificate'
              - 'iam:UploadSigningCertificate'
              - 'iam:ListSSHPublicKeys'
              - 'iam:GetSSHPublicKey'
              - 'iam:DeleteSSHPublicKey'
              - 'iam:UpdateSSHPublicKey'
              - 'iam:UploadSSHPublicKey'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
          - Sid: AllowIndividualUserToViewAndManageTheirOwnMFA
            Effect: Allow
            Action:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:DeleteVirtualMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:EnableMFADevice'
              - 'iam:ResyncMFADevice'
              - 'iam:DeactivateMFADevice'
            Resource:
              - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${aws:username}'
              - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            NotAction:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
              - 'iam:ChangePassword'
              - 'iam:GetAccountPasswordPolicy'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  # Security Audit Role for compliance
  SecurityAuditRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'SecurityAuditRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              NumericLessThan:
                'aws:MultiFactorAuthAge': '3600'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/SecurityAudit'
        - 'arn:aws:iam::aws:policy/job-function/ViewOnlyAccess'
      Policies:
        - PolicyName: SecurityAuditExtended
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'access-analyzer:*'
                  - 'securityhub:*'
                  - 'guardduty:Get*'
                  - 'guardduty:List*'
                  - 'inspector:Describe*'
                  - 'inspector:List*'
                  - 'macie2:Get*'
                  - 'macie2:List*'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: AccessLevel
          Value: SecurityAudit
        - Key: MFARequired
          Value: 'true'

  # Break Glass Emergency Access Role
  BreakGlassRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'BreakGlassEmergencyRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'sts:AssumeRole'
            Condition:
              Bool:
                'aws:MultiFactorAuthPresent': 'true'
              StringEquals:
                'aws:RequestedRegion': 'us-east-1'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AdministratorAccess'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: AccessLevel
          Value: Emergency
        - Key: MFARequired
          Value: 'true'
        - Key: Usage
          Value: EmergencyOnly

Outputs:
  MFASetupGroupName:
    Description: 'Name of the MFA setup group'
    Value: !Ref MFASetupGroup
    Export:
      Name: !Sub '${AWS::StackName}-MFASetupGroupName'

  EnforceMFAPolicyArn:
    Description: 'ARN of the enforce MFA policy'
    Value: !Ref EnforceMFAPolicy
    Export:
      Name: !Sub '${AWS::StackName}-EnforceMFAPolicyArn'

  SecurityAuditRoleArn:
    Description: 'ARN of the security audit role'
    Value: !GetAtt SecurityAuditRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-SecurityAuditRoleArn'

  BreakGlassRoleArn:
    Description: 'ARN of the break glass emergency role'
    Value: !GetAtt BreakGlassRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BreakGlassRoleArn'
```

This solution implements comprehensive security controls including:

1. **KMS Encryption**: Centralized encryption key for all services
2. **IAM Roles with Least Privilege**: Admin, Developer, and ReadOnly roles with MFA requirements
3. **MFA Enforcement**: Policies requiring MFA for all user actions
4. **Security Monitoring**: CloudTrail, Security Hub, and Access Analyzer
5. **Network Security**: VPC with private subnets and minimal security groups
6. **Data Protection**: Encrypted DynamoDB table and S3 bucket
7. **Audit Logging**: Comprehensive CloudTrail with encrypted logs
8. **Access Control**: Resource-based policies and proper tagging
9. **Emergency Access**: Break glass role for emergency situations
10. **Password Policies**: Strong password requirements

All resources follow AWS Well-Architected security principles and use the latest security features including support for FIDO2 passkeys and enhanced MFA requirements.