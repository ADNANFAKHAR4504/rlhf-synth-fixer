Generate CDK for Terraform (CDKTF) code in TypeScript that provisions the following AWS infrastructure for a development environment in `us-east-1`:

1. A VPC with CIDR block `10.0.0.0/16`.
2. Two **public subnets**, each in a different availability zone (e.g., `us-east-1a` and `us-east-1b`).
3. An **Internet Gateway** attached to the VPC.
4. A **route table** associated with both public subnets, including a route for `0.0.0.0/0` via the Internet Gateway.
5. An **EC2 instance** of type `t2.micro`, launched into one of the public subnets.
6. All resources must be tagged with `Environment: Dev`.
7. Use CDKTF **modules** for each logical group (e.g., VPC, Subnets, EC2).
8. Ensure the code is organized under a directory like `lib/modules/` for modularity and imported into a main `TapStack` defined in `lib/tap-stack.ts`.

Make sure the code:
- Uses the AWS provider.
- Uses best practices (like explicit dependencies between resources).
- Is deployable via `cdktf deploy`.

Assume the backend is configured using S3 with locking enabled.