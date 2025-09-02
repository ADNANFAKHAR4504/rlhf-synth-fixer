# Terraform Deployment Issues Need Fixing

I'm getting deployment errors with the current Terraform configuration. The main error is blocking the entire deployment and I need help resolving it.

## Primary Error - Missing user_data.sh File

The deployment is failing because the launch template references a user_data.sh file that doesn't exist:

```
Error: Invalid function argument
  on tap_stack.tf line 440, in resource "aws_launch_template" "web":
 440:   user_data = base64encode(templatefile("${path.module}/user_data.sh", {
 441:     app_config_bucket = var.app_config_bucket
 442:   }))

Invalid value for "path" parameter: no file exists at "./user_data.sh"
```

The launch template expects this file but it's not present in the lib directory. I need either:
- A working inline user_data script in the launch template, or  
- The actual user_data.sh file created with proper bootstrap logic

## Additional Issues I Found

Looking at the configuration, there are other problems that will cause deployment failures:

### 1. Key Pair Dependency
The launch template references `var.key_pair_name` with default "web-app-key" but this EC2 key pair probably doesn't exist in the target AWS account. This will cause the launch template creation to fail.

### 2. S3 Bucket Reference
The IAM policy and user data reference an S3 bucket "app-config-bucket" that likely doesn't exist. The EC2 instances will fail to access this bucket.

### 3. Load Balancer Listener Configuration
The load balancer listener has a syntax issue - the `default_action` block uses `target_group_arn` directly, but it should be nested under a `forward` action configuration.

### 4. Auto Scaling Group Dependencies
The ASG references the launch template but there might be circular dependency issues with the target group attachments.

## What I Need

Can you fix these deployment issues? Specifically:

1. **Fix the user_data issue** - either create the missing file or provide inline user_data that handles basic web server setup
2. **Make the key pair optional** - so instances can launch without requiring an existing key pair
3. **Fix the S3 bucket references** - make them conditional or use a bucket that exists
4. **Correct the load balancer listener syntax** - ensure the forwarding action is properly configured
5. **Check for any other syntax or dependency issues** that would prevent successful deployment

The goal is to have a working Terraform configuration that can actually deploy without errors. Right now it's completely blocked on the missing user_data.sh file.