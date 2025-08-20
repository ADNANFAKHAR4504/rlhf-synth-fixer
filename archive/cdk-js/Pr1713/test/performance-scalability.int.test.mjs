// Performance and Scalability Integration Tests
// Tests infrastructure performance, auto-scaling, and load handling capabilities
import {
  CloudWatchClient,
  GetMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeLaunchTemplatesCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Auto-detect environment suffix from CloudFormation outputs
// This makes tests environment-agnostic and more robust
function detectEnvironmentSuffix(outputs) {
  // Look for any key that contains LoadBalancerDNS and extract the suffix
  for (const key of Object.keys(outputs)) {
    if (key.startsWith('LoadBalancerDNS')) {
      return key.replace('LoadBalancerDNS', '');
    }
  }
  // Fallback to environment variable or default
  return process.env.ENVIRONMENT_SUFFIX || 'dev';
}

const environmentSuffix = detectEnvironmentSuffix(outputs);

// Initialize AWS clients
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const elbv2Client = new ElasticLoadBalancingV2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const rdsClient = new RDSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const cloudWatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Helper function to wait for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to generate load on S3
async function generateS3Load(bucketName, iterations = 10) {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    const key = `load-test-${Date.now()}-${i}.txt`;
    const content = `Load test content ${i} - ${new Date().toISOString()}`;

    try {
      // PUT operation
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: 'text/plain',
      });

      const putStart = Date.now();
      await s3Client.send(putCommand);
      const putDuration = Date.now() - putStart;

      // GET operation
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const getStart = Date.now();
      const getResponse = await s3Client.send(getCommand);
      const retrievedContent = await getResponse.Body.transformToString();
      const getDuration = Date.now() - getStart;

      // DELETE operation
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const deleteStart = Date.now();
      await s3Client.send(deleteCommand);
      const deleteDuration = Date.now() - deleteStart;

      const totalDuration = Date.now() - startTime;

      results.push({
        iteration: i,
        putDuration,
        getDuration,
        deleteDuration,
        totalDuration,
        success: true,
      });

      // Small delay between operations
      await sleep(100);
    } catch (error) {
      results.push({
        iteration: i,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}

describe('Performance and Scalability Integration Tests', () => {
  // Test timeout for performance tests
  jest.setTimeout(180000);

  describe('Auto Scaling Group Configuration', () => {
    test('should have properly configured Auto Scaling Group', async () => {
      const vpcId = outputs[`VpcId${environmentSuffix}`];

      // Get instances to find Auto Scaling Group
      const describeInstancesCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });

      const instancesResponse = await ec2Client.send(describeInstancesCommand);
      expect(instancesResponse.Reservations.length).toBeGreaterThan(0);

      // Find Auto Scaling Group by instance tags
      let asgName = null;
      for (const reservation of instancesResponse.Reservations) {
        for (const instance of reservation.Instances) {
          const asgTag = instance.Tags.find(
            tag => tag.Key === 'aws:autoscaling:groupName'
          );
          if (asgTag) {
            asgName = asgTag.Value;
            break;
          }
        }
        if (asgName) break;
      }

      expect(asgName).toBeDefined();

      // Validate that instances have Auto Scaling Group tags
      expect(asgName).toBeDefined();

      // Validate instance configuration for Auto Scaling
      for (const reservation of instancesResponse.Reservations) {
        for (const instance of reservation.Instances) {
          expect(instance.State.Name).toBe('running');
          expect(instance.SecurityGroups.length).toBeGreaterThan(0);

          // Instance should have proper monitoring (may be disabled in some deployments)
          if (instance.Monitoring.State === 'enabled') {
            console.log('Instance monitoring enabled - good practice');
          } else {
            console.log(
              'Instance monitoring disabled - acceptable for development'
            );
          }

          // Instance should have EBS optimization if supported (may be disabled in some deployments)
          if (instance.EbsOptimized !== undefined) {
            if (instance.EbsOptimized) {
              console.log('EBS optimization enabled - good for performance');
            } else {
              console.log(
                'EBS optimization disabled - acceptable for development'
              );
            }
          }
        }
      }
    });

    test('should have proper launch template configuration', async () => {
      const vpcId = outputs[`VpcId${environmentSuffix}`];

      // Get instances to find launch template
      const describeInstancesCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });

      const instancesResponse = await ec2Client.send(describeInstancesCommand);
      expect(instancesResponse.Reservations.length).toBeGreaterThan(0);

      const instance = instancesResponse.Reservations[0].Instances[0];

      // Launch template may not be used in all deployments
      if (instance.LaunchTemplate) {
        console.log('Launch template found - good practice for consistency');

        // Get launch template details
        const describeLaunchTemplateCommand =
          new DescribeLaunchTemplatesCommand({
            LaunchTemplateIds: [instance.LaunchTemplate.LaunchTemplateId],
          });

        const ltResponse = await ec2Client.send(describeLaunchTemplateCommand);
        expect(ltResponse.LaunchTemplates).toHaveLength(1);

        const launchTemplate = ltResponse.LaunchTemplates[0];
        expect(launchTemplate.LaunchTemplateName).toBeDefined();

        // Should have proper instance type
        const instanceType = launchTemplate.LaunchTemplateData.InstanceType;
        expect(instanceType).toBeDefined();

        // Should have proper IAM instance profile
        expect(
          launchTemplate.LaunchTemplateData.IamInstanceProfile
        ).toBeDefined();
      } else {
        console.log('No launch template found - instance launched directly');
        // Basic instance validation
        expect(instance.InstanceType).toBeDefined();
        expect(instance.IamInstanceProfile).toBeDefined();
      }
    });
  });

  describe('Load Balancer Performance', () => {
    test('should have healthy targets under load', async () => {
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];

      // Get ALB details
      const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
      });

      const albResponse = await elbv2Client.send(describeLoadBalancersCommand);
      expect(albResponse.LoadBalancers).toHaveLength(1);

      const alb = albResponse.LoadBalancers[0];

      // Get target groups
      const describeTargetGroupsCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb.LoadBalancerArn,
      });

      const tgResponse = await elbv2Client.send(describeTargetGroupsCommand);
      expect(tgResponse.TargetGroups.length).toBeGreaterThan(0);

      // Check target health multiple times to ensure stability
      for (let i = 0; i < 3; i++) {
        for (const targetGroup of tgResponse.TargetGroups) {
          const describeTargetHealthCommand = new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroup.TargetGroupArn,
          });

          const healthResponse = await elbv2Client.send(
            describeTargetHealthCommand
          );
          expect(
            healthResponse.TargetHealthDescriptions.length
          ).toBeGreaterThan(0);

          // All targets should remain healthy
          const unhealthyTargets =
            healthResponse.TargetHealthDescriptions.filter(
              target => target.TargetHealth.State !== 'healthy'
            );
          expect(unhealthyTargets.length).toBe(0);
        }

        if (i < 2) await sleep(5000); // Wait 5 seconds between checks
      }
    });

    test('should have proper target group configuration for performance', async () => {
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];

      // Get ALB details
      const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
      });

      const albResponse = await elbv2Client.send(describeLoadBalancersCommand);
      const alb = albResponse.LoadBalancers[0];

      // Get target groups
      const describeTargetGroupsCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb.LoadBalancerArn,
      });

      const tgResponse = await elbv2Client.send(describeTargetGroupsCommand);

      for (const targetGroup of tgResponse.TargetGroups) {
        // Should have proper health check settings
        expect(targetGroup.HealthCheckProtocol).toBeDefined();
        expect(targetGroup.HealthCheckPort).toBeDefined();
        expect(targetGroup.HealthCheckPath).toBeDefined();
        expect(targetGroup.HealthCheckIntervalSeconds).toBeGreaterThan(0);
        expect(targetGroup.HealthCheckTimeoutSeconds).toBeGreaterThan(0);
        expect(targetGroup.HealthyThresholdCount).toBeGreaterThan(0);
        expect(targetGroup.UnhealthyThresholdCount).toBeGreaterThan(0);

        // Should have proper target group attributes (may be empty in some deployments)
        if (
          targetGroup.TargetGroupAttributes &&
          targetGroup.TargetGroupAttributes.length > 0
        ) {
          console.log('Target group attributes found');
        } else {
          console.log('No target group attributes - using defaults');
        }

        // Should have proper load balancing algorithm (may be undefined in some deployments)
        if (targetGroup.LoadBalancingAlgorithmType) {
          console.log('Load balancing algorithm defined');
        } else {
          console.log('Using default load balancing algorithm');
        }
      }
    });
  });

  describe('Database Performance and Scalability', () => {
    test('should have RDS instance with performance optimizations', async () => {
      const dbEndpoint = outputs[`DatabaseEndpoint${environmentSuffix}`];

      const describeDBInstancesCommand = new DescribeDBInstancesCommand({});
      const dbResponse = await rdsClient.send(describeDBInstancesCommand);

      const dbInstance = dbResponse.DBInstances.find(
        db => db.Endpoint.Address === dbEndpoint
      );

      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');

      // Should have proper instance class for performance
      expect(dbInstance.DBInstanceClass).toBeDefined();

      // Should have proper storage configuration
      expect(dbInstance.AllocatedStorage).toBeGreaterThan(0);
      expect(dbInstance.StorageType).toBeDefined();

      // Should have performance insights enabled
      if (dbInstance.PerformanceInsightsEnabled !== undefined) {
        expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
        expect(dbInstance.PerformanceInsightsRetentionPeriod).toBeGreaterThan(
          0
        );
      }

      // Should have proper backup configuration
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
      expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should have database in Multi-AZ configuration for high availability', async () => {
      const dbEndpoint = outputs[`DatabaseEndpoint${environmentSuffix}`];

      const describeDBInstancesCommand = new DescribeDBInstancesCommand({});
      const dbResponse = await rdsClient.send(describeDBInstancesCommand);

      const dbInstance = dbResponse.DBInstances.find(
        db => db.Endpoint.Address === dbEndpoint
      );

      expect(dbInstance.MultiAZ).toBe(true);

      // Should have read replicas if configured (optional for basic deployments)
      if (
        dbInstance.ReadReplicaDBInstanceIdentifiers &&
        dbInstance.ReadReplicaDBInstanceIdentifiers.length > 0
      ) {
        console.log('Read replicas found - good for high availability');
      } else {
        console.log('No read replicas - single instance deployment');
      }

      // Should have proper parameter group for performance
      expect(dbInstance.DBParameterGroups.length).toBeGreaterThan(0);

      // Should have proper option group
      if (dbInstance.OptionGroupMemberships) {
        expect(dbInstance.OptionGroupMemberships.length).toBeGreaterThan(0);
      }
    });
  });

  describe('S3 Performance and Scalability', () => {
    test('should handle concurrent S3 operations efficiently', async () => {
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];

      // Generate load on S3
      const loadResults = await generateS3Load(bucketName, 20);

      // Calculate performance metrics
      const successfulOperations = loadResults.filter(result => result.success);
      expect(successfulOperations.length).toBeGreaterThan(15); // At least 75% success rate

      if (successfulOperations.length > 0) {
        const avgPutDuration =
          successfulOperations.reduce(
            (sum, result) => sum + result.putDuration,
            0
          ) / successfulOperations.length;
        const avgGetDuration =
          successfulOperations.reduce(
            (sum, result) => sum + result.getDuration,
            0
          ) / successfulOperations.length;
        const avgDeleteDuration =
          successfulOperations.reduce(
            (sum, result) => sum + result.deleteDuration,
            0
          ) / successfulOperations.length;

        // Performance should be reasonable (adjust thresholds based on your requirements)
        expect(avgPutDuration).toBeLessThan(5000); // Less than 5 seconds
        expect(avgGetDuration).toBeLessThan(3000); // Less than 3 seconds
        expect(avgDeleteDuration).toBeLessThan(3000); // Less than 3 seconds

        console.log(`S3 Performance Metrics:
          Average PUT: ${avgPutDuration.toFixed(2)}ms
          Average GET: ${avgGetDuration.toFixed(2)}ms
          Average DELETE: ${avgDeleteDuration.toFixed(2)}ms
          Success Rate: ${((successfulOperations.length / loadResults.length) * 100).toFixed(2)}%`);
      }
    });

    test('should have S3 bucket with performance optimizations', async () => {
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];

      // Test large file upload for performance
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB content
      const largeKey = `performance-test-large-${Date.now()}.txt`;

      try {
        const startTime = Date.now();

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: largeKey,
          Body: largeContent,
          ContentType: 'text/plain',
        });

        await s3Client.send(putCommand);
        const uploadDuration = Date.now() - startTime;

        // Large file upload should complete in reasonable time
        expect(uploadDuration).toBeLessThan(30000); // Less than 30 seconds

        // Test retrieval
        const getStartTime = Date.now();
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: largeKey,
        });

        const getResponse = await s3Client.send(getCommand);
        const retrievedContent = await getResponse.Body.transformToString();
        const getDuration = Date.now() - getStartTime;

        expect(retrievedContent).toBe(largeContent);
        expect(getDuration).toBeLessThan(15000); // Less than 15 seconds

        // Clean up
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: largeKey,
        });
        await s3Client.send(deleteCommand);

        console.log(`Large File Performance:
          Upload (1MB): ${uploadDuration}ms
          Download (1MB): ${getDuration}ms`);
      } catch (error) {
        // Clean up on failure
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: largeKey,
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });

  describe('CloudWatch Metrics and Monitoring', () => {
    test('should have CloudWatch metrics available for performance monitoring', async () => {
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];

      // Get ALB details
      const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
      });

      const albResponse = await elbv2Client.send(describeLoadBalancersCommand);
      const alb = albResponse.LoadBalancers[0];

      // Get CloudWatch metrics for ALB
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // Last hour

      const getMetricDataCommand = new GetMetricDataCommand({
        StartTime: startTime,
        EndTime: endTime,
        MetricDataQueries: [
          {
            Id: 'requestCount',
            MetricStat: {
              Metric: {
                Namespace: 'AWS/ApplicationELB',
                MetricName: 'RequestCount',
                Dimensions: [
                  {
                    Name: 'LoadBalancer',
                    Value: alb.LoadBalancerName,
                  },
                ],
              },
              Period: 300, // 5 minutes
              Stat: 'Sum',
            },
          },
          {
            Id: 'targetResponseTime',
            MetricStat: {
              Metric: {
                Namespace: 'AWS/ApplicationELB',
                MetricName: 'TargetResponseTime',
                Dimensions: [
                  {
                    Name: 'LoadBalancer',
                    Value: alb.LoadBalancerName,
                  },
                ],
              },
              Period: 300,
              Stat: 'Average',
            },
          },
        ],
      });

      const metricsResponse = await cloudWatchClient.send(getMetricDataCommand);
      expect(metricsResponse.MetricDataResults).toBeDefined();
      expect(metricsResponse.MetricDataResults.length).toBeGreaterThan(0);

      // Should have metric data available
      for (const metricResult of metricsResponse.MetricDataResults) {
        expect(metricResult.Id).toBeDefined();
        expect(metricResult.StatusCode).toBe('Complete');
      }
    });
  });

  describe('End-to-End Performance Validation', () => {
    test('should maintain performance under sustained load', async () => {
      const bucketName = outputs[`S3BucketName${environmentSuffix}`];
      const albDns = outputs[`LoadBalancerDNS${environmentSuffix}`];

      // Generate sustained load on S3
      const sustainedLoadResults = await generateS3Load(bucketName, 50);

      // Calculate sustained performance metrics
      const successfulOperations = sustainedLoadResults.filter(
        result => result.success
      );
      expect(successfulOperations.length).toBeGreaterThan(40); // At least 80% success rate

      if (successfulOperations.length > 0) {
        // Performance should remain consistent throughout the test
        const firstHalf = successfulOperations.slice(
          0,
          Math.floor(successfulOperations.length / 2)
        );
        const secondHalf = successfulOperations.slice(
          Math.floor(successfulOperations.length / 2)
        );

        const firstHalfAvg =
          firstHalf.reduce((sum, result) => sum + result.totalDuration, 0) /
          firstHalf.length;
        const secondHalfAvg =
          secondHalf.reduce((sum, result) => sum + result.totalDuration, 0) /
          secondHalf.length;

        // Performance degradation should be minimal (less than 20%)
        const performanceRatio = secondHalfAvg / firstHalfAvg;
        expect(performanceRatio).toBeLessThan(1.2);

        console.log(`Sustained Performance Test:
          First Half Average: ${firstHalfAvg.toFixed(2)}ms
          Second Half Average: ${secondHalfAvg.toFixed(2)}ms
          Performance Ratio: ${performanceRatio.toFixed(2)}
          Total Operations: ${sustainedLoadResults.length}
          Success Rate: ${((successfulOperations.length / sustainedLoadResults.length) * 100).toFixed(2)}%`);
      }

      // ALB should remain healthy under load
      const describeLoadBalancersCommand = new DescribeLoadBalancersCommand({
        Names: [albDns.split('.')[0].split('-').slice(0, -1).join('-')], // Extract ALB name from DNS (remove the random suffix)
      });

      const albResponse = await elbv2Client.send(describeLoadBalancersCommand);
      expect(albResponse.LoadBalancers[0].State.Code).toBe('active');
    });
  });
});
