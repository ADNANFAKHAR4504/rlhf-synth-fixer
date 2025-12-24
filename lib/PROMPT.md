## Prompt

I need a CDK TypeScript stack that creates a production VPC with networking and logging setup.

Set up a VPC using CIDR block 10.0.0.0/16 with two public subnets and two private subnets spread across different availability zones. The public subnets should connect to the internet through an Internet Gateway. Private subnets need outbound internet access via NAT Gateways.

Enable VPC Flow Logs that send traffic data to CloudWatch Logs. The VPC Flow Logs service connects to CloudWatch Logs to deliver network flow data. Create an IAM role for the VPC Flow Logs service that follows least-privilege - only grant specific permissions needed to write logs to the CloudWatch Log Group. The IAM role should allow the vpc-flow-logs service to create log streams and put log events into the specific log group. Use exact IAM actions like logs:CreateLogStream and logs:PutLogEvents instead of wildcards.

Tag each resource with Environment: Production for compliance tracking. Make sure no credentials or secrets are hardcoded anywhere in the code.

Deploy everything in us-east-2 region.

## Output

Create these three files:
- bin/tap.ts - CDK app entry point
- lib/tap-stack.ts - stack with all VPC resources
- cdk.json - project config

Just give me the code, no explanations needed.
