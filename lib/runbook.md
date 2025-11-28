# Database Migration Runbook

This runbook provides step-by-step procedures for executing the on-premises to AWS database migration.

## Migration Overview

- **Source**: On-premises PostgreSQL 13.x (500GB data + 2TB files)
- **Target**: AWS Aurora PostgreSQL 13.12 (Multi-AZ)
- **Migration Tool**: AWS Database Migration Service (DMS)
- **File Migration**: AWS S3 with lifecycle policies
- **Migration Window**: 4 hours
- **Deployment Pattern**: Blue-green with rollback capability

## Pre-Migration Checklist

### 1 Week Before Migration

- [ ] Infrastructure deployed and tested
- [ ] DMS replication task tested with sample data
- [ ] Aurora parameter groups match source PostgreSQL settings
- [ ] All schemas, indexes, and stored procedures verified in target
- [ ] CloudWatch dashboard and alarms configured
- [ ] SNS alert subscriptions confirmed
- [ ] Backup and rollback procedures tested
- [ ] Stakeholders notified of migration schedule

### 24 Hours Before Migration

- [ ] Final infrastructure validation
- [ ] DMS replication lag baseline established
- [ ] Application team ready for cutover
- [ ] On-call team notified
- [ ] Communication channels established
- [ ] Database backup completed and verified
- [ ] File storage backup completed

### 1 Hour Before Migration

- [ ] All team members on call
- [ ] Final system health check completed
- [ ] Backup verification completed
- [ ] Runbook reviewed with team

## Migration Phases

### Phase 1: Initial Setup (Complete before migration window)

**Duration**: Completed during infrastructure deployment
