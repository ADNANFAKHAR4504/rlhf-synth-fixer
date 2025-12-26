I need an AWS CloudFormation template in YAML to deploy a fitness tracking backend in `us-east-2`. Please generate only the YAML template (no explanations).

## Requirements

### API & Compute
- Amazon API Gateway for mobile API endpoints
- AWS Lambda functions (runtime: Python 3.9) for workout processing
- Integration between API Gateway and Lambda

### Database & Storage
- DynamoDB table for:
  - User profiles
  - Workout history
  - Must support efficient querying (partition + sort keys, secondary indexes as needed)
- Amazon S3 bucket for:
  - Achievement badges
  - User-uploaded images
  - Enable versioning and encryption

### Authentication & Identity
- Amazon Cognito for user authentication and authorization
  - User Pool + App Client
  - Social identity provider support (parameterized)

### Notifications
- Amazon SNS for achievement notifications
  - Allow Lambda to publish achievement events
  - Subscription via parameterized email or mobile endpoint

### Caching & Real-Time Leaderboards
- Amazon ElastiCache Redis cluster
  - Used for real-time leaderboards
  - Security Group restricts access to Lambda functions only

### Monitoring
- Amazon CloudWatch:
  - Collect metrics for active users (custom metric from Lambda)
  - Dashboard with user activity graphs
  - Alarms for Lambda errors and DynamoDB throttling

### Security
- IAM Roles with least-privilege permissions for:
  - Lambda (access DynamoDB, ElastiCache, SNS, S3, CloudWatch)
  - API Gateway invoke permissions
  - Cognito integration
- KMS encryption for S3, DynamoDB, and SNS topics
- VPC configuration for ElastiCache Redis (private subnet, SG rules)

### Constraints
- Store workout history in DynamoDB with efficient querying
- Implement real-time leaderboards with ElastiCache Redis
- Use Cognito for user authentication and social features
- Send achievement notifications via SNS
- Monitor active users in CloudWatch with custom metrics

### Tags
- `Environment: fitness-dev`
- `Project: FitnessTracker`
- `Owner: FitnessBackendTeam`

### Parameters & Outputs
- Parameters:
  - ApiName
  - DynamoDBReadCapacity / WriteCapacity
  - CognitoSocialProvider (default empty)
  - NotificationEmail (default empty)
  - RedisNodeType (default cache.t3.micro)
- Outputs:
  - API Gateway endpoint URL
  - Lambda function ARNs
  - DynamoDB table name
  - S3 bucket name
  - Cognito User Pool ID
  - SNS Topic ARN
  - Redis Cluster Endpoint
  - CloudWatch Dashboard name

### Formatting
- Must be valid CloudFormation YAML
- Use intrinsic functions (`Ref`, `Fn::GetAtt`) correctly
- Start template with:
  ```yaml
  AWSTemplateFormatVersion: '2010-09-09'