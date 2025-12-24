# MODEL_FAILURES.md

### Failure 1: S3 Bucket Encryption and Privacy

**Issue Statement:**
The model response did not enforce private access and KMS encryption for all S3 buckets by default, as required by the prompt.

**Expected (from tapstack.yml / Ideal Response):**

```yaml
Resources:
  ProdTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-prod-trail-bucket'
      AccessControl: Private
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
```

**Model Response Snippet:**

```yaml
Resources:
  ProdTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-prod-trail-bucket'
      AccessControl: PublicRead
      # No KMS encryption applied
```

**Discrepancy:**

- Access control incorrectly set to public.
- Missing server-side encryption using KMS.

### Failure 2: IAM Roles and Least Privilege

**Issue Statement:**
IAM roles in the model response did not adhere to the principle of least privilege; some roles were overly permissive.

**Expected:**

```yaml
Resources:
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: EC2LimitedAccess
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource: '*'
```

**Model Response Snippet:**

```yaml
Resources:
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AdministratorAccess
```

**Discrepancy:**

- Used `AdministratorAccess` → violates least privilege requirement.
- Does not define scoped policies for specific resource access.

### Failure 3: Auto Scaling Group Configuration

**Issue Statement:**
The model response did not ensure a minimum capacity of 2 instances for the Auto Scaling Group, nor did it handle conditional creation if an ASG already exists.

**Expected:**

```yaml
Resources:
  ProdAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 2
      MaxSize: 4
      LaunchTemplate:
        LaunchTemplateId: !Ref ProdLaunchTemplate
      VPCZoneIdentifier: !Ref PrivateSubnets
```

**Model Response Snippet:**

```yaml
Resources:
  ProdAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 1
      MaxSize: 3
      LaunchConfigurationName: !Ref ProdLaunchConfig
```

**Discrepancy:**

- `MinSize` is 1 instead of 2.
- Uses `LaunchConfiguration` instead of `LaunchTemplate`.
- Missing conditional logic for existing ASG reuse.

### Failure 4: Elastic Load Balancer Integration

**Issue Statement:**
The model response did not integrate ELB correctly with the ASG, and conditional checks for existing ELB were missing.

**Expected:**

```yaml
Resources:
  ProdALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-prod-alb'
      Subnets: !Ref PublicSubnets
      Scheme: internet-facing
```

**Model Response Snippet:**

```yaml
Resources:
  ProdALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${ProjectName}-alb'
      Subnets: !Ref PublicSubnets
      Scheme: internal
```

**Discrepancy:**

- Scheme set to `internal` instead of `internet-facing`.
- No conditional check for reusing an existing ALB.

### Failure 5: CloudTrail and AWS Config

**Issue Statement:**
The model response did not fully enable CloudTrail to log all API calls into a secure S3 bucket, and AWS Config resource monitoring was incomplete.

**Expected:**

```yaml
Resources:
  ProdCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      S3BucketName: !Ref ProdTrailBucket
      IsLogging: true
```

**Model Response Snippet:**

```yaml
Resources:
  ProdCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      S3BucketName: !Ref ProdTrailBucket
      IsLogging: false
```

**Discrepancy:**

- `IsLogging` set to false → CloudTrail not enabled.
- Missing AWS Config rules for compliance monitoring.

### Failure 6: Tagging and Naming Conventions

**Issue Statement:**
Resource tags and naming conventions in the model response did not follow the `prod` suffix requirement and missed mandatory tags.

**Expected:**

```yaml
Tags:
  - Key: Environment
    Value: Production
  - Key: Project
    Value: IaC-AWS-Nova-Model-Breaking
```

**Model Response Snippet:**

```yaml
Tags:
  - Key: Environment
    Value: Dev
  - Key: Project
    Value: IaC-Project
```

**Discrepancy:**

- Wrong environment tag (`Dev` instead of `Production`).
- Project tag does not match prompt requirement.
- Resource names missing consistent `prod` suffix.
