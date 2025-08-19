Hey, we're trying to get our infrastructure moved over to AWS and need some help with the setup. We've been running things manually but want to get everything properly coded up using Pulumi TypeScript.

Here's what we need to get running:

We need to support both our dev and prod environments, so probably need some way to configure things differently for each. Our app runs on some EC2 instances and we want to make sure we're getting proper monitoring set up - CloudWatch should work fine for that.

For storage, we're going to need S3 buckets with versioning turned on, and we definitely need encryption on everything since we're dealing with customer data. The database side needs to be MySQL on RDS, also encrypted at rest.

Security wise, we want to follow best practices - minimal permissions for IAM roles, security groups that only let HTTP/HTTPS through, that kind of thing. We're planning to deploy everything in us-west-2.

Oh and make sure everything gets tagged properly with Environment and Owner tags so we can track costs and ownership.

We've heard good things about Systems Manager Parameter Store for config management, so if you could include that it would be great. Also looking at containerizing some workloads with ECS Fargate behind a load balancer eventually.

Would be awesome if you could write this as TypeScript code that's organized nicely and we can tear down cleanly when needed. Nothing too fancy, just something solid that we can build on.