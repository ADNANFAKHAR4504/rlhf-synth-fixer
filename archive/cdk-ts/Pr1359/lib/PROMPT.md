I need a single AWS CDK v2 stack written in TypeScript that sets up a small but secure AWS environment. 
Everything should be in one `.ts` file no separate `bin` or `lib` directories. 
I should be able to run `cdk bootstrap` and then `cdk deploy` to create the stack without adding anything else.

Heres what the stack needs to do:

### Networking
- Create a VPC in `us-east-1` with CIDR block `10.0.0.0/16`.
- Add two subnets:
- `10.0.1.0/24`
- `10.0.2.0/24`

### Storage
- Create an S3 bucket with versioning turned on.

### Security & IAM
- Create an IAM role for an EC2 instance that follows the least-privilege principle:
- Can read/write to the S3 bucket you just created.
- Can perform basic CloudWatch logging actions.
- Attach that IAM role to the EC2 instance.
- Add a security group that allows inbound SSH only from a single IP address (pass it in as a CDK context value or stack parameter).

### Compute
- Launch one EC2 instance:
- Type: `t3.medium`
- In one of the subnets you created.
- Associated with the IAM role above.

### General
- Tag every resource with `Environment: Production`.
- Make sure dependencies are handled correctly so resources create in the right order.
- Use AWS CDK v2 imports (`aws-cdk-lib`).
- Add inline comments explaining the important parts.

File name: `basic-setup-stack.ts` 
Output: Just the TypeScript code no explanations, no extra files.
