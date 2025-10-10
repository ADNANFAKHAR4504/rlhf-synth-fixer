Hey, I need your help putting together a Terraform setup for something pretty serious.

The goal is to design and implement a highly available, multi-region AWS infrastructure for a critical financial application that processes sensitive payment data. Everything has to be resilient, secure, and compliant — automatic failover, real-time data replication, the works. Think in terms of strict RPO (<1 second) and RTO (<5 minutes) across regions.

We’ll have both a primary and secondary AWS region. Each region should use multi-AZ database clusters with cross-region replication, an auto-scaling application layer behind load balancers, and full encryption both at rest and in transit. It also needs strong monitoring, alerting, and automated disaster recovery workflows so that failover happens smoothly without manual steps.

All of this should be written in Terraform using workspaces for each region, with separate and encrypted state files, proper state locking, and custom modules under version control. I’ll need the usual Terraform structure — main.tf, variables.tf, outputs.tf, a modules folder for the reusable pieces, and environment-specific configs under an environments directory.

Please write the Terraform code and explain how it all ties together so that it meets those availability and compliance goals.
