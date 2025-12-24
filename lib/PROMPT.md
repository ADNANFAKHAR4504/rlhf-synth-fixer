## Prompt

I need a CDK TypeScript stack that creates a production-ready VPC with networking infrastructure.

Set up a VPC using the CIDR block 10.0.0.0/16 with two public subnets and two private subnets distributed across different availability zones. The public subnets should connect to the internet through an Internet Gateway. Private subnets need outbound connectivity via NAT Gateways.

Enable VPC Flow Logs that send all traffic data to CloudWatch Logs. Create an IAM role for the flow logs service following least-privilege principles - only grant the permissions needed to write logs.

Tag all resources with Environment: Production for compliance tracking. Make sure no credentials or secrets are hardcoded anywhere in the code.

Deploy everything in us-east-2 region.

## Output

Create these three files:
- bin/tap.ts - CDK app entry point
- lib/tap-stack.ts - stack with all VPC resources
- cdk.json - project config

Just give me the code, no explanations needed.
