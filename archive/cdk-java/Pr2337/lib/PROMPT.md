Hey there! I'm working on a security configuration project at my company and could really use some help with AWS CDK in Java. We're pretty serious about security here, especially after what happened with some other teams last year.

I'm trying to build a secure infrastructure setup that handles confidential logs. The business folks are breathing down our necks about compliance, and honestly, I'm still getting used to CDK Java after working mostly with CloudFormation templates before.

Here's what I need to accomplish:

I need to set up an S3 bucket that's going to store some pretty sensitive log data. The security team has made it crystal clear that this bucket needs to be locked down tight - absolutely no public access whatsoever. They also want server-side encryption with Amazon S3-managed keys. I've heard horror stories about misconfigured S3 buckets, so I want to make sure I get this right.

Next, I need a Lambda function that can process entries when they land in that S3 bucket. The function doesn't need to do anything fancy - just basic log processing. But I'm concerned about giving it the right permissions. I want to follow the principle of least privilege, so it should only have the bare minimum permissions it needs for S3 access and Lambda execution.

Finally, I need an RDS database to store the processed logs. This is where it gets tricky for me - I need to make sure the database is encrypted at rest using a KMS key, and it definitely can't be publicly accessible. The DBA team will have my head if I accidentally expose our database to the internet.

Oh, and everything needs to be isolated within a VPC. I'm thinking a simple CIDR of 10.0.0.0/16 should work fine for our use case. All resources should be tagged with 'Project: SecurityConfig' for cost tracking purposes.

I'm targeting the us-east-1 region since that's where most of our other infrastructure lives. 

One more thing - could you make sure the Lambda function uses AWS EventBridge for new event notifications? I heard it's becoming the preferred way to handle S3 events, and I want to stay current with AWS best practices.

Also, I'd appreciate it if you could include AWS Secrets Manager to store the RDS database credentials securely. I know it's an extra step, but our security policies require it for any database connections.

I'm hoping to get all of this implemented in CDK Java. I've been reading the docs, but there are so many options and I want to make sure I'm not missing any important security configurations. Any help would be amazing!

Thanks in advance!