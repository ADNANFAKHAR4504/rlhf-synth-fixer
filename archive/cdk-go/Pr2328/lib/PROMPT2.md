The current TAP stack is missing several key features required to meet the project specifications. Update the codebase to address the following:
Critical Fixes
Multi-Region Deployment
The stack should deploy in both us-east-1 and us-west-2.
CDK Validation:
Ensure cdk synth produces a valid CloudFormation template.
Confirm the stack deploys successfully in both regions.
Enhancements:
Extend integration tests to cover API Gateway, Lambda invocations, CloudWatch alarms, and cross-region communication.
Apply consistent environment suffixes across all resources.
Improve error handling with dead letter queues, retries, and stronger monitoring.
Harden security with least-privilege policies, VPC isolation for Lambdas, X-Ray tracing, WAF for APIs, and API key management.
