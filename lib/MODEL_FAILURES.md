1. EC2 KeyPair Dependency

Model Response: Requires mandatory KeyPairName parameter (Type: AWS::EC2::KeyPair::KeyName) forcing users to create and manage SSH key pairs before deployment.
Actual Implementation: Removes KeyPairName parameter entirely and relies on AWS Systems Manager Session Manager (AmazonSSMManagedInstanceCore policy) for secure instance access without SSH keys.

2. Systems Manager Access

Model Response: EC2InstanceRole only includes CloudWatchAgentServerPolicy managed policy, limiting instance management capabilities to CloudWatch monitoring.
Actual Implementation: Adds AmazonSSMManagedInstanceCore managed policy to EC2InstanceRole, enabling full Systems Manager functionality including Session Manager, Run Command, and Patch Manager without requiring SSH access.

3. AMI ID Validation

Model Response: Uses outdated or invalid AMI IDs in RegionAMIMap (e.g., ami-0c02fb55731490381 for us-east-1), causing deployment failures with "image ID is not valid" errors.
Actual Implementation: Uses current, validated Amazon Linux 2023 AMI IDs that conform to AWS AMI format requirements and are available in target regions.

4. LaunchTemplate Version Reference

Model Response: Uses unsupported static version reference "Version": "$Latest" for EC2 instances, which CloudFormation rejects with "does not support using $Latest or $Default" error.
Actual Implementation: Dynamically retrieves the latest version using "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}, ensuring compatibility with CloudFormation's version reference requirements.