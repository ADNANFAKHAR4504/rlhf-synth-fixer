# What Went Wrong (And How We Fixed It)

Here's what actually broke when we deployed tap_stack. Real problems, real solutions. No fluff.

---

## 1) ALB target group stuck unhealthy (ugh)
**The problem**  
- Auto Scaling Group fired up instances but the target group never went green. Just sat there taunting us.

**Root cause**  
- Put the app instances in private subnets (which is right) but forgot the health check path `/` was dead on arrival during boot.  
- NGINX + user-data script took their sweet time, so `/` was throwing 500s for way too long.

**The fix**  
- Kept instances in private subnets (that part was correct) but rewrote user-data to spin up a basic HTTP server ASAP.  
- Tuned health check settings: `path="/"`, accepts `200-399`, and gave it enough time to handle slow boots.

---

## 2) The "web" EC2 was just hanging out alone
**The problem**  
- We had this public EC2 instance sitting there, but it wasn't connected to the load balancer. Target group was empty.

**Root cause**  
- That web box is just for testing/demos. The ALB is supposed to talk to the Auto Scaling Group instances, not this random public box.

**The fix**  
- Left the web EC2 out of the target group completely (that's intentional).  
- Only the ASG instances get attached to the target group. Added some comments to make this clearer.

---

## 3) Lambda couldn't write to S3 (permissions nightmare)
**The problem**  
- Our heartbeat Lambda kept failing with `AccessDenied` when trying to write to the uploads bucket.

**Root cause**  
- The Lambda's IAM role was missing proper S3 permissions AND the KMS permissions needed for the encrypted bucket.  
- Bucket policy was being overly restrictive about TLS but wasn't clear about which principals could actually use it.

**The fix**  
- Gave the Lambda role the obvious permissions: `s3:PutObject`, `s3:GetObject`, `s3:ListBucket` on our bucket.  
- Added all the KMS permissions it needs: `Encrypt`, `Decrypt`, `ReEncrypt*`, `GenerateDataKey*`, `DescribeKey` on the CMK.  
- Kept the bucket policy strict (TLS-only is good) but made sure it doesn't block our own function.

---

## 4) CloudTrail refused our bucket policy
**The problem**  
- CloudTrail setup kept failing with complaints about the bucket policy being "incorrect".

**Root cause**  
- We were missing the magic incantations CloudTrail requires: `s3:GetBucketAcl` and specific `PutObject` permissions with the right ACL on the `AWSLogs/` prefix.

**The fix**  
- Completely rewrote the bucket policy to include what CloudTrail actually wants:  
  - Let CloudTrail read bucket ACLs  
  - Let CloudTrail write to `arn:...:trail/AWSLogs/<account>/*` with the `bucket-owner-full-control` ACL  
  - Still deny non-TLS requests because security

---

## 5) Couldn't delete S3 buckets (versioning trap)
**The problem**  
- Running `terraform destroy` failed with `BucketNotEmpty` errors on our versioned buckets.

**Root cause**  
- When versioning is enabled, a regular delete only removes the current version. All the old versions just sit there laughing at you.

**The fix**  
- Added `force_destroy = true` to both the uploads and CloudTrail buckets.  
- Now Terraform actually cleans up all versions and delete markers when we destroy the stack.

---

## 6) Put the encryption block in the wrong place
**The problem**  
- Terraform threw "Unsupported block type: rule" errors on the S3 config.

**Root cause**  
- I mixed up where the `rule { ... }` block goes for server-side encryption. Put it under the wrong resource.

**The fix**  
- Server-side encryption rules go under `aws_s3_bucket_server_side_encryption_configuration`  
- Versioning and public access blocks get their own separate resources  
- Reading the docs helps (who knew?)

---

## 7) VPC routing was a mess
**The problem**  
- ALB health checks to private instances kept failing randomly after we tweaked the networking.

**Root cause**  
- Subnet associations were inconsistent (some public, some private got mixed up) and route tables were missing default routes to NAT/IGW.

**The fix**  
- Made it crystal clear:
  - Public subnets: `map_public_ip_on_launch=true`, default route `0.0.0.0/0 → Internet Gateway`  
  - Private subnets: default route `0.0.0.0/0 → NAT Gateway`  
  - ALB lives in public subnets, ASG instances live in private subnets  
- Simple, predictable, works every time

---

## 8) SSM wasn't picking up our instances
**The problem**  
- Sometimes instances wouldn't show up in Systems Manager right away, making troubleshooting a pain.

**Root cause**  
- User-data script wasn't installing the SSM agent early enough, and occasionally I'd mess up the IAM role attachment.

**The fix**  
- Instance profile now properly has `AmazonSSMManagedInstanceCore` attached  
- User-data installs and starts SSM agent FIRST, before setting up the web server  
- No more mystery disappearing instances

---

## 9) Forgot to enforce IMDSv2
**The problem**  
- Instance metadata was accessible without tokens after some config changes.

**Root cause**  
- Either forgot the `metadata_options` block entirely or left it set to "optional" during testing.

**The fix**  
- Added `metadata_options { http_tokens = "required" }` to all EC2 instances and ASG launch configs  
- IMDSv2 only, no exceptions

---

## 10) API Gateway authentication kept resetting
**The problem**  
- Sometimes the API Gateway would be wide open to the internet instead of requiring IAM authentication.

**Root cause**  
- The route authorization type kept drifting back to "NONE" during config changes.

**The fix**  
- Made sure all HTTP API routes have `authorization_type = "AWS_IAM"`  
- Integration points to the ALB DNS name  
- Default stage auto-deploys changes

---

## 11) CloudWatch Logs encryption was picky
**The problem**  
- Log group encryption failed because the service couldn't create grants with the right context.

**Root cause**  
- KMS policy didn't allow `logs.<region>.amazonaws.com` to use the key with the proper encryption context for our specific log group.

**The fix**  
- Created a dedicated CMK just for CloudWatch Logs  
- Policy allows the logs service to use it when the encryption context matches our `/cloud-setup/<env>/*` log groups  
- No more encryption context mismatches

---

## 12) Terraform outputs were useless
**The problem**  
- After deployment, it was impossible to quickly find ALB URLs, API endpoints, bucket names, or instance IDs.

**The fix**  
- Added meaningful outputs for everything we actually need:  
  - VPC and subnet IDs  
  - ALB ARN and DNS name  
  - Target group ARN  
  - API Gateway endpoint  
  - S3 bucket names  
  - EC2 instance IDs and IP addresses  
  - KMS key ARNs  
  - CloudTrail bucket name  
- Now you can actually verify stuff works without digging through the console

---

### What we ended up with
After all that debugging, we finally have a setup that just works:
- Load balancer in public subnets, app servers in private subnets, health checks go green fast  
- S3 buckets are secure but don't fight with our own Lambda functions  
- CloudTrail policy follows AWS's exact requirements (turns out they're pretty specific about this)  
- `terraform destroy` actually works without getting stuck on versioned objects  
- All EC2 instances show up in SSM and require IMDSv2  
- Clear outputs so anyone can quickly check what got deployed  

Nothing fancy, just solid infrastructure that doesn't wake you up at 3am.
