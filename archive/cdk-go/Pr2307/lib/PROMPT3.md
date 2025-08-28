Got two issues that need fixing to get this stack working properly:

**Lambda path problem** - my code is hardcoded to look for "lambda" folder and that's breaking when I run it in different setups. Need to make the compute construct smarter so it checks multiple possible locations (lib/lambda, ../lib/lambda, etc.) and if it can't find anything, just use inline Python code instead.

**DynamoDB warning** - getting deprecation warnings because I'm using the old PointInTimeRecovery property. Should switch to the new PointInTimeRecoverySpecification API in the database construct.

Want these fixed so cdk synth runs without any errors or warnings and everything deploys cleanly.