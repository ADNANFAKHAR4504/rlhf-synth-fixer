Hey, I'm working on this e-commerce site that's been growing pretty fast and we're hitting some scaling issues. Black Friday completely crashed our servers last year, so I really need to get this infrastructure sorted out before the next holiday season.

We're using Java for everything else in our stack, so I'd love to use CDK Java for the infrastructure too. The main thing is we need this to be rock solid - customers get really angry when they can't checkout during a sale.

So here's what I'm thinking:

We definitely need multi-region deployment. I was looking at us-east-1 as primary since that's where most of our traffic comes from, and maybe us-west-2 as backup? Last time AWS had that big outage in Virginia we were completely down for 6 hours. Can't have that happen again.

For the auto scaling, during normal days we might have like 1000 users, but during flash sales or Black Friday we've seen it jump to 5000+ concurrent users. The current setup just dies. I'm thinking maybe start with t3.medium instances since they're cost effective, but we might need to scale up to something beefier like c5.large when things get crazy.

Load balancing is obviously crucial. Need both HTTP and HTTPS working properly - we've had SSL cert issues before that took the site down. 

Oh and Route 53 for DNS failover would be great. I heard there's some new Application Recovery Controller thing that might help coordinate failovers better? Not sure if that's worth the complexity though.

One more thing - I saw that Global Accelerator can help with performance for international customers. We're getting more traffic from Europe and Asia, so that might be worth it.

Security wise, just want to make sure we follow best practices. VPC setup, proper subnets, all that good stuff. Don't want to end up on the news for a data breach.

Can you help me build this out? I'd prefer to keep the code organized with separate files for different pieces - makes it easier for my team to understand and maintain. Thanks!