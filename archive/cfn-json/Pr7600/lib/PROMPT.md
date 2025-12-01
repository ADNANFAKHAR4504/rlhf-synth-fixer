Hey team,

We need to build a scalable media processing pipeline for our streaming platform that handles live video content. I've been asked to create this using CloudFormation with JSON. The business wants us to process and transcode live video streams efficiently while integrating with our CI/CD pipeline for automated deployments.

This system needs to handle real-time video processing workloads and scale automatically during peak streaming hours. We need proper monitoring, secure delivery, and automated deployment through our CI/CD pipeline. Make sure to include a string suffix in all resource names to avoid conflicts across different environments.

## What we need to build

Create a scalable media processing pipeline using **CloudFormation with JSON** for live video streaming and transcoding.

### Core Requirements

1. **Live Video Ingestion**
   - Accept live video streams from broadcasters
   - Support multiple input formats and protocols
   - Handle variable bitrate streams reliably

2. **Video Transcoding and Processing**
   - Transcode live streams to multiple quality levels for adaptive bitrate streaming
   - Generate HLS and DASH output formats for broad device compatibility
   - Process streams in real-time with minimal latency

3. **Content Packaging and Delivery**
   - Package transcoded streams for distribution
   - Deliver content through a CDN for global reach
   - Support time-shifted viewing and DVR functionality

4. **Scalability**
   - Auto-scale processing capacity based on concurrent streams
   - Handle sudden traffic spikes during live events
   - Efficient resource utilization to control costs

5. **CI/CD Pipeline Integration**
   - Automated infrastructure deployment through CI/CD
   - Configuration management for different environments
   - Automated testing and validation before production
   - Blue-green deployment support for zero-downtime updates

6. **Monitoring and Operations**
   - Real-time monitoring of stream health and quality
   - Automated alerting for processing failures or quality degradation
   - Logging for troubleshooting and analytics
   - Operational dashboards for visibility

7. **Security and Access Control**
   - Secure video ingest and delivery
   - IAM roles with least privilege access
   - Encryption for video content in transit and at rest
   - Access controls for content distribution

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS MediaLive** for live video encoding and processing
- Use **AWS MediaPackage** for content packaging and origin services
- **S3** for storing archived streams and configuration
- **CloudFront** for global content delivery
- **Lambda** for automation and event processing
- **Step Functions** for workflow orchestration
- **CodePipeline** and **CodeBuild** for CI/CD integration
- **CloudWatch** for monitoring, logging, and alarms
- **IAM** for permissions and access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in their names
- Use `!Sub` intrinsic function for resource naming: `!Sub 'resource-name-${EnvironmentSuffix}'`
- All resources must be destroyable (NO Retain deletion policies)
- Do NOT set `DeletionPolicy: Retain` on any resources
- Lambda functions must be compatible with Node.js 18+ runtime (use AWS SDK v3 if importing SDK)
- Include proper error handling and retry logic

### Constraints

- No hardcoded resource names without suffix
- All video content must be encrypted
- Pipeline must support automated rollback on failures
- Infrastructure must be reproducible across environments
- Minimize latency for live streaming (target sub-10 second end-to-end)
- Cost-effective resource selection (prefer serverless where applicable)
- Include proper CloudWatch log retention policies

## Success Criteria

- **Functionality**: Successfully ingest, transcode, and deliver live video streams
- **Performance**: Sub-10 second glass-to-glass latency for live streams
- **Scalability**: Handle multiple concurrent streams with auto-scaling
- **Reliability**: 99.9% uptime for streaming services
- **Security**: Encrypted content delivery with proper access controls
- **CI/CD Integration**: Fully automated deployment pipeline
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: Comprehensive CloudWatch metrics and alarms
- **Code Quality**: Valid JSON CloudFormation template, well-documented

## What to deliver

- Complete CloudFormation template in JSON format
- MediaLive channel configuration for live encoding
- MediaPackage endpoints for stream packaging
- CloudFront distribution for content delivery
- S3 buckets for archive storage
- Lambda functions for automation
- Step Functions workflow for orchestration
- CodePipeline and CodeBuild configuration for CI/CD
- IAM roles and policies with least privilege
- CloudWatch alarms and monitoring dashboards
- Documentation and deployment instructions
