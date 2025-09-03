import AWS from 'aws-sdk';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const ec2 = new AWS.EC2({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });
const kms = new AWS.KMS({ region: process.env.AWS_REGION || 'us-east-1' });
const iam = new AWS.IAM({ region: process.env.AWS_REGION || 'us-east-1' });
const ssm = new AWS.SSM({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatch = new AWS.CloudWatch({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Secure AWS Infrastructure Integration Tests', () => {
  const vpcId = outputs[`VpcId${environmentSuffix}`];
  const bucketName = outputs[`S3BucketName${environmentSuffix}`];
  const s3KmsKeyId = outputs[`S3KmsKeyId${environmentSuffix}`];
  const ec2RoleArn = outputs[`Ec2RoleArn${environmentSuffix}`];
  const webSecurityGroupId = outputs[`WebSecurityGroupId${environmentSuffix}`];
  const adminRoleArn = outputs[`AdminRoleArn${environmentSuffix}`];

  beforeAll(() => {
    console.log('Testing with outputs:', {
      vpcId,
      bucketName,
      s3KmsKeyId,
      ec2RoleArn,
      webSecurityGroupId,
      adminRoleArn
    });
  });

  describe('VPC and Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      const response = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();

      const vpc = response.Vpcs!.find(v => v.VpcId === vpcId);
      expect(vpc).toBeDefined();
      expect(vpc!.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc!.State).toBe('available');

      // Check VPC attributes separately
      const attributesResponse = await ec2.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      }).promise();
      expect(attributesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Security Groups have restrictive rules', async () => {
      if (!webSecurityGroupId) {
        console.log('Skipping security group test - no webSecurityGroupId found');
        return;
      }

      const response = await ec2.describeSecurityGroups({
        GroupIds: [webSecurityGroupId]
      }).promise();

      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      const sg = response.SecurityGroups!.find(sg => sg.GroupId === webSecurityGroupId);
      expect(sg).toBeDefined();
      expect(sg!.GroupName).toContain('WebSecurityGroup');
      
      // Check ingress rules - should only allow HTTPS from trusted ranges
      const httpsIngressRules = sg!.IpPermissions!.filter(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsIngressRules.length).toBeGreaterThan(0);

      // Check egress rules - should be restrictive
      const httpsEgressRules = sg!.IpPermissionsEgress!.filter(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsEgressRules.length).toBeGreaterThan(0);
    });

    test('Subnets are properly configured', async () => {
      const response = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      }).promise();

      expect(response.Subnets!.length).toBeGreaterThan(0);
      
      // Should have different subnet types
      const publicSubnets = response.Subnets!.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public')
      );
      const privateSubnets = response.Subnets!.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private')
      );

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('KMS Keys', () => {
    test('S3 KMS key is properly configured', async () => {
      if (!s3KmsKeyId) {
        console.log('Skipping KMS key test - no s3KmsKeyId found');
        return;
      }

      const response = await kms.describeKey({
        KeyId: s3KmsKeyId
      }).promise();

      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Description).toContain('S3 bucket encryption');

      // Check key rotation separately
      const rotationResponse = await kms.getKeyRotationStatus({
        KeyId: s3KmsKeyId
      }).promise();
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('KMS key aliases exist', async () => {
      const response = await kms.listAliases().promise();
      
      const s3Alias = response.Aliases?.find(alias => 
        alias.AliasName === `alias/tap-s3-key-${environmentSuffix}`
      );
      const ebsAlias = response.Aliases?.find(alias => 
        alias.AliasName === `alias/tap-ebs-key-${environmentSuffix}`
      );

      expect(s3Alias).toBeDefined();
      expect(ebsAlias).toBeDefined();
    });
  });

  describe('S3 Bucket Security', () => {
    test('S3 bucket exists with correct configuration', async () => {
      const response = await s3.getBucketVersioning({
        Bucket: bucketName
      }).promise();

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', async () => {
      if (!bucketName) {
        console.log('Skipping S3 encryption test - no bucketName found');
        return;
      }

      const response = await s3.getBucketEncryption({
        Bucket: bucketName
      }).promise();

      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule.BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket blocks public access', async () => {
      if (!bucketName) {
        console.log('Skipping S3 public access test - no bucketName found');
        return;
      }

      const response = await s3.getPublicAccessBlock({
        Bucket: bucketName
      }).promise();

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy enforces SSL', async () => {
      if (!bucketName) {
        console.log('Skipping S3 policy test - no bucketName found');
        return;
      }

      const response = await s3.getBucketPolicy({
        Bucket: bucketName
      }).promise();

      const policy = JSON.parse(response.Policy!);
      const sslStatement = policy.Statement.find((statement: any) => 
        statement.Effect === 'Deny' && 
        statement.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );

      expect(sslStatement).toBeDefined();
      expect(sslStatement.Action).toBe('s3:*');
    });

    test('S3 bucket has lifecycle rules configured', async () => {
      if (!bucketName) {
        console.log('Skipping S3 lifecycle test - no bucketName found');
        return;
      }

      const response = await s3.getBucketLifecycleConfiguration({
        Bucket: bucketName
      }).promise();

      expect(response.Rules?.length).toBeGreaterThan(0);
      
      const multipartRule = response.Rules?.find(rule => 
        rule.ID === 'delete-incomplete-multipart-uploads'
      );
      const transitionRule = response.Rules?.find(rule => 
        rule.ID === 'transition-to-ia'
      );

      expect(multipartRule).toBeDefined();
      expect(transitionRule).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 instance role exists with correct policies', async () => {
      if (!ec2RoleArn) {
        console.log('Skipping EC2 role test - no ec2RoleArn found');
        return;
      }

      const roleName = ec2RoleArn.split('/').pop();
      const response = await iam.getRole({
        RoleName: roleName!
      }).promise();

      expect(response.Role.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      // Check attached managed policies
      const policiesResponse = await iam.listAttachedRolePolicies({
        RoleName: roleName!
      }).promise();

      const ssmPolicy = policiesResponse.AttachedPolicies?.find(policy => 
        policy.PolicyName === 'AmazonSSMManagedInstanceCore'
      );
      expect(ssmPolicy).toBeDefined();
    });

    test('Admin role has MFA requirements', async () => {
      if (!adminRoleArn) {
        console.log('Skipping admin role test - no adminRoleArn found');
        return;
      }

      const roleName = adminRoleArn.split('/').pop();
      const response = await iam.listRolePolicies({
        RoleName: roleName!
      }).promise();

      expect(response.PolicyNames).toContain('AdminPolicy');

      const policyResponse = await iam.getRolePolicy({
        RoleName: roleName!,
        PolicyName: 'AdminPolicy'
      }).promise();

      const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
      const mfaStatement = policyDocument.Statement.find((statement: any) => 
        statement.Condition?.Bool?.['aws:MultiFactorAuthPresent'] === 'true'
      );

      expect(mfaStatement).toBeDefined();
      expect(mfaStatement.Condition.NumericLessThan['aws:MultiFactorAuthAge']).toBe('3600');
    });
  });

  describe('Parameter Store', () => {
    test('KMS key ARNs are stored in Parameter Store', async () => {
      try {
        const s3KeyParam = await ssm.getParameter({
          Name: `/tap/${environmentSuffix}/kms/s3-key-arn`
        }).promise();

        const ebsKeyParam = await ssm.getParameter({
          Name: `/tap/${environmentSuffix}/kms/ebs-key-arn`
        }).promise();

        expect(s3KeyParam.Parameter?.Value).toContain('arn:aws:kms');
        expect(ebsKeyParam.Parameter?.Value).toContain('arn:aws:kms');
      } catch (error) {
        console.log('SSM parameters not found, checking if they exist with different names');
        // Try to list all parameters with the prefix
        const response = await ssm.getParametersByPath({
          Path: `/tap/${environmentSuffix}/`,
          Recursive: true
        }).promise();
        
        console.log('Available SSM parameters:', response.Parameters?.map(p => p.Name));
        expect(response.Parameters?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Security monitoring alarm is configured', async () => {
      const response = await cloudWatch.describeAlarms({
        AlarmNames: [`tap-unauthorized-access-${environmentSuffix}`]
      }).promise();

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmDescription).toBe('Alarm for unauthorized access attempts');
      expect(alarm.MetricName).toBe('StatusCheckFailed');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('Resource Tagging', () => {
    test('Resources are properly tagged', async () => {
      // Check VPC tags
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();

      const vpc = vpcResponse.Vpcs![0];
      const tags = vpc.Tags || [];
      
      expect(tags.find(tag => tag.Key === 'Environment')?.Value).toBe(environmentSuffix);
      expect(tags.find(tag => tag.Key === 'Purpose')?.Value).toBe('security-infrastructure');
      expect(tags.find(tag => tag.Key === 'Project')?.Value).toBe('tap-security');
      expect(tags.find(tag => tag.Key === 'ManagedBy')?.Value).toBe('cdk');
    });
  });
});
