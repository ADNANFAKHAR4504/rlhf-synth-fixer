What was delivered

A single-file CloudFormation template named TapStack.yml that deploys, without edits, a complete, production-grade stack in us-east-1:

Networking

VPC 10.0.0.0/16, DNS support enabled.

Two public and two private subnets spread across distinct Availability Zones via Fn::GetAZs.

Internet Gateway + public route tables; private route tables with default routes to zonal NAT Gateways.

Security

ALB security group: inbound 80/443 from the internet; outbound open.

App security group: inbound 80 only from ALB SG; outbound open.

Compute

Launch Template using an SSM-sourced Amazon Linux 2 AMI and IMDSv2.

UserData installs and starts a simple web server, serves / and a fast /health endpoint.

Auto Scaling Group (min=2, desired=2, max=4) across private subnets.

Load Balancing

Internet-facing Application Load Balancer across public subnets.

HTTP listener on port 80 forwarding to a Target Group on port 80.

Health checks on /health with quick stabilization.

Logging

Dedicated S3 bucket for access logs with:

Ownership controls set to BucketOwnerPreferred.

Public access blocked and SSE-S3 encryption.

Bucket policy granting the us-east-1 ELB account (127311923021) s3:PutObject to the account-scoped log prefix and s3:GetBucketAcl.

Optional aws:SourceAccount and aws:SourceArn conditions for tighter scoping.

ALB attributes configured to write logs to this bucket with prefix alb/.

IAM

EC2 instance role and profile with minimal List/Get/Put permissions for the logs bucket prefix (to satisfy the stated requirement while keeping least privilege).

Tagging

Every resource includes Environment: Production.

Outputs

VpcId, PublicSubnetIds, PrivateSubnetIds, AlbDnsName, TargetGroupArn, AutoScalingGroupName, InstanceRoleArn, LogsBucketName, AlbSecurityGroupId, AppSecurityGroupId.

Why these decisions

High availability: subnets and instances distributed across AZs; NAT per AZ with same-AZ routing prevents cross-AZ dependency during failures.

Security posture: private instances never receive public traffic; SGs gate traffic precisely; IMDSv2 enabled; least-privilege IAM.

Operational clarity: standardized outputs; deterministic, account-unique resource names; access logging configured centrally.

Low friction deploy: no manual parameters required; dynamic AMI reference via SSM.

How to deploy and verify

Validate locally:

Run your linter to confirm it’s clean and free of substitution warnings.

Deploy:

Use your preferred method (CLI, pipeline, or console) targeting us-east-1.

Verify health:

Watch Target Group health until both instances show healthy.

Visit the AlbDnsName output over HTTP; you should see the welcome page.

Verify logs:

Check the logs bucket for new objects under alb/AWSLogs/<your-account-id>/....

Notes for future enhancement

Add HTTPS listener with an ACM certificate and redirect 80→443.

Add WAF for L7 protections.

Replace the demo web server with your application artifacts and lifecycle hooks.

Introduce log lifecycle and prefix partitioning for cost control.