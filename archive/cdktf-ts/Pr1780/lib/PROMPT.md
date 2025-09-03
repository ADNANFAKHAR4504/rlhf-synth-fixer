I need to put together a CDKTF configuration that can spin up a proper multi-environment setup covering Dev, Test, and Prod. Each stage has to be consistent, easy to replicate, and run in its own AWS region (we’re focusing on **us-east-1**).

Here’s what I want the setup to handle in a monolithic architecture form with all code in one main-stack file:

- Create separate stacks for Dev, Test, and Prod, with clear separation of resources.
- Every environment should have its own VPC using a `/16` CIDR block.
- Inside each VPC, there should be both public and private subnets.
- Public subnets should host an **Application Load Balancer (ALB)**.
- EC2 instances should live in private subnets, tied to Auto Scaling groups, and served behind the ALB.
- Security has to follow the principle of least privilege — so Security Groups and NACLs should be locked down tightly.
- IAM roles should be defined with only the permissions the EC2 instances actually need.
- Each environment should have an **RDS instance**, encrypted at rest with KMS keys.

The expected outcome is a set of **CDKTF TypeScript files** that generates the stack, validate cleanly, and make scaling or rolling out updates across environments simple.
