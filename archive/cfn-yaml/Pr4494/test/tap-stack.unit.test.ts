import * as fs from 'fs';
import * as path from 'path';

describe('Elastic Beanstalk Web App - CloudFormation Unit Tests', () => {
  const templatePath = path.resolve(__dirname, '../lib/TapStack.json');
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  const resources = template.Resources;
  const outputs = template.Outputs;
  const parameters = template.Parameters;

  // ================
  // BASIC VALIDATION
  // ================
  test('Template has required sections', () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(resources).toBeDefined();
    expect(parameters).toBeDefined();
    expect(outputs).toBeDefined();
  });

  // ================
  // PARAMETERS
  // ================
  test('Key parameters are defined', () => {
    const expectedParams = [
      'ApplicationName',
      'EnvironmentName',
      'SolutionStackName',
      'InstanceType',
      'S3BucketNamePrefix',
      'AllowedIngressCIDR',
      'MinInstances',
      'MaxInstances',
      'CPUAlarmThreshold'
    ];
    expectedParams.forEach(p => expect(parameters[p]).toBeDefined());
  });

  // ================
  // VPC & NETWORKING
  // ================
  test('VPC and Subnets are correctly configured', () => {
    expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
    expect(resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
    expect(resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    expect(resources.PublicRoute.Type).toBe('AWS::EC2::Route');
  });

  test('VPC has correct CIDR and IGW attachment configured', () => {
    expect(resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    const attach = resources.VPCGatewayAttachment;
    expect(attach).toBeDefined();
    expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(attach.Properties.VpcId).toBeDefined();
    expect(attach.Properties.InternetGatewayId).toBeDefined();
  });

  test('Security group allows HTTP traffic on port 80', () => {
    const sg = resources.ApplicationSecurityGroup.Properties.SecurityGroupIngress[0];
    expect(sg.IpProtocol).toBe('tcp');
    expect(sg.FromPort).toBe(80);
    expect(sg.ToPort).toBe(80);
    expect(sg.CidrIp).toBeDefined();
  });

  // ================
  // IAM ROLES
  // ================
  test('IAM roles for EB Service and EC2 instance are defined', () => {
    expect(resources.ElasticBeanstalkServiceRole.Type).toBe('AWS::IAM::Role');
    expect(resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    expect(resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
  });

  test('EC2 instance role includes S3 permissions', () => {
    const policies = resources.EC2InstanceRole.Properties.Policies;
    const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
    expect(s3Policy).toBeDefined();
    const actions = s3Policy.PolicyDocument.Statement[0].Action;
    expect(actions).toEqual(
      expect.arrayContaining(['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'])
    );
  });

  // ================
  // ELASTIC BEANSTALK
  // ================
  test('Elastic Beanstalk resources exist', () => {
    expect(resources.ElasticBeanstalkApplication.Type).toBe('AWS::ElasticBeanstalk::Application');
    expect(resources.ElasticBeanstalkConfigurationTemplate.Type).toBe(
      'AWS::ElasticBeanstalk::ConfigurationTemplate'
    );
    expect(resources.ElasticBeanstalkEnvironment.Type).toBe('AWS::ElasticBeanstalk::Environment');
  });

  test('Beanstalk environment uses configuration template and VPC settings', () => {
    const options = resources.ElasticBeanstalkConfigurationTemplate.Properties.OptionSettings;
    const vpcConfig = options.find((o: any) => o.Namespace === 'aws:ec2:vpc' && o.OptionName === 'VPCId');
    const subnetsConfig = options.find((o: any) => o.OptionName === 'Subnets');
    expect(vpcConfig).toBeDefined();
    expect(subnetsConfig).toBeDefined();
  });

  test('Beanstalk logs streaming and retention are configured', () => {
    const options = resources.ElasticBeanstalkConfigurationTemplate.Properties.OptionSettings;
    const cwLogs = options.filter((o: any) => o.Namespace === 'aws:elasticbeanstalk:cloudwatch:logs');
    const streamLogs = cwLogs.find((o: any) => o.OptionName === 'StreamLogs');
    const deleteOnTerminate = cwLogs.find((o: any) => o.OptionName === 'DeleteOnTerminate');
    const retention = cwLogs.find((o: any) => o.OptionName === 'RetentionInDays');
    expect(streamLogs?.Value).toBe('true');
    expect(deleteOnTerminate?.Value).toBe('false');
    expect(retention?.Value).toBe('7');
  });

  // ================
  // S3 BUCKET
  // ================
  test('S3 bucket has encryption and block public access', () => {
    const bucket = resources.S3Bucket.Properties;
    expect(bucket.BucketEncryption).toBeDefined();
    expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
  });

  test('S3 bucket name is derived dynamically (no hardcoded account/region)', () => {
    const bucket = resources.S3Bucket.Properties;
    // Expect CloudFormation intrinsic substitution using AWS::AccountId and AWS::Region
    const nameExpr = bucket.BucketName;
    // When parsed, !Sub becomes { "Fn::Sub": "..." }
    expect(nameExpr).toBeDefined();
    expect(nameExpr['Fn::Sub']).toMatch(/\$\{S3BucketNamePrefix\}-\$\{AWS::AccountId\}-\$\{AWS::Region\}/);
  });

  // ================
  // CLOUDWATCH
  // ================
  test('CloudWatch CPU alarm is defined and configured', () => {
    const alarm = resources.HighCPUAlarm.Properties;
    expect(alarm.MetricName).toBe('CPUUtilization');
    // Threshold should be parameterized, not hardcoded
    expect(alarm.Threshold).toBeDefined();
    expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    expect(alarm.Period).toBe(300);
    expect(alarm.EvaluationPeriods).toBe(2);
    expect(alarm.TreatMissingData).toBe('notBreaching');
  });

  // ================
  // OUTPUTS
  // ================
  test('Key outputs are present', () => {
    expect(outputs.ApplicationURL).toBeDefined();
    expect(outputs.EnvironmentName).toBeDefined();
    expect(outputs.S3BucketName).toBeDefined();
    expect(outputs.SecurityGroupId).toBeDefined();
    expect(outputs.VPCId).toBeDefined();
  });

  // ================
  // CROSS-ACCOUNT SAFETY
  // ================
  test('No hardcoded ARNs, account IDs, or regions', () => {
    const yamlString = fs.readFileSync(templatePath, 'utf8');
    expect(yamlString).not.toMatch(/\b\d{12}\b/); 
    expect(yamlString).not.toMatch(/arn:aws:[a-z0-9-]+:[a-z0-9-]+:\d{12}:/);
    // Allow intrinsic references but avoid literal hardcoded region tokens
    expect(yamlString).not.toMatch(/\b(us-|eu-|ap-|me-|ca-|af-)[a-z0-9-]+\b/);
  });
});
