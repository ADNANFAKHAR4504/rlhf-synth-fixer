### Reasoning Trace

---

### Overall Task

CloudFormation YAML template that enforces encryption and compliance across an AWS account.

### Key Requirements

1. **S3 Encryption**:
   - All buckets must have default encryption (AES-256 or SSE-KMS)
   - Unencrypted PUTs must be forbidden

2. **EBS Encryption**:
   - Enable account-level default EBS encryption using KMS

3. **IAM MFA Policy**:
   - Require MFA for all IAM users for privileged/risky operations

4. **AWS Config**:
   - Deploy Config Rules to detect non-encrypted S3/EBS resources
   - These resources should be marked as NON_COMPLIANT

5. **Template Quality**:
   - Must pass cfn-nag validation
   - Compatible with AWS Config Conformance Packs
   - Resources tagged consistently
   - Use intrinsic functions (!Ref, !Sub, !GetAtt)
   - Avoid hardcoding ARNs or regions

### Deliverables

1. **Reference Architecture** (ASCII diagram)
2. **Security/Compliance Mapping** (requirement to resource to enforcement)
3. **Test Plan Mapping** (how to validate each requirement)
4. **CloudFormation YAML** (full, deployable template)
5. **Post-Deploy Validation Steps** (CLI/Console checks)

CloudFormation template and then organize the sections accordingly.

## 1. Planning the CloudFormation Template

### Resources Needed

1. **S3 Bucket**:
   - With encryption enabled
   - Public access blocked
   - Bucket policy rejecting unencrypted uploads

2. **EBS Default Encryption**:
   - Using AWS::EC2::EBSDefaultKmsKeyId or similar

3. **IAM Policy**:
   - Requiring MFA for IAM users
   - Denying actions without aws:MultiFactorAuthPresent

4. **AWS Config Rules**:
   - For S3 encryption validation
   - For EBS encryption validation

5. **KMS Keys**:
   - For S3 encryption
   - For EBS encryption

Now, let me design each component in detail:

### KMS Keys

We'll create two customer managed KMS keys:

- One for S3 encryption
- One for EBS encryption

```yaml
S3KMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for S3 bucket encryption
    EnableKeyRotation: true
    KeyPolicy:
      Version: '2012-10-17'
      Statement:
        - Sid: Allow administration of the key
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action:
            - 'kms:*'
          Resource: '*'
        - Sid: Allow use of the key
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action:
            - 'kms:Encrypt'
            - 'kms:Decrypt'
            - 'kms:ReEncrypt*'
            - 'kms:GenerateDataKey*'
            - 'kms:DescribeKey'
          Resource: '*'

S3KMSKeyAlias:
  Type: AWS::KMS::Alias
  Properties:
    AliasName: alias/s3-encryption-key
    TargetKeyId: !Ref S3KMSKey

EBSKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for EBS volume encryption
    EnableKeyRotation: true
    KeyPolicy:
      Version: '2012-10-17'
      Statement:
        - Sid: Allow administration of the key
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action:
            - 'kms:*'
          Resource: '*'
        - Sid: Allow use of the key
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action:
            - 'kms:Encrypt'
            - 'kms:Decrypt'
            - 'kms:ReEncrypt*'
            - 'kms:GenerateDataKey*'
            - 'kms:DescribeKey'
          Resource: '*'

EBSKMSKeyAlias:
  Type: AWS::KMS::Alias
  Properties:
    AliasName: alias/ebs-encryption-key
    TargetKeyId: !Ref EBSKMSKey
```

### S3 Bucket

We'll create an encrypted S3 bucket with public access blocked and a bucket policy that rejects unencrypted uploads:

```yaml
EncryptedS3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref S3KMSKey
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    Tags:
      - Key: Purpose
        Value: EncryptedStorage
      - Key: Environment
        Value: Production

EncryptedS3BucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref EncryptedS3Bucket
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: DenyUnencryptedObjectUploads
          Effect: Deny
          Principal: '*'
          Action: 's3:PutObject'
          Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
          Condition:
            'Null':
              's3:x-amz-server-side-encryption': 'true'
        - Sid: DenyIncorrectEncryptionHeader
          Effect: Deny
          Principal: '*'
          Action: 's3:PutObject'
          Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
          Condition:
            StringNotEquals:
              's3:x-amz-server-side-encryption': 'aws:kms'
        - Sid: DenyUnencryptedObjectUploadsWithIncorrectKey
          Effect: Deny
          Principal: '*'
          Action: 's3:PutObject'
          Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
          Condition:
            StringNotEquals:
              's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3KMSKey.Arn
```

