# AWS Failure Recovery Setup

Need to build a disaster recovery solution for our web app. If us-east-2 goes down, we need to automatically failover to us-west-2.

Requirements:
- Auto-failover from us-east-2 to us-west-2 when primary region fails
- Route 53 for DNS routing during failover
- Keep database in sync between regions
- CloudWatch alarms to monitor health and trigger failover
- CloudFormation templates for both regions
- Everything automated - no manual intervention

Infrastructure:
- Web service on EC2 with load balancer
- RDS database
- Route 53 for DNS
- Proper tagging on all resources

Create a CDK stack using TypeScript. Put all the code in a single tap-stack.ts file with class TapStack. Need IAM roles and policies included. The CDK code should be valid and ready for deployment.