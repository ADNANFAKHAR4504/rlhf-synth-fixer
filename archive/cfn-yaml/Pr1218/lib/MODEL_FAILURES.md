# CloudFormation Template Failure Cases

## Deployment Failures

### 1. S3 Bucket Naming Conflicts
**Failure Scenario:** S3 bucket names are not globally unique
- **Root Cause:** Using `${ProjectName}-secure-bucket-${AWS::AccountId}-${AWS::Region}` pattern may conflict if same account/region combination is used
- **Impact:** Stack deployment fails with "Bucket name already exists" error
- **Detection:** CloudFormation CREATE_FAILED status
- **Mitigation:** Add random suffix or timestamp to bucket names

### 2. Availability Zone Unavailability
**Failure Scenario:** Specified AZs (us-west-2a, us-west-2b) are unavailable
- **Root Cause:** Hardcoded AZ mapping in RegionMap
- **Impact:** Subnet creation fails, entire VPC setup fails
- **Detection:** CloudFormation error during subnet creation
- **Mitigation:** Use dynamic AZ selection or add fallback AZs

### 3. NAT Gateway Resource Limits
**Failure Scenario:** NAT Gateway creation fails due to account limits
- **Root Cause:** AWS account has reached NAT Gateway limit (5 per AZ)
- **Impact:** Private subnet loses internet connectivity
- **Detection:** CloudFormation CREATE_FAILED for NATGateway resource
- **Mitigation:** Check account limits, request limit increase, or use NAT Instance

### 4. EIP Allocation Failure
**Failure Scenario:** Elastic IP allocation fails
- **Root Cause:** Account EIP limit reached or insufficient permissions
- **Impact:** NAT Gateway cannot be created, private subnet connectivity broken
- **Detection:** CloudFormation error during EIP creation
- **Mitigation:** Release unused EIPs or request limit increase

## Security and Compliance Failures

### 5. IAM Role Permission Violations
**Failure Scenario:** IAM roles have excessive permissions
- **Root Cause:** Using wildcard permissions (`"*"`) in IAM policies
- **Impact:** Security vulnerability, potential privilege escalation
- **Detection:** Security scanning tools, AWS Config rules
- **Mitigation:** Implement least privilege principle, remove wildcards

### 6. S3 Bucket Public Access
**Failure Scenario:** S3 buckets become publicly accessible
- **Root Cause:** Misconfigured bucket policies or ACLs
- **Impact:** Data exposure, compliance violations
- **Detection:** S3 bucket public access block settings, CloudTrail logs
- **Mitigation:** Ensure PublicAccessBlockConfiguration is properly set

### 7. CloudTrail Configuration Issues
**Failure Scenario:** CloudTrail not logging all required events
- **Root Cause:** Incorrect EventSelectors or missing global service events
- **Impact:** Security monitoring gaps, audit compliance issues
- **Detection:** CloudTrail console, missing log files in S3
- **Mitigation:** Verify EventSelectors include all S3 and IAM events

### 8. Encryption Configuration Failures
**Failure Scenario:** S3 buckets not properly encrypted
- **Root Cause:** SSE-S3 configuration missing or incorrect
- **Impact:** Data at rest not encrypted, compliance violations
- **Detection:** S3 bucket encryption settings, security scanning
- **Mitigation:** Ensure BucketEncryption is configured for all buckets

## Monitoring and Alerting Failures

### 9. CloudWatch Alarm Configuration Issues
**Failure Scenario:** Security alarms not triggering correctly
- **Root Cause:** Incorrect metric filters or alarm thresholds
- **Impact:** Security incidents not detected, false negatives
- **Detection:** CloudWatch metrics not appearing, alarms not firing
- **Mitigation:** Test metric filters, adjust thresholds, verify SNS topic

### 10. SNS Topic Subscription Failures
**Failure Scenario:** Email notifications not received
- **Root Cause:** Invalid email address or subscription confirmation pending
- **Impact:** Security alerts not delivered to stakeholders
- **Detection:** SNS subscription status, email delivery logs
- **Mitigation:** Verify email format, confirm subscription, test notifications

### 11. Metric Filter Pattern Errors
**Failure Scenario:** CloudWatch metric filters not capturing events
- **Root Cause:** Incorrect filter patterns for CloudTrail logs
- **Impact:** Security events not monitored, false sense of security
- **Detection:** No metrics generated, CloudWatch logs empty
- **Mitigation:** Test filter patterns, verify CloudTrail log format

