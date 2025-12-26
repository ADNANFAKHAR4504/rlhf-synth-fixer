1. S3 Bucket Naming Convention

Model Response: Uses uppercase characters in the ProjectName default value ("SecureWebApp"), which causes deployment failure with error "Bucket name should not contain uppercase characters" when the bucket name is constructed as `${ProjectName}-assets-${AWS::AccountId}`.
Ideal Implementation: Uses lowercase naming convention with hyphens ("secure-web-app") that complies with S3 bucket naming requirements, preventing deployment failures.

2. VPC Parameter Requirement

Model Response: Defines VpcId parameter with Type "AWS::EC2::VPC::Id", making it a required parameter that forces users to provide a valid VPC ID during deployment, even though the VPC is not actually used by any resources in the template.
Ideal Implementation: Uses Type "String" with an empty default value, making the parameter optional and documenting it as "not currently used", allowing deployment without requiring unnecessary inputs.

3. ACM Certificate Requirement

Model Response: Defines ACMCertificateArn as a required parameter with no default value, forcing users to provide an SSL certificate even for development/testing environments, blocking deployment for users without custom domains or certificates.
Ideal Implementation: Makes ACMCertificateArn optional with an empty string default, and uses conditional logic (HasSSLCertificate condition) to fall back to CloudFront default certificate when not provided, enabling deployment in any environment.

4. WAF Regional Deployment Constraint

Model Response: Creates WAF WebACL without regional conditions, causing deployment failures in regions other than us-east-1 since CloudFront-scoped WAF resources can only be created in us-east-1.
Ideal Implementation: Applies Condition: "IsUsEast1" to the WAFWebACL resource, ensuring it's only created when deploying to us-east-1, and conditionally references the WAF in CloudFront configuration to prevent cross-region deployment failures.

5. CloudFront SSL Certificate Configuration

Model Response: Hardcodes ACM certificate configuration in ViewerCertificate without conditional logic, requiring an ACM certificate for all deployments and causing failures when the certificate parameter is not provided.
Ideal Implementation: Uses Fn::If with HasSSLCertificate condition to dynamically configure ViewerCertificate, providing either custom ACM certificate settings or CloudFrontDefaultCertificate based on parameter availability.

6. CloudFront WAF Association Logic

Model Response: Unconditionally references WAF WebACL ARN in CloudFront's WebACLId property, causing deployment failures in non-us-east-1 regions where the WAF resource doesn't exist, and adds unnecessary DependsOn: ["WAFWebACL"] creating potential circular dependency risks with S3BucketPolicy.
Ideal Implementation: Uses Fn::If with IsUsEast1 condition to conditionally set WebACLId to either WAF ARN or AWS::NoValue, allowing successful CloudFront deployment in all regions without WAF when not in us-east-1, and removes explicit DependsOn to avoid circular dependencies.

7. Environment Default Safety

Model Response: Sets Environment parameter default to "Production", risking accidental production deployments during testing or development scenarios where users don't explicitly set the parameter.
Ideal Implementation: Uses "Development" as the default Environment value, providing a safer default that encourages explicit production deployments and prevents accidental production resource creation during testing.

8. Resource Creation Dependencies

Model Response: Explicitly sets DependsOn: ["WAFWebACL"] on CloudFrontDistribution, which combined with S3BucketPolicy's reference to CloudFrontDistribution.Id creates potential circular dependency issues during stack updates and prevents proper resource cleanup ordering.
Ideal Implementation: Omits explicit DependsOn declarations, relying on CloudFormation's automatic dependency detection through Ref and GetAtt intrinsic functions, allowing proper dependency graph construction and resource lifecycle management.

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | Community Edition | Pro/Ultimate Edition | Solution Applied | Production Status |
|---------|-------------------|---------------------|------------------|-------------------|
| CloudFront | Limited support | Full support | Conditional deployment with IsUsEast1 condition | Enabled in AWS |
| WAFv2 | Not supported | Full support | Conditional deployment with IsUsEast1 condition | Enabled in AWS |
| S3 Origin Access Control | Not supported | Partial support | Falls back to Origin Access Identity for LocalStack | Enabled in AWS |
| ACM Certificates | Limited | Full support | Made optional with CloudFront default certificate fallback | Enabled in AWS |

### Environment Detection Pattern Used

The template uses CloudFormation conditions for regional and environment-based deployment:

```yaml
Conditions:
  IsUsEast1: !Equals [!Ref "AWS::Region", "us-east-1"]
  HasSSLCertificate: !Not [!Equals [!Ref ACMCertificateArn, ""]]
```

### Services Verified Working in LocalStack

- S3 (full support)
- Lambda (basic support)
- API Gateway (basic support)
- CloudFormation (full support)

### Notes for LocalStack Deployment

1. CloudFront and WAF are conditionally created only in us-east-1 region
2. When deploying to LocalStack, ensure AWS_REGION is NOT set to us-east-1 to skip CloudFront/WAF
3. S3 bucket policy allows CloudFront access conditionally based on region
4. All core functionality (S3, Lambda, API Gateway) works in LocalStack without CloudFront/WAF