Need a CDK v2 app in TypeScript that can deploy the same stack to us-east-1 and us-west-2. Should be production-ready and maintainable.

Requirements:

- Tag everything with Environment: Production
- VPC in each region with public/private subnets (instances in private, ALB in public)
- Application Load Balancer in public subnets for HTTP traffic
- AutoScalingGroup in private subnets: min 3, max 6 instances, connected to ALB target group
- RDS Multi-AZ in private subnets, locked down to app instances only
- CloudWatch alarm for CPU > 70% for 5 minutes
- S3 bucket with versioning and encryption
- EC2 instance role with least privilege (S3 read, CloudWatch logs, SSM access)
- Security groups: ALB accepts 80/443, ALB to instances on app port, instances to RDS on DB port

Multi-region setup:

- Create two identical stacks, one for each region
- Get region-specific values from context/props, not hard-coded

Need two files:

- bin/my-app.ts - CDK app that creates both stacks
- lib/my-stack.ts - Stack definition with VPC, ALB, ASG, RDS, S3, CloudWatch, IAM, security groups

Guidelines:

- Use CDK constructs, keep policies tight
- Sensible defaults with TODO comments for trade-offs
- No hidden dependencies - expose ARNs/params via props or context

Deployment:

- cdk bootstrap both regions
- cdk synth
- cdk deploy "*"

Build something production-worthy.