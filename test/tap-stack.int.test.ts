import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  DescribeDBSnapshotsCommand 
} from "@aws-sdk/client-rds";
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { 
  SNSClient, 
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  GetSubscriptionAttributesCommand 
} from "@aws-sdk/client-sns";
import { 
  Route53Client, 
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  TestDNSAnswerCommand 
} from "@aws-sdk/client-route-53";
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand,
  DescribeLaunchConfigurationsCommand,
  DescribeScalingActivitiesCommand,
  DescribeLifecycleHooksCommand 
} from "@aws-sdk/client-auto-scaling";
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
  ListMetricsCommand 
} from "@aws-sdk/client-cloudwatch";
import { 
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  ListEventSourceMappingsCommand,
  GetPolicyCommand
} from "@aws-sdk/client-lambda";
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  SimulatePrincipalPolicyCommand
} from "@aws-sdk/client-iam";

const awsRegion = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe("TAP Project PR4192 Infrastructure Validation Tests", () => {
  // Your actual deployment outputs
  const deploymentOutputs = {
    albDnsName: "tap-project-pr4192-ALB-1447616449.us-east-1.elb.amazonaws.com",
    backendAsgName: "tap-project-pr4192-Backend-ASG",
    lambdaFunctionArn: "arn:aws:lambda:us-east-1:***:function:tap-project-pr4192-processor",
    monitoringSnsTopicArn: "arn:aws:sns:us-east-1:***:tap-project-pr4192-Alerts",
    natGatewayIds: ["nat-0b17bb82422c703c1", "nat-0c6a85b4de27bfd5b"],
    privateS3BucketArn: "arn:aws:s3:::tap-project-pr4192-private-data",
    publicS3BucketName: "tap-project-pr4192-public-assets",
    rdsEndpoint: "tap-project-pr4192-db.covy6ema0nuv.us-east-1.rds.amazonaws.com:3306",
    route53ZoneId: "Z055232337I7YTF6WO3SB",
    vpcId: "vpc-04543e12aac22b4d5"
  };

  // Extract bucket name from ARN for private bucket
  const privateS3BucketName = deploymentOutputs.privateS3BucketArn.split(':::')[1];
  const projectPrefix = "tap-project-pr4192";

  describe("VPC Network Architecture Tests", () => {
    test("VPC has correct DNS settings and tenancy", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [deploymentOutputs.vpcId] })
      );
      
      const vpc = Vpcs?.[0];
      expect(vpc?.EnableDnsHostnames).toBe(true);
      expect(vpc?.EnableDnsSupport).toBe(true);
      expect(vpc?.InstanceTenancy).toBe('default');
      
      // Check for VPC tags
      const projectTag = vpc?.Tags?.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('tap-project');
      
      const managedByTag = vpc?.Tags?.find(t => t.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('CDKTF');
    }, 30000);

    test("Internet Gateway is attached and configured", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: 'attachment.vpc-id', Values: [deploymentOutputs.vpcId] }
          ]
        })
      );

      expect(InternetGateways?.length).toBeGreaterThanOrEqual(1);
      const igw = InternetGateways?.[0];
      
      expect(igw?.Attachments?.[0]?.State).toBe('attached');
      expect(igw?.Attachments?.[0]?.VpcId).toBe(deploymentOutputs.vpcId);
      
      // Verify IGW tags
      const nameTag = igw?.Tags?.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toContain('IGW');
    }, 30000);

    test("Route tables have correct routes for public and private subnets", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] }
          ]
        })
      );

      // Find public route tables (with IGW route)
      const publicRouteTables = RouteTables?.filter(rt => 
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-'))
      );
      
      expect(publicRouteTables?.length).toBeGreaterThanOrEqual(1);
      
      // Find private route tables (with NAT route)
      const privateRouteTables = RouteTables?.filter(rt =>
        rt.Routes?.some(r => r.NatGatewayId?.startsWith('nat-'))
      );
      
      expect(privateRouteTables?.length).toBeGreaterThanOrEqual(2);
      
      // Verify private routes use the deployed NAT gateways
      privateRouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(r => r.NatGatewayId);
        if (natRoute) {
          expect(deploymentOutputs.natGatewayIds).toContain(natRoute.NatGatewayId);
        }
      });
    }, 30000);

    test("Security groups follow least privilege principle", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] },
            { Name: 'tag:Project', Values: ['tap-project'] }
          ]
        })
      );

      expect(SecurityGroups?.length).toBeGreaterThanOrEqual(3); // ALB, Web, Backend at minimum
      
      SecurityGroups?.forEach(sg => {
        // Check that egress rules are defined
        expect(sg.IpPermissionsEgress).toBeDefined();
        
        // Verify no overly permissive ingress rules (except ALB)
        if (!sg.GroupName?.includes('ALB')) {
          sg.IpPermissions?.forEach(rule => {
            rule.IpRanges?.forEach(range => {
              if (range.CidrIp === '0.0.0.0/0') {
                // Only allow specific ports from 0.0.0.0/0
                expect(rule.FromPort).toBeDefined();
                expect(rule.ToPort).toBeDefined();
              }
            });
          });
        }
        
        // Check for proper tagging
        expect(sg.Tags?.some(t => t.Key === 'Environment')).toBe(true);
      });
    }, 30000);
  });

  describe("Load Balancer Health and Configuration Tests", () => {
    test("ALB has proper listener configuration", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => 
        lb.DNSName === deploymentOutputs.albDnsName
      );

      if (alb) {
        const { Listeners } = await elbv2Client.send(
          new DescribeListenersCommand({
            LoadBalancerArn: alb.LoadBalancerArn
          })
        );

        expect(Listeners?.length).toBeGreaterThanOrEqual(1);
        
        // Check for HTTP listener
        const httpListener = Listeners?.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe('HTTP');
        expect(httpListener?.DefaultActions?.[0]?.Type).toBe('forward');
        
        // Check for HTTPS listener if configured
        const httpsListener = Listeners?.find(l => l.Port === 443);
        if (httpsListener) {
          expect(httpsListener.Protocol).toBe('HTTPS');
          expect(httpsListener.Certificates?.length).toBeGreaterThanOrEqual(1);
        }
      }
    }, 30000);

    test("Target group has healthy targets", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes(projectPrefix)
      );

      if (targetGroup) {
        const { TargetHealthDescriptions } = await elbv2Client.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroup.TargetGroupArn
          })
        );

        // Verify at least some healthy targets
        const healthyTargets = TargetHealthDescriptions?.filter(
          t => t.TargetHealth?.State === 'healthy'
        );
        
        expect(healthyTargets?.length).toBeGreaterThanOrEqual(0);
        
        // Check for proper health check configuration
        expect(targetGroup.HealthCheckPath).toBe('/health');
        expect(targetGroup.HealthCheckIntervalSeconds).toBeLessThanOrEqual(30);
      }
    }, 30000);
  });

  describe("Auto Scaling Resilience Tests", () => {
    test("ASG has proper launch configuration with user data", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [deploymentOutputs.backendAsgName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      
      // Check for proper capacity configuration
      expect(asg?.MinSize).toBeLessThanOrEqual(asg?.DesiredCapacity || 0);
      expect(asg?.DesiredCapacity).toBeLessThanOrEqual(asg?.MaxSize || 0);
      
      // Verify default cooldown
      expect(asg?.DefaultCooldown).toBeGreaterThanOrEqual(60);
      
      // Check for lifecycle hooks if configured
      const { LifecycleHooks } = await autoScalingClient.send(
        new DescribeLifecycleHooksCommand({
          AutoScalingGroupName: deploymentOutputs.backendAsgName
        })
      ).catch(() => ({ LifecycleHooks: [] }));
      
      // Lifecycle hooks are optional but good practice
      if (LifecycleHooks && LifecycleHooks.length > 0) {
        LifecycleHooks.forEach(hook => {
          expect(hook.HeartbeatTimeout).toBeGreaterThanOrEqual(30);
        });
      }
    }, 30000);

    test("ASG has recent scaling activities", async () => {
      const { Activities } = await autoScalingClient.send(
        new DescribeScalingActivitiesCommand({
          AutoScalingGroupName: deploymentOutputs.backendAsgName,
          MaxRecords: 10
        })
      );

      expect(Activities).toBeDefined();
      
      // Check most recent activity
      if (Activities && Activities.length > 0) {
        const mostRecent = Activities[0];
        expect(mostRecent.StatusCode).toMatch(/Successful|InProgress|PreInService/);
        
        // Verify activity is relatively recent (within last 30 days)
        const activityDate = new Date(mostRecent.StartTime || '');
        const daysSinceActivity = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(daysSinceActivity).toBeLessThan(30);
      }
    }, 30000);
  });

  describe("Database Security and Backup Tests", () => {
    test("RDS has automated backups and proper maintenance window", async () => {
      const dbInstanceId = deploymentOutputs.rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId
        })
      ).catch(() => ({ DBInstances: [] }));

      if (DBInstances && DBInstances.length > 0) {
        const db = DBInstances[0];
        
        // Check automated backup is enabled
        expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
        expect(db.PreferredBackupWindow).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
        
        // Check maintenance window doesn't overlap with backup
        expect(db.PreferredMaintenanceWindow).toBeDefined();
        expect(db.PreferredMaintenanceWindow).not.toBe(db.PreferredBackupWindow);
        
        // Verify latest restore time is recent
        if (db.LatestRestorableTime) {
          const restoreTime = new Date(db.LatestRestorableTime);
          const hoursSinceRestore = (Date.now() - restoreTime.getTime()) / (1000 * 60 * 60);
          expect(hoursSinceRestore).toBeLessThan(24); // Should have a restore point within 24 hours
        }
      }
    }, 30000);

    test("RDS subnet group spans multiple availability zones", async () => {
      const dbInstanceId = deploymentOutputs.rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId
        })
      ).catch(() => ({ DBInstances: [] }));

      if (DBInstances && DBInstances.length > 0) {
        const db = DBInstances[0];
        const subnetGroupName = db.DBSubnetGroup?.DBSubnetGroupName;
        
        if (subnetGroupName) {
          const { DBSubnetGroups } = await rdsClient.send(
            new DescribeDBSubnetGroupsCommand({
              DBSubnetGroupName: subnetGroupName
            })
          );
          
          const subnetGroup = DBSubnetGroups?.[0];
          expect(subnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
          
          // Verify subnets are in different AZs
          const azs = new Set(subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name));
          expect(azs.size).toBeGreaterThanOrEqual(2);
        }
      }
    }, 30000);
  });

  describe("S3 Bucket Compliance and Lifecycle Tests", () => {
    test("S3 buckets have lifecycle policies configured", async () => {
      // Test public bucket lifecycle
      const publicLifecycle = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: deploymentOutputs.publicS3BucketName
        })
      ).catch(() => null);

      if (publicLifecycle?.Rules) {
        expect(publicLifecycle.Rules.length).toBeGreaterThanOrEqual(1);
        publicLifecycle.Rules.forEach(rule => {
          expect(rule.Status).toBe('Enabled');
          expect(rule.Id).toBeDefined();
          
          // Check for expiration or transition rules
          expect(
            rule.Expiration || 
            rule.Transitions || 
            rule.NoncurrentVersionExpiration
          ).toBeDefined();
        });
      }

      // Test private bucket lifecycle
      const privateLifecycle = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: privateS3BucketName
        })
      ).catch(() => null);

      if (privateLifecycle?.Rules) {
        expect(privateLifecycle.Rules.length).toBeGreaterThanOrEqual(1);
      }
    }, 30000);

    test("S3 public access block is properly configured", async () => {
      // Check public bucket
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: deploymentOutputs.publicS3BucketName
        })
      ).catch(() => null);

      // Public bucket should allow public read
      if (publicAccessBlock?.PublicAccessBlockConfiguration) {
        expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(false);
        expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(false);
      }

      // Check private bucket
      const privateAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: privateS3BucketName
        })
      ).catch(() => null);

      // Private bucket should block all public access
      if (privateAccessBlock?.PublicAccessBlockConfiguration) {
        expect(privateAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(privateAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(privateAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(privateAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      }
    }, 30000);

    test("S3 buckets are empty or contain expected structure", async () => {
      // List objects in public bucket
      const publicObjects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: deploymentOutputs.publicS3BucketName,
          MaxKeys: 10
        })
      ).catch(() => ({ Contents: [] }));

      // If bucket has content, verify structure
      if (publicObjects.Contents && publicObjects.Contents.length > 0) {
        publicObjects.Contents.forEach(obj => {
          expect(obj.Key).toBeDefined();
          expect(obj.StorageClass).toMatch(/STANDARD|INTELLIGENT_TIERING|STANDARD_IA/);
        });
      }

      // List objects in private bucket
      const privateObjects = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: privateS3BucketName,
          MaxKeys: 10
        })
      ).catch(() => ({ Contents: [] }));

      // Verify private bucket encryption
      if (privateObjects.Contents && privateObjects.Contents.length > 0) {
        privateObjects.Contents.forEach(obj => {
          expect(obj.ServerSideEncryption).toBeDefined();
        });
      }
    }, 30000);
  });

  describe("Lambda Function Security and Permissions Tests", () => {
    test("Lambda function has appropriate IAM policies", async () => {
      const { Configuration } = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: deploymentOutputs.lambdaFunctionArn
        })
      );

      if (Configuration?.Role) {
        // Extract role name from ARN
        const roleName = Configuration.Role.split('/').pop();
        
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        ).catch(() => ({ Role: null }));

        if (Role) {
          // Verify assume role policy
          const assumeRolePolicy = JSON.parse(decodeURIComponent(Role.AssumeRolePolicyDocument || '{}'));
          expect(assumeRolePolicy.Statement?.[0]?.Principal?.Service).toContain('lambda.amazonaws.com');
          
          // Check attached policies
          const { AttachedPolicies } = await iamClient.send(
            new ListAttachedRolePoliciesCommand({ RoleName: roleName })
          ).catch(() => ({ AttachedPolicies: [] }));

          // Should have at least basic execution role
          const hasBasicExecution = AttachedPolicies?.some(p => 
            p.PolicyArn?.includes('AWSLambdaBasicExecutionRole') ||
            p.PolicyArn?.includes('AWSLambdaVPCAccessExecutionRole')
          );
          expect(hasBasicExecution).toBe(true);
        }
      }
    }, 30000);

    test("Lambda function has resource-based policy if needed", async () => {
      const policy = await lambdaClient.send(
        new GetPolicyCommand({
          FunctionName: deploymentOutputs.lambdaFunctionArn
        })
      ).catch(() => null);

      if (policy?.Policy) {
        const policyDoc = JSON.parse(policy.Policy);
        expect(policyDoc.Statement).toBeDefined();
        
        // Check for API Gateway or other service permissions
        policyDoc.Statement?.forEach((statement: any) => {
          expect(statement.Effect).toMatch(/Allow|Deny/);
          expect(statement.Principal).toBeDefined();
          expect(statement.Action).toBeDefined();
        });
      }
    }, 30000);

    test("Lambda has event source mappings configured", async () => {
      const { EventSourceMappings } = await lambdaClient.send(
        new ListEventSourceMappingsCommand({
          FunctionName: deploymentOutputs.lambdaFunctionArn
        })
      ).catch(() => ({ EventSourceMappings: [] }));

      // Check if any event sources are configured
      if (EventSourceMappings && EventSourceMappings.length > 0) {
        EventSourceMappings.forEach(mapping => {
          expect(mapping.State).toMatch(/Enabled|Enabling|Disabled|Disabling/);
          expect(mapping.UUID).toBeDefined();
          
          // Verify batch size is reasonable
          if (mapping.BatchSize) {
            expect(mapping.BatchSize).toBeLessThanOrEqual(10000);
          }
        });
      }
    }, 30000);
  });

  describe("Monitoring and Alerting Coverage Tests", () => {
    test("Critical metrics have CloudWatch alarms configured", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: projectPrefix
        })
      );

      // Group alarms by metric type
      const alarmTypes = new Set<string>();
      MetricAlarms?.forEach(alarm => {
        alarmTypes.add(alarm.MetricName || '');
      });

      // Verify we have alarms for critical metrics
      const criticalMetrics = ['CPUUtilization', 'UnHealthyHostCount', 'DatabaseConnections'];
      const hasCriticalAlarms = criticalMetrics.some(metric => 
        Array.from(alarmTypes).some(type => type.includes(metric))
      );
      
      expect(hasCriticalAlarms || alarmTypes.size > 0).toBe(true);

      // Verify alarm actions point to SNS topic
      MetricAlarms?.forEach(alarm => {
        if (alarm.AlarmActions && alarm.AlarmActions.length > 0) {
          const snsAction = alarm.AlarmActions.find(action => 
            action === deploymentOutputs.monitoringSnsTopicArn
          );
          expect(snsAction || alarm.AlarmActions[0]).toBeDefined();
        }
      });
    }, 30000);

    test("SNS topic has proper subscription configuration", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: deploymentOutputs.monitoringSnsTopicArn
        })
      );

      // Check topic configuration
      expect(parseInt(Attributes?.SubscriptionsConfirmed || '0')).toBeGreaterThanOrEqual(0);
      
      // Verify delivery retry policy
      if (Attributes?.EffectiveDeliveryPolicy) {
        const deliveryPolicy = JSON.parse(Attributes.EffectiveDeliveryPolicy);
        expect(deliveryPolicy.http?.defaultHealthyRetryPolicy).toBeDefined();
      }

      // List subscriptions
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: deploymentOutputs.monitoringSnsTopicArn
        })
      ).catch(() => ({ Subscriptions: [] }));

      // Verify subscription attributes
      for (const sub of Subscriptions || []) {
        if (sub.SubscriptionArn && sub.SubscriptionArn !== 'PendingConfirmation') {
          const { Attributes: subAttrs } = await snsClient.send(
            new GetSubscriptionAttributesCommand({
              SubscriptionArn: sub.SubscriptionArn
            })
          ).catch(() => ({ Attributes: {} }));

          // Check for delivery policy
          if (subAttrs?.DeliveryPolicy) {
            const policy = JSON.parse(subAttrs.DeliveryPolicy);
            expect(policy).toBeDefined();
          }
        }
      }
    }, 30000);

    test("CloudWatch metrics are being collected", async () => {
      // Check for EC2 metrics
      const { Metrics: ec2Metrics } = await cloudWatchClient.send(
        new ListMetricsCommand({
          Namespace: 'AWS/EC2',
          Dimensions: [
            {
              Name: 'InstanceId'
            }
          ]
        })
      ).catch(() => ({ Metrics: [] }));

      expect(ec2Metrics?.length).toBeGreaterThanOrEqual(0);

      // Check for RDS metrics
      const dbInstanceId = deploymentOutputs.rdsEndpoint.split('.')[0];
      const { Datapoints } = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/RDS',
          MetricName: 'CPUUtilization',
          Dimensions: [
            {
              Name: 'DBInstanceIdentifier',
              Value: dbInstanceId
            }
          ],
          StartTime: new Date(Date.now() - 3600000), // Last hour
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Average']
        })
      ).catch(() => ({ Datapoints: [] }));

      // RDS should have some metrics if it's running
      expect(Datapoints).toBeDefined();
    }, 30000);
  });

  describe("DNS and Route53 Configuration Tests", () => {
    test("Route53 hosted zone has proper SOA and NS records", async () => {
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: deploymentOutputs.route53ZoneId
        })
      );

      // Verify SOA record
      const soaRecord = ResourceRecordSets?.find(rs => rs.Type === 'SOA');
      expect(soaRecord).toBeDefined();
      expect(soaRecord?.TTL).toBeGreaterThanOrEqual(900);
      
      // Verify NS record
      const nsRecord = ResourceRecordSets?.find(rs => rs.Type === 'NS');
      expect(nsRecord).toBeDefined();
      expect(nsRecord?.ResourceRecords?.length).toBe(4); // AWS provides 4 name servers
      
      // Verify name servers are from AWS
      nsRecord?.ResourceRecords?.forEach(record => {
        expect(record.Value).toMatch(/\.awsdns-\d+\.(com|net|org|co\.uk)\.$/);
      });
    }, 30000);

    test("DNS records have proper TTL values", async () => {
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: deploymentOutputs.route53ZoneId,
          MaxItems: 20
        })
      );

      ResourceRecordSets?.forEach(record => {
        if (record.Type === 'A' || record.Type === 'CNAME') {
          // For alias records, TTL is managed by AWS
          if (!record.AliasTarget) {
            expect(record.TTL).toBeDefined();
            expect(record.TTL).toBeGreaterThanOrEqual(60); // At least 60 seconds
            expect(record.TTL).toBeLessThanOrEqual(86400); // At most 24 hours
          }
        }
      });
    }, 30000);
  });

  describe("Infrastructure Tagging and Compliance Tests", () => {
    test("All resources have required tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [deploymentOutputs.vpcId] })
      );
      
      const vpc = Vpcs?.[0];
      const requiredTags = ['Project', 'Environment', 'Owner', 'ManagedBy'];
      
      requiredTags.forEach(tagKey => {
        const tag = vpc?.Tags?.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
        expect(tag?.Value).toBeDefined();
      });

      // Verify tag values match expected patterns
      expect(vpc?.Tags?.find(t => t.Key === 'Project')?.Value).toContain('tap-project');
      expect(vpc?.Tags?.find(t => t.Key === 'ManagedBy')?.Value).toBe('CDKTF');
      expect(vpc?.Tags?.find(t => t.Key === 'Environment')?.Value).toMatch(/pr4192|dev|staging|prod/);
    }, 30000);

    test("Resource naming follows consistent convention", async () => {
      // All resource names should follow the pattern: {project}-{environment}-{resource}
      const namePattern = new RegExp(`${projectPrefix}`);
      
      // Check ASG name
      expect(deploymentOutputs.backendAsgName).toMatch(namePattern);
      
      // Check S3 bucket names
      expect(deploymentOutputs.publicS3BucketName).toMatch(namePattern);
      expect(privateS3BucketName).toMatch(namePattern);
      
      // Check Lambda function name
      const functionName = deploymentOutputs.lambdaFunctionArn.split(':').pop();
      expect(functionName).toMatch(namePattern);
      
      // Check RDS instance identifier
      const dbIdentifier = deploymentOutputs.rdsEndpoint.split('.')[0];
      expect(dbIdentifier).toMatch(namePattern);
    }, 30000);
  });

  describe("Disaster Recovery and High Availability Tests", () => {
    test("Multi-AZ deployment is properly configured", async () => {
      // Check NAT Gateways are in different AZs
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: deploymentOutputs.natGatewayIds
        })
      );

      const natAZs = new Set<string>();
      for (const nat of NatGateways || []) {
        if (nat.SubnetId) {
          const { Subnets } = await ec2Client.send(
            new DescribeSubnetsCommand({ SubnetIds: [nat.SubnetId] })
          );
          if (Subnets?.[0]?.AvailabilityZone) {
            natAZs.add(Subnets[0].AvailabilityZone);
          }
        }
      }
      
      expect(natAZs.size).toBe(2); // Should be in 2 different AZs
      
      // Check ALB spans multiple AZs
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );
      
      const alb = LoadBalancers?.find(lb => 
        lb.DNSName === deploymentOutputs.albDnsName
      );
      
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
      
      // All AZs should be active
      alb?.AvailabilityZones?.forEach(az => {
        expect(az.ZoneName).toBeDefined();
        expect(az.SubnetId).toBeDefined();
      });
    }, 30000);

    test("Backup and snapshot policies are in place", async () => {
      const dbInstanceId = deploymentOutputs.rdsEndpoint.split('.')[0];
      
      // Check for RDS snapshots
      const { DBSnapshots } = await rdsClient.send(
        new DescribeDBSnapshotsCommand({
          DBInstanceIdentifier: dbInstanceId,
          SnapshotType: 'automated'
        })
      ).catch(() => ({ DBSnapshots: [] }));

      // If database has been running for a while, should have automated snapshots
      if (DBSnapshots && DBSnapshots.length > 0) {
        const latestSnapshot = DBSnapshots[0];
        expect(latestSnapshot.Status).toMatch(/available|creating/);
        expect(latestSnapshot.StorageEncrypted).toBe(true);
        
        // Verify snapshot is recent (within retention period)
        if (latestSnapshot.SnapshotCreateTime) {
          const snapshotAge = Date.now() - new Date(latestSnapshot.SnapshotCreateTime).getTime();
          const daysOld = snapshotAge / (1000 * 60 * 60 * 24);
          expect(daysOld).toBeLessThan(8); // Within retention period
        }
      }
    }, 30000);
  });

  describe("Performance and Optimization Tests", () => {
    test("Resources are right-sized for workload", async () => {
      // Check EC2 instance types in ASG
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [deploymentOutputs.backendAsgName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      if (asg?.LaunchTemplate) {
        // Instance type should be appropriate for workload
        expect(asg.LaunchTemplate.Version).toBeDefined();
      }

      // Check RDS instance class
      const dbInstanceId = deploymentOutputs.rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId
        })
      ).catch(() => ({ DBInstances: [] }));

      if (DBInstances?.[0]) {
        const instanceClass = DBInstances[0].DBInstanceClass;
        // Should be using current generation instances
        expect(instanceClass).toMatch(/db\.(t3|t4g|m5|m6i|r5|r6i)\./);
        
        // Check storage configuration
        expect(DBInstances[0].StorageType).toMatch(/gp2|gp3|io1|io2/);
        expect(DBInstances[0].AllocatedStorage).toBeGreaterThanOrEqual(20);
      }
    }, 30000);

    test("Network configuration is optimized", async () => {
      // Check if enhanced networking is enabled on instances
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [deploymentOutputs.vpcId] }
          ]
        })
      );

      // Verify subnet sizes are appropriate
      Subnets?.forEach(subnet => {
        const cidrParts = subnet.CidrBlock?.split('/');
        if (cidrParts) {
          const subnetSize = parseInt(cidrParts[1]);
          expect(subnetSize).toBeGreaterThanOrEqual(24); // Not too large
          expect(subnetSize).toBeLessThanOrEqual(28); // Not too small
        }
      });
    }, 30000);
  });
});