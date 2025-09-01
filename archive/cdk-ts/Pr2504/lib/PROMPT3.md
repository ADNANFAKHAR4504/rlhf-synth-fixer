🚨 S3 Bucket Policy Creation Failed

Error:

CREATE_FAILED | AWS::S3::BucketPolicy | TapS3Bucket/Policy
User: arn:aws:sts::... is not authorized to perform: s3:PutBucketPolicy 
because public policies are blocked by the BlockPublicPolicy setting.
(Service: S3, Status Code: 403)


Cause:
AWS accounts by default enforce Block Public Access (BPA) on all S3 buckets. When CDK tries to attach a bucket policy that could allow public access (even indirectly), CloudFormation fails with AccessDenied due to the BlockPublicPolicy setting.

Fix Options:

If the bucket must remain private (recommended):

Remove or modify the bucketPolicy statement in your CDK code so it doesn’t grant Principal: * or public access.

Example:

const bucket = new s3.Bucket(this, "TapS3Bucket", {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // default secure setting
});


If controlled public access is required (edge case):

Explicitly disable blockPublicAccess on the bucket (not recommended for sensitive data):

const bucket = new s3.Bucket(this, "TapS3Bucket", {
  blockPublicAccess: s3.BlockPublicAccess.NONE,
});


Ensure policies are least-privilege and scoped tightly.

Validate execution role permissions:

Ensure the cdk-hnb659fds-cfn-exec-role has s3:PutBucketPolicy permissions if you intend to attach bucket policies.

Recommendation:
Keep S3 buckets private by default and use IAM roles or signed URLs for controlled access. Only relax Block Public Access if there is a business-critical justification.