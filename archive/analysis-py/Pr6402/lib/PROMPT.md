Okay, our e-commerce platform just finished the holiday rush, and our AWS bill for `us-east-1` is massive. We have almost 900 EC2 instances, and I know we're wasting a ton of money. I need a really advanced Python script using Boto3 and Pandas to find where all the cash is going.

**Analysis Requirements:**
Here's the analysis I need the script to perform:

1.  Find "zombie" instances: Pull the 14-day CloudWatch metrics. Any instance with average CPU under 10% _and_ average network traffic under 5MB/hour needs to be flagged.
2.  Find oversized memory instances: Look at our memory-optimized fleet (r5, r6i, x2 families). If they've been running with memory utilization under 40%, they're too big.
3.  Find old-gen instances: We should have migrated all t2, m4, c4, and r4 instances by now. List any that are still running so we can move them to t3, m5, etc.
4.  Find stopped instances still costing us money: List any stopped instance that still has EBS volumes attached.
5.  Find Reserved Instance (RI) gaps: Use the Cost Explorer API. For any instance family where we're running more than 5 instances (like c5.xlarge), check if our RI coverage for that family is 0%.
6.  Find untagged instances: We can't do FinOps without tags. Find any instance missing `CostCenter`, `Environment`, `Owner`, or `Application`.
7.  Find inefficient storage: Scan our EBS volumes. Any `gp2` volume should be flagged for migration to `gp3` for instant savings.
8.  Find burstable credit abuse: Look at our t2/t3 fleet. Find any instances that are consistently running in "unlimited mode" and racking up extra credit charges.

**Output Requirements:**
For the output, I want two files. First, a JSON report named `ec2_cost_optimization.json`.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
