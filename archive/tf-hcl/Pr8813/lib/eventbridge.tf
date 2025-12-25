# EventBridge rule to trigger Step Functions from SNS
# Note: This implementation uses SNS -> Lambda -> Step Functions pattern
# as EventBridge doesn't directly subscribe to SNS topics
# The Lambda trigger function handles this integration
