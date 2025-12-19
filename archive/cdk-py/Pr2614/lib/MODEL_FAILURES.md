# Common Errors and Failures

### Billing Mode Error
**What went wrong:** The model's response used `BillingMode.ON_DEMAND`, but this doesn't exist in the CDK version that is being used.
**Fix:** Replaced it with `PAY_PER_REQUEST`.

### Point-in-Time Recovery 
**What went wrong:** The model suggested using the deprecated `point_in_time_recovery=True` syntax.
**Fix:** Used `point_in_time_recovery_specification` with the proper structure. Inside the specification, i also used `point_in_time_recovery_enabled` and not just `point_in_time_recovery`.

## CloudFront Error

### S3 Origin Deprecation
**What went wrong:** The model used the deprecated `S3Origin` class.
**Fix:** Replaced it with `S3BucketOrigin`.

## Application Load Balancer (ALB) Changes

### Listener Actions with Conditions
**What went wrong:** The model's code was missing the required `priority` parameter when adding conditions to ALB listener actions.
**Fix:** Added priorities to each domain. I also used `enumerate()` to automatically assign priorities 1, 2, 3 to each domain in the list.

## Auto Scaling Configuration

### CPU Utilization Scaling
**What went wrong:** The model tried to pass `scale_in_cooldown` and `scale_out_cooldown` as separate parameters to `scale_on_cpu_utilization`, but these aren't accepted.
**Fix:** Configured cooldown periods using the correct approach.

## Launch Template Issues

### Missing User Data Method
**What went wrong:** The model's code tried to use `add_user_data()` method on `LaunchTemplate`, but this method doesn't exist.
**Fix:** Configured user data through the Launch Template's configuration object instead of trying to call a method that doesn't exist.