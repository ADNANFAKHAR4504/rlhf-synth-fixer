import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation - Unit Tests', () => {
  const templatePath = path.resolve(__dirname, '../lib/TapStack.json');
  const raw = fs.readFileSync(templatePath, 'utf8');
  const template = JSON.parse(raw);

  const resources = template.Resources;
  const outputs = template.Outputs;
  const parameters = template.Parameters;

  // =================
  // BASIC VALIDATION
  // =================
  test('Template has required sections', () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(resources).toBeDefined();
    expect(parameters).toBeDefined();
    expect(outputs).toBeDefined();
  });

  // ===========
  // PARAMETERS
  // ===========
  test('Key parameters are defined', () => {
    const expectedParams = [
      'VPCCidr',
      'Subnet1Cidr',
      'Subnet2Cidr',
      'InstanceType',
      'KeyPairName',
      'LatestAmi',
      'EnvironmentName',
      'ProjectName',
      'Owner',
      'CostCenter',
    ];
    expectedParams.forEach((p) => expect(parameters[p]).toBeDefined());
  });

  // ==================
  // VPC & NETWORKING
  // ==================
  test('VPC and Subnets are correctly configured', () => {
    expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(resources.Subnet1.Type).toBe('AWS::EC2::Subnet');
    expect(resources.Subnet2.Type).toBe('AWS::EC2::Subnet');
    expect(resources.RouteTable.Type).toBe('AWS::EC2::RouteTable');
    expect(resources.InternetRoute.Type).toBe('AWS::EC2::Route');
  });

  test('VPC has parameterized CIDR and IGW attachment configured', () => {
    expect(resources.VPC.Properties.CidrBlock).toEqual({ Ref: 'VPCCidr' });
    const attach = resources.AttachGateway;
    expect(attach).toBeDefined();
    expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
    expect(attach.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
  });

  test('Route table default route targets Internet Gateway', () => {
    const route = resources.InternetRoute;
    expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    expect(route.Properties.RouteTableId).toEqual({ Ref: 'RouteTable' });
  });

  test('Subnets associate with route table', () => {
    expect(resources.Subnet1RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    expect(resources.Subnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    expect(resources.Subnet1RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'Subnet1' });
    expect(resources.Subnet2RouteTableAssociation.Properties.SubnetId).toEqual({ Ref: 'Subnet2' });
  });

  // ============
  // SECURITY
  // ============
  test('Security group allows HTTP(80) and SSH(22) and all egress', () => {
    const sgIngress = resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
    const httpRule = sgIngress.find((r: any) => r.FromPort === 80 && r.ToPort === 80);
    const sshRule = sgIngress.find((r: any) => r.FromPort === 22 && r.ToPort === 22);
    expect(httpRule).toBeDefined();
    expect(sshRule).toBeDefined();
    const egress = resources.EC2SecurityGroup.Properties.SecurityGroupEgress[0];
    expect(egress.IpProtocol).toBe(-1);
    expect(egress.CidrIp).toBe('0.0.0.0/0');
  });

  // =====
  // IAM
  // =====
  test('IAM role is properly configured with correct name and assume role policy', () => {
    const role = resources.EC2Role;
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.RoleName).toEqual({
      'Fn::Sub': '${AWS::StackName}-${AWS::Region}-EC2Role'
    });

    // Verify assume role policy
    const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
    expect(assumeRolePolicy.Version).toBe('2012-10-17');
    expect(assumeRolePolicy.Statement).toHaveLength(1);
    expect(assumeRolePolicy.Statement[0]).toEqual({
      Effect: 'Allow',
      Principal: { Service: 'ec2.amazonaws.com' },
      Action: 'sts:AssumeRole'
    });

    // Verify required tags
    const tags = role.Properties.Tags;
    expect(tags).toContainEqual({
      Key: 'Name',
      Value: { 'Fn::Sub': '${AWS::StackName}-${AWS::Region}-EC2Role' }
    });
    expect(tags).toContainEqual({
      Key: 'EnvName',
      Value: { Ref: 'EnvironmentName' }
    });
  });

  test('Instance profile is correctly configured with proper name and role', () => {
    const instanceProfile = resources.EC2InstanceProfile;
    expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    expect(instanceProfile.Properties.InstanceProfileName).toEqual({
      'Fn::Sub': '${AWS::StackName}-${AWS::Region}-EC2InstanceProfile'
    });
    expect(instanceProfile.Properties.Roles).toHaveLength(1);
    expect(instanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2Role' });
  });

  test('EC2 role includes required managed and inline policies', () => {
    const role = resources.EC2Role.Properties;
    // Check managed policies
    expect(role.ManagedPolicyArns).toEqual(
      expect.arrayContaining(['arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'])
    );

    const policies = role.Policies;
    // Check S3 access policy
    const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
    expect(s3Policy).toBeDefined();
    const s3Statement = s3Policy.PolicyDocument.Statement[0];
    expect(s3Statement.Effect).toBe('Allow');
    expect(s3Statement.Action).toEqual(
      expect.arrayContaining(['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'])
    );
    // Ensure policy resources reference bucket ARNs correctly
    expect(s3Statement.Resource).toEqual(
      expect.arrayContaining([
        { 'Fn::GetAtt': ['GeneralStorageBucket', 'Arn'] },
        { 'Fn::Sub': '${GeneralStorageBucket.Arn}/*' },
        { 'Fn::GetAtt': ['LogsBucket', 'Arn'] },
        { 'Fn::Sub': '${LogsBucket.Arn}/*' },
      ])
    );

    // Check CloudWatch access policy
    const cwPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchFullAccessPolicy');
    expect(cwPolicy).toBeDefined();
    const cwStatement = cwPolicy.PolicyDocument.Statement[0];
    expect(cwStatement.Effect).toBe('Allow');
    expect(cwStatement.Action).toEqual(
      expect.arrayContaining([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:PutLogEvents',
        'logs:PutRetentionPolicy'
      ])
    );
  });

  // ==========
  // COMPUTE
  // ==========
  test('EC2 instance is configured with parameterized AMI, SG, subnet, profile and encryption', () => {
    const ec2 = resources.EC2Instance.Properties;
    expect(ec2.ImageId).toEqual({ Ref: 'LatestAmi' });
    expect(ec2.InstanceType).toEqual({ Ref: 'InstanceType' });
    expect(ec2.KeyName).toEqual({ Ref: 'EC2KeyPair' });
    expect(ec2.SubnetId).toEqual({ Ref: 'Subnet1' });
    expect(ec2.SecurityGroupIds[0]).toEqual({ Ref: 'EC2SecurityGroup' });
    expect(ec2.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    expect(ec2.Monitoring).toBe(true);
    const rootDisk = ec2.BlockDeviceMappings[0].Ebs;
    expect(rootDisk.VolumeType).toBe('gp3');
    expect(rootDisk.Encrypted).toBe(true);
  });

  test('Elastic IP attaches to the EC2 instance', () => {
    const eip = resources.ElasticIP.Properties;
    expect(eip.Domain).toBe('vpc');
    expect(eip.InstanceId).toEqual({ Ref: 'EC2Instance' });
  });

  // ======
  // S3
  // ======
  // ===================
  // CLOUDWATCH LOGS
  // ===================
  test('CloudWatch Log Group is properly configured with retention and tags', () => {
    const logGroup = resources.EC2LogGroup;
    expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    expect(logGroup.Properties.LogGroupName).toEqual({
      'Fn::Sub': '/aws/ec2/${AWS::StackName}'
    });
    expect(logGroup.Properties.RetentionInDays).toBe(30);

    // Check required tags
    const tags = logGroup.Properties.Tags;
    expect(tags).toContainEqual({
      Key: 'Name',
      Value: { 'Fn::Sub': '${AWS::StackName}-${AWS::Region}-LogGroup' }
    });
    expect(tags).toContainEqual({
      Key: 'EnvName',
      Value: { Ref: 'EnvironmentName' }
    });
  });

  // ==============
  // S3 BUCKETS
  // ==============
  test('Logs bucket has proper configuration and lifecycle rules', () => {
    const logsBucket = resources.LogsBucket;
    expect(logsBucket.Type).toBe('AWS::S3::Bucket');
    expect(logsBucket.Properties.BucketName).toEqual({
      'Fn::Sub': 'logs-${AWS::AccountId}-${AWS::Region}'
    });

    // Check versioning
    expect(logsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

    // Check encryption
    const encryption = logsBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
    expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

    // Check public access blocks
    const publicAccess = logsBucket.Properties.PublicAccessBlockConfiguration;
    expect(publicAccess.BlockPublicAcls).toBe(true);
    expect(publicAccess.BlockPublicPolicy).toBe(true);
    expect(publicAccess.IgnorePublicAcls).toBe(true);
    expect(publicAccess.RestrictPublicBuckets).toBe(true);

    // Check lifecycle rules
    const lifecycleRule = logsBucket.Properties.LifecycleConfiguration.Rules[0];
    expect(lifecycleRule.Id).toBe('DeleteOldLogs');
    expect(lifecycleRule.Status).toBe('Enabled');
    expect(lifecycleRule.ExpirationInDays).toBe(90);
    expect(lifecycleRule.NoncurrentVersionExpirationInDays).toBe(30);

    // Check required tags
    const tags = logsBucket.Properties.Tags;
    expect(tags).toContainEqual({
      Key: 'Name',
      Value: { 'Fn::Sub': 'logs-${AWS::AccountId}-${AWS::Region}' }
    });
  });

  test('General storage bucket has encryption, versioning, and public access blocks', () => {
    const bucket = resources.GeneralStorageBucket.Properties;
    expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    expect(bucket.BucketEncryption).toBeDefined();
    expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    // Dynamic name using account and region
    expect(bucket.BucketName['Fn::Sub']).toMatch(/generalstorage-\$\{AWS::AccountId\}-\$\{AWS::Region\}/);
  });

  test('Logs bucket has encryption, versioning, public access blocks, and lifecycle rules', () => {
    const bucket = resources.LogsBucket.Properties;
    expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    expect(bucket.BucketEncryption).toBeDefined();
    expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    expect(bucket.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
    expect(bucket.BucketName['Fn::Sub']).toMatch(/logs-\$\{AWS::AccountId\}-\$\{AWS::Region\}/);
  });

  // =============
  // CLOUDWATCH
  // =============
  test('CloudWatch CPU alarm is defined and references the EC2 instance', () => {
    const alarm = resources.CPUAlarm.Properties;
    expect(alarm.MetricName).toBe('CPUUtilization');
    expect(alarm.Namespace).toBe('AWS/EC2');
    expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    const dimension = alarm.Dimensions.find((d: any) => d.Name === 'InstanceId');
    expect(dimension.Value).toEqual({ Ref: 'EC2Instance' });
  });

  // ==========
  // OUTPUTS
  // ==========
  test('Key outputs are present', () => {
    [
      'VPCId',
      'Subnet1Id',
      'Subnet2Id',
      'EC2InstanceId',
      'ElasticIP',
      'GeneralStorageBucketName',
      'LogsBucketName',
      'SecurityGroupId',
      'KeyPairOutput',
    ].forEach((o) => expect(outputs[o]).toBeDefined());
  });

  // =====================
  // CROSS-ACCOUNT SAFETY
  // =====================
  test('No hardcoded ARNs, account IDs, or regions in the template text', () => {
    expect(raw).not.toMatch(/\b\d{12}\b/); // 12-digit account IDs
    expect(raw).not.toMatch(/arn:aws:[a-z0-9-]+:[a-z0-9-]+:\d{12}:/);
    // Avoid literal region tokens (allow intrinsic references via ${AWS::Region})
    expect(raw).not.toMatch(/\b(us-|eu-|ap-|me-|ca-|af-)[a-z0-9-]+\b/);
  });
});


