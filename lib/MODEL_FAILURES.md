# Model Failures 

---

### 1. **IAM Roles are overly permissive (violates least privilege)**

**Statement:** The IAM role grants `"ec2:*"` on all resources, which is not aligned with the principle of least privilege. Roles must be restricted to only the necessary actions.

**Code:**

```yaml
IAMRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: EC2Role-prod
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: ec2.amazonaws.com
          Action: sts:AssumeRole
    Policies:
      - PolicyName: EC2Policy
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action: "ec2:*"
              Resource: "*"
```

---

### 2. **Tags missing on some resources (non-compliant)**

**Statement:** Several resources (e.g., CloudTrail, Config Recorder, IAM Role) do not include the mandatory tags `Environment=Production` and `Project=IaC - AWS Nova Model Breaking`.

**Code Example (missing tags on CloudTrail):**

```yaml
CloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    TrailName: CloudTrail-prod
    S3BucketName: !Ref CloudTrailBucket
    IsLogging: true
```

*(No `Tags` property is defined here.)*

---

### 3. **Naming conventions not consistently applied (missing `prod` suffix)**

**Statement:** Not all resources follow the `prod` suffix requirement. For example, the Auto Scaling Group and some subnets lack the suffix.

**Code Example (Auto Scaling Group without `prod` suffix):**

```yaml
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    VPCZoneIdentifier:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2
    LaunchConfigurationName: !Ref LaunchConfig
    MinSize: "2"
    MaxSize: "5"
```

*(Here, `AutoScalingGroup` should have been named `AutoScalingGroup-prod` to comply with conventions.)*

---

### 4. **Security groups missing for EC2 and ELB**

**Statement:** The EC2 instances and Load Balancer are defined without security groups, leaving networking and traffic rules ambiguous and insecure.

**Code Example (EC2 LaunchConfiguration without SG):**

```yaml
LaunchConfig:
  Type: AWS::AutoScaling::LaunchConfiguration
  Properties:
    ImageId: ami-0abcdef1234567890
    InstanceType: t2.micro
    IamInstanceProfile: !Ref IAMRole
```

*(There is no `SecurityGroups` property, which should restrict inbound/outbound access.)*

---

### 5. **CloudTrail S3 bucket not fully secured (encryption/enforce SSL missing)**

**Statement:** The CloudTrail bucket does not enforce SSL-only access and lacks explicit bucket policy to prevent public access, which violates secure logging requirements.

**Code:**

```yaml
CloudTrailBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: cloudtrail-logs-prod
```

*(Only a plain S3 bucket is defined — no bucket policy enforcing HTTPS-only requests or denying non-encrypted uploads.)*


