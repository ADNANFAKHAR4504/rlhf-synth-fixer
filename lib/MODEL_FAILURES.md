## Model Failures for TapStack.yml CloudFormation Template

1. **Circular Security Group References:**
	- The model initially created circular dependencies between security groups (ALB and EC2) by referencing each other in ingress/egress rules, which is not allowed in CloudFormation.

2. **YAML Indentation and Structure Errors:**
	- Several attempts to add or modify properties (e.g., KeyName) resulted in invalid YAML due to incorrect indentation or property placement, causing cfn-lint errors.

3. **Overly Permissive Security Group Rules:**
	- Some security group rules used `CidrIp: 0.0.0.0/0` for HTTP/SSH access, which is not best practice for production environments. These should be restricted to specific sources (e.g., ALB or Bastion SG).

4. **IAM Role Least Privilege:**
	- The model sometimes included managed policies that may be broader than necessary. Custom policies should be reviewed to ensure least privilege.

5. **Missing/Incorrect Use of Parameters:**
	- The `KeyPairName` parameter was missing in early versions, and its addition required multiple corrections for proper referencing in EC2 resources.

6. **Intrinsic Function Lint Warnings:**
	- The use of CloudFormation intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`, etc.) triggered linter warnings in non-AWS YAML tools, though these are valid in CloudFormation.

7. **Logging and Encryption:**
	- The template generally follows best practices for logging and encryption, but users should verify that all resources (including new ones) have logging and encryption enabled as required.

8. **Dynamic References for Secrets:**
	- The template does not use dynamic references for secrets (e.g., passwords), as none are present, but this should be reviewed if secrets are added in the future.

9. **Resource Specification Compliance:**
	- Care must be taken not to add unsupported properties (e.g., 'BackupPolicy') to resources, as this will cause validation failures.

10. **Parameterization and Reusability:**
	 - The template is parameterized for environment name, VPC CIDR, instance type, and key pair, but further parameterization may be needed for full reusability in different environments.
