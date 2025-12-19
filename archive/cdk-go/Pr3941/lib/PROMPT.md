Help write an AWS CDK application in Go that deploys a serverless image processing system for a photography app handling approximately 2,000 daily uploads. The design should focus on cost efficiency, scalability, and reliable processing while remaining simple to maintain and extend.

Amazon S3 should be used as the storage layer for uploaded images. When a new image is uploaded, an S3 event trigger must invoke an AWS Lambda function (Go 1.x runtime) responsible for generating preview versions of the images. The processed previews should be stored back in S3 or linked appropriately for downstream use.

To track image metadata such as filenames, processing status, and preview references, provision an Amazon DynamoDB table. The DynamoDB configuration should allow flexible queries and provide efficient scalability as daily usage increases. IAM roles and policies should be carefully defined to secure execution and ensure that Lambda can only access the resources it needs.

For observability, configure Amazon CloudWatch to capture both Lambda execution logs and processing metrics, such as the number of images processed and any failures. This will allow for monitoring performance, troubleshooting issues, and tracking system health as usage grows.

The infrastructure must deploy cleanly with AWS CDK in Go, prioritize cost efficiency to scale with the startup’s needs, and ensure that the system is fully serverless, event-driven, and production-ready.
