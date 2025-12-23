# PROMPT

I need to build a static website with a Lambda backend using CDK Python. Deploy everything to us-west-2.

## Static Website on S3

Create an S3 bucket to host static website content like HTML and CSS files. The bucket should have static website hosting enabled. Since we're putting CloudFront in front of it, keep the bucket private - CloudFront will access it through an Origin Access Identity.

## Lambda Function for Dynamic Content

Set up a Lambda function written in Python that handles dynamic content requests. The Lambda needs to read from the S3 bucket to serve content, so make sure it has the right IAM permissions. When users hit certain endpoints, the request flows through CloudFront to Lambda for processing.

## CloudFront Distribution

Put a CloudFront distribution in front of both the S3 bucket and Lambda function. CloudFront connects to S3 as the default origin for static files and routes API requests to Lambda. This gives us HTTPS, caching, and global edge distribution. Configure custom error pages so users see a nice error page instead of raw S3 errors.

## IAM Configuration

Create an IAM role for the Lambda function following least privilege principles. The Lambda only needs permissions to read from the S3 bucket and write logs to CloudWatch. The CloudFront Origin Access Identity needs GetObject permission on the S3 bucket.

## How the pieces connect

Static requests flow from users through CloudFront to S3. Dynamic requests go through CloudFront to Lambda, which can read from S3 if needed. CloudFront caches responses at edge locations to reduce latency. The Origin Access Identity lets CloudFront access the private S3 bucket securely.

## Deployment

Include sample HTML files that get uploaded to S3 during deployment. The Lambda function code should be bundled and deployed through CDK. Output the CloudFront URL so we can test the site after deployment.
