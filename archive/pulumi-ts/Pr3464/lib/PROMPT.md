Create infrastructure code using Pulumi TypeScript for a podcast hosting platform in AWS region us-west-2.

Requirements:
- Deploy S3 bucket for audio file storage with requester pays enabled to manage bandwidth costs
- Configure CloudFront distribution with signed cookies for secure subscriber-only access to audio content
- Implement Lambda@Edge function for authorization and access control at CloudFront edge locations
- Set up Route 53 hosted zone and DNS records for domain management
- Configure MediaConvert for audio transcoding to multiple bitrates (128kbps, 192kbps, 320kbps)
- Create DynamoDB table for storing subscriber data and metadata
- Set up CloudWatch dashboards and alarms for monitoring streaming metrics
- Configure IAM roles and policies for secure content access control between services

The platform needs to support 6,900 daily listeners with secure audio streaming and subscription management capabilities. Ensure the S3 bucket uses requester pays to offload bandwidth costs, CloudFront uses signed cookies for subscriber authentication, and MediaConvert creates multiple bitrate versions for adaptive streaming.

Include Application Composer integration for visualizing the architecture and utilize EventBridge Scheduler for automated content processing tasks.

Please provide the complete infrastructure code with one code block per file.