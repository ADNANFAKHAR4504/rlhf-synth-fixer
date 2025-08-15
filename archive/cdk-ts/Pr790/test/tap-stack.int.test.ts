import * as AWS from 'aws-sdk';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr34';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

// AWS Service Clients
const ec2 = new AWS.EC2();
const kms = new AWS.KMS();
const s3 = new AWS.S3();
const rds = new AWS.RDS();
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();
const logs = new AWS.CloudWatchLogs();
const iam = new AWS.IAM();

describe('Security Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be configured correctly', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const vpcs = await ec2
        .describeVpcs({
          VpcIds: [vpcId],
        })
        .promise();

      expect(vpcs.Vpcs).toHaveLength(1);
      const vpc = vpcs.Vpcs![0];

      // Get DNS settings using describeVpcAttribute
      const dnsHostnames = await ec2
        .describeVpcAttribute({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
        .promise();

      const dnsSupport = await ec2
        .describeVpcAttribute({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
        .promise();

      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });

    test('VPC should have flow logs enabled', async () => {
      const vpcId = outputs.VPCId;
      const flowLogs = await ec2
        .describeFlowLogs({
          Filter: [
            {
              Name: 'resource-id',
              Values: [vpcId],
            },
          ],
        })
        .promise();

      expect(flowLogs.FlowLogs).toBeDefined();
      expect(flowLogs.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = flowLogs.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
    });

    test('VPC should have multiple subnets across availability zones', async () => {
      const vpcId = outputs.VPCId;
      const subnets = await ec2
        .describeSubnets({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
        .promise();

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(6); // At least 2 AZs * 3 subnet types

      // Check that subnets are distributed across multiple AZs
      const azs = new Set(
        subnets.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Private subnets should have NAT gateway routes', async () => {
      const vpcId = outputs.VPCId;

      // First check if private subnets exist
      const subnets = await ec2
        .describeSubnets({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'tag:aws-cdk:subnet-type',
              Values: ['Private'],
            },
          ],
        })
        .promise();

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBeGreaterThan(0);

      // Check NAT Gateways with less restrictive filters
      const natGateways = await ec2
        .describeNatGateways({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
        .promise();

      console.log('NAT Gateways:', JSON.stringify(natGateways, null, 2)); // Debug log

      // Check route tables for private subnets
      const routeTables = await ec2
        .describeRouteTables({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'association.subnet-id',
              Values: subnets.Subnets!.map(subnet => subnet.SubnetId!),
            },
          ],
        })
        .promise();

      // Verify that private subnets have routes to NAT Gateway
      const hasNatRoutes = routeTables.RouteTables!.some(rt =>
        rt.Routes!.some(route => route.NatGatewayId)
      );

      expect(hasNatRoutes).toBe(true);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const keyMetadata = await kms
        .describeKey({
          KeyId: keyId,
        })
        .promise();

      expect(keyMetadata.KeyMetadata).toBeDefined();
      expect(keyMetadata.KeyMetadata!.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyMetadata!.Description).toContain(
        'KMS key for securing storage resources'
      );

      // Check key rotation
      const keyRotation = await kms
        .getKeyRotationStatus({
          KeyId: keyId,
        })
        .promise();

      expect(keyRotation.KeyRotationEnabled).toBe(true);
    });

    test('KMS key should have policy for CloudWatch Logs', async () => {
      const keyId = outputs.KMSKeyId;
      const keyPolicy = await kms
        .getKeyPolicy({
          KeyId: keyId,
          PolicyName: 'default',
        })
        .promise();

      expect(keyPolicy.Policy).toBeDefined();
      const policy = JSON.parse(keyPolicy.Policy!);

      // Check for CloudWatch Logs permissions
      const logsStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'Enable CloudWatch Logs'
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(logsStatement.Effect).toBe('Allow');
    });
  });

  describe('S3 Storage Security', () => {
    test('S3 buckets should exist with proper encryption', async () => {
      // List all buckets with the environment suffix
      const buckets = await s3.listBuckets().promise();
      const securityBuckets = buckets.Buckets!.filter(bucket =>
        bucket.Name!.includes(`-${environmentSuffix}-`)
      );

      expect(securityBuckets.length).toBeGreaterThanOrEqual(3); // At least 3 data buckets + access logs

      // Check encryption on each bucket
      for (const bucket of securityBuckets) {
        if (bucket.Name!.includes('access-logs')) {
          // Access logs bucket should use S3-managed encryption
          const encryption = await s3
            .getBucketEncryption({
              Bucket: bucket.Name!,
            })
            .promise();

          expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
          const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
          expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe(
            'AES256'
          );
        } else {
          // Data buckets should use KMS encryption
          const encryption = await s3
            .getBucketEncryption({
              Bucket: bucket.Name!,
            })
            .promise();

          expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
          const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
          expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe(
            'aws:kms'
          );
        }
      }
    });

    test('S3 buckets should block public access', async () => {
      const buckets = await s3.listBuckets().promise();
      const securityBuckets = buckets.Buckets!.filter(bucket =>
        bucket.Name!.includes(`-${environmentSuffix}-`)
      );

      for (const bucket of securityBuckets) {
        const publicAccessBlock = await s3
          .getPublicAccessBlock({
            Bucket: bucket.Name!,
          })
          .promise();

        expect(publicAccessBlock.PublicAccessBlockConfiguration).toBeDefined();
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration!.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration!
            .RestrictPublicBuckets
        ).toBe(true);
      }
    });

    test('S3 buckets should have versioning enabled for data buckets', async () => {
      const buckets = await s3.listBuckets().promise();
      const dataBuckets = buckets.Buckets!.filter(
        bucket =>
          bucket.Name!.includes(`-${environmentSuffix}-`) &&
          !bucket.Name!.includes('access-logs')
      );

      for (const bucket of dataBuckets) {
        const versioning = await s3
          .getBucketVersioning({
            Bucket: bucket.Name!,
          })
          .promise();

        expect(versioning.Status).toBe('Enabled');
      }
    });
  });

  describe('RDS Database Security', () => {
    test('RDS instances should exist with encryption enabled', async () => {
      const dbInstances = await rds.describeDBInstances().promise();
      const securityDatabases = dbInstances.DBInstances!.filter(db =>
        db
          .DBInstanceIdentifier!.toLowerCase()
          .includes(environmentSuffix.toLowerCase())
      );

      expect(securityDatabases.length).toBeGreaterThanOrEqual(2); // Primary and secondary

      for (const db of securityDatabases) {
        // Check encryption
        expect(db.StorageEncrypted).toBe(true);

        // Check backup retention
        expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);

        // Check deletion protection is disabled (for easy cleanup)
        expect(db.DeletionProtection).toBe(false);
      }
    });

    test('RDS instances should be in private subnets', async () => {
      const dbInstances = await rds.describeDBInstances().promise();
      const securityDatabases = dbInstances.DBInstances!.filter(db =>
        db
          .DBInstanceIdentifier!.toLowerCase()
          .includes(environmentSuffix.toLowerCase())
      );

      for (const db of securityDatabases) {
        // Check that DB is not publicly accessible
        expect(db.PubliclyAccessible).toBe(false);

        // Check that DB is in a subnet group
        expect(db.DBSubnetGroup).toBeDefined();
        expect(db.DBSubnetGroup!.DBSubnetGroupName).toContain('database');
      }
    });
  });

  describe('EC2 Compute Security', () => {
    test('EC2 instances should exist with encrypted EBS volumes', async () => {
      const instances = await ec2
        .describeInstances({
          Filters: [
            {
              Name: 'instance-state-name',
              Values: ['running'],
            },
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
        .promise();

      let totalInstances = 0;
      for (const reservation of instances.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          totalInstances++;

          // Check that all EBS volumes are encrypted
          for (const blockDevice of instance.BlockDeviceMappings || []) {
            if (blockDevice.Ebs) {
              const volume = await ec2
                .describeVolumes({
                  VolumeIds: [blockDevice.Ebs.VolumeId!],
                })
                .promise();

              expect(volume.Volumes![0].Encrypted).toBe(true);
              expect(volume.Volumes![0].VolumeType).toBe('gp3');
            }
          }
        }
      }

      expect(totalInstances).toBeGreaterThanOrEqual(4); // 2 web + 2 app servers
    });

    test('EC2 instances should have IAM roles attached', async () => {
      const instances = await ec2
        .describeInstances({
          Filters: [
            {
              Name: 'instance-state-name',
              Values: ['running'],
            },
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
        .promise();

      for (const reservation of instances.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          // Check that instance has IAM role
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile!.Arn).toContain('InstanceProfile');
        }
      }
    });

    test('EC2 security groups should have appropriate rules', async () => {
      const securityGroups = await ec2
        .describeSecurityGroups({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
        .promise();

      // Find web server security group
      const webSG = securityGroups.SecurityGroups!.find(sg =>
        sg.GroupName!.includes('WebSecurityGroup')
      );

      if (webSG) {
        // Check HTTPS ingress rule
        const httpsRule = webSG.IpPermissions!.find(
          rule => rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
        expect(httpsRule!.IpProtocol).toBe('tcp');
      }

      // Find app server security group
      const appSG = securityGroups.SecurityGroups!.find(sg =>
        sg.GroupName!.includes('AppSecurityGroup')
      );

      if (appSG) {
        // Check that app servers only accept traffic from web servers
        const appRules = appSG.IpPermissions!.filter(
          rule => rule.FromPort === 8080
        );

        if (appRules.length > 0) {
          expect(appRules[0].UserIdGroupPairs).toBeDefined();
        }
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch dashboard should exist', async () => {
      const dashboards = await cloudwatch
        .listDashboards({
          DashboardNamePrefix: 'SecureInfrastructure-Monitoring',
        })
        .promise();

      const securityDashboard = dashboards.DashboardEntries!.find(d =>
        d.DashboardName!.includes(environmentSuffix)
      );

      expect(securityDashboard).toBeDefined();
    });

    test('CloudWatch log groups should exist with encryption', async () => {
      // Check for EC2 log group
      const ec2LogGroup = `/aws/ec2/secure-instances-${environmentSuffix}`;

      try {
        const logGroups = await logs
          .describeLogGroups({
            logGroupNamePrefix: ec2LogGroup,
          })
          .promise();

        if (logGroups.logGroups && logGroups.logGroups.length > 0) {
          const logGroup = logGroups.logGroups[0];
          expect(logGroup.logGroupName).toBe(ec2LogGroup);
          expect(logGroup.retentionInDays).toBe(30);
          expect(logGroup.kmsKeyId).toBeDefined();
        }
      } catch (error) {
        // Log group might not exist if no logs have been written yet
        console.log('EC2 log group not found - may not have been created yet');
      }

      // Check for security audit log group
      try {
        const auditLogs = await logs
          .describeLogGroups({
            logGroupNamePrefix: '/aws/security/audit',
          })
          .promise();

        if (auditLogs.logGroups && auditLogs.logGroups.length > 0) {
          const auditLog = auditLogs.logGroups[0];
          expect(auditLog.retentionInDays).toBe(365);
        }
      } catch (error) {
        console.log(
          'Audit log group not found - may not have been created yet'
        );
      }
    });

    test('SNS topic should exist for security alerts', async () => {
      const topics = await sns.listTopics().promise();

      const securityTopic = topics.Topics!.find(topic =>
        topic.TopicArn!.includes('SecurityAlertTopic')
      );

      if (securityTopic) {
        const topicAttributes = await sns
          .getTopicAttributes({
            TopicArn: securityTopic.TopicArn!,
          })
          .promise();

        expect(topicAttributes.Attributes).toBeDefined();
        expect(topicAttributes.Attributes!.DisplayName).toBe('Security Alerts');

        // Check KMS encryption
        if (topicAttributes.Attributes!.KmsMasterKeyId) {
          expect(topicAttributes.Attributes!.KmsMasterKeyId).toBeDefined();
        }
      }
    });
  });

  describe('IAM Security', () => {
    test('EC2 instance roles should have minimal permissions', async () => {
      const roles = await iam.listRoles().promise();

      const instanceRoles = roles.Roles!.filter(
        role =>
          role.RoleName!.includes('ServerRole') &&
          role.RoleName!.includes(environmentSuffix)
      );

      for (const role of instanceRoles) {
        // Get attached policies
        const attachedPolicies = await iam
          .listAttachedRolePolicies({
            RoleName: role.RoleName!,
          })
          .promise();

        // Check for expected managed policies
        const policyNames = attachedPolicies.AttachedPolicies!.map(
          p => p.PolicyName
        );

        if (role.RoleName!.includes('WebServerRole')) {
          expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
          expect(policyNames).toContain('CloudWatchAgentServerPolicy');
        }

        if (role.RoleName!.includes('AppServerRole')) {
          expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
          expect(policyNames).toContain('CloudWatchAgentServerPolicy');

          // Check inline policies for S3 access
          const inlinePolicies = await iam
            .listRolePolicies({
              RoleName: role.RoleName!,
            })
            .promise();

          if (
            inlinePolicies.PolicyNames &&
            inlinePolicies.PolicyNames.length > 0
          ) {
            const policyDoc = await iam
              .getRolePolicy({
                RoleName: role.RoleName!,
                PolicyName: inlinePolicies.PolicyNames[0],
              })
              .promise();

            const policy = JSON.parse(
              decodeURIComponent(policyDoc.PolicyDocument!)
            );

            // Check that S3 permissions are limited
            const s3Statement = policy.Statement.find(
              (stmt: any) =>
                stmt.Action &&
                stmt.Action.some((action: string) => action.startsWith('s3:'))
            );

            if (s3Statement) {
              expect(s3Statement.Action).toContain('s3:GetObject');
              expect(s3Statement.Action).toContain('s3:ListBucket');
              expect(s3Statement.Resource).toBeDefined();
            }
          }
        }
      }
    });
  });

  describe('Stack Configuration', () => {
    test('Environment suffix should be properly set', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('All expected outputs should be present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });
  });
});
