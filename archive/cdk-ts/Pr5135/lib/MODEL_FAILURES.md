# Infrastructure Deployment Issues and Fixes

## Issues Found and Fixed

### 1. ECS Container Port Configuration Mismatch
**Issue**: The infrastructure defined an nginx container configured to expose port 8080, but nginx by default runs on port 80. This caused health check failures in the ECS service.

**Impact**: ECS tasks repeatedly failed health checks and were terminated, preventing the service from stabilizing.

**Fix Applied**:
- Changed container port mapping from 8080 to 80 in `compute-stack.ts`
- Updated target group port from 8080 to 80
- Modified security group rule to allow traffic on port 80 instead of 8080

### 2. Resource Provisioning Time
**Issue**: Aurora Serverless v2 PostgreSQL cluster takes 15-20+ minutes to provision, causing extremely long deployment times.

**Impact**: Deployment timeout and poor development experience during testing.

**Recommendation**: Consider using standard RDS PostgreSQL for development/testing environments, or implement a tiered approach where Aurora Serverless is only used in production.

### 3. Missing Application Container
**Issue**: The infrastructure uses a generic nginx container without any actual API application code.

**Impact**: While the infrastructure deploys, it doesn't serve the intended API functionality.

**Recommendation**: Replace nginx container with a proper API application container that implements the StreamFlix content metadata API.