I need to design something pretty straightforward but reliable for a small business. They’ve got about 500 users, and their main concern is backing up critical documents every single day. Nothing fancy—just durable, secure, automated, and not expensive to maintain.

The idea is to lean on S3 as the storage backbone. That means creating a bucket where everything lands. The bucket should automatically clean up old stuff after 30 days using a lifecycle policy, since we don’t want costs spiraling out of control. Security is important, so everything stored should be encrypted with an AWS-managed KMS key. And because access control matters, the bucket will need a proper policy so that only the right IAM principals can touch it.

I also want some visibility: CloudWatch metrics and alerts for the bucket, so if something goes sideways (usage spikes, errors, etc.) we know about it. On top of that, scheduling the backups should be handled through EventBridge so the process kicks off automatically every day without anyone having to remember to run it.

There are some ground rules:

All of this needs to live inside a single tap_stack.tf file.

The region is us-west-2.

No provider blocks in this file (I’ve got those set up separately).

Make sure to include variables and locals where it makes sense, so the file is clean and flexible.

Add outputs for the resources so we can grab the bucket name, ARNs, alarms, etc. after deployment.

The bucket policy for restricted access is not optional—it has to be there.

At the end of the day, the Terraform file should just work: no syntax errors, no missing pieces, following AWS best practices, and creating exactly the described setup. Think durability, simplicity, and cost-efficiency above all.
