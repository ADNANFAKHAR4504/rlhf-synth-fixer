# Model Failures Analysis


This document details the failures in the original Model response

1. Model used incorrect syntax to get availaibility zone. The get_availability_zones() function doesn't accept a region parameter directly. The region is determined by the AWS provider configuration. 
**Issue**: The issue is that get_availability_zones() returns an awaitable object, and the model was trying to use it synchronously(for i, az in enumerate(availability_zones[:2]):).
**Resoultion**: I redefined the function and include proper testing.

2. Incorrect syntax and resource module on instance profile that the Model provided - iam_instance_profile=aws.ec2.InstanceProfile(...) when it should be this iam_instance_profile=aws.iam.InstanceProfile(...)

3. Model tried to use trying to use ClusterInstance for monitoring a regular RDS Instance. This is incorrect - ClusterInstance is only for Aurora clusters, not regular RDS instances. 

4. Model used Deprecated parameter on the EIP module and referencing old and deprecated version of the PostgreSQL Database Engine

5. Incompatible instance class. The RDS DB instance model provided was not supoorted. Cluster instance properties were also missing from the module provided.
