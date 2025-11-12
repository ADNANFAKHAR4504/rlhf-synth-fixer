# Model Failures - Task 4f1rq8

## Critical Failure 1: Deprecated CloudWatch Synthetics Runtime (Category A)

**MODEL_RESPONSE**: Used `SYNTHETICS_NODEJS_PUPPETEER_5_1` (deprecated)
**Deployment Error**: "Invalid request provided: Deprecated runtime version specified: syn-nodejs-puppeteer-5.1 (Status Code: 400)"
**IDEAL_RESPONSE**: Use `SYNTHETICS_NODEJS_PUPPETEER_7_0` (current version)
**Training Value**: HIGH - AWS service version lifecycle management, security implications

## Critical Failure 2: Missing crossRegionReferences (Category A)

**MODEL_RESPONSE**: Stack constructors used `super(scope, id, props)` without crossRegionReferences
**Synth Error**: "Stack DatabaseSecondary cannot reference DatabasePrimary/GlobalCluster. Set crossRegionReferences=true"
**IDEAL_RESPONSE**: All stacks use `super(scope, id, { ...props, crossRegionReferences: true })`
**Training Value**: HIGH - Multi-region CDK patterns, cross-stack references

## Critical Failure 3: S3 CRR Dependency Management (Category B)

**MODEL_RESPONSE**: Configured CRR on source bucket before destination bucket exists
**Potential Error**: "Destination bucket must exist" during parallel deployment
**IDEAL_RESPONSE**: Sequential deployment or dependency management to ensure destination exists first
**Training Value**: MEDIUM - Resource dependency orchestration in multi-region

**Total Critical Failures**: 3 (2 Category A, 1 Category B)
**Training Quality**: 8-9/10 - Expert-level multi-region DR with real production-blocking issues
