I need you to approach this like an experienced senior Terraform engineer mixed with an AWS architect. The context here is failure recovery automation for a large-scale manufacturing IoT platform with 156,000 sensors across 234 factories, but this time we’re going for a real infrastructure deployment that runs in production.

Here’s what I need upfront:
Act as a senior Terraform engineer and build me a **single Terraform file** that deploys our production infrastructure to **us-east-1**. The file should be named `tap_stack.tf`. Everything — from the VPC to the IoT recovery components — must live inside this one Terraform file. No modules, no splitting.

Start with a well-defined **VPC setup**:
- Create one custom VPC (non-default) dedicated for this entire IoT platform.
- Add **2 public subnets** and **2 private subnets**, spread across different availability zones.
- Attach an **Internet Gateway** for outbound access from the public subnets.
- Include **NAT Gateways** for the private subnets so that internal services can reach AWS APIs without being publicly exposed.
- Route Tables need to be configured correctly for public and private subnet traffic.

Now, the main purpose of this infrastructure is to automate recovery from failures in our AWS IoT pipeline. The environment is production (`HCL prod`), and everything below needs to tie into this VPC topology.

The flow goes like this:

If an **IoT Core message broker** begins failing — say messages stall or drop unexpectedly — **CloudWatch** must pick that up within 20 seconds. We’ll set up metrics like `ConnectionAttempts` and `IncomingMessages` for IoT Core. Once the threshold crosses, CloudWatch fires an alarm.

That alarm triggers a **Lambda function** (Node.js 20.x runtime, 1 GB memory, 180s timeout) that queries the IoT Data Plane APIs to check shadow states and connection health for all 156,000 devices. This Lambda should run parallel checks efficiently (async batching or pagination). When it finishes verifying device status, control shifts to **Step Functions**.

**AWS Step Functions** will orchestrate recovery through several coordinated actions:
- Invoke a secondary Lambda (2 GB memory, Python runtime) to pull buffered data from **DynamoDB** and republish those messages to **Kinesis Data Streams** at high rate — roughly 890,000 messages per minute.
- Launch parallel branches to recalculate time-series aggregates in **Timestream** databases. These recalculation tasks must complete within 10 minutes.
- Send event updates through **EventBridge**, routing them to 45 downstream **SQS queues**, one per sensor type. Routing keys can be derived from message attributes such as sensor category or region.

While all this happens, **Athena** queries the raw S3 data lake to find data gaps, completing within 5 minutes. Detected gaps trigger **Glue ETL jobs** that backfill missing data from on-premise (factory-local) databases through an **AWS VPN** setup. Those Glue jobs should finish within 30 minutes and push the restored data back into S3 and Timestream for consistency.

Performance constraints we’re aiming for:
- CloudWatch: detect within 20 seconds
- Lambda: verify all 156,000 devices in under 2 minutes
- Step Functions: replay up to 12 hours of buffered data
- Kinesis: handle 890,000 msgs/minute
- Timestream: recalc done in 10 minutes
- Athena: detect data gaps in 5 minutes
- Glue: complete backfill in 30 minutes

We’ll keep everything in **us-east-1** for this stack and ensure that IAM roles use least privilege — separate roles for Lambda, Step Functions, Glue, etc. CloudWatch metrics and alarms should also have recovery dashboards for visibility.

The end goal for NOVA is to output:
- A complete architecture plan that stitches together these AWS services as part of an automated recovery connector
- And a **Terraform file (`tap_stack.tf`)** that launches the full production infrastructure (VPC, subnets, networking, and all required service scaffolding) in **us-east-1**
- Also the suffix is not required with all the resources so use it wherever specifically needed.
This should feel like something a real senior DevOps engineer would craft by hand — optimized, readable, production-ready, and secure by default. Terraform syntax should be clean, consistent, and modular in logic even though we’re keeping everything in one file.

Let’s make the recovery pipeline both autonomous and resilient — fully AWS-native, tightly integrated, and deployable with a single Terraform apply.
