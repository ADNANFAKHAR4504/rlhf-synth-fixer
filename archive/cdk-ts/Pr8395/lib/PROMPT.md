I need help enhancing my existing serverless infrastructure on AWS using CDK TypeScript. The current system has Lambda functions, API Gateway, EventBridge with enhanced logging, and canary deployments working well. Now I want to add complexity with two recent AWS features.

Requirements:
1. Deploy everything in the us-east-1 region
2. Keep the existing canary deployments and EventBridge integration
3. Add AWS Lambda Powertools for TypeScript for better observability, structured logging, and metrics
4. Add Amazon EventBridge Scheduler for scheduled event processing and automated workflows
5. Use least privilege IAM roles and policies
6. Follow CDK best practices for modularization

For the AWS Lambda Powertools integration, I want structured logging with JSON output, custom metrics, and distributed tracing capabilities. The functions should use the Logger, Metrics, and Tracer utilities.

For EventBridge Scheduler, I want both one-time and recurring schedule capabilities that can trigger Lambda functions for automated processing tasks like cleanup jobs or periodic data processing.

Please provide infrastructure code that will pass cdk synth and cdk deploy without errors. I need one code block per file so I can copy and paste them directly.
