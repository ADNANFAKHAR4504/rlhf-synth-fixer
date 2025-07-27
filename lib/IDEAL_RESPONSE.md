# AWS IAM Security Configuration with CloudFormation

This solution provides a comprehensive IAM security configuration that enforces the principle of least privilege for EC2 instances and IAM users accessing S3 resources.

## Solution Overview

The CloudFormation template creates the following security resources:

1. **IAM Role for EC2 Instances** - Provides read-only S3 access with explicit write denial
2. **IAM User with S3 Policy** - Grants read-only access to a specific S3 bucket
3. **S3 Test Bucket** - A secure bucket for testing IAM policies
4. **Instance Profile** - Allows EC2 instances to assume the IAM role

## Implementation

### File Structure

```
lib/
├── TapStack.yml          # Main CloudFormation template with IAM security configuration
└── TapStack.json         # JSON version generated from YAML
```

### lib/TapStack.yml

The main CloudFormation template includes the following security resources:

**S3 Bucket Configuration:**
```yaml
TestS3Bucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Delete
  UpdateReplacePolicy: Delete
  Properties:
    BucketName: !Sub 'tap-test-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
```

**EC2 IAM Role with S3 Read-Only Access:**
```yaml
EC2InstanceRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: !Sub 'EC2S3ReadOnlyRole${EnvironmentSuffix}'
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: ec2.amazonaws.com
          Action: sts:AssumeRole
    Policies:
      - PolicyName: S3ReadOnlyAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:GetObjectVersion
                - s3:ListBucket
                - s3:ListBucketVersions
                - s3:GetBucketLocation
              Resource: 
                - !Sub '${TestS3Bucket}/*'
                - !Ref TestS3Bucket
            - Effect: Deny
              Action:
                - s3:PutObject
                - s3:PutObjectAcl
                - s3:DeleteObject
                - s3:DeleteObjectVersion
                - s3:CreateBucket
                - s3:DeleteBucket
                - s3:PutBucketPolicy
                - s3:DeleteBucketPolicy
              Resource: '*'
```

**Instance Profile for EC2:**
```yaml
EC2InstanceProfile:
  Type: AWS::IAM::InstanceProfile
  Properties:
    InstanceProfileName: !Sub 'EC2S3ReadOnlyInstanceProfile${EnvironmentSuffix}'
    Roles:
      - !Ref EC2InstanceRole
```

**IAM User and Policy:**
```yaml
TestIAMUser:
  Type: AWS::IAM::User
  Properties:
    UserName: !Sub 'TestS3ReadOnlyUser${EnvironmentSuffix}'

S3SpecificBucketReadOnlyPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyName: !Sub 'S3SpecificBucketReadOnly${EnvironmentSuffix}'
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:GetObjectVersion
            - s3:ListBucket
            - s3:ListBucketVersions
            - s3:GetBucketLocation
          Resource:
            - !Sub '${TestS3Bucket}/*'
            - !Ref TestS3Bucket
    Users:
      - !Ref TestIAMUser
```

## Security Features

### 1. Principle of Least Privilege
- **EC2 Role**: Only allows specific S3 read operations
- **IAM User**: Limited to read-only access on a specific bucket
- **Explicit Deny**: Prevents all S3 write operations for EC2 role

### 2. Resource-Specific Access
- IAM policies target only the specific test S3 bucket
- No wildcard permissions except for explicit denies
- Bucket-level and object-level permissions are clearly separated

### 3. Secure S3 Configuration
- Encryption enabled with AES256
- Public access completely blocked
- Secure bucket naming with account ID to prevent conflicts

## Deployment Commands

### Prerequisites
```bash
# Install dependencies
npm install
pipenv install

# Validate template
pipenv run cfn-lint lib/TapStack.yml --regions us-east-1

# Build TypeScript
npm run build
```

### Deploy Stack
```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export REPOSITORY=iac-test-automations
export COMMIT_AUTHOR=your-name

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags Repository=${REPOSITORY} CommitAuthor=${COMMIT_AUTHOR} \
  --region us-east-1
```

### Collect Outputs
```bash
# Create outputs directory
mkdir -p cfn-outputs

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs' \
  --output json > cfn-outputs/stack-outputs.json

# Flatten outputs for testing
node -e "
const outputs = require('./cfn-outputs/stack-outputs.json');
const flat = {};
outputs.forEach(o => flat[o.OutputKey] = o.OutputValue);
require('fs').writeFileSync('cfn-outputs/flat-outputs.json', JSON.stringify(flat, null, 2));
"
```

## Testing

### Unit Tests
```bash
# Convert YAML to JSON for testing
pipenv run cfn-flip-to-json > lib/TapStack.json

# Run unit tests
npm run test:unit
```

### Integration Tests
```bash
# Run integration tests (requires deployed resources)
npm run test:integration
```

## Usage Examples

### Attaching Role to EC2 Instance
```bash
# Create EC2 instance with the role
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.micro \
  --iam-instance-profile Name=EC2S3ReadOnlyInstanceProfile${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### Testing S3 Access
```bash
# Test read access (should work)
aws s3 ls s3://tap-test-bucket-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID}/

# Test write access (should fail)
aws s3 cp test.txt s3://tap-test-bucket-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID}/
```

## Cleanup

### Destroy Resources
```bash
# Empty S3 bucket first (if it contains objects)
aws s3 rm s3://tap-test-bucket-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID}/ --recursive

# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name TapStack${ENVIRONMENT_SUFFIX} --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name TapStack${ENVIRONMENT_SUFFIX} --region us-east-1
```

## Security Validation

The solution ensures:

1. **No Overprivileged Access**: IAM roles and policies grant only necessary permissions
2. **Explicit Denies**: Write operations are explicitly denied to prevent privilege escalation
3. **Resource Isolation**: Policies are scoped to specific resources, not account-wide
4. **Secure Defaults**: S3 bucket configured with encryption and public access blocked
5. **Environment Isolation**: Resource names include environment suffix for separation

This implementation meets all requirements while maintaining AWS security best practices and ensuring resources can be safely created and destroyed in testing environments.