### EBS Default Encryption

We'll enable account-level default EBS encryption:

```yaml
EBSDefaultEncryption:
  Type: 'AWS::EC2::EBSEncryptionByDefault'
  Properties:
    EnableEbsEncryptionByDefault: true

EBSDefaultKMSKey:
  Type: 'AWS::EC2::EBSDefaultKmsKeyId'
  Properties:
    KmsKeyId: !Ref EBSKMSKey
```

### IAM MFA Policy

We'll create an IAM policy requiring MFA for privileged actions:

```yaml
MFARequiredPolicy:
  Type: AWS::IAM::ManagedPolicy
  Properties:
    Description: Policy requiring MFA for privileged actions
    ManagedPolicyName: RequireMFAForPrivilegedActions
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Sid: AllowViewAccountInfo
          Effect: Allow
          Action:
            - 'iam:GetAccountPasswordPolicy'
            - 'iam:GetAccountSummary'
            - 'iam:ListVirtualMFADevices'
          Resource: '*'
        - Sid: AllowManageOwnPasswords
          Effect: Allow
          Action:
            - 'iam:ChangePassword'
            - 'iam:GetUser'
          Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
        - Sid: AllowManageOwnVirtualMFADevice
          Effect: Allow
          Action:
            - 'iam:CreateVirtualMFADevice'
            - 'iam:DeleteVirtualMFADevice'
          Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${!aws:username}'
        - Sid: AllowManageOwnUserMFA
          Effect: Allow
          Action:
            - 'iam:DeactivateMFADevice'
            - 'iam:EnableMFADevice'
            - 'iam:ListMFADevices'
            - 'iam:ResyncMFADevice'
          Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${!aws:username}'
        - Sid: DenyAllExceptListedIfNoMFA
          Effect: Deny
          NotAction:
            - 'iam:ChangePassword'
            - 'iam:CreateVirtualMFADevice'
            - 'iam:EnableMFADevice'
            - 'iam:GetUser'
            - 'iam:ListMFADevices'
            - 'iam:ListVirtualMFADevices'
            - 'iam:ResyncMFADevice'
            - 'sts:GetSessionToken'
          Resource: '*'
          Condition:
            BoolIfExists:
              'aws:MultiFactorAuthPresent': 'false'

# Attach the MFA policy to all users via an IAM group
AllUsersGroup:
  Type: AWS::IAM::Group
  Properties:
    GroupName: AllUsers
    ManagedPolicyArns:
      - !Ref MFARequiredPolicy
```

### AWS Config Rules

We'll set up AWS Config and deploy rules to detect non-encrypted resources:

```yaml
# AWS Config Recorder and Delivery Channel
ConfigRecorder:
  Type: AWS::Config::ConfigurationRecorder
  Properties:
    Name: DefaultRecorder
    RecordingGroup:
      AllSupported: true
      IncludeGlobalResources: true
    RoleARN: !GetAtt ConfigRole.Arn

ConfigDeliveryChannel:
  Type: AWS::Config::DeliveryChannel
  Properties:
    ConfigSnapshotDeliveryProperties:
      DeliveryFrequency: One_Hour
    S3BucketName: !Ref ConfigBucket
    S3KeyPrefix: 'config'

ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: 'sts:AssumeRole'
    ManagedPolicyArns:
      - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'

ConfigBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref S3KMSKey
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    Tags:
      - Key: Purpose
        Value: ConfigStorage
      - Key: Environment
        Value: Production

# AWS Config Rules for Encryption
S3EncryptionRule:
  Type: AWS::Config::ConfigRule
  DependsOn: ConfigRecorder
  Properties:
    ConfigRuleName: s3-bucket-server-side-encryption-enabled
    Description: Checks that S3 buckets have encryption enabled
    Source:
      Owner: AWS
      SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
    Scope:
      ComplianceResourceTypes:
        - AWS::S3::Bucket

EBSEncryptionRule:
  Type: AWS::Config::ConfigRule
  DependsOn: ConfigRecorder
  Properties:
    ConfigRuleName: encrypted-volumes
    Description: Checks that EBS volumes are encrypted
    Source:
      Owner: AWS
      SourceIdentifier: ENCRYPTED_VOLUMES
    Scope:
      ComplianceResourceTypes:
        - AWS::EC2::Volume
```

