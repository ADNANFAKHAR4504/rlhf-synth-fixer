# Aurora MySQL Version Issue

Hey, running into an issue with the Terraform deployment. 

## The problem

Getting an error when trying to create the Aurora cluster. Terraform is failing with:

**Error:** Can't create RDS Cluster "proj-webapp-aurora-cluster" - AWS API is returning InvalidParameterCombination. Says it can't find version 8.0.mysql_aurora.3.02.0 for aurora-mysql.

## Where it's failing

The error is happening in tap_stack.tf at line 649 where we define the RDS cluster resource. Looks like the engine version we're trying to use doesn't exist or isn't available.

## What I need

Need to fix the Aurora MySQL engine version to one that actually exists in AWS. Should probably use a version that's:
- Currently available in the region
- Compatible with Aurora MySQL 8.0
- Stable and production-ready

Can you update the cluster configuration with a valid engine version? Maybe also add a data source to automatically get the latest available version so we don't hit this issue again?

The rest of the config seems fine, just need to sort out this version mismatch.