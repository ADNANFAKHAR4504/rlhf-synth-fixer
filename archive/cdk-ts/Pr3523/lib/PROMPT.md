Create AWS infrastructure code using CDK in TypeScript for a mobile app backend configuration management system in the us-east-2 region.

Requirements:

1. Set up AWS AppConfig with:
   - Application for mobile app configuration
   - Environment for production use
   - Configuration profile for feature flags
   - Deployment strategy with gradual rollout (20% at a time, 5 minute bake time)
   - Use the advanced targeting capabilities for feature flag experimentation

2. Configure Parameter Store with:
   - Standard parameters for non-sensitive app settings (API endpoints, timeouts)
   - SecureString parameters for sensitive configuration values
   - Enable cross-account parameter sharing for advanced-tier parameters
   - Organize parameters using hierarchical naming (/mobile-app/config/)

3. Implement Secrets Manager for:
   - API keys storage with automatic rotation every 30 days
   - Database credentials management
   - Third-party service credentials

4. Create Lambda functions for:
   - Configuration validation before deployment (validate JSON schema)
   - Pre-deployment hooks to verify configuration changes
   - Post-deployment monitoring and rollback triggers

5. Set up DynamoDB table for:
   - Configuration change history tracking
   - Audit logging of all configuration modifications
   - Point-in-time recovery enabled
   - Global secondary index for querying by timestamp

6. Configure CloudWatch for:
   - Custom metrics for deployment success rates
   - Alarms for configuration validation failures
   - Dashboard showing deployment metrics and configuration usage
   - Log groups for Lambda functions

7. Implement IAM roles and policies for:
   - Mobile application read-only access to configurations
   - Lambda execution roles with least privilege
   - Cross-service permissions between AppConfig, Parameter Store, and Secrets Manager

8. Configure S3 bucket for:
   - Daily backups of all configurations
   - Versioning enabled for backup history
   - Lifecycle policy to archive old backups after 90 days
   - Server-side encryption with AWS managed keys

The infrastructure should handle 9,700 daily active devices efficiently with minimal latency for configuration retrieval. Include proper error handling and monitoring for all services.

Provide the infrastructure code in separate TypeScript files following CDK best practices, with clear separation of concerns and reusable constructs where appropriate.