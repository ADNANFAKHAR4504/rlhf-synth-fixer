Hey, I need a complete Pulumi setup in Python for a production deployment. Please generate a single file called `tap_stack.py`.

Here’s what I need:

- It should deploy to both `us-east-1` and `us-west-2` for high availability.
- Use Pulumi’s Python SDK (no TypeScript).
- Every resource must follow proper naming conventions (no dummy names or hardcoded stuff).
- All resources must be tagged with `Environment: Production`.
- There should be S3 buckets in both regions with versioning turned on and server-side encryption (AES256 or KMS).
- Set up CloudWatch alarms to notify if any changes are made to security groups.
- Create IAM roles with least privilege (only give what’s actually needed).
- Use `pulumi.Config` where values might change — no hardcoding sensitive or environment-specific data.
- Make sure the code is clean, well-commented, and production-grade.
- Everything should be in one Python file (`tap_stack.py`) with no extra files or text.

If any commands are needed to run or preview the stack, please add them at the top as comments (like `pulumi up` etc).