## Network Configuration Failures

### 12. VPC CIDR Conflicts
**Failure Scenario:** VPC CIDR block conflicts with existing VPCs
- **Root Cause:** Using 10.0.0.0/16 which may conflict with existing VPCs
- **Impact:** VPC creation fails, network connectivity issues
- **Detection:** CloudFormation error during VPC creation
- **Mitigation:** Use unique CIDR blocks, check existing VPC ranges

### 13. Route Table Configuration Errors
**Failure Scenario:** Incorrect routing between public and private subnets
- **Root Cause:** Route table associations or routes misconfigured
- **Impact:** Network connectivity issues, services unreachable
- **Detection:** Network connectivity tests, route table verification
- **Mitigation:** Verify route table associations and routes

### 14. Internet Gateway Attachment Issues
**Failure Scenario:** Internet Gateway not properly attached to VPC
- **Root Cause:** Missing or incorrect VPCGatewayAttachment
- **Impact:** Public subnet loses internet connectivity
- **Detection:** Internet connectivity tests from public subnet
- **Mitigation:** Ensure proper DependsOn and attachment configuration

## Resource Dependency Failures

### 15. Circular Dependencies
**Failure Scenario:** Resources have circular dependencies
- **Root Cause:** Resources referencing each other in a loop
- **Impact:** CloudFormation stack creation hangs or fails
- **Detection:** CloudFormation dependency analysis, stack events
- **Mitigation:** Restructure dependencies, use DependsOn appropriately

### 16. Missing Resource References
**Failure Scenario:** Resources reference non-existent resources
- **Root Cause:** Typos in resource names or incorrect Ref/GetAtt usage
- **Impact:** CloudFormation validation or creation failures
- **Detection:** CloudFormation template validation errors
- **Mitigation:** Verify all resource references, use cfn-lint

## Cost and Resource Management Failures

### 17. NAT Gateway Cost Overruns
**Failure Scenario:** NAT Gateway costs exceed budget
- **Root Cause:** NAT Gateway running 24/7 without proper cost controls
- **Impact:** Unexpected AWS charges, budget overruns
- **Detection:** AWS Cost Explorer, billing alerts
- **Mitigation:** Use NAT Instances for dev environments, implement cost monitoring

### 18. S3 Lifecycle Policy Failures
**Failure Scenario:** S3 objects not transitioning or expiring as expected
- **Root Cause:** Incorrect lifecycle configuration or bucket policies
- **Impact:** Storage costs not optimized, compliance issues
- **Detection:** S3 lifecycle reports, storage costs not decreasing
- **Mitigation:** Verify lifecycle rules, test transitions

## Template Validation Failures

### 19. cfn-lint Validation Errors
**Failure Scenario:** Template fails cfn-lint validation
- **Root Cause:** YAML syntax errors, invalid resource properties
- **Impact:** Deployment fails, security best practices not followed
- **Detection:** cfn-lint tool output, CloudFormation validation
- **Mitigation:** Fix linting errors, follow AWS best practices

### 20. Parameter Validation Failures
**Failure Scenario:** Invalid parameter values provided
- **Root Cause:** Email format validation, environment value constraints
- **Impact:** Stack creation fails, user input errors
- **Detection:** CloudFormation parameter validation errors
- **Mitigation:** Validate parameters before deployment, provide clear error messages

## Operational Failures

### 21. Tag Consistency Issues
**Failure Scenario:** Resources missing required tags
- **Root Cause:** Inconsistent tagging across resources
- **Impact:** Cost allocation issues, resource management problems
- **Detection:** AWS Config rules, cost allocation reports
- **Mitigation:** Implement tagging strategy, use AWS Config for compliance

### 22. Log Retention Policy Violations
**Failure Scenario:** CloudWatch logs not retained for required period
- **Root Cause:** Incorrect RetentionInDays configuration
- **Impact:** Compliance violations, audit trail gaps
- **Detection:** CloudWatch log group settings, compliance scans
- **Mitigation:** Set appropriate retention periods, monitor log storage

### 23. Cross-Region Deployment Issues
**Failure Scenario:** Multi-region CloudTrail configuration fails
- **Root Cause:** IsMultiRegionTrail enabled but cross-region permissions missing
- **Impact:** Security monitoring gaps in other regions
  - **Detection:** CloudTrail console, missing logs in other regions
  - **Mitigation:** Ensure proper cross-region permissions and configuration

