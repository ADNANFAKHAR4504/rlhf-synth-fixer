## Prompt

We need to build out an AWS CDK (TypeScript) stack in **us-east-1** that bakes in our security and availability standards from day one. Think of this as our baseline secure app infrastructure thats ready for production, but also easy to teardown in non-prod environments.

### What it should include

1. **VPC** CIDR block `10.0.0.0/16`, split into public and private subnets. Public only if something truly needs direct access, otherwise private.
2. **S3** Every bucket must have server-side encryption (SSE-S3) turned on and public access blocked. Bucket should be deletable in non-prod (auto-delete objects).
3. **IAM** Roles and policies need to follow least privilege. No blanket admin permissions.
4. **RDS** Multi-AZ deployment, encrypted at rest, private subnets, not publicly accessible; deletion protection disabled and stack deletable in non-prod.
5. **EC2** All instances inside the VPC, with Elastic IPs where public access is needed (e.g., bastion host). Use SSM instead of SSH.
6. **Security Groups** Absolutely no SSH (port 22) open to `0.0.0.0/0`. Restrict or use SSM instead.
7. **Load Balancer** Internet-facing Application Load Balancer with HTTP only (port 80) for this baseline. No ACM certificate required.
8. **CloudWatch Alarms** Trigger if EC2 CPU hits >80%.
9. **DynamoDB** Enable Point-In-Time Recovery; table deletable in non-prod.
10. **General** Use AWS-managed services where possible, no hard-coded secrets, and tag everything consistently (e.g., `companyname-env-component`). Prefer deletion-friendly removal policies in non-prod.

### Deliverables

A CDK project with three files:

1. `bin/tap.ts` Entry point that sets the app and region.
2. `lib/tap-stack.ts` Defines all of the above resources and their security settings.
3. `cdk.json` Project config.

Code should deploy cleanly with `cdk deploy` and be easy to destroy in non-prod without manual fixes.
