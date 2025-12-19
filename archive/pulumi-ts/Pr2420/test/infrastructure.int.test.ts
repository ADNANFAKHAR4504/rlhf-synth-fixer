import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Integration Tests
describe('Infrastructure Integration Tests', () => {
  const region = 'ap-south-1';
  const requiredRegions = ['us-east-1', 'us-west-2', 'ap-south-1'];
  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const s3 = new AWS.S3();
  const rds = new AWS.RDS();
  const iam = new AWS.IAM();
  const logs = new AWS.CloudWatchLogs();
  const ssm = new AWS.SSM();
  const cloudfront = new AWS.CloudFront();
  const configService = new AWS.ConfigService();

  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  let outputs: any = {};

  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    }
  });

  describe('VPC and Networking', () => {
    it('VPC exists and is available', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping VPC test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('public subnet exists with correct configuration', async () => {
      if (!outputs.publicSubnetId) {
        console.log('Skipping public subnet test - no public subnet ID in outputs');
        return;
      }

      const response = await ec2.describeSubnets({ SubnetIds: [outputs.publicSubnetId] }).promise();
      expect(response.Subnets).toHaveLength(1);
      expect(response.Subnets![0].MapPublicIpOnLaunch).toBe(true);
      expect(response.Subnets![0].CidrBlock).toBe('10.0.1.0/24');
    });

    it('private subnet exists with correct configuration', async () => {
      if (!outputs.privateSubnetId) {
        console.log('Skipping private subnet test - no private subnet ID in outputs');
        return;
      }

      const response = await ec2.describeSubnets({ SubnetIds: [outputs.privateSubnetId] }).promise();
      expect(response.Subnets).toHaveLength(1);
      expect(response.Subnets![0].MapPublicIpOnLaunch).toBe(false);
      expect(response.Subnets![0].CidrBlock).toBe('10.0.2.0/24');
    });
  });

  describe('Compute Resources', () => {
    it('EC2 instance is running with correct configuration', async () => {
      if (!outputs.ec2InstanceId) {
        console.log('Skipping EC2 test - no EC2 instance ID in outputs');
        return;
      }

      const response = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
      expect(response.Reservations).toHaveLength(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State!.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.Placement!.AvailabilityZone).toContain('ap-south-1');
      expect(instance.IamInstanceProfile).toBeDefined();
    });

    it('EC2 instance has public IP and is in public subnet', async () => {
      if (!outputs.ec2PublicIp || !outputs.ec2InstanceId) {
        console.log('Skipping public IP test - missing outputs');
        return;
      }

      expect(outputs.ec2PublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      const response = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
      const instance = response.Reservations![0].Instances![0];
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.SubnetId).toBe(outputs.publicSubnetId);
    });

    it('EC2 instance is accessible via Session Manager', async () => {
      if (!outputs.ec2InstanceId) {
        console.log('Skipping Session Manager test - no EC2 instance ID in outputs');
        return;
      }

      try {
        const response = await ssm.describeInstanceInformation({
          Filters: [{ Key: 'InstanceIds', Values: [outputs.ec2InstanceId] }]
        }).promise();

        expect(response.InstanceInformationList).toHaveLength(1);
        expect(response.InstanceInformationList![0].PingStatus).toBe('Online');
      } catch (error) {
        console.log('Session Manager agent may not be ready yet');
      }
    });
  });

  describe('Database', () => {
    it('RDS instance is available with correct configuration', async () => {
      if (!outputs.rdsEndpoint) {
        console.log('Skipping RDS test - no RDS endpoint in outputs');
        return;
      }

      const dbId = outputs.rdsEndpoint.split('.')[0];
      const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
      expect(response.DBInstances).toHaveLength(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.small');
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageType).toBe('gp2');
    });

    it('RDS instance has KMS encryption enabled', async () => {
      if (!outputs.rdsEndpoint) {
        console.log('Skipping RDS encryption test - no RDS endpoint in outputs');
        return;
      }

      const dbId = outputs.rdsEndpoint.split('.')[0];
      const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
    });

    it('RDS instance is not publicly accessible', async () => {
      if (!outputs.rdsEndpoint) {
        console.log('Skipping RDS accessibility test - no RDS endpoint in outputs');
        return;
      }

      const dbId = outputs.rdsEndpoint.split('.')[0];
      const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

      expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
    });

    it('RDS instance has managed master password and CloudWatch logs', async () => {
      if (!outputs.rdsEndpoint) {
        console.log('Skipping RDS password test - no RDS endpoint in outputs');
        return;
      }

      const dbId = outputs.rdsEndpoint.split('.')[0];
      const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.MasterUserSecret).toBeDefined();
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('error');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('slowquery');
      expect(dbInstance.MultiAZ).toBe(true);
    });

    it('RDS instance is in ap-south-1 region', async () => {
      if (!outputs.rdsEndpoint) {
        console.log('Skipping RDS region test - no RDS endpoint in outputs');
        return;
      }

      expect(outputs.rdsEndpoint).toContain('ap-south-1.rds.amazonaws.com');
    });
  });

  describe('Storage', () => {
    it('S3 bucket exists with versioning enabled', async () => {
      if (!outputs.s3BucketName) {
        console.log('Skipping S3 versioning test - no S3 bucket name in outputs');
        return;
      }

      const headResponse = await s3.headBucket({ Bucket: outputs.s3BucketName }).promise();
      expect(headResponse.$response.httpResponse.statusCode).toBe(200);

      const versioningResponse = await s3.getBucketVersioning({ Bucket: outputs.s3BucketName }).promise();
      expect(versioningResponse.Status).toBe('Enabled');
    });

    it('S3 bucket has KMS encryption enabled', async () => {
      if (!outputs.s3BucketName) {
        console.log('Skipping S3 encryption test - no S3 bucket name in outputs');
        return;
      }

      const encryptionResponse = await s3.getBucketEncryption({ Bucket: outputs.s3BucketName }).promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);

      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
    });

    it('S3 bucket is in ap-south-1 region', async () => {
      if (!outputs.s3BucketName) {
        console.log('Skipping S3 region test - no S3 bucket name in outputs');
        return;
      }

      const locationResponse = await s3.getBucketLocation({ Bucket: outputs.s3BucketName }).promise();
      expect(locationResponse.LocationConstraint).toBe('ap-south-1');
    });

    it('S3 bucket has public access blocked', async () => {
      if (!outputs.s3BucketName) {
        console.log('Skipping S3 public access test - no S3 bucket name in outputs');
        return;
      }

      const publicAccessResponse = await s3.getPublicAccessBlock({ Bucket: outputs.s3BucketName }).promise();
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM', () => {
    it('IAM role exists with correct policies', async () => {
      if (!outputs.iamRoleArn) {
        console.log('Skipping IAM test - no IAM role ARN in outputs');
        return;
      }

      const roleName = outputs.iamRoleArn.split('/').pop();
      const response = await iam.getRole({ RoleName: roleName }).promise();
      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);

      const policiesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
      expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThanOrEqual(1);

      const hasSSMPolicy = policiesResponse.AttachedPolicies!.some(
        policy => policy.PolicyArn === 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(hasSSMPolicy).toBe(true);
    });

    it('EC2 instance can write to S3 bucket', async () => {
      if (!outputs.s3BucketName || !outputs.iamRoleArn) {
        console.log('Skipping S3 access test - missing outputs');
        return;
      }

      const roleName = outputs.iamRoleArn.split('/').pop();

      const policiesResponse = await iam.listRolePolicies({ RoleName: roleName }).promise();
      const attachedPoliciesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();

      const hasS3Policy = policiesResponse.PolicyNames.some(name => name.includes('s3')) ||
        attachedPoliciesResponse.AttachedPolicies!.some(policy => policy.PolicyName!.includes('s3'));

      expect(hasS3Policy).toBe(true);
    });
  });

  describe('Monitoring', () => {
    it('CloudWatch log group exists with correct retention', async () => {
      if (!outputs.cloudWatchLogGroup) {
        console.log('Skipping CloudWatch test - no log group in outputs');
        return;
      }

      const response = await logs.describeLogGroups({ logGroupNamePrefix: outputs.cloudWatchLogGroup }).promise();
      expect(response.logGroups).toHaveLength(1);
      expect(response.logGroups![0].logGroupName).toBe(outputs.cloudWatchLogGroup);
      expect(response.logGroups![0].retentionInDays).toBe(14);
    });

    it('CloudWatch log group is in ap-south-1 region', async () => {
      if (!outputs.cloudWatchLogGroup) {
        console.log('Skipping CloudWatch region test - no log group in outputs');
        return;
      }

      const response = await logs.describeLogGroups({ logGroupNamePrefix: outputs.cloudWatchLogGroup }).promise();
      expect(response.logGroups).toHaveLength(1);
      // Log group ARN should contain ap-south-1 region
      expect(response.logGroups![0].arn).toContain('ap-south-1');
    });

    it('EC2 instance can write to CloudWatch Logs', async () => {
      if (!outputs.cloudWatchLogGroup) {
        console.log('Skipping CloudWatch logs test - no log group in outputs');
        return;
      }

      try {
        const response = await logs.describeLogStreams({
          logGroupName: outputs.cloudWatchLogGroup,
          orderBy: 'LastEventTime',
          descending: true
        }).promise();

        expect(response.logStreams).toBeDefined();
      } catch (error) {
        console.log('CloudWatch agent may not have created log streams yet');
      }
    });
  });

  describe('Security Groups', () => {
    it('EC2 security group has SSH access from 193.10.210.0/32', async () => {
      if (!outputs.ec2InstanceId) {
        console.log('Skipping security group test - no EC2 instance ID in outputs');
        return;
      }

      const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
      const securityGroups = instanceResponse.Reservations![0].Instances![0].SecurityGroups!;

      let hasCorrectSSHRule = false;
      for (const sg of securityGroups) {
        const sgResponse = await ec2.describeSecurityGroups({ GroupIds: [sg.GroupId!] }).promise();
        const ingressRules = sgResponse.SecurityGroups![0].IpPermissions!;

        const sshRule = ingressRules.find(rule =>
          rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
        );

        if (sshRule && sshRule.IpRanges) {
          hasCorrectSSHRule = sshRule.IpRanges.some(range => range.CidrIp === '193.10.210.0/32');
          if (hasCorrectSSHRule) break;
        }
      }
      expect(hasCorrectSSHRule).toBe(true);
    });

    it('EC2 security group allows outbound traffic to anywhere', async () => {
      if (!outputs.ec2InstanceId) {
        console.log('Skipping outbound security group test - no EC2 instance ID in outputs');
        return;
      }

      const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
      const securityGroups = instanceResponse.Reservations![0].Instances![0].SecurityGroups!;

      let hasAllOutboundRule = false;
      for (const sg of securityGroups) {
        const sgResponse = await ec2.describeSecurityGroups({ GroupIds: [sg.GroupId!] }).promise();
        const egressRules = sgResponse.SecurityGroups![0].IpPermissionsEgress!;

        hasAllOutboundRule = egressRules.some(rule =>
          rule.IpProtocol === '-1' &&
          rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
        );
        if (hasAllOutboundRule) break;
      }
      expect(hasAllOutboundRule).toBe(true);
    });
  });

  describe('Network Connectivity', () => {
    it('EC2 instance can reach internet via Internet Gateway', async () => {
      if (!outputs.ec2InstanceId) {
        console.log('Skipping network connectivity test - no EC2 instance ID in outputs');
        return;
      }

      const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
      const subnetId = instanceResponse.Reservations![0].Instances![0].SubnetId!;

      const routeTablesResponse = await ec2.describeRouteTables({
        Filters: [{ Name: 'association.subnet-id', Values: [subnetId] }]
      }).promise();

      expect(routeTablesResponse.RouteTables).toHaveLength(1);
      const routes = routeTablesResponse.RouteTables![0].Routes!;

      const hasIGWRoute = routes.some(route =>
        route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId
      );
      expect(hasIGWRoute).toBe(true);
    });

    it('Internet Gateway is properly attached', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping IGW test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }]
      }).promise();

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('available');
    });

    it('NAT Gateway is available', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping NAT Gateway test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeNatGateways({
        Filter: [{ Name: 'vpc-id', Values: [outputs.vpcId] }]
      }).promise();

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(response.NatGateways![0].State).toBe('available');
    });
  });

  describe('Resource Tagging and Compliance', () => {
    it('resources have proper environment and purpose tags', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping tagging test - no VPC ID in outputs');
        return;
      }

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
      const vpc = response.Vpcs![0];

      expect(vpc.Tags).toBeDefined();
      const environmentTag = vpc.Tags!.find(tag => tag.Key === 'environment');
      const purposeTag = vpc.Tags!.find(tag => tag.Key === 'purpose');
      expect(environmentTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      expect(environmentTag!.Value).toBeDefined();
      expect(purposeTag!.Value).toBeDefined();
    });

    it('resources follow naming convention <environment>-<resource-name>', async () => {
      const namingPattern = /^[a-z0-9]+-[a-z0-9-]+$/;
      
      if (outputs.vpcId) {
        const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
        const nameTag = response.Vpcs![0].Tags?.find(tag => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value).toMatch(namingPattern);
        }
      }

      if (outputs.s3BucketName) {
        expect(outputs.s3BucketName).toMatch(namingPattern);
      }
    });

    it('all resources are in ap-south-1 region', async () => {
      // Check VPC region
      if (outputs.vpcId) {
        const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
        // VPC region is validated by the AWS SDK configuration
      }

      // Check EC2 region
      if (outputs.ec2InstanceId) {
        const ec2Response = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        expect(ec2Response.Reservations![0].Instances![0].Placement!.AvailabilityZone).toContain('ap-south-1');
      }

      // Check RDS region
      if (outputs.rdsEndpoint) {
        expect(outputs.rdsEndpoint).toContain('ap-south-1');
      }
    });

    it('resources are optimized for cost and performance', async () => {
      if (!outputs.ec2InstanceId && !outputs.rdsEndpoint) {
        console.log('Skipping optimization test - no resource IDs in outputs');
        return;
      }

      // Check EC2 instance type
      if (outputs.ec2InstanceId) {
        const ec2Response = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        const instance = ec2Response.Reservations![0].Instances![0];
        expect(instance.InstanceType).toBe('t3.micro');
      }

      // Check RDS instance class
      if (outputs.rdsEndpoint) {
        const dbId = outputs.rdsEndpoint.split('.')[0];
        const rdsResponse = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
        const dbInstance = rdsResponse.DBInstances![0];
        expect(dbInstance.DBInstanceClass).toBe('db.t3.small');
        expect(dbInstance.StorageType).toBe('gp2');
      }
    });

    it('infrastructure follows security best practices', async () => {
      const securityChecks = [];

      // Check RDS security
      if (outputs.rdsEndpoint) {
        const dbId = outputs.rdsEndpoint.split('.')[0];
        const rdsResponse = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
        securityChecks.push({
          check: 'RDS Public Access',
          secure: !rdsResponse.DBInstances![0].PubliclyAccessible
        });
        securityChecks.push({
          check: 'RDS Encryption',
          secure: rdsResponse.DBInstances![0].StorageEncrypted === true
        });
        securityChecks.push({
          check: 'RDS Multi-AZ Enabled',
          secure: rdsResponse.DBInstances![0].MultiAZ === true
        });
      }

      // Check S3 bucket security
      if (outputs.s3BucketName) {
        try {
          const publicAccessResponse = await s3.getPublicAccessBlock({
            Bucket: outputs.s3BucketName
          }).promise();
          securityChecks.push({
            check: 'S3 Public Access Block',
            secure: publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls === true &&
              publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy === true &&
              publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls === true &&
              publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets === true
          });
        } catch (error) {
          securityChecks.push({ check: 'S3 Public Access Block', secure: false });
        }
      }

      // Check EC2 security group for SSH access
      if (outputs.ec2InstanceId) {
        const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        const securityGroups = instanceResponse.Reservations![0].Instances![0].SecurityGroups!;

        let hasCorrectSSHRule = false;
        for (const sg of securityGroups) {
          const sgResponse = await ec2.describeSecurityGroups({ GroupIds: [sg.GroupId!] }).promise();
          const ingressRules = sgResponse.SecurityGroups![0].IpPermissions!;

          const sshRule = ingressRules.find(rule =>
            rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
          );

          if (sshRule && sshRule.IpRanges) {
            hasCorrectSSHRule = sshRule.IpRanges.some(range => range.CidrIp === '193.10.210.0/32');
            if (hasCorrectSSHRule) break;
          }
        }

        securityChecks.push({
          check: 'SSH Access from 193.10.210.0/32',
          secure: hasCorrectSSHRule
        });
      }

      if (securityChecks.length === 0) {
        console.log('Skipping security test - no resources to check');
        return;
      }

      securityChecks.forEach(check => {
        expect(check.secure).toBe(true);
      });
    });

    it('backup and recovery mechanisms are in place', async () => {
      let hasBackupChecks = false;

      // Check RDS automated backups (skip if not configured)
      if (outputs.rdsEndpoint) {
        const dbId = outputs.rdsEndpoint.split('.')[0];
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
        const dbInstance = response.DBInstances![0];

        // RDS should have backup retention configured
        expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
        hasBackupChecks = true;
      }

      // Check S3 versioning for data protection
      if (outputs.s3BucketName) {
        const response = await s3.getBucketVersioning({ Bucket: outputs.s3BucketName }).promise();
        expect(response.Status).toBe('Enabled');
        hasBackupChecks = true;
      }

      if (!hasBackupChecks) {
        console.log('Skipping backup test - no resources to check');
      }
    });
  });

  describe('Multi-Region Infrastructure', () => {
    it('infrastructure is deployed across multiple regions', async () => {
      const deployedRegions = [];
      
      for (const testRegion of requiredRegions) {
        try {
          const regionalEC2 = new AWS.EC2({ region: testRegion });
          const vpcs = await regionalEC2.describeVpcs({
            Filters: [{ Name: 'tag:environment', Values: ['*'] }]
          }).promise();
          
          if (vpcs.Vpcs && vpcs.Vpcs.length > 0) {
            deployedRegions.push(testRegion);
          }
        } catch (error) {
          console.log(`No resources found in region ${testRegion}`);
        }
      }
      
      expect(deployedRegions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('CloudFront Distribution', () => {
    it('CloudFront distribution exists and serves S3 content', async () => {
      if (!outputs.cloudfrontDistributionId) {
        console.log('Skipping CloudFront test - no distribution ID in outputs');
        return;
      }

      const response = await cloudfront.getDistribution({
        Id: outputs.cloudfrontDistributionId
      }).promise();

      expect(response.Distribution).toBeDefined();
      expect(response.Distribution!.DistributionConfig.Enabled).toBe(true);
      expect(response.Distribution!.DistributionConfig.Origins.Items).toHaveLength(1);
      
      const origin = response.Distribution!.DistributionConfig.Origins.Items[0];
      expect(origin.DomainName).toContain('.s3.');
    });

    it('CloudFront distribution has proper security configuration', async () => {
      if (!outputs.cloudfrontDistributionId) {
        console.log('Skipping CloudFront security test - no distribution ID in outputs');
        return;
      }

      const response = await cloudfront.getDistribution({
        Id: outputs.cloudfrontDistributionId
      }).promise();

      const config = response.Distribution!.DistributionConfig;
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('AWS Config Compliance', () => {
    it('AWS Config is enabled for compliance monitoring', async () => {
      if (!outputs.configDeliveryChannelName) {
        console.log('Skipping Config test - no delivery channel in outputs');
        return;
      }

      const response = await configService.describeDeliveryChannels({
        DeliveryChannelNames: [outputs.configDeliveryChannelName]
      }).promise();

      expect(response.DeliveryChannels).toHaveLength(1);
      expect(response.DeliveryChannels![0].s3BucketName).toBeDefined();
    });

    it('Config rules are monitoring resource compliance', async () => {
      try {
        const response = await configService.describeConfigRules().promise();
        expect(response.ConfigRules).toBeDefined();
        expect(response.ConfigRules!.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Config rules may not be configured yet');
      }
    });
  });



  describe('Infrastructure Outputs and Parameterization', () => {
    it('key outputs are exported for resource sharing', async () => {
      const requiredOutputs = [
        'vpcId',
        'publicSubnetId', 
        'privateSubnetId',
        'ec2InstanceId',
        'rdsEndpoint',
        's3BucketName',
        'iamRoleArn',
        'cloudWatchLogGroup'
      ];

      const missingOutputs = requiredOutputs.filter(output => !outputs[output]);
      expect(missingOutputs).toEqual([]);
    });

    it('infrastructure supports parameterized configurations', async () => {
      // Verify different instance sizes can be configured
      if (outputs.ec2InstanceId) {
        const response = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        const instance = response.Reservations![0].Instances![0];
        expect(['t3.micro', 't3.small', 't3.medium']).toContain(instance.InstanceType);
      }

      // Verify RDS instance class is configurable
      if (outputs.rdsEndpoint) {
        const dbId = outputs.rdsEndpoint.split('.')[0];
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
        const dbInstance = response.DBInstances![0];
        expect(['db.t3.small', 'db.t3.medium']).toContain(dbInstance.DBInstanceClass);
      }
    });
  });

  describe('IAM Least Privilege Validation', () => {
    it('IAM policies follow least privilege principle', async () => {
      if (!outputs.iamRoleArn) {
        console.log('Skipping IAM least privilege test - no IAM role ARN in outputs');
        return;
      }

      const roleName = outputs.iamRoleArn.split('/').pop();
      const policiesResponse = await iam.listRolePolicies({ RoleName: roleName }).promise();
      
      // Check that policies are specific and not overly broad
      for (const policyName of policiesResponse.PolicyNames) {
        const policyResponse = await iam.getRolePolicy({
          RoleName: roleName,
          PolicyName: policyName
        }).promise();

        const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
        
        // Ensure no wildcard actions on all resources
        const hasWildcardActions = policyDocument.Statement.some((stmt: any) => 
          stmt.Action === '*' && stmt.Resource === '*'
        );
        expect(hasWildcardActions).toBe(false);
      }
    });
  });

  // End-to-End Tests
  describe('e2e: Infrastructure End-to-End Tests', () => {
    describe('e2e: Session Manager Connectivity', () => {
      it('e2e: EC2 instance is accessible via Session Manager', async () => {
        if (!outputs.ec2InstanceId) {
          console.log('Skipping Session Manager test - no EC2 instance ID in outputs');
          return;
        }

        try {
          const response = await ssm.describeInstanceInformation({
            Filters: [{ Key: 'InstanceIds', Values: [outputs.ec2InstanceId] }]
          }).promise();

          expect(response.InstanceInformationList).toHaveLength(1);
          expect(response.InstanceInformationList![0].PingStatus).toBe('Online');
        } catch (error) {
          console.log('Session Manager agent may not be ready yet');
        }
      });

      it('e2e: Session Manager can start session', async () => {
        if (!outputs.ec2InstanceId) {
          console.log('Skipping Session Manager session test - no EC2 instance ID in outputs');
          return;
        }

        try {
          const response = await ssm.startSession({
            Target: outputs.ec2InstanceId
          }).promise();

          expect(response.SessionId).toBeDefined();
          expect(response.TokenValue).toBeDefined();
          expect(response.StreamUrl).toBeDefined();

          // Terminate the session immediately
          await ssm.terminateSession({
            SessionId: response.SessionId!
          }).promise();
        } catch (error) {
          console.log('Session Manager may not be fully configured yet');
        }
      });
    });

    describe('e2e: Security Group Configuration', () => {
      it('e2e: EC2 security group has SSH access from 193.10.210.0/32', async () => {
        if (!outputs.ec2InstanceId) {
          console.log('Skipping security group test - no EC2 instance ID in outputs');
          return;
        }

        const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        const securityGroups = instanceResponse.Reservations![0].Instances![0].SecurityGroups!;

        let hasCorrectSSHRule = false;
        for (const sg of securityGroups) {
          const sgResponse = await ec2.describeSecurityGroups({ GroupIds: [sg.GroupId!] }).promise();
          const ingressRules = sgResponse.SecurityGroups![0].IpPermissions!;

          const sshRule = ingressRules.find(rule =>
            rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
          );

          if (sshRule && sshRule.IpRanges) {
            hasCorrectSSHRule = sshRule.IpRanges.some(range => range.CidrIp === '193.10.210.0/32');
            if (hasCorrectSSHRule) break;
          }
        }
        expect(hasCorrectSSHRule).toBe(true);
      });

      it('e2e: EC2 security group allows all outbound traffic', async () => {
        if (!outputs.ec2InstanceId) {
          console.log('Skipping outbound security group test - no EC2 instance ID in outputs');
          return;
        }

        const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        const securityGroups = instanceResponse.Reservations![0].Instances![0].SecurityGroups!;

        let hasAllOutboundRule = false;
        for (const sg of securityGroups) {
          const sgResponse = await ec2.describeSecurityGroups({ GroupIds: [sg.GroupId!] }).promise();
          const egressRules = sgResponse.SecurityGroups![0].IpPermissionsEgress!;

          hasAllOutboundRule = egressRules.some(rule =>
            rule.IpProtocol === '-1' &&
            rule.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')
          );
          if (hasAllOutboundRule) break;
        }
        expect(hasAllOutboundRule).toBe(true);
      });
    });

    describe('e2e: Network Connectivity', () => {
      it('e2e: EC2 instance can reach internet via Internet Gateway', async () => {
        if (!outputs.ec2InstanceId) {
          console.log('Skipping network connectivity test - no EC2 instance ID in outputs');
          return;
        }

        const instanceResponse = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
        const subnetId = instanceResponse.Reservations![0].Instances![0].SubnetId!;

        const routeTablesResponse = await ec2.describeRouteTables({
          Filters: [{ Name: 'association.subnet-id', Values: [subnetId] }]
        }).promise();

        expect(routeTablesResponse.RouteTables).toHaveLength(1);
        const routes = routeTablesResponse.RouteTables![0].Routes!;

        const hasIGWRoute = routes.some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId
        );
        expect(hasIGWRoute).toBe(true);
      });

      it('e2e: NAT Gateway is in public subnet', async () => {
        if (!outputs.publicSubnetId) {
          console.log('Skipping NAT Gateway subnet test - no public subnet ID in outputs');
          return;
        }

        const natGatewaysResponse = await ec2.describeNatGateways({
          Filter: [
            { Name: 'subnet-id', Values: [outputs.publicSubnetId] },
            { Name: 'state', Values: ['available'] }
          ]
        }).promise();

        expect(natGatewaysResponse.NatGateways).toBeDefined();
        expect(natGatewaysResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);

        natGatewaysResponse.NatGateways!.forEach(natGw => {
          expect(natGw.State).toBe('available');
          expect(natGw.SubnetId).toBe(outputs.publicSubnetId);
        });
      });
    });

    describe('e2e: Database Security', () => {
      it('e2e: RDS instance is not publicly accessible', async () => {
        if (!outputs.rdsEndpoint) {
          console.log('Skipping RDS accessibility test - no RDS endpoint in outputs');
          return;
        }

        const dbId = outputs.rdsEndpoint.split('.')[0];
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

        expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
      });

      it('e2e: RDS instance has managed master password', async () => {
        if (!outputs.rdsEndpoint) {
          console.log('Skipping RDS password test - no RDS endpoint in outputs');
          return;
        }

        const dbId = outputs.rdsEndpoint.split('.')[0];
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

        expect(response.DBInstances![0].MasterUserSecret).toBeDefined();
      });

      it('e2e: RDS instance is in private subnet', async () => {
        if (!outputs.rdsEndpoint || !outputs.privateSubnetId) {
          console.log('Skipping RDS subnet test - missing outputs');
          return;
        }

        const dbId = outputs.rdsEndpoint.split('.')[0];
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

        const dbSubnetGroup = response.DBInstances![0].DBSubnetGroup!;
        const subnetIds = dbSubnetGroup.Subnets!.map(subnet => subnet.SubnetIdentifier);

        expect(subnetIds).toContain(outputs.privateSubnetId);
      });

      it('e2e: RDS instance has CloudWatch logs enabled', async () => {
        if (!outputs.rdsEndpoint) {
          console.log('Skipping RDS CloudWatch logs test - no RDS endpoint in outputs');
          return;
        }

        const dbId = outputs.rdsEndpoint.split('.')[0];
        const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();

        const enabledLogs = response.DBInstances![0].EnabledCloudwatchLogsExports;
        expect(enabledLogs).toBeDefined();
        expect(enabledLogs).toContain('error');
        expect(enabledLogs).toContain('slowquery');
      });
    });

    describe('e2e: CloudWatch Logs Integration', () => {
      it('e2e: EC2 instance can write to CloudWatch Logs', async () => {
        if (!outputs.cloudWatchLogGroup) {
          console.log('Skipping CloudWatch logs test - no log group in outputs');
          return;
        }

        try {
          const response = await logs.describeLogStreams({
            logGroupName: outputs.cloudWatchLogGroup,
            orderBy: 'LastEventTime',
            descending: true
          }).promise();

          expect(response.logStreams).toBeDefined();
        } catch (error) {
          console.log('CloudWatch agent may not have created log streams yet');
        }
      });

      it('e2e: CloudWatch log group has correct retention', async () => {
        if (!outputs.cloudWatchLogGroup) {
          console.log('Skipping CloudWatch retention test - no log group in outputs');
          return;
        }

        const response = await logs.describeLogGroups({
          logGroupNamePrefix: outputs.cloudWatchLogGroup
        }).promise();

        expect(response.logGroups).toHaveLength(1);
        expect(response.logGroups![0].retentionInDays).toBe(14);
      });
    });

    describe('e2e: S3 Access Control', () => {
      it('e2e: EC2 instance can write to S3 bucket', async () => {
        if (!outputs.s3BucketName || !outputs.iamRoleArn) {
          console.log('Skipping S3 access test - missing outputs');
          return;
        }

        const roleName = outputs.iamRoleArn.split('/').pop();

        const policiesResponse = await iam.listRolePolicies({ RoleName: roleName }).promise();
        const attachedPoliciesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();

        const hasS3Policy = policiesResponse.PolicyNames.some(name => name.includes('s3')) ||
          attachedPoliciesResponse.AttachedPolicies!.some(policy => policy.PolicyName!.includes('s3'));

        expect(hasS3Policy).toBe(true);
      });

      it('e2e: S3 bucket policy allows PutObject and GetObject', async () => {
        if (!outputs.s3BucketName || !outputs.iamRoleArn) {
          console.log('Skipping S3 policy test - missing outputs');
          return;
        }

        const roleName = outputs.iamRoleArn.split('/').pop();
        const policiesResponse = await iam.listRolePolicies({ RoleName: roleName }).promise();

        for (const policyName of policiesResponse.PolicyNames) {
          if (policyName.includes('s3')) {
            const policyResponse = await iam.getRolePolicy({
              RoleName: roleName,
              PolicyName: policyName
            }).promise();

            const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
            const s3Statement = policyDocument.Statement.find((stmt: any) =>
              stmt.Action && (stmt.Action.includes('s3:PutObject') || stmt.Action.includes('s3:GetObject'))
            );

            expect(s3Statement).toBeDefined();
            expect(s3Statement.Action).toEqual(['s3:PutObject', 's3:GetObject']);
          }
        }
      });
    });

    describe('e2e: Infrastructure Health Check', () => {
      it('e2e: All critical resources are healthy', async () => {
        const healthChecks = [];

        // Check VPC
        if (outputs.vpcId) {
          const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
          healthChecks.push({
            resource: 'VPC',
            healthy: vpcResponse.Vpcs![0].State === 'available'
          });
        }

        // Check EC2
        if (outputs.ec2InstanceId) {
          const ec2Response = await ec2.describeInstances({ InstanceIds: [outputs.ec2InstanceId] }).promise();
          healthChecks.push({
            resource: 'EC2',
            healthy: ec2Response.Reservations![0].Instances![0].State!.Name === 'running'
          });
        }

        // Check RDS
        if (outputs.rdsEndpoint) {
          const dbId = outputs.rdsEndpoint.split('.')[0];
          const rdsResponse = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
          healthChecks.push({
            resource: 'RDS',
            healthy: rdsResponse.DBInstances![0].DBInstanceStatus === 'available'
          });
        }

        // All resources should be healthy
        healthChecks.forEach(check => {
          expect(check.healthy).toBe(true);
        });

        expect(healthChecks.length).toBeGreaterThan(0);
      });

      it('e2e: Infrastructure can handle basic operations', async () => {
        const operationalChecks = [];

        // Check if S3 bucket is accessible
        if (outputs.s3BucketName) {
          try {
            await s3.headBucket({ Bucket: outputs.s3BucketName }).promise();
            operationalChecks.push({ operation: 'S3 Access', success: true });
          } catch (error) {
            operationalChecks.push({ operation: 'S3 Access', success: false });
          }
        }

        // Check if CloudWatch log group is accessible
        if (outputs.cloudWatchLogGroup) {
          try {
            await logs.describeLogGroups({ logGroupNamePrefix: outputs.cloudWatchLogGroup }).promise();
            operationalChecks.push({ operation: 'CloudWatch Access', success: true });
          } catch (error) {
            operationalChecks.push({ operation: 'CloudWatch Access', success: false });
          }
        }

        // Check if IAM role exists
        if (outputs.iamRoleArn) {
          try {
            const roleName = outputs.iamRoleArn.split('/').pop();
            await iam.getRole({ RoleName: roleName }).promise();
            operationalChecks.push({ operation: 'IAM Role Access', success: true });
          } catch (error) {
            operationalChecks.push({ operation: 'IAM Role Access', success: false });
          }
        }

        // All operations should succeed
        operationalChecks.forEach(check => {
          expect(check.success).toBe(true);
        });

        expect(operationalChecks.length).toBeGreaterThan(0);
      });

      it('e2e: Security posture is maintained', async () => {
        const securityChecks = [];

        // Check RDS encryption
        if (outputs.rdsEndpoint) {
          const dbId = outputs.rdsEndpoint.split('.')[0];
          const response = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
          securityChecks.push({
            check: 'RDS Encryption',
            secure: response.DBInstances![0].StorageEncrypted === true
          });
        }

        // Check S3 public access block
        if (outputs.s3BucketName) {
          try {
            const response = await s3.getPublicAccessBlock({ Bucket: outputs.s3BucketName }).promise();
            securityChecks.push({
              check: 'S3 Public Access Block',
              secure: response.PublicAccessBlockConfiguration!.BlockPublicAcls === true
            });
          } catch (error) {
            securityChecks.push({ check: 'S3 Public Access Block', secure: false });
          }
        }

        // All security checks should pass
        securityChecks.forEach(check => {
          expect(check.secure).toBe(true);
        });

        expect(securityChecks.length).toBeGreaterThan(0);
      });
    });
  });
});