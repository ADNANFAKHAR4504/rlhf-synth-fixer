We need to put together a CDKTF + Python stack ('secure-webapp-environment') that builds out a highly available and secure web application setup in AWS. This is going to run in us-east-1, and it needs to check all the boxes for best practices around high availability, security, and maintainability and all the stack/infra code should follow monolithic approach.

Here’s what the environment has to look like:

- Start with a VPC that spans multiple availability zones, and make sure there are at least two public subnets in different AZs.
- The application should sit behind an internet-facing ALB.
- EC2 instances can’t just be stand-alone — they all need to run in an Auto Scaling Group, spread across AZs so the app stays up even if one zone goes down.
- Any EC2s that need access to S3 should get it through IAM roles only. No embedded or hardcoded keys anywhere.
- Enable monitoring on every EC2 instance, and push all logs into CloudWatch so there’s one place to look when we need to debug or audit.
- For the database layer, use RDS, and turn on encryption at rest and in transit. Data protection is not optional here.
- Security groups have to be tight: only allow essential ingress traffic. No wide-open rules.
- S3 buckets must block public access and have versioning turned on so we don’t lose data by accident.
- Set up automated backups for data and define a retention policy so we don’t just keep backups forever.
- IAM policies should follow least privilege. Nothing broad or overly permissive.

On top of that, every resource needs to be tagged with `Environment: Production` so we keep things consistent and traceable.

The output here is one GO file named. It should pass validation, deploy cleanly, and hold up against integration tests.
