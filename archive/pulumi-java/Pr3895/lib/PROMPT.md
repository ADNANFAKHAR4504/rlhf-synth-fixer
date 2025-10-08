I need to create a multi-tenant storage architecture on AWS for a SaaS provider that handles 8,600 daily customer records. The solution needs tenant-specific encryption and data isolation.

Here are the specific requirements:

Create infrastructure code using Pulumi with Java that includes:

1. S3 buckets using a bucket-per-tenant strategy for 3 tenants (tenant-a, tenant-b, tenant-c). Each bucket should have versioning enabled and block public access.

2. KMS keys with separate encryption keys for each tenant. Each key should have appropriate key policies for tenant isolation.

3. IAM roles with tenant isolation policies. Create one role per tenant that can only access their specific bucket and KMS key.

4. Lambda function for cross-tenant data validation that can read from all tenant buckets but write nowhere. Include the Lambda code inline or reference it appropriately.

5. CloudWatch log groups and metric filters for per-tenant metrics. Create separate log groups for each tenant to track access patterns.

6. DynamoDB table for storing tenant configuration with tenant_id as the partition key and attributes for bucket_name, kms_key_id, and status.

7. CloudTrail with data events enabled for all tenant buckets to meet compliance auditing requirements. Configure it to log to a central audit bucket.

8. S3 Access Points - create one access point per tenant bucket with appropriate access point policies for controlled access.

Also incorporate S3 Access Grants which is a newer feature for more dynamic access control patterns.

Make sure all resources are properly tagged with tenant information and environment tags. Use us-east-1 as the region. Keep resource names clear and follow AWS naming conventions.

Provide the complete infrastructure code in separate files following Pulumi Java best practices.