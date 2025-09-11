## Model Failures - Key Issues Encountered

Here is a breakdown of the main failures I encountered during CDK synth deployment.

### **Duration.milliseconds() doesn't exist**
Should be `Duration.millis()` instead.

### **LogGroup retry_options parameter issue**
LogGroup doesn't accept a `retry_options` parameter

### **SNS Topic parameter naming**
Parameter should be `master_key` instead of `kms_master_key`.

### **LogQueryWidget expects different parameter**
Expects `log_group_names` instead of `log_groups`.

### **Trail KMS key parameter issue**
Trail doesn't accept `kms_key` as a parameter

### **recording_mode not valid for RecordingGroupProperty**
The `recording_mode` parameter isn't accepted by RecordingGroupProperty.

### **CfnConfigRule doesn't accept depends_on**
Need to use `add_dependency()` method instead of passing `depends_on` as a parameter.

### **ParameterType.SECURE_STRING not recognized**
The enum value needs to be uppercase for proper recognition.

### **AWS Config managed policy name incorrect**
The correct policy name is `AWS_ConfigRole`, not `ConfigRole`.

### **KMS keys and CloudWatch Logs permission issue**
CloudWatch Logs needs explicit permission to use KMS keys for encryption - requires resource policies on the KMS keys.

### **CloudTrail S3 bucket permissions**
CloudTrail needs explicit permissions to write to the S3 bucket through proper bucket policy configuration.

### **Lambda VPC network interface permissions**
Lambda functions in VPCs need additional IAM permissions to create and manage network interfaces.

### **Config delivery channel S3 permissions**
AWS Config delivery channel requires proper permissions to write to the S3 bucket.