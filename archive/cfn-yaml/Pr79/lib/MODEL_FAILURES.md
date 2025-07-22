## MODEL_FAILURE.md

### Summary  
The generated CloudFormation YAML template fails to meet multiple critical security, scalability, and AWS best practice expectations outlined in the prompt. These failures include insecure RDS networking, broken S3 policy structure, incorrect CloudFront configuration, use of deprecated resources, and lack of encrypted data handling.

---

### Detailed Failures

#### 1. 🔐 RDS Deployed in Public Subnets  
- **Issue**: `RDSSubnetGroup` uses `PublicSubnet1`, `PublicSubnet2`, and `PublicSubnet3`, exposing the database directly to the internet.  
- **Fix**: Move RDS into **private subnets** by defining new `AWS::EC2::Subnet` resources with no internet routing.

---

#### 2. ❌ Inline S3 Bucket Policy Block  
- **Issue**: `BucketPolicy` is incorrectly nested inside the `AWS::S3::Bucket` resource, which is unsupported in CloudFormation.  
- **Fix**: Define `AWS::S3::BucketPolicy` as a separate resource and reference the S3 bucket using `!Ref`.

---

#### 3. ❌ Invalid CloudFront Origin Configuration  
- **Issue**: `S3OriginConfig` includes `OriginAccessIdentity: ""` (empty), and `OriginAccessControl` is not defined.  
- **Fix**: Use `OriginAccessControl` (preferred) or valid `OriginAccessIdentity` to securely restrict CloudFront access to the S3 bucket.

---

#### 4. 🚫 WAF Not Associated  
- **Issue**: A `WAF` WebACL is declared but never associated with any CloudFront or ALB resource.  
- **Fix**: Attach the WebACL to `CloudFrontDistribution` via `WebACLId`, or use `AWS::WAFv2::WebACLAssociation` for ALB.

---

#### 5. ⚠️ Hardcoded RDS Credentials  
- **Issue**: `MasterUsername: admin` and `MasterUserPassword: SecretPassword123` are insecurely hardcoded.  
- **Fix**: Use `AWS::SecretsManager::Secret` and inject credentials using `!Ref` or `!Sub`.

---

#### 6. ⚠️ S3 Bucket Policy Reference Fails  
- **Issue**: The policy references `!Sub "arn:aws:s3:::${S3Bucket}/*"`, which fails evaluation due to circular dependency.  
- **Fix**: Use `!GetAtt S3Bucket.Arn` and `!Join` if needed, or define the policy separately after bucket creation.

---

#### 7. ❌ Launch Configuration is Deprecated  
- **Issue**: Uses `AWS::AutoScaling::LaunchConfiguration`, which is deprecated.  
- **Fix**: Replace with `AWS::AutoScaling::LaunchTemplate` and define `InstanceType`, `ImageId`, and `IamInstanceProfile`.

---

#### 8. ❌ Mixed LoadBalancerNames and TargetGroupARNs  
- **Issue**: `AutoScalingGroup` specifies both `LoadBalancerNames` (Classic) and `TargetGroupARNs` (ALB), which is not allowed.  
- **Fix**: Remove `LoadBalancerNames` and use only `TargetGroupARNs`.

---

#### 9. 🔒 Missing ALB HTTPS Listener  
- **Issue**: Only HTTP (`Port: 80`) listener is defined for ALB.  
- **Fix**: Add an HTTPS listener with `Port: 443` and valid ACM certificate.

---

#### 10. 📉 No Logging or Monitoring  
- **Issue**: No CloudTrail, CloudFront, ALB, or RDS logs are enabled.  
- **Fix**:  
  - Enable logging for all applicable services  
  - Add CloudTrail  
  - Create a dedicated S3 logging bucket

---

### Conclusion  
Although syntactically valid, the CloudFormation template does **not fulfill the high-availability, secure, and production-grade requirements** described in the original prompt. It violates key AWS architecture principles, contains deprecated resources, insecure practices, and lacks proper monitoring — **failing the model evaluation** by expert standards.