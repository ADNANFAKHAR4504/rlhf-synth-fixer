# Terraform State Cleanup

This document explains how to handle orphaned Terraform state resources, particularly the `aws_launch_template.web` that can cause dependency cycles.

## Problem

When Terraform state contains orphaned resources (resources that exist in state but not in the current configuration), it can cause dependency cycles during `terraform plan` or `terraform apply`. A common example is `aws_launch_template.web` which may be referenced in error messages even though it's not defined in the current configuration.

## Solution

We provide cleanup scripts that automatically remove orphaned resources from Terraform state before deployment.

## Cleanup Scripts

### Bash Script (Linux/macOS)

```bash
./scripts/cleanup-terraform-state.sh
```

### PowerShell Script (Windows)

```powershell
.\scripts\cleanup-terraform-state.ps1
```

## What the Scripts Do

1. **Initialize Terraform** without backend to avoid S3 issues
2. **List current state** to see what resources exist
3. **Remove orphaned resources** like `aws_launch_template.web`
4. **Validate configuration** to ensure it's still valid
5. **Report results** of the cleanup process

## Integration with CI/CD

### GitHub Actions

The cleanup is automatically integrated into the GitHub Actions workflow:

```yaml
- name: Cleanup Orphaned State Resources
  run: |
    chmod +x scripts/cleanup-terraform-state.sh
    ./scripts/cleanup-terraform-state.sh
  continue-on-error: true # Continue even if cleanup fails
```

### Manual Cleanup

If you need to manually clean up state:

```bash
cd lib
terraform init -backend=false
terraform state rm 'aws_launch_template.web'
terraform validate
```

## Testing

The cleanup process is tested in the integration tests:

```bash
npm test
```

The tests verify:

- No orphaned `aws_launch_template.web` in state
- Terraform configuration validates successfully
- No dependency cycles in plan
- Cleanup scripts exist and are executable

## Common Orphaned Resources

The scripts check for and can remove:

- `aws_launch_template.web`
- `aws_launch_template` (any launch template)
- `aws_autoscaling_group`
- `aws_launch_configuration`

## Troubleshooting

### Error: "Backend initialization required"

This is normal when running cleanup scripts. The scripts use `terraform init -backend=false` to avoid backend issues.

### Error: "No state found"

This is also normal if no Terraform state exists yet. The cleanup will continue and validate the configuration.

### Error: "Resource not found in state"

This means the orphaned resource doesn't exist in state, which is good. The cleanup will continue.

## Best Practices

1. **Run cleanup before deployment** in CI/CD pipelines
2. **Test cleanup scripts** in your development environment
3. **Monitor for new orphaned resources** and update scripts as needed
4. **Document any manual cleanup steps** for your team
5. **Use `create_before_destroy` lifecycle** for resources with variable names to prevent replacement cycles

## Dependency Cycle Prevention

### Lifecycle Policies

To prevent dependency cycles during resource replacement, we use `create_before_destroy` lifecycle policies for resources with variable names:

```hcl
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name

  # Prevent cycle when replacing due to name changes
  lifecycle {
    create_before_destroy = true
  }
}
```

This ensures that when the resource name changes (due to variable updates), Terraform creates the new resource before destroying the old one, preventing dependency cycles.

## Security Considerations

- Cleanup scripts only remove resources from Terraform state
- They do not delete actual AWS resources
- Always review what will be removed before running cleanup
- Use `terraform plan` after cleanup to verify changes
