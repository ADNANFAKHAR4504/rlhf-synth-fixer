Please design a fully automated, serverless image processing pipeline using Pulumi with Python to handle image resizing in AWS, meeting these requirements:

- When high-resolution images are uploaded to a specified source S3 bucket, the pipeline automatically triggers processing.
- Use AWS Lambda functions to resize images into two versions: 800x600 (standard) and 150x150 (thumbnail).
- Store the resized images in a separate, designated destination S3 bucket optimized for web display.
- Configure IAM roles with least privilege to allow Lambda access only to the source and destination S3 buckets and CloudWatch logging.
- Enable logging in CloudWatch Logs for monitoring processing success and errors.
- Set up event notifications on the source bucket to trigger the processing Lambda automatically upon image upload.
- Ensure the infrastructure is modular, reusable, and includes inline comments explaining resource configuration.
- Deploy the entire solution using Pulumi Python, strictly adhering to AWS best practices for security, efficiency, and scalability.
- The deployment should be region agnostic or specify a default AWS region.
- Ensure the solution validates successfully against AWS deployment standards and can be easily maintained or extended.

Remember to keep your solution modular.
is
