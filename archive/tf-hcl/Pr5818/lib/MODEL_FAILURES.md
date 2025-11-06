1. Critical Failures- The error "cannot use immediate apply method for static parameter" when modifying RDS DB Parameter Groups indicates that some parameters you are trying to apply immediately are static parameters. AWS RDS does not allow immediate application for static parameters; they require a reboot of the DB instance for changes to take effect.

From the content extracted from your tap_stack.tf file related to the DB parameter group resources for primary and secondary:

The resources aws_db_parameter_group.primary_pg_params and aws_db_parameter_group.secondary_pg_params define PostgreSQL 17 parameter groups.

These parameter groups include parameters like rds.forcessl, maxconnections, statementtimeout, sharedbuffers, workmem, maintenanceworkmem, and trackiotiming.

It's clear these parameter groups are associated with PostgreSQL 17 family and configured for SSL enforcement and performance related parameters.

The error suggests that some of these parameters are static and cannot be applied immediately with apply_immediately = true.

How to fix:
Check if your DB parameter group Terraform resource includes the argument apply_immediately = true. This argument is not actually supported in the aws_db_parameter_group resource but could be passed to the associated aws_db_instance.

If you want some parameters to apply immediately, AWS distinguishes between dynamic and static parameters:

Dynamic parameters apply immediately without a reboot.

Static parameters require reboot.

Terraform community guidance for this error typically recommends:

Do not try to apply static parameter changes immediately.

Set apply_immediately to false for DB instance resource updates, so changes wait for manual reboot or scheduled maintenance window.

You cannot set apply_immediately on aws_db_parameter_group, only on the aws_db_instance resource that uses it.

Inspect your aws_db_instance resources to ensure that the apply_immediately attribute is handled correctly.


```
│ Error: modifying RDS DB Parameter Group (primary-rdha-pg17-params): operation error RDS: ModifyDBParameterGroup, https response error StatusCode: 400, RequestID: 4242a06e-f787-48fd-9cb2-02a4f43e1337, api error InvalidParameterCombination: cannot use immediate apply method for static parameter
│ 

│   with aws_db_parameter_group.primary_pg_params,

│   on tap_stack.tf line 602, in resource "aws_db_parameter_group" "primary_pg_params":

│  602: resource "aws_db_parameter_group" "primary_pg_params" {

│ 

╵

╷

│ Error: modifying RDS DB Parameter Group (dr-rdha-pg17-params): operation error RDS: ModifyDBParameterGroup, https response error StatusCode: 400, RequestID: 0f1842e8-6607-4d33-b39f-0f7e99add2c1, api error InvalidParameterCombination: cannot use immediate apply method for static parameter

│ 

│   with aws_db_parameter_group.secondary_pg_params,

│   on tap_stack.tf line 656, in resource "aws_db_parameter_group" "secondary_pg_params":

│  656: resource "aws_db_parameter_group" "secondary_pg_params" {

│ 
```

2. Medium Failures - indicates a constraint from AWS RDS for PostgreSQL using GP3 storage types with IOPS and throughput settings. For PostgreSQL engine with GP3 storage, the allocated storage must be at least 400 GB if you specify iops and storage_throughput.

How to fix this:
Increase the allocated storage to at least 400 GB if you want to specify iops and storage_throughput.

OR remove iops and storage_throughput from your RDS instance configuration when using storage sizes less than 400 GB.

```
╷
│ Error: creating RDS DB Instance (primary-rdha-postgres-db): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: d3d8506f-36e7-4edc-9761-eaff881da8ce, api error InvalidParameterCombination: You can't specify IOPS or storage throughput for engine postgres and a storage size less than 400.
│ 
│   with aws_db_instance.primary_rds,
│   on tap_stack.tf line 602, in resource "aws_db_instance" "primary_rds":
│  602: resource "aws_db_instance" "primary_rds" {
│ 
╵
Error: Terraform exited with code 1.

```
