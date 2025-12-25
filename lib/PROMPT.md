I need help setting up secure S3 infrastructure for our data science team using AWS CDK in Java. We're implementing a zero-trust security approach following the latest AWS best practices from 2024.

Here's what I need to accomplish:

I want to create a secure S3 bucket called 'secure-data-bucket' that our data scientists can use to store and access sensitive datasets. The security requirements are pretty strict - we need to ensure all data is encrypted at rest using AWS-managed SSE-S3 encryption keys, and the bucket should block all public access to prevent any accidental data exposure.

For access control, I need to set up an IAM role named 'DataScientistRole' that will be the only way to access this bucket. This role should have read and write permissions to the S3 bucket, but nothing else - we're following the principle of least privilege here. No other users or roles should have access to this bucket. The IAM role will be integrated with the S3 bucket through explicit bucket policies that grant access only to this specific role ARN, creating a secure authentication and authorization chain between IAM and S3.

For compliance and monitoring purposes, I also need to enable S3 bucket access logging so we can track all activities and access patterns. The access logs should be written to a separate logging bucket, and the logging configuration should integrate with the main bucket's security controls to ensure logs capture all access attempts including both successful and denied requests. This logging integration will feed into our broader security monitoring and alerting system, providing audit trails that can be analyzed for compliance reporting and anomaly detection.

I'd like to use some of the newer S3 security features that AWS introduced recently, like the enhanced data integrity protections and make sure we're leveraging S3 Object Ownership to disable ACLs for simplified access management.

The infrastructure should be deployed to us-east-1 region and I need the CDK code to be well-structured with proper outputs so we can reference the resources in other parts of our infrastructure later. The outputs should include the bucket ARN, the IAM role ARN, and the logging bucket name, which will be used downstream by our data science applications to establish connections, configure SDK clients with the correct IAM credentials, and set up monitoring dashboards.

The complete architecture creates an integrated security workflow where: first, data scientists assume the IAM role to get temporary credentials; second, these credentials are validated against the S3 bucket policy to grant access; third, all access attempts are logged to the logging bucket; and finally, the logs are available for compliance auditing and security monitoring through integration with our CloudWatch and security tooling.

Can you help me create the CDK Java code that implements this secure S3 setup with proper IAM policies, access logging configuration, and all the necessary service integrations? Please provide the complete infrastructure code with all necessary imports and configurations that demonstrates how these AWS services connect and work together.
