1.

Reason
ALB is configured to send logs to the S3 bucket tap-logs-<suffix>, but this bucket as currently defined has only encryption, tagging, versioning, and lifecycle rules.
The default S3 bucket settings (especially with block_public_acls, block_public_policy, and restrict_public_buckets) block almost all external access, including AWS internal services like ELB, unless you explicitly update the bucket policy to let the ELB service write logs into it.

Fix
Add a bucket policy to allow your specific ELB service principal to write logs. The service principal is logdelivery.elasticloadbalancing.amazonaws.com. Here’s the resource you should add (after the encryption and before the lifecycle):

```

│ Error: modifying ELBv2 Load Balancer (arn:aws:elasticloadbalancing:us-east-1:***:loadbalancer/app/tap-alb-1205/b7f12c999a82d846) attributes: operation error Elastic Load Balancing v2: ModifyLoadBalancerAttributes, https response error StatusCode: 400, RequestID: 4e236b16-4388-4c19-bbb1-87304d07e8cc, InvalidConfigurationRequest: Access Denied for bucket: tap-logs-1205. Please check S3bucket permission
│ 
│   with aws_lb.main,
│   on tap_stack.tf line 645, in resource "aws_lb" "main":
│  645: resource "aws_lb" "main" {

```

2.

Reason
You have both a aws_s3_bucket_acl resource and public access blocks enabled.
Modern S3 buckets (especially when created with BlockPublicAcls and BlockPublicPolicy true) do not need (and often do not allow) manual ACL setting.
Setting an ACL is incompatible with these security features and frequently results in this error.

Fix
Remove the following section from your configuration (delete or comment it out):

```

│ Error: creating S3 Bucket (tap-logs-1205) ACL: operation error S3: PutBucketAcl, https response error StatusCode: 400, RequestID: HX8DYKH9Y8TGXGR5, HostID: Dh4oPWfnBisba23P6UzhJc+7DHwKzUq6BTFbPTKzZkOiUfSe63/xuFO1KUeiAgRllNf8cqGoDjU=, api error AccessControlListNotSupported: The bucket does not allow ACLs
│ 
│   with aws_s3_bucket_acl.logs,
│   on tap_stack.tf line 866, in resource "aws_s3_bucket_acl" "logs":
│  866: resource "aws_s3_bucket_acl" "logs" {
│ 

```