Now I'll put all these resources together into a complete CloudFormation template and add appropriate outputs.

## 2. Complete CloudFormation Template

Now I'll construct the final CloudFormation template with all the elements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CloudFormation template to enforce encryption and compliance requirements'

Resources:
  # KMS Keys
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Purpose
          Value: S3Encryption
        - Key: Environment
          Value: Production

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/s3-encryption-key
      TargetKeyId: !Ref S3KMSKey

  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EBS volume encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Purpose
          Value: EBSEncryption
        - Key: Environment
          Value: Production

  EBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/ebs-encryption-key
      TargetKeyId: !Ref EBSKMSKey

  # Encrypted S3 Bucket
  EncryptedS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Purpose
          Value: EncryptedStorage
        - Key: Environment
          Value: Production

  EncryptedS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref EncryptedS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
            Condition:
              'Null':
                's3:x-amz-server-side-encryption': 'true'
          - Sid: DenyIncorrectEncryptionHeader
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Sid: DenyUnencryptedObjectUploadsWithIncorrectKey
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3KMSKey.Arn

  # EBS Default Encryption
  EBSDefaultEncryption:
    Type: 'AWS::EC2::EBSEncryptionByDefault'
    Properties:
      EnableEbsEncryptionByDefault: true

  EBSDefaultKMSKey:
    Type: 'AWS::EC2::EBSDefaultKmsKeyId'
    Properties:
      KmsKeyId: !Ref EBSKMSKey

  # IAM MFA Policy
  MFARequiredPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: Policy requiring MFA for privileged actions
      ManagedPolicyName: RequireMFAForPrivilegedActions
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - 'iam:GetAccountPasswordPolicy'
              - 'iam:GetAccountSummary'
              - 'iam:ListVirtualMFADevices'
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - 'iam:ChangePassword'
              - 'iam:GetUser'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/$${aws:username}'
          - Sid: AllowManageOwnVirtualMFADevice
            Effect: Allow
            Action:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:DeleteVirtualMFADevice'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/$${aws:username}'
          - Sid: AllowManageOwnUserMFA
            Effect: Allow
            Action:
              - 'iam:DeactivateMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ResyncMFADevice'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/$${aws:username}'
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            NotAction:
              - 'iam:ChangePassword'
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  AllUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: AllUsers
      ManagedPolicyArns:
        - !Ref MFARequiredPolicy

  # AWS Config Setup
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Path: /
      Tags:
        - Key: Purpose
          Value: AWSConfig
        - Key: Environment
          Value: Production

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${ConfigBucket}'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${ConfigBucket}/config/AWSLogs/${AWS::AccountId}/Config/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ConfigBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Purpose
          Value: ConfigStorage
        - Key: Environment
          Value: Production

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn: ConfigRole
    Properties:
      Name: DefaultRecorder
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResources: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    DependsOn: ConfigBucketPolicy
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: One_Hour
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: 'config'

  # AWS Config Rules for Encryption
  S3EncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Description: Checks that S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket

  EBSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks that EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume

Outputs:
  S3KMSKeyArn:
    Description: ARN of the KMS key used for S3 encryption
    Value: !GetAtt S3KMSKey.Arn

  EBSKMSKeyArn:
    Description: ARN of the KMS key used for EBS encryption
    Value: !GetAtt EBSKMSKey.Arn

  EncryptedS3BucketName:
    Description: Name of the encrypted S3 bucket
    Value: !Ref EncryptedS3Bucket

  MFARequiredPolicyArn:
    Description: ARN of the IAM policy requiring MFA
    Value: !Ref MFARequiredPolicy

  S3EncryptionConfigRuleId:
    Description: ID of the Config rule checking S3 bucket encryption
    Value: !GetAtt S3EncryptionRule.ConfigRuleId

  EBSEncryptionConfigRuleId:
    Description: ID of the Config rule checking EBS volume encryption
    Value: !GetAtt EBSEncryptionRule.ConfigRuleId