## Unit Test Cases

### Template Structure Tests
```typescript
describe('Template Structure', () => {
  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toBe(
      'Secure AWS infrastructure with IAM roles, S3 bucket, VPC networking, and CloudWatch monitoring'
    );
  });

  test('should have required sections', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
    expect(template.Mappings).toBeDefined();
  });
});
```

### Parameter Validation Tests
```typescript
describe('Parameters', () => {
  test('should have ProjectName parameter with correct properties', () => {
    const param = template.Parameters.ProjectName;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('TapProject');
    expect(param.Description).toBeDefined();
  });

  test('should have Environment parameter with allowed values', () => {
    const param = template.Parameters.Environment;
    expect(param.Type).toBe('String');
    expect(param.Default).toBe('dev');
    expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
  });

  test('should have NotificationEmail parameter with email validation', () => {
    const param = template.Parameters.NotificationEmail;
    expect(param.Type).toBe('String');
    expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    expect(param.ConstraintDescription).toBeDefined();
  });
});
```

### VPC and Networking Tests
```typescript
describe('VPC and Networking Resources', () => {
  test('should have VPC with correct CIDR block', () => {
    const vpc = template.Resources.TapVPC;
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
  });

  test('should have public and private subnets', () => {
    expect(template.Resources.PublicSubnet).toBeDefined();
    expect(template.Resources.PrivateSubnet).toBeDefined();
    
    const publicSubnet = template.Resources.PublicSubnet;
    const privateSubnet = template.Resources.PrivateSubnet;
    
    expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(publicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
    expect(privateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
  });

  test('should have Internet Gateway and NAT Gateway', () => {
    expect(template.Resources.InternetGateway).toBeDefined();
    expect(template.Resources.NATGateway).toBeDefined();
    expect(template.Resources.NATGatewayEIP).toBeDefined();
  });

  test('should have route tables with correct routes', () => {
    expect(template.Resources.PublicRouteTable).toBeDefined();
    expect(template.Resources.PrivateRouteTable).toBeDefined();
    expect(template.Resources.PublicRoute).toBeDefined();
    expect(template.Resources.PrivateRoute).toBeDefined();
  });
});
```

### S3 Bucket Tests
```typescript
describe('S3 Bucket Resources', () => {
  test('should have main S3 bucket with encryption', () => {
    const bucket = template.Resources.TapS3Bucket;
    expect(bucket.Type).toBe('AWS::S3::Bucket');
    expect(bucket.Properties.BucketEncryption).toBeDefined();
    expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
      .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
  });

  test('should have public access block configuration', () => {
    const bucket = template.Resources.TapS3Bucket;
    const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
    expect(publicAccess.BlockPublicAcls).toBe(true);
    expect(publicAccess.BlockPublicPolicy).toBe(true);
    expect(publicAccess.IgnorePublicAcls).toBe(true);
    expect(publicAccess.RestrictPublicBuckets).toBe(true);
  });

  test('should have versioning enabled', () => {
    const bucket = template.Resources.TapS3Bucket;
    expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
  });

  test('should have access logs bucket', () => {
    expect(template.Resources.S3AccessLogsBucket).toBeDefined();
    const logsBucket = template.Resources.S3AccessLogsBucket;
    expect(logsBucket.Properties.LifecycleConfiguration).toBeDefined();
  });
});
```

### IAM Role Tests
```typescript
describe('IAM Role Resources', () => {
  test('should have EC2 application role with least privilege', () => {
    const role = template.Resources.EC2ApplicationRole;
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    
    // Check for specific S3 permissions only
    const policies = role.Properties.Policies;
    const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
    expect(s3Policy).toBeDefined();
    expect(s3Policy.PolicyDocument.Statement[0].Action).toEqual([
      's3:GetObject', 's3:PutObject', 's3:DeleteObject'
    ]);
  });

  test('should have Lambda execution role', () => {
    const role = template.Resources.LambdaExecutionRole;
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
  });

  test('should have CloudWatch events role', () => {
    const role = template.Resources.CloudWatchEventsRole;
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('events.amazonaws.com');
  });

  test('should not have wildcard permissions', () => {
    const resources = Object.values(template.Resources);
    resources.forEach((resource: any) => {
      if (resource.Type === 'AWS::IAM::Role' && resource.Properties.Policies) {
        resource.Properties.Policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            if (statement.Action) {
              expect(statement.Action).not.toContain('*');
            }
          });
        });
      }
    });
  });
});
```

