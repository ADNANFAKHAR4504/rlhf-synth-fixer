I need to create infrastructure for a basic cloud application environment using Pulumi and JavaScript. The setup should include:

1. An S3 bucket with versioning enabled that allows public read access but restricts write access to authorized users only
2. An RDS instance using gp2 storage type with automatic backups enabled and a retention period of at least 7 days
3. A Lambda function with its code stored in the S3 bucket
4. Proper IAM roles and policies to grant the Lambda function the necessary permissions to access other resources
5. All resources should be deployed in the us-west-2 region
6. The solution should include outputs that export the S3 bucket name

I'd also like to incorporate some newer AWS features in this setup. I've heard about S3 Express One Zone's atomic renaming capabilities and Aurora Serverless v2's ability to scale to zero capacity - could you include relevant modern features where appropriate?

Please provide the complete infrastructure code with one code block per file. Make sure all security best practices are followed, especially for the S3 bucket permissions and IAM policies.