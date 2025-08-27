I need help setting up secure S3 infrastructure for our data science team using AWS CDK in Java. We're implementing a zero-trust security approach following the latest AWS best practices from 2024.

Here's what I need to accomplish:

I want to create a secure S3 bucket called 'secure-data-bucket' that our data scientists can use to store and access sensitive datasets. The security requirements are pretty strict - we need to ensure all data is encrypted at rest using AWS-managed keys (SSE-S3), and the bucket should block all public access to prevent any accidental data exposure.

For access control, I need to set up an IAM role named 'DataScientistRole' that will be the only way to access this bucket. This role should have read and write permissions to the S3 bucket, but nothing else - we're following the principle of least privilege here. No other users or roles should have access to this bucket.

For compliance and monitoring purposes, I also need to enable S3 bucket access logging so we can track all activities and access patterns. This will help us with audit trails and security monitoring.

I'd like to use some of the newer S3 security features that AWS introduced recently, like the enhanced data integrity protections and make sure we're leveraging S3 Object Ownership to disable ACLs for simplified access management.

The infrastructure should be deployed to us-east-1 region and I need the CDK code to be well-structured with proper outputs so we can reference the resources in other parts of our infrastructure later.

Can you help me create the CDK Java code that implements this secure S3 setup with proper IAM policies and access logging? Please provide the complete infrastructure code with all necessary imports and configurations.