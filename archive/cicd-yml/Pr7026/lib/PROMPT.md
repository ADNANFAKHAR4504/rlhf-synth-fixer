# Prompt — Media Streaming Platform CI/CD (Azure, Multi-Region)

## Overview
A media streaming platform requires a video transcoding deployment pipeline on Azure, supporting global CDN distribution, GPU-based AKS transcoding, Azure Media Services, Azure Functions, Cosmos DB, and multi-region failover. This document serves as the prompt.md reference for generating the CI/CD workflow.

## Requirements Summary

### Platform Architecture
- Azure Media Services for encoding and orchestration
- AKS GPU node pools (NVIDIA T4) for transcoding workers
- Azure Functions for upload callbacks and status webhooks
- Cosmos DB for metadata
- Azure Storage for raw and transcoded video
- Azure CDN (Verizon Premium profile)
- Azure API Management as the API gateway
- Application Gateway with WAF
- Azure Traffic Manager for global routing
- Azure Front Door for multi-region delivery

## Security and Access
- Azure Federated Credentials only
- No client secrets
- Service principal with Contributor role
- Workload identity subject example:
  repo:org/repo:environment:production

## CI/CD Workflow Requirements

### 1. validation job
- Bicep linting
- Azure Policy as Code checks
- TypeScript compilation
- Go compilation
- Shellcheck, Hadolint, Yamllint

### 2. build job
- Build Upload API, Transcoding Worker, Streaming API
- Build Azure Functions
- Build React Dashboard
- Bicep → JSON
- Push images to ACR
- Store artifacts

### 3. test job
- Jest tests
- Go tests with testcontainers
- React tests
- Azurite integration tests
- VMAF tests
- K6 load tests

### 4. security job
- Trivy, Grype
- Snyk
- Checkov
- OWASP ZAP
- Defender for Cloud checks
- NSG / KV / DDoS validation

### 5. storage-setup
- Deploy storage + CDN
- Validate CDN cache hit ≥ 85%

### 6. deploy-infrastructure-dev
- Media Services
- Cosmos DB
- AKS GPU
- Function Apps
- Application Gateway + WAF

### 7. deploy-services-dev
- Helm workloads
- Function slot deployments
- Event Grid + APIM

### 8. integration-test-dev
- Transcoding workflow tests
- CDN checks
- Metadata checks
- Azure Monitor KQL

### 9. deploy-staging (Blue/Green)
- Two AKS clusters
- Traffic Manager rollout
- Function slot deployment

### 10. performance-test
- Locust 10k users
- 1000 parallel transcoding
- CDN efficiency
- Encoding ladder timing

### 11. canary-analysis
- Compare blue and green
- Auto rollback if error > 0.5%
- GPU util < 80%

### 12. e2e-test
- Playwright tests
- DRM validation
- ABR validation
- Accessibility checks

### 13. compliance-validation
- Encryption at rest
- Private Link
- RBAC
- Diagnostic settings
- Cosmos DB backup

### 14. production-approval
- Requires approvals from Media Ops, Security, and Platform teams

### 15. deploy-production
- Multi-region rollout: eastus, westeurope, southeastasia
- Rolling deployment
- Health checks
- Front Door + Traffic Manager

### 16. smoke-test
- Multi-region validation
- CDN checks
- Failover checks
- Cosmos replication checks

### 17. monitoring
- Dashboards
- App Insights tracing
- Video Indexer
- Cost anomaly alerts
- PagerDuty integration

### 18. disaster-recovery
- Weekly DR drill
- Cosmos restore
- Storage GRS failover
- Front Door failover
- RTO/RPO validation

## Required Scripts
- deploy-bicep.sh
- deploy-aks-gpu.sh
- deploy-functions-slots.sh
- deploy-blue-green.sh
- transcode-test.sh
- cdn-validation.sh
- failover-test.sh
- configure-monitoring.sh
- rollback-blue-green.sh

## Deliverables
- ci-cd.yml
- scripts directory
- this prompt.md
