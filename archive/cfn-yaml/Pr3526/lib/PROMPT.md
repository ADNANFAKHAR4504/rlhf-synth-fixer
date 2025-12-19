# Quiz Platform Infrastructure Requirements

Create CloudFormation infrastructure code in YAML for a serverless quiz generation system that processes 3,700 daily personalized quizzes.

## Architecture Requirements

The system needs:
- API Gateway REST API to receive quiz generation requests
- Lambda function (Python 3.13) for quiz generation with 5-minute timeout
- DynamoDB table for storing quiz questions and results with 365-day TTL
- Lambda function for quiz scoring logic
- S3 bucket for exporting quiz results
- CloudWatch dashboard for quiz metrics monitoring
- AWS Personalize for adaptive question selection based on user performance
- IAM roles with least privilege for all services

## Implementation Details

1. API Gateway should have endpoints for:
   - POST /quiz/generate - Create personalized quiz
   - POST /quiz/submit - Submit answers for scoring
   - GET /quiz/{id} - Retrieve quiz details
   - GET /quiz/{id}/results - Get quiz results

2. DynamoDB tables structure:
   - Questions table with attributes: question_id, category, difficulty, content
   - Results table with TTL attribute set to 365 days

3. Lambda functions should use environment variables for configuration and have appropriate memory allocation for processing workload.

4. S3 bucket should have lifecycle policies for cost optimization and versioning enabled.

5. Use AWS Personalize with automatic solution training enabled (every 7 days) for adaptive question selection based on user performance patterns.

6. CloudWatch should track metrics including quiz generation rate, scoring latency, and error rates.

Provide complete CloudFormation YAML template code with all resources properly configured. Include one code block per file needed.