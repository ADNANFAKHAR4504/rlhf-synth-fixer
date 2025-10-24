I need help building infrastructure for a video streaming service called StreamFlix. The company needs to process and deliver video content to millions of users.

Here's what I need:

We need a system that can handle raw video files, transcode them into different formats, store all the metadata in a database, and deliver the content efficiently. The system must follow MPAA compliance standards for content security.

Please create infrastructure code using CDKTF with Python that includes:

1. ECS with Fargate for video transcoding - should be able to handle at least 1000 concurrent video streams and scale automatically
2. RDS Aurora cluster for storing metadata - needs to be multi-AZ for high availability
3. ElastiCache Redis cluster for managing user sessions
4. EFS for temporary media file storage during processing
5. Kinesis Data Streams for real-time analytics on video streaming data
6. API Gateway for content delivery APIs
7. Secrets Manager for storing all sensitive credentials like database passwords, API keys, and encryption keys - please use automatic rotation where possible

Important requirements:

- Everything must be deployed in eu-west-2 region
- The system needs to be highly available with multi-AZ deployment
- Target 99.99% availability
- All sensitive data must be managed through Secrets Manager
- All resource names should include environmentSuffix parameter for supporting parallel deployments
- Make sure the infrastructure follows MPAA compliance for content security

I'd appreciate if you could use some of the latest AWS features like the improved Secrets Manager API limits that were recently increased to 10,000 requests per second, and consider Aurora RDS Extended Support for better upgrade management.

Please provide the complete infrastructure code with all files needed to deploy this. Make sure each file is in a separate code block so I can easily copy them.
