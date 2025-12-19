
# Resource Conflict Error Report

I tried another deployment and ran into more resource conflicts:

- IAM Role, RDS DB Subnet Group, ALB, and Target Group already exist.

Here’s the error output:

```
Error: creating IAM Role ... EntityAlreadyExists: Role with name ... already exists.
Error: creating RDS DB Subnet Group ... DBSubnetGroupAlreadyExists: The DB subnet group ... already exists.
Error: ELBv2 Load Balancer ... already exists
Error: ELBv2 Target Group ... already exists
Error: Terraform exited with code 1.
```

What changes should I make to the Terraform code to avoid these “already exists” errors?