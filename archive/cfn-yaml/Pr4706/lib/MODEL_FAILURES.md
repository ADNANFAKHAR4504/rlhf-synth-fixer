# model_failure

# Where the Approach Went Wrong

## Misdiagnosis by Omission

The failure message clearly referenced `Client.InvalidKMSKey.InvalidState`, which points to KMS grant and policy plumbing during EC2 boot. The initial fixes improved the key policy for several services but **missed the Auto Scaling service-linked role**, the entity that commonly attempts to create the grant on behalf of the group.

## Over-reliance on a Single Fix

Adding permissions for `autoscaling.amazonaws.com` is necessary but not always sufficient. In many organizations, the actual actor is the service-linked role. Without that explicit allow, instance launches still fail even though the policy looks broadly permissive.

## Latency and Churn Not Addressed Early

User-data can legitimately take a few minutes to succeed on first boot. Without a health check grace period, the ASG will churn instances while they’re still provisioning, compounding delays and increasing the chance of hitting transient issues.

## Resulting Symptoms

* Long stack creation windows with no progress at the ASG stage.
* Instances repeatedly failing to reach `InService`.
* Final stack failure after extended time with `NotStabilized`, despite other resources succeeding.

## Lessons

* For CMKs used by EBS at boot, always include the **service-linked role** for Auto Scaling in the key policy.
* Provide a fast path using the AWS-managed EBS key to decouple launch success from CMK policy correctness.
* Add a modest health check grace period and resilient user-data from the start.

