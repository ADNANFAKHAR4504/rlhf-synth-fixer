## **Model Failures**

### 1. **S3 Bucket Privacy & KMS Encryption**

**Failure Statement:**
The model created S3 buckets but did not enforce **private access by default** and **KMS encryption** on all buckets, which violates the prompt requirements.

**Code Reference from Model Response:**

```yaml
Resources:
  AppLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: app-logs
```

**Corrected Implementation (from `tapstack.yml`):**

```yaml
Resources:
  AppLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
      AccessControl: Private
```

---

### 2. **IAM Roles Principle of Least Privilege**

**Failure Statement:**
The model generated IAM roles with overly broad permissions (`AdministratorAccess`) instead of **least privilege roles per service**, as required by the prompt.

**Code Reference from Model Response:**

```yaml
Resources:
  EC2AdminRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument: {...}
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AdministratorAccess
```

**Corrected Implementation:**

```yaml
Resources:
  EC2AppRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument: {...}
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess
```

---

### 3. **Auto Scaling Group & ELB Integration**

**Failure Statement:**
The model included EC2 instances but did **not place them in an Auto Scaling Group** with minimum capacity 2, nor did it attach them to an **Elastic Load Balancer**, violating the deployment requirements.

**Model Response Code:**

```yaml
Resources:
  AppServer:
    Type: AWS::EC2::Instance
    Properties: {...}
```

**Corrected Implementation:**

```yaml
Resources:
  AppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 2
      MaxSize: 5
      LaunchConfigurationName: !Ref AppLaunchConfig
      VPCZoneIdentifier: !Ref SubnetIds
  AppLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties: {...}
```

---

### 4. **CloudTrail Logging & AWS Config**

**Failure Statement:**
The model did not configure **CloudTrail** to log all API calls to a secure bucket, and **AWS Config** was missing for compliance monitoring.

**Model Response Code:**

```yaml
Resources:
  None
```

**Corrected Implementation:**

```yaml
Resources:
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      IsLogging: true
      S3BucketName: !Ref AppLogsBucket
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties: {...}
```

---

### 5. **VPC Isolation**

**Failure Statement:**
The model failed to deploy all resources within a **dedicated VPC**, violating isolation requirements.

**Model Response Code:**

```yaml
Resources:
  AppServer:
    Type: AWS::EC2::Instance
    Properties: {...} # No VPC specification
```

**Corrected Implementation:**

```yaml
Resources:
  ProdVPC:
    Type: AWS::EC2::VPC
    Properties: {...}
  AppAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier: !Ref SubnetIds
```

---

### 6. **Resource Tagging**

**Failure Statement:**
The model did not add **required tags** (`Environment: Production`, `Project: IaC - AWS Nova Model Breaking`) to all resources.

**Model Response Code:**

```yaml
Resources:
  AppServer: {...} # No Tags
```

**Corrected Implementation:**

```yaml
Resources:
  AppServer:
    Type: AWS::EC2::Instance
    Properties:
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: IaC - AWS Nova Model Breaking
```
