Please write IAC code in cdktf Go using the data given below:

This is the Environment that the task asks for:

You are tasked with developing a `tap_stack.go` file to ensure multi-environment consistency across different AWS regions. This requires expertise in structuring CDKTF stack that can manage resources in a synchronized manner, specifically focusing on load balancers and auto-scaling groups. Requirements include:

Deploy an application consisting of an Elastic Load Balancer (ELB) and linked Auto Scaling Groups (ASG) across three regions: us-east-1, us-west-2, and eu-central-1.
Ensure that the ELB scales automatically based on predefined metrics and that ASGs are set to maintain a minimum of two instances per region.
Use variables and mappings to handle different configurations per region, ensuring no manual changes are needed when deploying infrastructure in different regions.
4.Integrate Route 53 for consistent DNS resolution, distributing traffic to the least-loaded region while maintaining failover capabilities. For testing and demonstration purposes, use a public hosted zone with a fake domain name (e.g., `fake-domain.com) instead of a real registered domain. Route53 allows creation of such zones even if the domain does not exist, which is sufficient to validate health checks and failover behavior within AWS.

Expected output: A single `tap_stack.go` file written in CDKTF Go that, when executed, provisions this setup across the specified regions. Ensure it includes detailed comments explaining each section of the code.

- Single Go source file: `lib/tap_stack.go`.
- Use only `cdktf`, constructs, and packages under `.gen/aws/*` (e.g. `github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup`).

These are the Contraints for the task:

Utilize a single `tap_stack.go` file in CDKTF Go to deploy resources consistently across multiple AWS regions. For DNS failover, configure a Route 53 hosted zone with a fake domain, along with health checks and failover records pointing to the ELBs.

And this is the Proposed Statement:

Target environment is AWS with multiple regions including us-east-1, us-west-2, and eu-central-1. Resources must be deployed consistently with a focus on minimizing latency and ensuring high availability. Route 53 hosted zone should use a placeholder domain (e.g., `fake-domain.com`) for testing DNS failover without requiring a real domain name.

Please write IAC code based on these instructions.
