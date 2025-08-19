I need your help designing a Terraform multi-environment setup that supports both staging and production. The solution should be consistent, maintainable, and reusable, following Terraform best practices.

Requirements
	1.	Environment separation
	•	Use Terraform workspaces to separate staging and production environments cleanly.
	2.	Consistency
	•	Ensure variable names are consistent across environments for predictability and easier management.
	3.	Reusability
	•	Implement Terraform modules for common infrastructure components so that code duplication is minimized.
	4.	Shared outputs
	•	Define output values that can be shared across environments (useful for deployments and CI/CD pipelines).
	5.	Multi-region support
	•	Deploy the infrastructure in two AWS regions:
	•	us-west-2
	•	eu-west-1
	•	Each environment should have its own dedicated workspace.

Expected Outcome

A Terraform codebase that:
	•	Correctly uses workspaces for environment separation
	•	Leverages modules to reuse infrastructure components
	•	Applies consistent naming conventions for variables
	•	Exposes useful output values that can be shared across environments

Constraints
	•	Must rely on Terraform workspaces for environment separation
	•	Must follow consistent naming conventions for environment variables
	•	Must avoid duplication by using modules
	•	Must define shared output values

File Structure
	•	provider.tf
	•	tap_stack.tf