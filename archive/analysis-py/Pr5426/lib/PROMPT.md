We need a new FinOps CLI tool, this time using Python and Boto3. This one needs to find the real waste in us-east-1, the non-obvious stuff.

Here’s the analysis I need it to do. First, find idle ALBs. And I don't just mean unattached. It needs to check CloudWatch for RequestCount over the last 14 days. If the sum is under 1000, flag it. Second, NAT Gateways. These are expensive. Check BytesProcessed for the last 30 days. If it's under 1 GB, flag it. Also, check its AZ. If there are no private subnets in that AZ, it's a misconfiguration, so flag that too. Third, S3. Find buckets with versioning on but no non-current version expiration policy. That's a huge hidden cost. Also, for any bucket over 1 TB, check if it's missing a lifecycle rule to Glacier Deep Archive. Fourth, EIPs. Find the unassociated ones, but also find any that are attached to stopped EC2 instances.

Now, a critical safety rule: the R&D team has a bunch of test gear. We must not report any resource that has the 'CostCenter' tag set to 'R&D'. The script has to check for this tag and skip the resource, even if it looks idle.

For the output, I want a clean table printed to the console for a quick look, and also a finops_report.json file. The JSON needs to include the ResourceId, Region, WasteType, and an EstimatedMonthlySavings for each finding.

Please provide the code in lib/analyse.py
