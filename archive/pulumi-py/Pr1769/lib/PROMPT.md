# Migration Plan: AWS us-west-1 → us-east-1

We need to move our infrastructure from **us-west-1** into **us-east-1**.  
The main services involved are S3, EC2, and RDS. The move should not cause downtime for our public-facing workloads.

## Goals

- Shift all S3 buckets and ensure data is consistent and verifiable after replication.  
- Recreate EC2 instances in the new region but keep the same public IPs. Services should remain available throughout the transition.  
- Relocate RDS databases while preserving encryption, backups, and parameter configurations.  
- Add CloudWatch monitoring so we can track health and performance once the migration is complete.  
- Make sure backups exist before and after the move in case a rollback is needed.  

## Approach

For S3 we’ll use cross-region replication and final sync jobs to confirm no data is lost.  
EC2 will rely on elastic IPs so the addresses don’t change when moving to the new region. We can cut over gradually using DNS to avoid downtime.  
For RDS, we’ll use snapshots or cross-region replicas depending on the database type, then promote the replica in us-east-1.  
CloudWatch dashboards and alarms will be set up to give visibility into the environment.  

## Pulumi Requirements

- Use **Pulumi with Python** for defining all resources.  
- The program should be idempotent and safe to re-run.  
- Enforce encryption on all S3 buckets and databases.  
- Apply least-privilege IAM roles where needed.  

## Testing & Validation

We’ll add unit tests with Pulumi mocks and basic integration tests that confirm resources can be deployed.  
Validation will include confirming that S3 replication completes, EC2 services respond during the switch, and RDS connections remain intact.  

---

This document is intentionally written as a migration note rather than a generated spec.  
