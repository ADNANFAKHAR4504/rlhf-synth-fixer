#!/bin/bash
# Fix unused variable errors by prefixing with underscore

files=(
  "lib/compliance-monitoring-stack.ts"
  "lib/health-dashboard-stack.ts"
  "lib/inspector-stack.ts"
  "lib/security-hub-stack.ts"
  "lib/security-services-stack.ts"
  "lib/tap-stack.ts"
  "lib/vpc-stack.ts"
  "lib/compute-optimizer-stack.ts"
  "lib/detective-stack.ts"
  "lib/devops-guru-stack.ts"
  "lib/well-architected-stack.ts"
)

for file in "${files[@]}"; do
  # Replace const with const _ for unused variables
  sed -i '' 's/const emailSubscription/const _emailSubscription/g' "$file"
  sed -i '' 's/const scheduledTarget/const _scheduledTarget/g' "$file"
  sed -i '' 's/const scheduledPermission/const _scheduledPermission/g' "$file"
  sed -i '' 's/const ec2Target/const _ec2Target/g' "$file"
  sed -i '' 's/const ec2Permission/const _ec2Permission/g' "$file"
  sed -i '' 's/const s3Target/const _s3Target/g' "$file"
  sed -i '' 's/const s3Permission/const _s3Permission/g' "$file"
  sed -i '' 's/const unencryptedS3Alarm/const _unencryptedS3Alarm/g' "$file"
  sed -i '' 's/const missingTagsAlarm/const _missingTagsAlarm/g' "$file"
  sed -i '' 's/const insecureEc2Alarm/const _insecureEc2Alarm/g' "$file"
  sed -i '' 's/const unauthorizedCallsFilter/const _unauthorizedCallsFilter/g' "$file"
  sed -i '' 's/const unauthorizedCallsAlarm/const _unauthorizedCallsAlarm/g' "$file"
  sed -i '' 's/const remediationTarget/const _remediationTarget/g' "$file"
  sed -i '' 's/const remediationPermission/const _remediationPermission/g' "$file"
  sed -i '' 's/const healthTarget/const _healthTarget/g' "$file"
  sed -i '' 's/const healthPermission/const _healthPermission/g' "$file"
  sed -i '' 's/const ec2Configuration/const _ec2Configuration/g' "$file"
  sed -i '' 's/const cisStandard/const _cisStandard/g' "$file"
  sed -i '' 's/const foundationalStandard/const _foundationalStandard/g' "$file"
  sed -i '' 's/const securityHub =/const _securityHub =/g' "$file"
  sed -i '' 's/const inspector =/const _inspector =/g' "$file"
  sed -i '' 's/const auditManager =/const _auditManager =/g' "$file"
  sed -i '' 's/const detective =/const _detective =/g' "$file"
  sed -i '' 's/const devopsGuru =/const _devopsGuru =/g' "$file"
  sed -i '' 's/const computeOptimizer =/const _computeOptimizer =/g' "$file"
  sed -i '' 's/const healthDashboard =/const _healthDashboard =/g' "$file"
  sed -i '' 's/const wellArchitected =/const _wellArchitected =/g' "$file"
  sed -i '' 's/const s3Endpoint/const _s3Endpoint/g' "$file"
  sed -i '' 's/const dynamodbEndpoint/const _dynamodbEndpoint/g' "$file"
  sed -i '' 's/const logsEndpoint/const _logsEndpoint/g' "$file"
  sed -i '' 's/const tags = /const _tags = /g' "$file" 2>/dev/null || true
done

# Remove unused aws imports from stub files
for file in lib/tap-stack.ts lib/security-services-stack.ts lib/compute-optimizer-stack.ts lib/detective-stack.ts lib/devops-guru-stack.ts lib/well-architected-stack.ts; do
  sed -i '' 's/^import \* as aws from .*$/\/\/ import * as aws from "..." - not needed in stub/g' "$file"
done

echo "Fixed unused variables"
