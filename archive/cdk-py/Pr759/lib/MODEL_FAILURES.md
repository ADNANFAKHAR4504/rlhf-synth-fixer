Common Failures and How to Handle Them
1. Lambda Timeout

    Problem: The function takes longer than 5 seconds and fails.

    Fix: Make sure the code runs fast. Avoid slow operations.

2. DynamoDB Throttling

    Problem: Too many requests cause DynamoDB to reject some.

    Fix: Use on-demand mode. Add retry logic with small delays.

3. Too Many Lambda Requests

    Fix: Ask AWS to raise limits if needed. Queue extra requests with SQS.

4. Bad or Missing ItemId

    Problem: DynamoDB errors when ItemId is missing or wrong.

    Fix: Check input before calling DynamoDB. Log bad input.

5. Missing Permissions

    Problem: Lambda can't access DynamoDB or CloudWatch.

    Fix: Make sure the Lambda role has the right IAM permissions.