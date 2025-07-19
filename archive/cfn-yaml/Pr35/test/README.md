# Integration Tests

## Enhanced Integration Test Setup

### 1. Pre-test Lambda Build Process:
- 🔨 **Builds Lambda package** with `npm install --production`
- 📦 **Installs mysql2 dependency** and verifies it exists
- 🧹 **Cleans previous builds** to ensure fresh dependencies
- ✅ **Verifies package creation** and reasonable file size
- 📊 **Reports package size** to confirm dependencies are included

### 2. Robust Error Handling:
- ⏱️ **2-minute timeout** for npm install process
- ❌ **Detailed error messages** if build fails
- 🔍 **Package verification** before proceeding with tests
- ⚠️ **Size validation** to catch missing dependencies

### 3. Build Script Enhancements:
- 🧹 **Clean slate approach** - removes old builds first
- 📦 **Production-only dependencies** for smaller package
- ✅ **mysql2 verification** ensures critical dependency is present
- 📊 **Size reporting** with warnings for suspiciously small packages

## How it works:

1. **Test starts** → `beforeAll()` executes build script
2. **Build script** → Installs mysql2 + creates ZIP package  
3. **Verification** → Confirms package exists and has dependencies
4. **CloudFormation** → Uses the ZIP package with mysql2 included
5. **RDS Tests** → Lambda can now properly connect to MySQL database

Your Lambda function will now have access to the real mysql2 library for actual database operations! 🎉

## Test Structure

### RDS Integration Tests
- Tests database connectivity through Lambda function
- Creates, reads, updates, and deletes test data
- Validates error handling for invalid queries

### ALB Integration Tests
- Tests Application Load Balancer endpoint accessibility
- Verifies target group health and configuration
- Validates load balancer routing

### VPC and Subnet Integration Tests
- Verifies VPC and subnet configuration
- Tests multi-AZ availability setup
- Validates network routing and connectivity

### High Availability (HA) Tests
- Ensures RDS Multi-AZ configuration
- Verifies resources are distributed across multiple AZs
- Tests infrastructure resilience