```

Let's check for any issues with the template:

1. The IAM policy for requiring MFA seems correct.
2. The S3 bucket is encrypted with KMS and has a policy that enforces encryption.
3. EBS default encryption is enabled with a customer-managed KMS key.
4. AWS Config is set up with rules to check for S3 and EBS encryption.
5. All resources are properly tagged.
6. No hardcoded ARNs or regions.
7. Intrinsic functions are used correctly.

Now let me complete the other sections of the response.

## 3. Reference Architecture (ASCII)

Let me create an ASCII diagram to represent the architecture:

```
+-------------------------------------------+
|                AWS Account                |
|                                           |
|  +---------------+    +---------------+   |
|  |  KMS Keys     |    |  IAM Policy   |   |
|  | - S3KMSKey    |    | - MFA Required|   |
|  | - EBSKMSKey   |    +-------+-------+   |
|  +-------+-------+            |           |
|          |                    |           |
|          v                    v           |
|  +---------------+    +---------------+   |
|  | S3 Bucket     |    | AllUsersGroup |   |
|  | - Encrypted   |    | - Attached    |   |
|  | - No Public   |    |   MFA Policy  |   |
|  +-------+-------+    +---------------+   |
|          |                                |
|          v                                |
|  +---------------+    +---------------+   |
|  | Bucket Policy |    | EBS Default   |   |
|  | - Enforces    |    | Encryption    |   |
|  |   Encryption  |    | - KMS         |   |
|  +---------------+    +---------------+   |
|                                           |
|  +-----------------------------------------+
|  |             AWS Config                  |
|  |                                         |
|  | +---------------+  +---------------+    |
|  | | ConfigRecorder|  | DeliveryChannel|   |
|  | +---------------+  +---------------+    |
|  |                                         |
|  | +---------------+  +---------------+    |
|  | | S3 Encryption |  | EBS Encryption|    |
|  | | Config Rule   |  | Config Rule   |    |
|  | +---------------+  +---------------+    |
|  +-----------------------------------------+
+-------------------------------------------+
```

## 4. Security / Compliance Mapping

Now I'll map each requirement to the corresponding resource and enforcement mechanism:

| Requirement      | Resource                                                                                                        | Enforcement Mechanism                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S3 Encryption    | 1. EncryptedS3Bucket<br>2. EncryptedS3BucketPolicy<br>3. S3KMSKey                                               | 1. ServerSideEncryptionConfiguration with KMS<br>2. Bucket policy denying unencrypted uploads<br>3. Customer managed KMS key for encryption                                                                           |
| EBS Encryption   | 1. EBSDefaultEncryption<br>2. EBSDefaultKMSKey<br>3. EBSKMSKey                                                  | 1. Account-level EBS encryption<br>2. Default KMS key for EBS<br>3. Customer managed KMS key for encryption                                                                                                           |
| IAM MFA Policy   | 1. MFARequiredPolicy<br>2. AllUsersGroup                                                                        | 1. IAM policy denying actions without MFA<br>2. Group attaching policy to all users                                                                                                                                   |
| AWS Config Rules | 1. S3EncryptionRule<br>2. EBSEncryptionRule<br>3. ConfigRecorder<br>4. ConfigDeliveryChannel<br>5. ConfigBucket | 1. AWS managed rule for S3 encryption<br>2. AWS managed rule for EBS encryption<br>3. Config recorder to track resource changes<br>4. Channel to deliver compliance reports<br>5. Encrypted bucket for config history |

## 5. Test Plan Mapping

Let me outline how to test each of the encryption and compliance requirements:

| Requirement       | Test Plan                                                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S3 Encryption     | 1. Try to create an object in the bucket without encryption headers<br>2. Verify the operation is denied<br>3. Create an object with the correct encryption headers<br>4. Verify the operation succeeds<br>5. Check AWS Config for compliance status           |
| EBS Encryption    | 1. Try to create an EBS volume without specifying encryption<br>2. Verify the volume is automatically encrypted with the default KMS key<br>3. Create an EC2 instance and check if attached volumes are encrypted<br>4. Check AWS Config for compliance status |
| MFA Policy        | 1. Create a test IAM user and add to AllUsersGroup<br>2. Try privileged actions without MFA<br>3. Verify the operations are denied<br>4. Set up MFA for the user<br>5. Try the same actions with MFA<br>6. Verify the operations succeed                       |
| Config Compliance | 1. Check the AWS Config dashboard for rule compliance<br>2. Create a non-compliant resource (if possible)<br>3. Verify the Config rules detect it as NON_COMPLIANT<br>4. Fix the resource to be compliant<br>5. Verify the Config rules detect it as COMPLIANT |

## 6. Post-Deploy Validation Steps

Now I'll outline the CLI/Console checks to confirm COMPLIANT state:

1. **S3 Encryption Validation**:

   ```bash
   # Check S3 bucket encryption settings
   aws s3api get-bucket-encryption --bucket <bucket-name>

   # Try to upload unencrypted object (should fail)
   aws s3 cp test-file.txt s3://<bucket-name>/test-file.txt

   # Upload encrypted object with correct KMS key
   aws s3 cp test-file.txt s3://<bucket-name>/test-file.txt --sse aws:kms --sse-kms-key-id <S3KMSKeyArn>
   ```

2. **EBS Encryption Validation**:

   ```bash
   # Check EBS encryption by default setting
   aws ec2 get-ebs-encryption-by-default

   # Check EBS default KMS key
   aws ec2 get-ebs-default-kms-key-id

   # Create a new volume without specifying encryption (should be encrypted by default)
   aws ec2 create-volume --availability-zone <az> --size 10

   # Verify encryption status of the created volume
   aws ec2 describe-volumes --volume-ids <volume-id> --query 'Volumes[*].Encrypted'
   ```

3. **MFA Policy Validation**:

   ```bash
   # Create a test IAM user
   aws iam create-user --user-name test-mfa-user

   # Add user to the AllUsersGroup
   aws iam add-user-to-group --user-name test-mfa-user --group-name AllUsers

   # Try privileged action without MFA (should fail)
   aws ec2 describe-instances --profile test-mfa-user

   # Create and configure MFA device for user
   aws iam create-virtual-mfa-device --virtual-mfa-device-name test-mfa-user --outfile QRCode.png --bootstrap-method QRCodePNG
   aws iam enable-mfa-device --user-name test-mfa-user --serial-number <mfa-device-arn> --authentication-code1 <code1> --authentication-code2 <code2>

   # Get session token with MFA and try again (should succeed)
   aws sts get-session-token --serial-number <mfa-device-arn> --token-code <mfa-code> --profile test-mfa-user
   ```

4. **AWS Config Compliance Validation**:

   ```bash
   # Check compliance status for S3 encryption rule
   aws configservice describe-compliance-by-config-rule --config-rule-name s3-bucket-server-side-encryption-enabled

   # Check compliance status for EBS encryption rule
   aws configservice describe-compliance-by-config-rule --config-rule-name encrypted-volumes

   # List all compliance status
   aws configservice describe-compliance-by-resource --resource-type AWS::S3::Bucket
   aws configservice describe-compliance-by-resource --resource-type AWS::EC2::Volume
   ```

Console checks:

1. Navigate to S3 console and verify bucket encryption settings
2. Navigate to EC2 console and verify EBS default encryption settings
3. Navigate to AWS Config console and check compliance dashboard
4. Try to create an EBS volume in the EC2 console and verify encryption is automatic
5. Try to upload an unencrypted file to S3 bucket via console and verify it's rejected

Organize this information into the final response according to the requested format.

### Answer

---

# Encryption & Compliance CloudFormation Template

## 1. Reference Architecture (ASCII)

```
+------------------------------------------------------+
|                  AWS Account                          |
+------------------------------------------------------+
|                                                      |
|  +----------------+    +-------------------------+    |
|  |   KMS Keys     |    |       IAM MFA          |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | S3 Key    |  |    | | MFARequiredPolicy |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | EBS Key   |  |    | | AllUsersGroup     |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  +----------------+    +-------------------------+    |
|         |  |                       |                  |
|         |  +--------------------+  |                  |
|         v                       v  v                  |
|  +----------------+    +-------------------------+    |
|  | S3 Resources   |    | EBS Configuration      |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | Bucket    |  |    | | Default KMS Key   |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  | | Bucket    |  |    | | Default           |  |    |
|  | | Policy    |  |    | | Encryption        |  |    |
|  | +-----------+  |    | +-------------------+  |    |
|  +----------------+    +-------------------------+    |
|                                                      |
|  +----------------------------------------------+    |
|  |               AWS Config                     |    |
|  |                                              |    |
|  |  +----------------+   +------------------+   |    |
|  |  | Config Recorder |   | Delivery Channel |   |    |
|  |  +----------------+   +------------------+   |    |
|  |                                              |    |
|  |  +-------------------+  +-----------------+  |    |
|  |  | S3 Encryption Rule |  | EBS Encryption  |  |    |
|  |  +-------------------+  | Rule             |  |    |
|  |                         +-----------------+  |    |
|  +----------------------------------------------+    |
|                                                      |
+------------------------------------------------------+
```

## 2. Security / Compliance Mapping

| Requirement        | Resource                                                                | Enforcement Mechanism                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **S3 Encryption**  | 1. `S3KMSKey`<br>2. `EncryptedS3Bucket`<br>3. `EncryptedS3BucketPolicy` | 1. Customer-managed KMS key with rotation<br>2. Server-side encryption with KMS<br>3. Bucket policy denying unencrypted PUTs                    |
| **EBS Encryption** | 1. `EBSKMSKey`<br>2. `EBSDefaultEncryption`<br>3. `EBSDefaultKMSKey`    | 1. Customer-managed KMS key with rotation<br>2. Account-level encryption by default<br>3. Default KMS key for EBS volumes                       |
| **IAM MFA Policy** | 1. `MFARequiredPolicy`<br>2. `AllUsersGroup`                            | 1. Policy with deny statement for operations without MFA<br>2. Group applying MFA policy to all users                                           |
| **AWS Config**     | 1. `ConfigRecorder`<br>2. `S3EncryptionRule`<br>3. `EBSEncryptionRule`  | 1. Account-level compliance monitoring<br>2. Managed rule detecting unencrypted S3 buckets<br>3. Managed rule detecting unencrypted EBS volumes |

## 3. Test Plan Mapping

| Requirement        | Test Approach                                                                                                                    | Expected Outcome                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **S3 Encryption**  | 1. Upload object without encryption headers<br>2. Upload object with incorrect encryption type<br>3. Upload with correct KMS key | 1. Request denied<br>2. Request denied<br>3. Request successful                                |
| **EBS Encryption** | 1. Create volume without encryption parameter<br>2. Verify encryption status<br>3. Create instance with implicit volumes         | 1. Volume created<br>2. Volume is encrypted with specified KMS key<br>3. All volumes encrypted |
| **MFA Policy**     | 1. Attempt privileged action without MFA<br>2. Enable MFA and retry action<br>3. Verify user can manage own MFA                  | 1. Action denied<br>2. Action permitted<br>3. MFA management successful                        |
| **Config Rules**   | 1. Check config dashboard<br>2. Create non-compliant resource (if possible)<br>3. Remediate and recheck                          | 1. Rules active<br>2. NON_COMPLIANT status shown<br>3. COMPLIANT status after fix              |

## 4. CloudFormation YAML

```yaml
# filename: encryption-compliance-template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security and compliance template enforcing encryption and MFA requirements'

