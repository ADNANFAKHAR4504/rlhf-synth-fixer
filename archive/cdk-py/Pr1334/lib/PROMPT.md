Hey, so I'm working on this e-commerce infrastructure project and need some help with AWS. The client wants something really robust in us-west-2 that won't fall over if things go sideways.

Basically, we can't have single points of failure anywhere. Web servers, databases, caching layer - everything needs to be spread across multiple AZs. And when stuff breaks (because it always does), we want it to recover on its own without anyone having to wake up at 3am.

The database situation is pretty standard - thinking RDS or Aurora with cross-AZ replication. Nothing fancy, just reliable. Network-wise, we'll need the usual VPC setup with public/private subnets, NAT gateways, security groups locked down tight.

Oh, and automation is huge for them. They want Lambda functions watching CloudWatch and EventBridge, ready to fix problems automatically. IAM permissions should be super minimal - just what each service actually needs to function.

One more thing - this has to work across different environments. Dev, staging, prod, the whole deal. And deployment should be straightforward, not some nightmare process.

Can you put together the CDK code for this? Python preferred, and just throw it in app.py. Thanks!

