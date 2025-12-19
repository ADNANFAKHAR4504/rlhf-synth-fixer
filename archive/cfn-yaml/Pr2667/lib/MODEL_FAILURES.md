During the development and refinement of **lib/TapStack.yml**, the following errors and issues were encountered:

1. **Linting Errors**
   - `E1020` – Unsupported parameter type when attempting to use `AWS::SSM::Parameter::Value` incorrectly.
   - `E3001` – Misconfigured S3 bucket resource due to additional or misplaced properties.
   - `E3045` – A bucket with `AccessControl` set must also have `OwnershipControls`.
   - `W3045` – `AccessControl` flagged as a legacy property, requiring replacement with an `AWS::S3::BucketPolicy`.

2. **Deployment Failures**
   - **CloudFront Logging Failure**:  
     Error – *“The S3 bucket that you specified for CloudFront logs does not enable ACL access”*.  
     Cause – Buckets created with `BucketOwnerEnforced` disabled ACLs by default. CloudFront requires ACL support for log delivery.  
     Resolution – Used `ObjectOwnership: ObjectWriter` and `BucketPolicy` instead of legacy `AccessControl`.

   - **CloudFront Distribution Failure**:  
     Error – *“The parameter ForwardedValues is required”*.  
     Cause – Initially omitted `CachePolicyId` or `ForwardedValues`.  
     Resolution – Switched to AWS-managed `CachePolicyId` for caching behavior.

   - **Parameter Validation Errors**:  
     Error – *“Parameters [KeyPairName, DomainName, HostedZoneId, CertificateArn] must have values”*.  
     Cause – Required parameters not provided in stack launch.  
     Resolution – Added safe defaults and conditions to allow optional parameters.

3. **Test Failures**
   - Unit and integration tests failed due to missing parameters (`EnvironmentSuffix`), missing resources (`TurnAroundPromptTable`), and mismatched outputs.
   - Resource count assertions failed because the test harness expected a minimal template while the real template included many resources.

---

## Key Lessons
- CloudFront logging **cannot work with ACLs disabled**. Using a dedicated log bucket with `ObjectWriter` ownership and a bucket policy is the stable solution.
- Avoid `AccessControl` for new S3 buckets; use `BucketPolicy` instead.
- Always align template parameters with test expectations (e.g., provide `EnvironmentSuffix` if required).
- When CloudFormation deploy errors mention **“must have values”**, it indicates that parameters were not provided or defaults weren’t set.