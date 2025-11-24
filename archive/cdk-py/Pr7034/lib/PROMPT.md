You’re helping me design and automate a large-scale AWS trading and machine learning environment, and I need you to generate both the infrastructure code and an optimization automation script. The goal is to deploy the trading stack in us-east-1 using CDK in Python, while also preparing an optimization workflow for a related ML platform running in us-west-2. I want the final output to feel like something a senior cloud engineer would write when handing requirements to another developer.

The trading platform needs a full multi-AZ setup with extremely low latency, so please generate CDK Python code (single file lib/tap_stack.py) that builds a dedicated VPC and deploys:

an Aurora PostgreSQL cluster (Postgres engine) sized for high-frequency trading workloads, with an r6g.8xlarge writer, 4 readers, 35-day retention, Multi-AZ, PI enabled, and automated 4-hour backups;

an EC2 Auto Scaling Group of c6i.8xlarge compute-optimized instances (desired 20 / min 15 / max 30) using placement groups, enhanced networking, and io2 EBS volumes provisioned at 10k IOPS;

an ElastiCache Redis cluster-mode-enabled deployment with 15 shards and 2 replicas per shard on cache.r6g.8xlarge, along with data tiering enabled;

three DynamoDB tables (trades/orders/positions) in provisioned mode with 3 GSIs each, streams enabled, and fronted by a DAX cluster (6 nodes, dax.r4.8xlarge).
Spread everything across 3 AZs, include a Direct Connect–like simulation using VPN, add CloudWatch detailed metrics (1-minute), X-Ray tracing, and Log Insights queries for order latency.

Alongside this infrastructure, I also need a Python optimize.py script using boto3 that evaluates 90-day trading metrics and safely tunes resources without impacting the sub-10ms trading SLA. Implement logic like reducing Aurora instance classes when CPU/connection thresholds stay low, lowering EC2 instance sizes and ASG capacity when p95 utilization is low, shrinking Redis shards/replicas when the hit rate is consistently high, and converting DynamoDB to on-demand if capacity consumption stays below 20% for 30+ days. Include rules to scale back up when error rate >1%, latency p95 >15ms, or queue depth >1000. Produce an Excel workbook summarizing cost savings, SLA impacts, before/after resource configurations, 90-day metric visualizations (matplotlib), a Gantt-style roadmap (plotly), rollback procedures, and an RTO/RPO impact assessment.

For additional context: the same AWS account also runs a machine learning inference platform in us-west-2, originally sized for 10k predictions/sec but currently receiving only ~1.2k/sec with GPUs around 15% utilization. Training jobs run ~4 hours/day and will be restructured using spot capacity. Please incorporate optimization considerations such as preserving model accuracy, replaying production traffic before switching to optimized endpoints, gradual rollouts for endpoint updates, A/B tests for new configurations, GPU hour savings analysis, and spot interruption handling. Generate a Jupyter notebook report that visualizes the before/after metrics of these ML optimizations.

Please combine all of this into a single, cohesive output that feels natural and interconnected rather than a list of requirements. The prompt should give you enough clarity to generate production-ready CDK Python code for the full trading stack, the boto3 optimization script, and the ML optimization workflow artifacts.
