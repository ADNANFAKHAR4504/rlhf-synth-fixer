We're building an e-commerce platform and need AWS infrastructure in us-west-2 that's bulletproof. Can't have downtime during Black Friday, you know?

The main thing is redundancy - if one availability zone craps out, everything should keep running smoothly. We've had outages before where the whole site went down because some critical piece was only in one zone. Never again.

Database needs to be rock solid too. Probably RDS with multi-AZ, maybe Aurora if the budget allows. Customer data can't get lost, period. And speaking of data, everything needs encryption - at rest, in transit, the works. Compliance is breathing down our necks about this stuff.

For the network setup, thinking VPC with the usual public/private subnet split. Security groups locked down tight - only what's absolutely necessary gets through. We've been burned by overly permissive rules before.

The ops team is stretched thin, so automation is crucial. When something breaks at 2am, we want Lambda functions fixing it before anyone even notices. CloudWatch alarms, auto-scaling, health checks - the full monitoring stack.

Oh, and this needs to work for dev and staging environments too, not just production. Developers are always spinning up new instances and we need consistent deployments.

Can you put together the CDK code? Python works best for our team. Just need something we can actually deploy and iterate on.