### CloudTrail and Monitoring Tests
```typescript
describe('CloudTrail and Monitoring Resources', () => {
  test('should have CloudTrail with correct configuration', () => {
    const trail = template.Resources.TapCloudTrail;
    expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    expect(trail.Properties.IsLogging).toBe(true);
    expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    expect(trail.Properties.EnableLogFileValidation).toBe(true);
  });

  test('should have CloudWatch alarms for security monitoring', () => {
    expect(template.Resources.UnauthorizedAccessAlarm).toBeDefined();
    expect(template.Resources.S3AccessDeniedAlarm).toBeDefined();
    
    const alarm = template.Resources.UnauthorizedAccessAlarm;
    expect(alarm.Properties.AlarmActions).toBeDefined();
    expect(alarm.Properties.Threshold).toBe(1);
  });

  test('should have SNS topic for notifications', () => {
    expect(template.Resources.SecurityAlarmTopic).toBeDefined();
    expect(template.Resources.SecurityAlarmSubscription).toBeDefined();
  });

  test('should have metric filters for CloudTrail logs', () => {
    expect(template.Resources.UnauthorizedAccessMetricFilter).toBeDefined();
    expect(template.Resources.S3AccessDeniedMetricFilter).toBeDefined();
  });
});
```

### Output Tests
```typescript
describe('Outputs', () => {
  test('should have all required outputs', () => {
    const expectedOutputs = [
      'VPCId', 'PublicSubnetId', 'PrivateSubnetId', 'S3BucketName',
      'EC2RoleArn', 'LambdaRoleArn', 'SecurityTopicArn', 'CloudTrailArn'
    ];

    expectedOutputs.forEach(outputName => {
      expect(template.Outputs[outputName]).toBeDefined();
    });
  });

  test('should have exports for cross-stack references', () => {
    Object.keys(template.Outputs).forEach(outputName => {
      const output = template.Outputs[outputName];
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    });
  });
});
```

### Tagging Tests
```typescript
describe('Resource Tagging', () => {
  test('all resources should have consistent tags', () => {
    const resources = Object.values(template.Resources);
    const requiredTags = ['Environment', 'Owner', 'Project'];
    
    resources.forEach((resource: any) => {
      if (resource.Properties.Tags) {
        const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
        requiredTags.forEach(requiredTag => {
          expect(tagKeys).toContain(requiredTag);
        });
      }
    });
  });
});
```

## Integration Test Cases

### Stack Deployment Tests
```typescript
describe('Stack Deployment Integration Tests', () => {
  let stackOutputs: any;
  let awsSDK: any;

  beforeAll(async () => {
    // Load outputs from CloudFormation deployment
    stackOutputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
    
    // Initialize AWS SDK
    awsSDK = new AWS.SDK({
      region: 'us-west-2'
    });
  });

  test('should have deployed VPC with correct CIDR', async () => {
    const vpcId = stackOutputs.VPCId;
    const ec2 = new awsSDK.EC2();
    
    const vpcResponse = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
    const vpc = vpcResponse.Vpcs[0];
    
    expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.EnableDnsHostnames).toBe(true);
    expect(vpc.EnableDnsSupport).toBe(true);
  });

  test('should have deployed public and private subnets', async () => {
    const vpcId = stackOutputs.VPCId;
    const publicSubnetId = stackOutputs.PublicSubnetId;
    const privateSubnetId = stackOutputs.PrivateSubnetId;
    
    const ec2 = new awsSDK.EC2();
    const subnetsResponse = await ec2.describeSubnets({
      SubnetIds: [publicSubnetId, privateSubnetId]
    }).promise();
    
    const publicSubnet = subnetsResponse.Subnets.find(s => s.SubnetId === publicSubnetId);
    const privateSubnet = subnetsResponse.Subnets.find(s => s.SubnetId === privateSubnetId);
    
    expect(publicSubnet.MapPublicIpOnLaunch).toBe(true);
    expect(publicSubnet.CidrBlock).toBe('10.0.1.0/24');
    expect(privateSubnet.CidrBlock).toBe('10.0.2.0/24');
  });

  test('should have NAT Gateway with EIP', async () => {
    const vpcId = stackOutputs.VPCId;
    const ec2 = new awsSDK.EC2();
    
    const natGateways = await ec2.describeNatGateways({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
    }).promise();
    
    expect(natGateways.NatGateways.length).toBeGreaterThan(0);
    expect(natGateways.NatGateways[0].State).toBe('available');
  });
});
```