Resources:
  #----------------------------------------
  # KMS Keys for Encryption
  #----------------------------------------
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for S3 bucket encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Purpose
          Value: S3Encryption
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: DataEncryption

  S3KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/s3-encryption-key
      TargetKeyId: !Ref S3KMSKey

  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for EBS volume encryption
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Allow administration of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Purpose
          Value: EBSEncryption
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: DataEncryption

  EBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/ebs-encryption-key
      TargetKeyId: !Ref EBSKMSKey

  #----------------------------------------
  # S3 Bucket with Encryption Enforcement
  #----------------------------------------
  EncryptedS3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3KMSKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Purpose
          Value: SecureStorage
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: EncryptedStorage

  EncryptedS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref EncryptedS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
            Condition:
              'Null':
                's3:x-amz-server-side-encryption': 'true'
          - Sid: DenyIncorrectEncryptionHeader
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Sid: DenyIncorrectKMSKey
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${EncryptedS3Bucket.Arn}/*'
            Condition:
              StringNotLike:
                's3:x-amz-server-side-encryption-aws-kms-key-id': !GetAtt S3KMSKey.Arn

  #----------------------------------------
  # EBS Default Encryption Configuration
  #----------------------------------------
  EBSDefaultEncryption:
    Type: 'AWS::EC2::EBSEncryptionByDefault'
    Properties:
      EnableEbsEncryptionByDefault: true

  EBSDefaultKMSKey:
    Type: 'AWS::EC2::EBSDefaultKmsKeyId'
    Properties:
      KmsKeyId: !Ref EBSKMSKey

  #----------------------------------------
  # IAM MFA Policy Configuration
  #----------------------------------------
  MFARequiredPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      Description: Policy requiring MFA for privileged actions
      ManagedPolicyName: RequireMFAForPrivilegedActions
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - 'iam:GetAccountPasswordPolicy'
              - 'iam:GetAccountSummary'
              - 'iam:ListVirtualMFADevices'
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - 'iam:ChangePassword'
              - 'iam:GetUser'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/$${aws:username}'
          - Sid: AllowManageOwnVirtualMFADevice
            Effect: Allow
            Action:
              - 'iam:CreateVirtualMFADevice'
              - 'iam:DeleteVirtualMFADevice'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/$${aws:username}'
          - Sid: AllowManageOwnUserMFA
            Effect: Allow
            Action:
              - 'iam:DeactivateMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:ListMFADevices'
              - 'iam:ResyncMFADevice'
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/$${aws:username}'
          - Sid: DenyAllExceptListedIfNoMFA
            Effect: Deny
            NotAction:
              - 'iam:ChangePassword'
              - 'iam:CreateVirtualMFADevice'
              - 'iam:EnableMFADevice'
              - 'iam:GetUser'
              - 'iam:ListMFADevices'
              - 'iam:ListVirtualMFADevices'
              - 'iam:ResyncMFADevice'
              - 'sts:GetSessionToken'
            Resource: '*'
            Condition:
              BoolIfExists:
                'aws:MultiFactorAuthPresent': 'false'

  AllUsersGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: AllUsers
      ManagedPolicyArns:
        - !Ref MFARequiredPolicy
      Path: '/'

  #----------------------------------------
  # AWS Config Setup
  #----------------------------------------
  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      Path: '/'
      Tags:
        - Key: Purpose
          Value: ComplianceMonitoring
        - Key: Environment
          Value: Production

  ConfigBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !GetAtt S3KMSKey.Arn
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Purpose
          Value: ConfigStorage
        - Key: Environment
          Value: Production
        - Key: ComplianceControl
          Value: ComplianceData

  ConfigBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ConfigBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSConfigBucketPermissionsCheck
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub 'arn:aws:s3:::${ConfigBucket}'
          - Sid: AWSConfigBucketDelivery
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub 'arn:aws:s3:::${ConfigBucket}/config/AWSLogs/${AWS::AccountId}/Config/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    DependsOn: ConfigRole
    Properties:
      Name: DefaultRecorder
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResources: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    DependsOn: ConfigBucketPolicy
    Properties:
      ConfigSnapshotDeliveryProperties:
        DeliveryFrequency: One_Hour
      S3BucketName: !Ref ConfigBucket
      S3KeyPrefix: 'config'

  #----------------------------------------
  # AWS Config Rules
  #----------------------------------------
  S3EncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Description: Checks if S3 buckets have encryption enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      Scope:
        ComplianceResourceTypes:
          - AWS::S3::Bucket
      MaximumExecutionFrequency: Six_Hours

  EBSEncryptionRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigRecorder
    Properties:
      ConfigRuleName: encrypted-volumes
      Description: Checks if EBS volumes are encrypted
      Source:
        Owner: AWS
        SourceIdentifier: ENCRYPTED_VOLUMES
      Scope:
        ComplianceResourceTypes:
          - AWS::EC2::Volume
      MaximumExecutionFrequency: Six_Hours

Outputs:
  S3KMSKeyArn:
    Description: ARN of the KMS key for S3 encryption
    Value: !GetAtt S3KMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3KMSKeyArn'

  EBSKMSKeyArn:
    Description: ARN of the KMS key for EBS encryption
    Value: !GetAtt EBSKMSKey.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EBSKMSKeyArn'

  EncryptedS3BucketName:
    Description: Name of the encrypted S3 bucket
    Value: !Ref EncryptedS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-EncryptedS3BucketName'

  MFARequiredPolicyArn:
    Description: ARN of the IAM policy requiring MFA for privileged actions
    Value: !Ref MFARequiredPolicy
    Export:
      Name: !Sub '${AWS::StackName}-MFARequiredPolicyArn'

  ConfigBucketName:
    Description: Name of the bucket storing AWS Config data
    Value: !Ref ConfigBucket
    Export:
      Name: !Sub '${AWS::StackName}-ConfigBucketName'
```

## 5. Post-Deploy Validation Steps

### 1. S3 Encryption Validation

```bash
# Verify bucket encryption settings
aws s3api get-bucket-encryption \
  --bucket $(aws cloudformation describe-stacks \
  --stack-name encryption-compliance \
  --query "Stacks[0].Outputs[?OutputKey=='EncryptedS3BucketName'].OutputValue" \
  --output text)

# Test unencrypted object upload (should fail)
echo "test content" > test-file.txt
aws s3 cp test-file.txt s3://$(aws cloudformation describe-stacks \
  --stack-name encryption-compliance \
  --query "Stacks[0].Outputs[?OutputKey=='EncryptedS3BucketName'].OutputValue" \
  --output text)/

# Test encrypted upload with correct KMS key (should succeed)
aws s3 cp test-file.txt s3://$(aws cloudformation describe-stacks \
  --stack-name encryption-compliance \
  --query "Stacks[0].Outputs[?OutputKey=='EncryptedS3BucketName'].OutputValue" \
  --output text)/ \
  --sse aws:kms \
  --sse-kms-key-id $(aws cloudformation describe-stacks \
  --stack-name encryption-compliance \
  --query "Stacks[0].Outputs[?OutputKey=='S3KMSKeyArn'].OutputValue" \
  --output text)
```

### 2. EBS Encryption Validation

```bash
# Verify account-level EBS encryption is enabled
aws ec2 get-ebs-encryption-by-default

# Verify default KMS key for EBS encryption
aws ec2 get-ebs-default-kms-key-id

# Create a test volume (without explicitly specifying encryption)
VOLUME_ID=$(aws ec2 create-volume \
  --availability-zone $(aws ec2 describe-availability-zones \
  --query "AvailabilityZones[0].ZoneName" --output text) \
  --size 1 \
  --query "VolumeId" \
  --output text)

# Verify the volume is encrypted with correct key
aws ec2 describe-volumes \
  --volume-ids $VOLUME_ID \
  --query "Volumes[0].{Encrypted:Encrypted,KmsKeyId:KmsKeyId}"

# Clean up test volume
aws ec2 delete-volume --volume-id $VOLUME_ID
```

### 3. MFA Policy Validation

```bash
# Create test user
aws iam create-user --user-name test-compliance-user

# Add to AllUsers group
aws iam add-user-to-group --group-name AllUsers --user-name test-compliance-user

# Create access keys for testing
aws iam create-access-key --user-name test-compliance-user > test-user-credentials.json

# Configure test profile
aws configure --profile test-compliance-user

# Test privileged operation without MFA (should fail)
aws ec2 describe-instances --profile test-compliance-user

# Create virtual MFA device
MFA_ARN=$(aws iam create-virtual-mfa-device \
  --virtual-mfa-device-name test-compliance-user \
  --outfile qrcode.png --bootstrap-method QRCodePNG \
  --query "VirtualMFADevice.SerialNumber" --output text)

# Enable MFA for user (requires two consecutive TOTP codes)
aws iam enable-mfa-device \
  --user-name test-compliance-user \
  --serial-number $MFA_ARN \
  --authentication-code-1 123456 \
  --authentication-code-2 123456

# Get session token with MFA
aws sts get-session-token \
  --serial-number $MFA_ARN \
  --token-code 123456 \
  --profile test-compliance-user > mfa-session.json

# Configure MFA profile with temporary credentials
export AWS_ACCESS_KEY_ID=$(cat mfa-session.json | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(cat mfa-session.json | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(cat mfa-session.json | jq -r '.Credentials.SessionToken')

aws ec2 describe-instances
```

### 4. AWS Config Rule Validation

```bash
# Verify S3 encryption rule status
aws configservice describe-config-rules \
  --config-rule-names s3-bucket-server-side-encryption-enabled

# Check compliance status for S3 buckets
aws configservice describe-compliance-by-config-rule \
  --config-rule-name s3-bucket-server-side-encryption-enabled

# Verify EBS encryption rule status
aws configservice describe-config-rules \
  --config-rule-names encrypted-volumes

# Check compliance status for EBS volumes
aws configservice describe-compliance-by-config-rule \
  --config-rule-name encrypted-volumes

# View overall compliance dashboard
aws configservice describe-compliance-by-resource \
  --resource-types AWS::S3::Bucket AWS::EC2::Volume
```

### 5. Console Verification

1. **KMS Console**:
   - Navigate to KMS service
   - Verify two customer-managed keys exist with proper aliases
   - Verify key rotation is enabled

2. **S3 Console**:
   - Check bucket properties
   - Confirm default encryption is enabled with KMS
   - Test file upload without encryption settings (should fail)

3. **EC2/EBS Console**:
   - Navigate to EC2 → EBS → Settings
   - Verify "Always encrypt new EBS volumes" is enabled
   - Verify correct KMS key is set as default

4. **Config Console**:
   - Navigate to AWS Config → Rules
   - Verify both rules show COMPLIANT status
   - View detailed rule compliance reports

5. **IAM Console**:
   - Navigate to IAM → Groups
   - Verify AllUsers group has MFA policy attached
   - Test sign-in as test user and attempt privileged operation
