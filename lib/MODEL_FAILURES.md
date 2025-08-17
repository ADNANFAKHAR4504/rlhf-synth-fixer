## **Model Failures**

### **Failure 1 — Non-standard Condition Keys in S3 Bucket Policy**

**Statement:**
The model attempted to prevent public access to the CloudTrail bucket using `aws:PrincipalIsAWSService` and `aws:PrincipalServiceName`. These are **not valid S3 policy condition keys**, so the bucket policy may fail deployment or be ignored by AWS. Correct enforcement requires standard keys like `aws:PrincipalOrgID`, `aws:PrincipalArn`, or `aws:PrincipalAccount`.

**Code Snippet:**

```yaml
Condition:
  Bool:
    'aws:PrincipalIsAWSService': 'false'
  StringNotEquals:
    'aws:PrincipalServiceName':
      - cloudtrail.amazonaws.com
```

---

### **Failure 2 — Incomplete IAM Role Restrictions**

**Statement:**
The problem specification required that **only IAM roles are allowed to have assumable permissions**, explicitly avoiding root account access. The model partially applied this restriction (only for LambdaExecutionRole) but **did not apply it to other roles** such as `ConfigRole` or any future IAM roles. This is a security gap that could allow root or unmanaged users to assume sensitive roles.

**Code Snippet:**

```yaml
ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: !Sub 'AWSConfigRole-${Environment}'
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: sts:AssumeRole
```

---

### **Failure 3 — AWS Config Rule Input Parameters Formatting**

**Statement:**
The model passed JSON as a YAML block scalar for the `REQUIRED_TAGS` AWS Config rule. AWS Config expects **native YAML mapping**, not a string containing JSON. This could cause **template validation or rule creation to fail**.

**Code Snippet:**

```yaml
RequiredTagsRule:
  Type: AWS::Config::ConfigRule
  DependsOn: ConfigurationRecorder
  Properties:
    ConfigRuleName: 'required-tags'
    Description: 'Checks whether resources contain all required tags'
    Source:
      Owner: AWS
      SourceIdentifier: REQUIRED_TAGS
    InputParameters: |
      {
        "tag1Key": "Environment",
        "tag2Key": "Purpose"
      }
```

---

### **Failure 4 — Hardcoded TLS Policy**

**Statement:**
The ALB HTTPS listener uses an outdated TLS policy `ELBSecurityPolicy-TLS-1-2-2017-01`. For strict security compliance, the template should enforce **TLS 1.2 or 1.3 using the latest AWS-managed policies**. Using old policies could fail security audits.

**Code Snippet:**

```yaml
HTTPSListener:
  Type: AWS::ElasticLoadBalancingV2::Listener
  Properties:
    LoadBalancerArn: !Ref ApplicationLoadBalancer
    Port: 443
    Protocol: HTTPS
    SslPolicy: ELBSecurityPolicy-TLS-1-2-2017-01
    Certificates:
      - CertificateArn: !Sub 'arn:aws:acm:${AWS::Region}:${AWS::AccountId}:certificate/example-cert-id'
```

---

### **Failure 5 — RDS Master Password Handling**

**Statement:**
The property `ManageMasterUserPassword: true` is used without linking to **AWS Secrets Manager**, which is required for password management in CloudFormation for modern RDS instances. This could prevent RDS from successfully deploying or generate runtime errors.

**Code Snippet:**

```yaml
SecureRDSInstance:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceIdentifier: !Sub 'secure-db-${Environment}'
    DBInstanceClass: db.t3.micro
    Engine: mysql
    EngineVersion: '8.0'
    AllocatedStorage: 20
    StorageType: gp2
    StorageEncrypted: true
    KmsKeyId: !Ref RDSKMSKey
    DBSubnetGroupName: !Ref RDSSubnetGroup
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
    MasterUsername: admin
    ManageMasterUserPassword: true
```
