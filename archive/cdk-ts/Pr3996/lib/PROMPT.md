We need to build the AWS CDK project in TypeScript for our new global trading platform. This has to be a multi-region, active-active setup in us-east-1 and eu-west-1 to ensure we have zero downtime and meet our performance goals.

First, let's define the global components. We'll use AWS Global Accelerator to provide a static entry point and direct user traffic to the nearest healthy region. For the database, it has to be Amazon Aurora Global Database. The primary cluster will be in us-east-1 with a writable secondary in eu-west-1, which is critical for fast reads and sub-second database failover.

Next, for the infrastructure that gets deployed in each of the two regions. Each region needs its own VPC with the specified non-overlapping CIDRs (10.0.0.0/16 and 172.16.0.0/16). To connect them for private backend communication, set up a Transit Gateway with inter-region vpc peering. Inside each VPC, we'll run our microservices (like the trading engine and order management) on Amazon ECS with AWS Fargate, fronted by a regional Application Load Balancer. The Global Accelerator will point to these ALBs.

To enforce our governance rules across the entire project, we need to use a CDK Aspect. This Aspect should automatically apply our standard tags (e.g., Project: TradingPlatform) to every single resource. It must also check that all storage resources like S3 buckets have encryption enabled, and fail the build with an error if they don't.

Please provide the complete and well-structured AWS CDK TypeScript project that defines this infrastructure.
