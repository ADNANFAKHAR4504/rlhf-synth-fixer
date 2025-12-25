The RDS InstanceType configuration is incorrect. Please fix this final compilation error:

**RDS InstanceType Error**: The `software.amazon.awscdk.services.rds.InstanceType.of(InstanceClass, InstanceSize)` method doesn't exist. 

The RDS InstanceType should use predefined constants like `InstanceType.T3_MICRO` instead of the `of()` method which is only available for EC2 InstanceType.

Please provide the corrected AWS CDK Java code with the proper RDS instance type configuration.
