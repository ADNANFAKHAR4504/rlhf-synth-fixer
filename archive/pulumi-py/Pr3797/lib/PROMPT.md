I need to set up a CDN infrastructure with edge computing capabilities for a service that handles around 18,900 requests per day. The solution should support A/B testing and user personalization at the edge.

Here are the requirements:

1. Create a CloudFront distribution with multiple cache behaviors to handle different content types
2. Set up an S3 bucket as the origin for storing static content
3. Implement Lambda@Edge functions for:
   - Request manipulation for A/B testing (routing users to different versions)
   - Response manipulation for adding custom headers and personalization
4. Configure a DynamoDB table to store edge configuration data like A/B test variants and user preferences
5. Set up AWS WAF with CloudFront to provide security, including geo-blocking rules to restrict access from specific countries
6. Create a Route 53 hosted zone and DNS records pointing to the CloudFront distribution
7. Configure CloudWatch logs and metrics for monitoring edge function performance and CDN metrics
8. Set up appropriate IAM roles and policies for Lambda@Edge functions to access DynamoDB and CloudWatch

Additional requirements:
- Use CloudFront KeyValueStore for low-latency lookup data that Lambda@Edge functions can access
- Configure CloudFront cache behaviors with appropriate TTLs for different content paths
- The infrastructure should be deployed in us-west-2 region
- Make sure Lambda@Edge functions are created in us-east-1 (required for Lambda@Edge)

Please provide the complete Pulumi Python code to create this infrastructure. Each file should be in its own code block with clear file paths.