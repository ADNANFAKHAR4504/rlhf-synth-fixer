## Failure Recovery Automation	
An IoT platform needs automated recovery when sensor data pipeline failures occur affecting 2.3 million connected devices.	
Design a recovery connector with the following requirements: 
- IoT Core rule failures trigger CloudWatch alarms that invoke Lambda functions to analyze IoT shadow states, which then trigger Step Functions that orchestrate DynamoDB backfill operations from S3 archived data, simultaneously invoking additional Lambda functions to republish messages to Kinesis streams, which trigger EventBridge rules to update SQS dead letter queues, 
- with final validation Lambda functions querying DynamoDB with time-series range queries to verify data continuity and detect timestamp gaps.
- CloudWatch must detect rule failures within 15 seconds across 34,000 IoT rules; 
- Lambda must parse shadow states for 2.3M devices;
- Step Functions must orchestrate parallel backfill of 12 hours of data; 
- Kinesis must replay 45M messages with proper ordering; 
- EventBridge must route recovery events to appropriate SQS queues based on device type; 
- DynamoDB queries must verify 99.9% data recovery within 5 minutes using time-series range queries to detect timestamp gaps.	
- The solution should be implemented using CDK and Typescript, and the main Stack called TapStack in a file tap-stack.ts