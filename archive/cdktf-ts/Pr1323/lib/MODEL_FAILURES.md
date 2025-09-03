# Model Failures

## 1. Multi-Region Deployment
- **Failure:** The solution only deploys resources to a single region (from `AWS_REGION` env var). The prompt requires deployment in both `us-east-1` and `us-west-2`.

## 2. Workspace Isolation
- **Failure:** No explicit use of Terraform workspaces for environment isolation. The solution uses environment variables, but does not show workspace configuration or switching.

## 3. Remote State Management
- **Failure:** No backend configuration for remote state management or per-workspace state files.

## 4. Security Group Rules
- **Failure:** Security groups allow HTTP/HTTPS from `0.0.0.0/0` (the entire internet). The prompt requires only known IP ranges and all ports closed by default.

## 5. IAM Least Privilege
- **Failure:** IAM roles use broad managed policies (e.g., `AmazonSSMManagedInstanceCore`, `CloudWatchAgentServerPolicy`). The prompt requires permissions limited to minimum required actions and resources.

## 6. Logging/Auditing
- **Failure:** No logging mechanism for auditing configuration changes is implemented.

## 7. Terraform Version
- **Failure:** The `cdktf.json` only specifies AWS provider version, not Terraform version (`>= 1.0.0`).

## 8. Resource Naming
- **Failure:** No standard naming convention with environment-specific prefixes for all resources (e.g., `dev-`, `prod-`).

## 9. Module Usage
- **Failure:** No explicit use of Terraform modules for reusable components; constructs are used, but not modules as required by the prompt.

## 10. Resource Tagging
- **Failure:** Tagging is present, but not validated for completeness (e.g., cost monitoring tags).

## 11. Testing
- **Failure:** No tests are provided to validate deployment in multiple regions, workspace isolation, or other critical functionalities.