### S3 Bucket Integration Tests
```typescript
describe('S3 Bucket Integration Tests', () => {
  test('should have S3 bucket with encryption enabled', async () => {
    const bucketName = stackOutputs.S3BucketName;
    const s3 = new awsSDK.S3();
    
    const encryptionResponse = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
    const encryption = encryptionResponse.ServerSideEncryptionConfiguration.Rules[0];
    
    expect(encryption.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
  });

  test('should have S3 bucket with public access blocked', async () => {
    const bucketName = stackOutputs.S3BucketName;
    const s3 = new awsSDK.S3();
    
    const publicAccessResponse = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
    const publicAccess = publicAccessResponse.PublicAccessBlockConfiguration;
    
    expect(publicAccess.BlockPublicAcls).toBe(true);
    expect(publicAccess.BlockPublicPolicy).toBe(true);
    expect(publicAccess.IgnorePublicAcls).toBe(true);
    expect(publicAccess.RestrictPublicBuckets).toBe(true);
  });

  test('should have S3 bucket with versioning enabled', async () => {
    const bucketName = stackOutputs.S3BucketName;
    const s3 = new awsSDK.S3();
    
    const versioningResponse = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    expect(versioningResponse.Status).toBe('Enabled');
  });

  test('should be able to upload and download test object', async () => {
    const bucketName = stackOutputs.S3BucketName;
    const s3 = new awsSDK.S3();
    const testKey = 'test-integration-object.txt';
    const testContent = 'Integration test content';
    
    // Upload test object
    await s3.putObject({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent
    }).promise();
    
    // Download and verify
    const downloadResponse = await s3.getObject({
      Bucket: bucketName,
      Key: testKey
    }).promise();
    
    expect(downloadResponse.Body.toString()).toBe(testContent);
    
    // Cleanup
    await s3.deleteObject({
      Bucket: bucketName,
      Key: testKey
    }).promise();
  });
});
```

### IAM Role Integration Tests
```typescript
describe('IAM Role Integration Tests', () => {
  test('should have EC2 role with correct permissions', async () => {
    const ec2RoleArn = stackOutputs.EC2RoleArn;
    const iam = new awsSDK.IAM();
    
    const roleName = ec2RoleArn.split('/').pop();
    const roleResponse = await iam.getRole({ RoleName: roleName }).promise();
    
    expect(roleResponse.Role.AssumeRolePolicyDocument).toBeDefined();
    
    // Test assume role policy
    const assumePolicy = JSON.parse(roleResponse.Role.AssumeRolePolicyDocument);
    expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
  });

  test('should have Lambda role with VPC permissions', async () => {
    const lambdaRoleArn = stackOutputs.LambdaRoleArn;
    const iam = new awsSDK.IAM();
    
    const roleName = lambdaRoleArn.split('/').pop();
    const policiesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
    
    const hasBasicExecutionRole = policiesResponse.AttachedPolicies.some(
      policy => policy.PolicyName === 'AWSLambdaBasicExecutionRole'
    );
    expect(hasBasicExecutionRole).toBe(true);
  });
});
```

### CloudTrail Integration Tests
```typescript
describe('CloudTrail Integration Tests', () => {
  test('should have CloudTrail logging to S3', async () => {
    const cloudTrailArn = stackOutputs.CloudTrailArn;
    const cloudtrail = new awsSDK.CloudTrail();
    
    const trailResponse = await cloudtrail.describeTrails({ trailNameList: [cloudTrailArn] }).promise();
    const trail = trailResponse.trailList[0];
    
    expect(trail.S3BucketName).toBeDefined();
    expect(trail.IncludeGlobalServiceEvents).toBe(true);
    expect(trail.IsMultiRegionTrail).toBe(true);
    expect(trail.LogFileValidationEnabled).toBe(true);
  });

  test('should have CloudTrail event selectors configured', async () => {
    const cloudTrailArn = stackOutputs.CloudTrailArn;
    const cloudtrail = new awsSDK.CloudTrail();
    
    const eventSelectorsResponse = await cloudtrail.getEventSelectors({ TrailName: cloudTrailArn }).promise();
    const eventSelectors = eventSelectorsResponse.EventSelectors;
    
    expect(eventSelectors.length).toBeGreaterThan(0);
    expect(eventSelectors[0].ReadWriteType).toBe('All');
    expect(eventSelectors[0].IncludeManagementEvents).toBe(true);
  });
});
```

