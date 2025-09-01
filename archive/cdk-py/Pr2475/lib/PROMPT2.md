Fix the DynamoDB billing mode issue in the CDK stack. Getting an error about BillingMode.ON_DEMAND not being available. Need to update it to use the correct attribute for on-demand billing.

Keep everything else the same - just fix the billing mode so the stack can deploy without errors.
