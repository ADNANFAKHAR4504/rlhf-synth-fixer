We’re moving this security configuration exercise into CDK (TypeScript). The project should live in us-east-2 and be structured with three files:

bin/tap.ts – entry point that wires up the app and region.

lib/tap-stack.ts – all the resource definitions and their security hardening.

cdk.json – the project config.

The environment needs to enforce strong security across IAM, storage, compute, networking, and logging. Here’s what has to be in place:

IAM roles must use least-privilege policies. Don’t attach broad permissions. Also, make sure multi-factor authentication (MFA) is enforced for all IAM users.

Every S3 bucket has to use server-side encryption (SSE-S3 or better) and must block public access completely.

EC2 instances should only launch inside a VPC, and their security groups should allow only the traffic that’s explicitly needed — nothing open-ended.

VPC Flow Logs must be enabled to capture traffic in and out of interfaces.

RDS instances should only accept connections from specific VPC security groups, not open to the world.

End goal: when you run cdk deploy, the stack comes up cleanly and the whole environment follows security best practices out of the box.