We need two fixes to get the stack deploying cleanly:
Lambda Path Issue (Critical)
Current code hardcodes "lambda" → breaks in some environments.
Update compute_construct.go to dynamically resolve possible paths (lib/lambda, ../lib/lambda, etc.).
If no valid path found, fall back to an inline Python Lambda.
DynamoDB Deprecation (Warning)
Replace old PointInTimeRecovery: jsii.Bool(true) with the new PointInTimeRecoverySpecification API in database_construct.go.
Success = cdk synth runs clean, Lambda deploys everywhere, DynamoDB has point-in-time recovery, and no warnings remain.