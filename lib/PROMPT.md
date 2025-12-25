I need to create Pulumi TypeScript infrastructure for a comprehensive cloud application using Amazon S3, Amazon RDS, AWS Lambda, AWS Systems Manager Parameter Store, and Amazon EventBridge. The infrastructure should be deployable in the us-west-2 region and meet the following requirements:

1. Set up an S3 bucket with versioning enabled and configure it to allow public read access while restricting write access to authorized users only
2. Create an RDS instance using 'gp2' storage type with automatic backups enabled and at least 7 days retention period
3. Deploy a Lambda function with its code stored in the S3 bucket
4. Create the necessary IAM roles and policies to grant the Lambda function proper permissions
5. Include stack outputs to export the S3 bucket name
6. Implement AWS Systems Manager Parameter Store integration to securely store and retrieve RDS connection details, including database endpoint, username, and password
7. Configure Amazon EventBridge with a custom event bus to handle application events, with Lambda publishing events when processing S3 objects and rules for routing events to monitoring systems

I'd also like to use some of AWS's recent features including S3 default data integrity protections for uploaded objects, Lambda's improved scaling capabilities, Systems Manager Parameter Store's enhanced secret rotation capabilities, and EventBridge's advanced event pattern matching that were introduced in 2024.

Please provide the infrastructure code with proper TypeScript types and ensure all resources follow Pulumi best practices. Make sure to structure the code in multiple files for better organization.
