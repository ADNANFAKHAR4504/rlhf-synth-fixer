You are an expert Prompt Engineer with 10 years of experience. Your task is to create prompts for AI so that the AI will generate a response (IAC code).

Help me write a prompt for creating Infrastructure as Code (IAC) in CDKTF. Please make sure that the provided data should remain intact and it should not change in any way.

**Constraints:**
- Use Terraform version 1.0.0 or greater.
- Ensure all security groups are configured with specified inbound and outbound rules.
- The configuration must support multiple environments using workspaces.
- Integrate AWS IAM roles and policies to adhere to the principle of least privilege.
- Use Terraform modules to encapsulate reusable components.
- Implement a logging mechanism for auditing configuration changes.

**Environment:**
Create a Terraform HCL configuration that implements a secure cloud infrastructure. The requirements are as follows:
1. Define and deploy Security Groups with strict inbound and outbound rules in AWS across multiple regions using AWS VPC.
2. Utilize Terraform workspaces to manage multiple environments (development, staging, production) with isolated settings.
3. Implement AWS IAM policies and roles to restrict access in line with the principle of least privilege. These roles should be assigned to specific EC2 instances depending on the workspace.
4. Use Terraform modules to define reusable components for security groups and IAM configurations.
5. Include detailed resource tagging for cost monitoring and organization.
6. Ensure all configuration changes are logged for audit purposes.

**Expected output:**  
The solution should include well-commented HCL files with correct implementations of all required security groups, IAM roles, workspace configurations, and necessary modules. Passing tests must validate the deployment in multiple environments and regions, ensuring all security constraints are met without errors.

**Proposed Statement:**  
The infrastructure environment consists of multiple AWS accounts distinguished by Terraform workspaces. Resources must be deployed in the us-east-1 and us-west-2 regions, using standard naming conventions with environment-specific prefixes (e.g., dev-, prod-). Each workspace should have its own state file, and backend configurations must be set up for remote state management. Security groups should allow traffic only from known IP ranges, and all ports should be closed by default. IAM roles should have permissions limited to the minimum required actions and resources.