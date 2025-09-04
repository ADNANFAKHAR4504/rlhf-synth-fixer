Claimed multi-AZ networking and ALB, but the template is single-AZ by design and does not create any load balancer. All subnets use !Select [0, !GetAZs ""], keeping everything in one AZ, and there is no ALB or listener defined.

Stated that CloudTrail trails are created and shipped to CloudWatch Logs. The template purposely does not create a CloudTrail trail. It only creates a KMS-encrypted TrailBucket and a bucket policy that allows CloudTrail to write if a trail elsewhere targets the bucket.

Mentioned AWS WAF, Shield Advanced, Auto Scaling Groups, and an RDS instance. None of these resources exist in the template. Compute is a single t3.micro EC2 instance in a public subnet.

Said S3 public-access block and deny-insecure-transport policies are present. The file configures SSE-KMS and versioning for SecureBucket, plus CloudTrail-required statements on TrailBucket. It does not add a Public Access Block or an explicit DenyInsecureTransport statement.

Asserted a cross-account IAM role with MFA. The template defines no cross-account roles; the only conditional IAM resource is the AWS Config role when EnableConfig is "true".

Claimed the AMI is hardcoded. The actual AMI is retrieved dynamically via the LatestAmiId SSM parameter for Amazon Linux 2.

Said CloudWatch alarms include ALB metrics. The only alarm configured is UnauthorizedApiCallsAlarm for the AWS/CloudTrail UnauthorizedAPICalls metric, with a single evaluation period and a 5-minute period, and no actions.