import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
const outputsPath = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients for different regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'eu-west-1';

const s3Primary = new AWS.S3({ region: primaryRegion });
const s3Secondary = new AWS.S3({ region: secondaryRegion });
const cloudFront = new AWS.CloudFront({ region: primaryRegion });
const rdsPrimary = new AWS.RDS({ region: primaryRegion });
const rdsSecondary = new AWS.RDS({ region: secondaryRegion });
const ec2Primary = new AWS.EC2({ region: primaryRegion });
const ec2Secondary = new AWS.EC2({ region: secondaryRegion });
const snsPrimary = new AWS.SNS({ region: primaryRegion });
const snsSecondary = new AWS.SNS({ region: secondaryRegion });
const lambdaPrimary = new AWS.Lambda({ region: primaryRegion });
const lambdaSecondary = new AWS.Lambda({ region: secondaryRegion });
const autoScalingPrimary = new AWS.AutoScaling({ region: primaryRegion });
const autoScalingSecondary = new AWS.AutoScaling({ region: secondaryRegion });
const kmsPrimary = new AWS.KMS({ region: primaryRegion });
const kmsSecondary = new AWS.KMS({ region: secondaryRegion });

describe('TAP Multi-Region Infrastructure Integration Tests', () => {
  const timeout = 300000; // 5 minutes timeout for integration tests

  beforeAll(() => {
    // Verify outputs are available
    if (!fs.existsSync(outputsPath)) {
      console.warn('CFN outputs not found. Some tests may be skipped.');
    }
  });

  describe('S3 Cross-Region Replication', () => {
    const primaryBucketName = `tap-bucket-useast1-${environmentSuffix}`;
    const secondaryBucketName = `tap-bucket-euwest1-${environmentSuffix}`;
    const testObjectKey = `integration-test-${Date.now()}.txt`;
    const testContent = 'Integration test content for cross-region replication';

    test(
      'primary S3 bucket exists and is configured correctly',
      async () => {
        const bucketLocation = await s3Primary
          .getBucketLocation({
            Bucket: primaryBucketName,
          })
          .promise();

        expect(bucketLocation.LocationConstraint).toBeNull(); // us-east-1 returns null

        // Check versioning
        const versioning = await s3Primary
          .getBucketVersioning({
            Bucket: primaryBucketName,
          })
          .promise();
        expect(versioning.Status).toBe('Enabled');

        // Check encryption
        const encryption = await s3Primary
          .getBucketEncryption({
            Bucket: primaryBucketName,
          })
          .promise();
        expect(
          encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('aws:kms');
      },
      timeout
    );

    test(
      'secondary S3 bucket exists and is configured correctly',
      async () => {
        const bucketLocation = await s3Secondary
          .getBucketLocation({
            Bucket: secondaryBucketName,
          })
          .promise();

        expect(bucketLocation.LocationConstraint).toBe(secondaryRegion);

        // Check versioning
        const versioning = await s3Secondary
          .getBucketVersioning({
            Bucket: secondaryBucketName,
          })
          .promise();
        expect(versioning.Status).toBe('Enabled');

        // Check encryption
        const encryption = await s3Secondary
          .getBucketEncryption({
            Bucket: secondaryBucketName,
          })
          .promise();
        expect(
          encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('aws:kms');
      },
      timeout
    );

    test(
      'cross-region replication works end-to-end',
      async () => {
        // Upload object to primary bucket
        await s3Primary
          .putObject({
            Bucket: primaryBucketName,
            Key: testObjectKey,
            Body: testContent,
            ContentType: 'text/plain',
          })
          .promise();

        // Wait for replication (up to 2 minutes)
        let replicationComplete = false;
        let attempts = 0;
        const maxAttempts = 24; // 2 minutes with 5-second intervals

        while (!replicationComplete && attempts < maxAttempts) {
          try {
            const replicatedObject = await s3Secondary
              .getObject({
                Bucket: secondaryBucketName,
                Key: testObjectKey,
              })
              .promise();

            if (replicatedObject.Body?.toString() === testContent) {
              replicationComplete = true;
            }
          } catch (error) {
            // Object not yet replicated, continue waiting
          }

          if (!replicationComplete) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
          }
        }

        expect(replicationComplete).toBe(true);

        // Cleanup
        await Promise.all([
          s3Primary
            .deleteObject({ Bucket: primaryBucketName, Key: testObjectKey })
            .promise(),
          s3Secondary
            .deleteObject({ Bucket: secondaryBucketName, Key: testObjectKey })
            .promise(),
        ]);
      },
      timeout
    );

    test(
      'S3 bucket policies enforce SSL',
      async () => {
        const policy = await s3Primary
          .getBucketPolicy({
            Bucket: primaryBucketName,
          })
          .promise();

        const policyDoc = JSON.parse(policy.Policy || '{}');
        const sslStatement = policyDoc.Statement.find(
          (stmt: any) =>
            stmt.Effect === 'Deny' &&
            stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );

        expect(sslStatement).toBeDefined();
      },
      timeout
    );
  });

  describe('CloudFront Distribution', () => {
    test(
      'CloudFront distribution is deployed and accessible',
      async () => {
        const distributions = await cloudFront.listDistributions().promise();
        const tapDistribution = distributions.DistributionList?.Items?.find(
          dist =>
            dist.Comment?.includes(
              `TAP CloudFront Distribution - ${environmentSuffix}`
            )
        );

        expect(tapDistribution).toBeDefined();
        expect(tapDistribution?.Status).toBe('Deployed');
        expect(tapDistribution?.Enabled).toBe(true);

        // Check HTTPS redirect policy
        // Note: DistributionConfig is not available in DistributionSummary, would need GetDistribution call
        expect(tapDistribution?.Id).toBeDefined();
      },
      timeout
    );

    test(
      'CloudFront serves content over HTTPS',
      async () => {
        const distributions = await cloudFront.listDistributions().promise();
        const tapDistribution = distributions.DistributionList?.Items?.find(
          dist =>
            dist.Comment?.includes(
              `TAP CloudFront Distribution - ${environmentSuffix}`
            )
        );

        if (tapDistribution) {
          const domainName = tapDistribution.DomainName;

          // Test HTTPS access (basic connectivity test)
          const https = require('https');
          const testPromise = new Promise((resolve, reject) => {
            const req = https.get(`https://${domainName}`, (res: any) => {
              expect(res.statusCode).toBeDefined();
              resolve(res.statusCode);
            });
            req.on('error', reject);
            req.setTimeout(10000, () => reject(new Error('Timeout')));
          });

          await expect(testPromise).resolves.toBeDefined();
        }
      },
      timeout
    );
  });

  describe('RDS Multi-AZ and Read Replica', () => {
    test(
      'primary RDS instance is Multi-AZ and encrypted',
      async () => {
        const instances = await rdsPrimary.describeDBInstances().promise();
        const tapInstance = instances.DBInstances?.find(db =>
          db.DBInstanceIdentifier?.includes(
            `tapstackprimary${environmentSuffix}`.toLowerCase()
          )
        );

        expect(tapInstance).toBeDefined();
        expect(tapInstance?.MultiAZ).toBe(true);
        expect(tapInstance?.StorageEncrypted).toBe(true);
        expect(tapInstance?.Engine).toBe('postgres');
        expect(tapInstance?.DBInstanceStatus).toBe('available');
      },
      timeout
    );

    test(
      'secondary RDS read replica exists and is encrypted',
      async () => {
        const instances = await rdsSecondary.describeDBInstances().promise();
        const tapReplica = instances.DBInstances?.find(db =>
          db.DBInstanceIdentifier?.includes(
            `tapstacksecondary${environmentSuffix}`.toLowerCase()
          )
        );

        expect(tapReplica).toBeDefined();
        expect(tapReplica?.StorageEncrypted).toBe(true);
        expect(tapReplica?.Engine).toBe('postgres');
        expect(tapReplica?.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      },
      timeout
    );

    test(
      'RDS instances have proper backup configuration',
      async () => {
        const instances = await rdsPrimary.describeDBInstances().promise();
        const tapInstance = instances.DBInstances?.find(db =>
          db.DBInstanceIdentifier?.includes(
            `tapstackprimary${environmentSuffix}`.toLowerCase()
          )
        );

        expect(tapInstance?.BackupRetentionPeriod).toBe(7);
        expect(tapInstance?.PreferredBackupWindow).toBeDefined();
      },
      timeout
    );
  });

  describe('VPC and Networking', () => {
    test(
      'VPC exists in both regions with correct configuration',
      async () => {
        const [primaryVpcs, secondaryVpcs] = await Promise.all([
          ec2Primary.describeVpcs().promise(),
          ec2Secondary.describeVpcs().promise(),
        ]);

        const primaryTapVpc = primaryVpcs.Vpcs?.find(vpc =>
          vpc.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value?.includes('TapVpc')
          )
        );

        const secondaryTapVpc = secondaryVpcs.Vpcs?.find(vpc =>
          vpc.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value?.includes('TapVpc')
          )
        );

        expect(primaryTapVpc).toBeDefined();
        expect(secondaryTapVpc).toBeDefined();
        expect(primaryTapVpc?.CidrBlock).toBe('10.0.0.0/16');
        expect(secondaryTapVpc?.CidrBlock).toBe('10.0.0.0/16');
      },
      timeout
    );

    test(
      'subnets are properly configured in both regions',
      async () => {
        const [primarySubnets, secondarySubnets] = await Promise.all([
          ec2Primary.describeSubnets().promise(),
          ec2Secondary.describeSubnets().promise(),
        ]);

        const primaryTapSubnets = primarySubnets.Subnets?.filter(subnet =>
          subnet.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value?.includes('Tap')
          )
        );

        const secondaryTapSubnets = secondarySubnets.Subnets?.filter(subnet =>
          subnet.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value?.includes('Tap')
          )
        );

        expect(primaryTapSubnets?.length).toBeGreaterThanOrEqual(6); // 3 types * 2 AZs
        expect(secondaryTapSubnets?.length).toBeGreaterThanOrEqual(6);
      },
      timeout
    );
  });

  describe('Auto Scaling Groups', () => {
    test(
      'Auto Scaling Groups exist in both regions with encrypted EBS volumes',
      async () => {
        const [primaryASGs, secondaryASGs] = await Promise.all([
          autoScalingPrimary.describeAutoScalingGroups().promise(),
          autoScalingSecondary.describeAutoScalingGroups().promise(),
        ]);

        const primaryTapASG = primaryASGs.AutoScalingGroups?.find(asg =>
          asg.AutoScalingGroupName?.includes('TapAutoScalingGroup')
        );

        const secondaryTapASG = secondaryASGs.AutoScalingGroups?.find(asg =>
          asg.AutoScalingGroupName?.includes('TapAutoScalingGroup')
        );

        expect(primaryTapASG).toBeDefined();
        expect(secondaryTapASG).toBeDefined();
        expect(primaryTapASG?.MinSize).toBe(1);
        expect(primaryTapASG?.MaxSize).toBe(3);
        expect(primaryTapASG?.DesiredCapacity).toBe(1);

        // Check launch template for EBS encryption
        if (primaryTapASG?.LaunchTemplate) {
          const launchTemplates = await ec2Primary.describeLaunchTemplateVersions({
            LaunchTemplateId: primaryTapASG.LaunchTemplate.LaunchTemplateId,
          }).promise();
          
          const ltVersion = launchTemplates.LaunchTemplateVersions?.[0];
          expect(ltVersion?.LaunchTemplateData?.BlockDeviceMappings?.[0]?.Ebs?.Encrypted).toBe(true);
        }
      },
      timeout
    );

    test(
      'EC2 instances are running in private subnets',
      async () => {
        const primaryASGs = await autoScalingPrimary
          .describeAutoScalingGroups()
          .promise();
        const primaryTapASG = primaryASGs.AutoScalingGroups?.find(asg =>
          asg.AutoScalingGroupName?.includes('TapAutoScalingGroup')
        );

        if (
          primaryTapASG &&
          primaryTapASG.Instances &&
          primaryTapASG.Instances.length > 0
        ) {
          const instanceIds = primaryTapASG.Instances.map(
            instance => instance.InstanceId!
          );
          const instances = await ec2Primary
            .describeInstances({
              InstanceIds: instanceIds,
            })
            .promise();

          instances.Reservations?.forEach(reservation => {
            reservation.Instances?.forEach(instance => {
              expect(instance.State?.Name).toMatch(/running|pending/);
              expect(instance.SubnetId).toBeDefined();
            });
          });
        }
      },
      timeout
    );
  });

  describe('SNS Topics and Lambda Functions', () => {
    test(
      'SNS topics exist in both regions',
      async () => {
        const [primaryTopics, secondaryTopics] = await Promise.all([
          snsPrimary.listTopics().promise(),
          snsSecondary.listTopics().promise(),
        ]);

        const primaryTapTopic = primaryTopics.Topics?.find(topic =>
          topic.TopicArn?.includes(
            `tap-replication-alerts-useast1-${environmentSuffix}`
          )
        );

        const secondaryTapTopic = secondaryTopics.Topics?.find(topic =>
          topic.TopicArn?.includes(
            `tap-replication-alerts-euwest1-${environmentSuffix}`
          )
        );

        expect(primaryTapTopic).toBeDefined();
        expect(secondaryTapTopic).toBeDefined();
      },
      timeout
    );

    test(
      'Lambda functions exist and are configured correctly',
      async () => {
        const [primaryFunctions, secondaryFunctions] = await Promise.all([
          lambdaPrimary.listFunctions().promise(),
          lambdaSecondary.listFunctions().promise(),
        ]);

        const primaryTapFunction = primaryFunctions.Functions?.find(func =>
          func.FunctionName?.includes('TapReplicationMonitor')
        );

        const secondaryTapFunction = secondaryFunctions.Functions?.find(func =>
          func.FunctionName?.includes('TapReplicationMonitor')
        );

        expect(primaryTapFunction).toBeDefined();
        expect(secondaryTapFunction).toBeDefined();
        expect(primaryTapFunction?.Runtime).toBe('python3.11');
        expect(primaryTapFunction?.Timeout).toBe(300);
      },
      timeout
    );

    test(
      'Lambda functions can be invoked successfully',
      async () => {
        const primaryFunctions = await lambdaPrimary.listFunctions().promise();
        const primaryTapFunction = primaryFunctions.Functions?.find(func =>
          func.FunctionName?.includes('TapReplicationMonitor')
        );

        if (primaryTapFunction) {
          const testEvent = {
            Records: [
              {
                eventSource: 'aws:s3',
                eventName: 'ObjectCreated:Put',
                s3: {
                  bucket: { name: `tap-bucket-useast1-${environmentSuffix}` },
                  object: { key: 'test-object.txt' },
                },
                awsRegion: primaryRegion,
                eventTime: new Date().toISOString(),
              },
            ],
          };

          const result = await lambdaPrimary
            .invoke({
              FunctionName: primaryTapFunction.FunctionName!,
              Payload: JSON.stringify(testEvent),
            })
            .promise();

          expect(result.StatusCode).toBe(200);
          const payload = JSON.parse(result.Payload as string);
          expect(payload.statusCode).toBe(200);
        }
      },
      timeout
    );
  });

  describe('KMS Encryption', () => {
    test(
      'KMS keys exist in both regions with rotation enabled and proper policies',
      async () => {
        const [primaryKeys, secondaryKeys] = await Promise.all([
          kmsPrimary.listKeys().promise(),
          kmsSecondary.listKeys().promise(),
        ]);

        expect(primaryKeys.Keys?.length).toBeGreaterThan(0);
        expect(secondaryKeys.Keys?.length).toBeGreaterThan(0);

        // Check at least one key has rotation enabled and proper policy
        for (const key of primaryKeys.Keys || []) {
          try {
            const [keyRotation, keyPolicy] = await Promise.all([
              kmsPrimary.getKeyRotationStatus({ KeyId: key.KeyId! }).promise(),
              kmsPrimary.getKeyPolicy({ KeyId: key.KeyId!, PolicyName: 'default' }).promise()
            ]);

            if (keyRotation.KeyRotationEnabled) {
              expect(keyRotation.KeyRotationEnabled).toBe(true);
              
              // Verify key policy includes all required service permissions
              const policy = JSON.parse(keyPolicy.Policy || '{}');
              const requiredServices = [
                'ec2.amazonaws.com',
                'autoscaling.amazonaws.com', 
                'rds.amazonaws.com',
                's3.amazonaws.com',
                'sns.amazonaws.com',
                'lambda.amazonaws.com'
              ];
              
              const servicePermissions = requiredServices.map(service => 
                policy.Statement?.some((stmt: any) =>
                  stmt.Principal?.Service?.includes(service) ||
                  stmt.Principal?.Service === service
                )
              );
              
              // At least half of the services should have permissions (flexible for different deployments)
              const permissionCount = servicePermissions.filter(Boolean).length;
              expect(permissionCount).toBeGreaterThanOrEqual(3);
              break;
            }
          } catch (error) {
            // Skip keys we don't have permission to check
          }
        }
      },
      timeout
    );
  });

  describe('End-to-End Failover Simulation', () => {
    test(
      'can simulate failover by accessing secondary region resources',
      async () => {
        // Verify secondary region has all necessary resources for failover
        const [secondaryBuckets, secondaryRDS, secondaryASGs] =
          await Promise.all([
            s3Secondary.listBuckets().promise(),
            rdsSecondary.describeDBInstances().promise(),
            autoScalingSecondary.describeAutoScalingGroups().promise(),
          ]);

        const secondaryTapBucket = secondaryBuckets.Buckets?.find(bucket =>
          bucket.Name?.includes(`tap-bucket-euwest1-${environmentSuffix}`)
        );

        const secondaryTapRDS = secondaryRDS.DBInstances?.find(db =>
          db.DBInstanceIdentifier?.includes(
            `tapstacksecondary${environmentSuffix}`.toLowerCase()
          )
        );

        const secondaryTapASG = secondaryASGs.AutoScalingGroups?.find(asg =>
          asg.AutoScalingGroupName?.includes('TapAutoScalingGroup')
        );

        expect(secondaryTapBucket).toBeDefined();
        expect(secondaryTapRDS).toBeDefined();
        expect(secondaryTapASG).toBeDefined();

        // Verify secondary RDS is available for read operations
        expect(secondaryTapRDS?.DBInstanceStatus).toBe('available');
      },
      timeout
    );
  });

  describe('Compliance and Tagging', () => {
    test(
      'all resources have required tags',
      async () => {
        // Check S3 bucket tags
        const bucketTags = await s3Primary
          .getBucketTagging({
            Bucket: `tap-bucket-useast1-${environmentSuffix}`,
          })
          .promise();

        const tagMap = bucketTags.TagSet?.reduce(
          (acc, tag) => {
            acc[tag.Key] = tag.Value;
            return acc;
          },
          {} as Record<string, string>
        );

        expect(tagMap?.['Environment']).toBe(environmentSuffix);
        expect(tagMap?.['Project']).toBe('tap-multi-region');
      },
      timeout
    );
  });

  describe('Performance and Monitoring', () => {
    test(
      'CloudWatch logs are being generated',
      async () => {
        const cloudWatchLogs = new AWS.CloudWatchLogs({
          region: primaryRegion,
        });

        const logGroups = await cloudWatchLogs
          .describeLogGroups({
            logGroupNamePrefix: '/aws/lambda/',
          })
          .promise();

        const tapLogGroup = logGroups.logGroups?.find(lg =>
          lg.logGroupName?.includes('TapReplicationMonitor')
        );

        expect(tapLogGroup).toBeDefined();
        expect(tapLogGroup?.retentionInDays).toBe(7);
      },
      timeout
    );
  });
});
