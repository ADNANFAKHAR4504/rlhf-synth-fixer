## System Context

You are an expert Infrastructure as Code (IaC) assistant specializing in AWS CloudFormation template generation. Generate comprehensive, production-ready infrastructure definitions based on application requirements.

## Application Requirements

### Overview

Create infrastructure for a language learning application serving **6,000 students** with the following capabilities:

- Interactive lessons across **20 languages**
- Speech recognition for pronunciation practice
- Progress tracking and adaptive learning
- Multi-language content delivery
- Grammar analysis and error detection

### Target Configuration

- **Region**: us-west-1
- **Output Format**: JSON CloudFormation template
- **File Name**: `secure_cfn_template.json`
- **Runtime**: Python 3.10 for Lambda functions

## Required AWS Services and Architecture

### Core Application Services

1. **API Gateway**
   - RESTful API for lesson delivery
   - Authentication and authorization
   - Rate limiting for 6,000 concurrent users
   - CORS configuration for web/mobile clients

2. **AWS Lambda Functions**
   - Runtime: Python 3.10
   - Functions needed:
     - Lesson delivery and content management
     - User progress tracking
     - Speech recognition processing
     - Grammar analysis
     - Personalized recommendations
   - Appropriate memory allocation and timeout settings
   - Dead letter queues for error handling

3. **DynamoDB Tables**
   - **Lessons Table**: Store lesson content, metadata, and structure
   - **User Progress Table**: Track learning progress and achievements
   - **Global Secondary Indexes (GSI)**:
     - Query by language
     - Query by user progress level
     - Query by lesson difficulty
   - On-demand billing for scalability
   - Point-in-time recovery enabled

### AI/ML Services Integration

4. **Amazon Transcribe**
   - Speech-to-text for pronunciation assessment
   - Support for 20 languages
   - Custom vocabulary for language learning terms
   - Real-time transcription capabilities

5. **Amazon Polly**
   - Text-to-speech for native speaker audio generation
   - Neural voices for natural pronunciation examples
   - SSML support for pronunciation guidance
   - Multiple language support

6. **Amazon Translate**
   - Multi-language content delivery
   - Real-time translation for lesson content
   - Custom terminology for consistent translations
   - Batch translation capabilities

7. **Amazon Comprehend**
   - Grammar error detection and analysis
   - Sentiment analysis for learning feedback
   - Custom entity recognition for language learning

8. **Amazon Personalize**
   - Adaptive learning path recommendations
   - Real-time recommendations API
   - Event tracking for user interactions
   - Solution versions for A/B testing

### Storage and Content Delivery

9. **Amazon S3**
   - Audio lesson storage with lifecycle policies
   - Static content hosting
   - Versioning enabled for content updates
   - Encryption at rest and in transit
   - CloudFront integration for global delivery

### Notification and Scheduling

10. **Amazon EventBridge**
    - Daily lesson reminder scheduling
    - Custom event patterns for learning milestones
    - Integration with Lambda for automated workflows

11. **Amazon SNS**
    - Achievement and progress notifications
    - Multi-channel delivery (email, SMS, push)
    - Topic-based messaging for different notification types

### Monitoring and Analytics

12. **Amazon CloudWatch**
    - Learning metrics and analytics
    - Custom metrics for engagement tracking
    - Log aggregation from all services
    - Alarms for system health monitoring

### Security and Access Management

13. **IAM Roles and Policies**
    - Principle of least privilege
    - Service-specific roles for each AWS service
    - Cross-service access permissions
    - Resource-based policies where appropriate

## Technical Requirements

### Security Specifications

- All data encrypted in transit and at rest
- VPC endpoints for private service communication
- WAF protection for API Gateway
- Secrets Manager for API keys and database credentials
- CloudTrail for audit logging

### Performance Requirements

- Support for 6,000 concurrent users
- Sub-second response times for lesson delivery
- Auto-scaling configuration for Lambda functions
- DynamoDB provisioned or on-demand based on usage patterns

### High Availability

- Multi-AZ deployment where applicable
- Cross-region backup for critical data
- Health checks and automatic failover
- Disaster recovery procedures

## Output Requirements

### Template Structure

Generate a single JSON CloudFormation template with:

- Clear parameter definitions for customization
- Logical resource naming convention
- Comprehensive outputs section
- Detailed resource descriptions

### Best Practices Implementation

- Use CloudFormation intrinsic functions appropriately
- Implement proper resource dependencies
- Include condition statements for optional features
- Add comprehensive tags for resource management

## Validation Criteria

Ensure the generated template:

- Passes CloudFormation validation
- Follows AWS Well-Architected Framework principles
- Implements industry security best practices
- Supports the specified user load and feature requirements
- Includes proper error handling and logging

Generate the complete CloudFormation template as `secure_cfn_template.json` with all specified services properly configured and integrated for a production-ready language learning application.
