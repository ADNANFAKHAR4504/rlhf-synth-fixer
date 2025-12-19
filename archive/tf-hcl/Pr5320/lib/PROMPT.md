Hey team, we need to build an automated image processing system for our media company client. They're handling around 2,000 daily users who upload images, and we need to automatically generate thumbnails for each upload. Use Terraform with HCL to set up the entire infrastructure.

Here's what we're looking for: Set up an S3 bucket as the main upload destination. When users upload images, we'll need automatic triggers to kick off the processing. Configure the bucket with AES256 encryption and make sure all public access is blocked - we don't want any accidental data exposure. Add versioning to the bucket so we can track changes and recover from any mistakes.

For the processing logic, we'll use Lambda functions running Python 3.9. The Lambda should trigger automatically when new images land in the S3 bucket. It'll read the original image, generate thumbnail versions (let's go with standard sizes: 150x150 for thumbnails and 800x600 for preview), and save them back to S3 in a processed folder. Make sure the Lambda has enough memory allocated - image processing can be memory-intensive, so let's set it to at least 1024MB with a 60-second timeout.

We need DynamoDB to store metadata about each processed image. Track things like original filename, upload timestamp, processing timestamp, file sizes, thumbnail locations, and processing status. Set up the table with on-demand billing since we're dealing with variable traffic throughout the day. Add a global secondary index on the user ID so we can quickly query all images for a specific user.

For monitoring, set up CloudWatch to track our processing metrics. We need dashboards showing daily processing counts, average processing time, error rates, and Lambda invocation counts. Configure alarms for when error rates exceed 5% or when processing time goes above 30 seconds. Also set up log groups for the Lambda functions with 7-day retention to keep costs down.

Security-wise, create specific IAM roles with least-privilege access. The Lambda execution role should only have permissions to read from the upload prefix, write to the processed prefix, read and write to the specific DynamoDB table, and write logs to CloudWatch. No wildcards in the policies - be explicit about resource ARNs.

Since this is for a media company with cost concerns, add lifecycle policies to move processed images to S3 Standard-IA after 30 days and delete thumbnails after 90 days. Tag everything with Environment, Project, and CostCenter tags for billing tracking.

For the file organization, structure it like this:
- lib/provider.tf for AWS provider configuration
- lib/main.tf for all the resource definitions
- Use the environmentSuffix pattern for all resource names to support multiple environments

Make sure outputs include the S3 bucket name, Lambda function ARN, DynamoDB table name, and CloudWatch dashboard URL so the ops team can easily access everything after deployment.