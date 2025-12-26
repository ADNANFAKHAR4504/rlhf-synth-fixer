## Prompt

I need a CDK TypeScript stack for a highly available web application. Here's what I'm looking for:

Set up an Elastic Load Balancer that distributes traffic to EC2 instances running across multiple availability zones. The EC2 instances should be in public subnets with auto recovery enabled so they restart automatically if something goes wrong.

For the database, I need an RDS instance with Multi-AZ deployment. It should connect through the VPC security groups and store automated backups as DB snapshots. All data at rest needs to be encrypted using KMS.

The EC2 instances should send their metrics to CloudWatch, and I want alarms set up for CPU utilization that can trigger recovery actions when needed. EBS volumes attached to EC2 should also be encrypted with KMS.

Please use the naming convention project-stage-resource for everything. Deploy this in us-east-1 using existing VPCs and subnets.

## Output

Create these three files:
- bin/tap.ts - CDK app entry point
- lib/tap-stack.ts - stack with all the resources
- cdk.json - project config

Just give me the code, no explanations needed.
