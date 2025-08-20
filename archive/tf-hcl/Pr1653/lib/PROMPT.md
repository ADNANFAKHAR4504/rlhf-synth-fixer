# Infrastructure Requirements

I need to create Terraform HCL infrastructure code for an S3-Lambda integration system in the us-east-1 region. The requirements are:

1. Create an S3 bucket with versioning enabled 
2. Implement a bucket policy that allows public read access to objects in the bucket
3. Set up a Lambda function that is triggered by S3 bucket events when objects are created
4. All resources must follow 'corp-' naming convention 
5. Follow AWS best practices with proper IAM roles and least privilege permissions

Additional considerations:
- The Lambda function should use the latest AWS Lambda scaling improvements (1,000 concurrent executions every 10 seconds)
- Consider implementing S3 default data integrity protections for new object uploads, a recent feature introduced in 2024

Please provide complete Terraform HCL infrastructure code with one code block per file that can be directly copied and used. Include proper IAM policies for the Lambda function to access S3 and CloudWatch logs.