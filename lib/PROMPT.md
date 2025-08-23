We're building this in AWS CDK with TypeScript, running in us-east-1. Keep it as a three-file project:

bin/tap.ts (app + region)

lib/tap-stack.ts (all resources and security settings)

cdk.json (project config)

When the model generates output, it should be only the code for those three files — no explanations, no comments, nothing extra.

What the stack needs to cover: IAM roles for EC2 must follow least privilege, no broad permissions. All storage must be encrypted at rest (S3 with SSE, RDS encrypted, EBS volumes with KMS). Traffic in transit should be protected (TLS where relevant). Every resource should default to private access — deny public access unless absolutely required.

Networking should be a VPC across at least two Availability Zones, with public and private subnets. EC2s go in private subnets, secured by SGs with minimal rules. RDS goes into private subnets, Multi-AZ, encrypted, and only reachable from specific SGs. Lambda functions need to log to CloudWatch and use secure environment configs. S3 buckets should be encrypted, block all public access, and be tagged properly.

For monitoring, use CloudWatch for logs and metrics across services. Auto Scaling Groups should handle EC2 capacity, and security groups should default to deny. API Gateway should be deployed without ACM (since that’s an external dependency we can’t provide here) — just use the AWS default TLS endpoint. Attach an AWS WAF WebACL to the API Gateway to mitigate exploits. Also enforce an IAM password policy to meet complexity standards.

Tag all resources with Environment, Project, and Owner. No hard-coded secrets. Deploy should succeed with a straight cdk deploy.

The model should return only the code for bin/tap.ts, lib/tap-stack.ts, and cdk.json.