### CloudWatch Alarm Integration Tests
```typescript
describe('CloudWatch Alarm Integration Tests', () => {
  test('should have security alarms configured', async () => {
    const cloudwatch = new awsSDK.CloudWatch();
    
    const alarmsResponse = await cloudwatch.describeAlarms({
      AlarmNames: [
        `${process.env.PROJECT_NAME || 'TapProject'}-unauthorized-access-alarm`,
        `${process.env.PROJECT_NAME || 'TapProject'}-s3-access-denied-alarm`
      ]
    }).promise();
    
    expect(alarmsResponse.MetricAlarms.length).toBeGreaterThan(0);
    
    alarmsResponse.MetricAlarms.forEach(alarm => {
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions.length).toBeGreaterThan(0);
    });
  });

  test('should have SNS topic for notifications', async () => {
    const securityTopicArn = stackOutputs.SecurityTopicArn;
    const sns = new awsSDK.SNS();
    
    const topicResponse = await sns.getTopicAttributes({ TopicArn: securityTopicArn }).promise();
    expect(topicResponse.Attributes.TopicArn).toBe(securityTopicArn);
  });
});
```

### Network Connectivity Tests
```typescript
describe('Network Connectivity Integration Tests', () => {
  test('should have internet connectivity from public subnet', async () => {
    // This test would require an EC2 instance in the public subnet
    // For now, we'll test the route table configuration
    const vpcId = stackOutputs.VPCId;
    const publicSubnetId = stackOutputs.PublicSubnetId;
    const ec2 = new awsSDK.EC2();
    
    const routeTablesResponse = await ec2.describeRouteTables({
      Filters: [{ Name: 'association.subnet-id', Values: [publicSubnetId] }]
    }).promise();
    
    const routeTable = routeTablesResponse.RouteTables[0];
    const internetRoute = routeTable.Routes.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
    
    expect(internetRoute).toBeDefined();
    expect(internetRoute.GatewayId).toBeDefined();
  });

  test('should have NAT Gateway route for private subnet', async () => {
    const privateSubnetId = stackOutputs.PrivateSubnetId;
    const ec2 = new awsSDK.EC2();
    
    const routeTablesResponse = await ec2.describeRouteTables({
      Filters: [{ Name: 'association.subnet-id', Values: [privateSubnetId] }]
    }).promise();
    
    const routeTable = routeTablesResponse.RouteTables[0];
    const natRoute = routeTable.Routes.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
    
    expect(natRoute).toBeDefined();
    expect(natRoute.NatGatewayId).toBeDefined();
  });
});
```

### Security Compliance Tests
```typescript
describe('Security Compliance Integration Tests', () => {
  test('should have CloudTrail logs in S3 bucket', async () => {
    const cloudTrailArn = stackOutputs.CloudTrailArn;
    const cloudtrail = new awsSDK.CloudTrail();
    
    const trailResponse = await cloudtrail.describeTrails({ trailNameList: [cloudTrailArn] }).promise();
    const trail = trailResponse.trailList[0];
    
    const s3 = new awsSDK.S3();
    const objectsResponse = await s3.listObjectsV2({
      Bucket: trail.S3BucketName,
      Prefix: 'AWSLogs/'
    }).promise();
    
    // Should have some CloudTrail log files
    expect(objectsResponse.Contents.length).toBeGreaterThan(0);
  });

  test('should have metric filters for security monitoring', async () => {
    const cloudwatch = new awsSDK.CloudWatchLogs();
    
    const logGroupsResponse = await cloudwatch.describeLogGroups({
      logGroupNamePrefix: 'CloudTrail/'
    }).promise();
    
    expect(logGroupsResponse.logGroups.length).toBeGreaterThan(0);
    
    // Check for metric filters
    const logGroupName = logGroupsResponse.logGroups[0].logGroupName;
    const metricFiltersResponse = await cloudwatch.describeMetricFilters({
      logGroupName: logGroupName
    }).promise();
    
    expect(metricFiltersResponse.metricFilters.length).toBeGreaterThan(0);
  });
});
```