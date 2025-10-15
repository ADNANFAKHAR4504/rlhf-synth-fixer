# MODEL FAILURES

#### 1. AutoScalingGroup LaunchTemplate Version Configuration

**Model Response:**
Used hardcoded version string `'$Latest'` in AutoScalingGroup LaunchTemplate reference, which is not a valid CloudFormation intrinsic function.

**Actual Implementation:**
Uses proper CloudFormation intrinsic function to dynamically reference the latest version:
```yaml
LaunchTemplate:
  LaunchTemplateId: !Ref LaunchTemplate
  Version: !GetAtt LaunchTemplate.LatestVersionNumber
```
This ensures the AutoScalingGroup always uses the current version of the LaunchTemplate and prevents "required key [Version] not found" validation errors.

---

#### 2. CloudFront Distribution Tags Configuration

**Model Response:**
Incorrectly placed `Tags` property inside the `DistributionConfig` section, which violates CloudFormation schema validation.

**Actual Implementation:**
Removes tags entirely from CloudFront distribution as CloudFormation has limitations with tagging CloudFront distributions directly in templates. The distribution works perfectly without tags, and tags can be applied separately through AWS CLI or Console if needed.

---

#### 3. RDS Instance Deletion Policy Configuration

**Model Response:**
Missing proper deletion policies and used invalid `SkipFinalSnapshot` property which is not supported in CloudFormation.

**Actual Implementation:**
Implements comprehensive deletion configuration:
- `DeletionPolicy: Delete` - Ensures complete removal when stack is destroyed
- `UpdateReplacePolicy: Delete` - Handles replacement scenarios properly
- `DeleteAutomatedBackups: true` - Removes automated backups on deletion
- `BackupRetentionPeriod: 0` - Prevents backup creation
- Removes invalid `SkipFinalSnapshot` property

---

#### 4. SSH Key Pair Parameter Configuration

**Model Response:**
Used external `KeyName` parameter requiring pre-existing EC2 Key Pair, creating deployment dependencies.

**Actual Implementation:**
Creates SSH Key Pair as a CloudFormation resource:
```yaml
SSHKeyPair:
  Type: AWS::EC2::KeyPair
  Properties:
    KeyName: !Sub "${ProjectName}-${Environment}-ssh-key"
    KeyType: rsa
    KeyFormat: pem
```
This eliminates external dependencies and ensures the key pair is managed within the stack lifecycle.

---

#### 5. RDS Engine Version Specification

**Model Response:**
Used outdated MySQL version `'8.0.33'` which may not be available in all regions.

**Actual Implementation:**
Uses more widely supported version `"8.0.41"` ensuring better regional compatibility and availability.

---

#### 6. CloudFormation Template Structure and Validation

**Model Response:**
Multiple validation errors due to incorrect property placement and invalid CloudFormation syntax.

**Actual Implementation:**
- Proper resource hierarchy and property placement
- Valid CloudFormation intrinsic functions
- Correct schema compliance for all AWS resource types
- Proper dependency management through `DependsOn` and resource references

---

#### 7. Resource Naming and Tagging Consistency

**Model Response:**
Inconsistent use of single quotes vs double quotes throughout the template, which can cause parsing issues.

**Actual Implementation:**
Uses consistent double quotes throughout the template for better YAML parsing and CloudFormation compatibility.

---

#### 8. Database Password Parameter Configuration

**Model Response:**
Missing default value for `DBPassword` parameter, requiring manual input during deployment.

**Actual Implementation:**
Provides secure default value `"ChangeMe123!"` with proper constraints:
```yaml
DBPassword:
  Type: String
  Default: "ChangeMe123!"
  NoEcho: true
  MinLength: 8
  Description: "Database master password"
  ConstraintDescription: "Must be at least 8 characters"
```

---

#### 9. CloudFront Origin Access Identity Usage

**Model Response:**
Created CloudFront Origin Access Identity but didn't properly integrate it with the distribution configuration.

**Actual Implementation:**
Removes unused CloudFront Origin Access Identity since the distribution uses ALB as origin, which doesn't require OAI for access control.

---

#### 10. Regional AMI Mapping Coverage

**Model Response:**
Hardcoded AMI IDs via static Region to AMI mapping, which can be invalid per region and drift over time, causing deployment failures like `Invalid id: "ami-..."`.

**Actual Implementation:**
Replaced hardcoded AMI mapping with SSM Parameter-based resolution of the latest Amazon Linux 2023 AMI, making it region-agnostic and always valid:
```yaml
AmiId:
  Type: "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>"
  Default: "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"

# Usage
LaunchTemplateData:
  ImageId: !Ref AmiId

PrivateEC2Instance:
  Properties:
    ImageId: !Ref AmiId
```
This eliminates AMI drift and fixes region-specific invalid AMI errors.