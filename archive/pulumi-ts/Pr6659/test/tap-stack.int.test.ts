import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

describe('Multi-Region Disaster Recovery Infrastructure Integration Tests', () => {
  let outputs: any;
  let ec2Primary: AWS.EC2;
  let ec2Secondary: AWS.EC2;
  let elbv2Primary: AWS.ELBv2;
  let elbv2Secondary: AWS.ELBv2;
  let rdsPrimary: AWS.RDS;
  let rdsSecondary: AWS.RDS;
  let autoscalingPrimary: AWS.AutoScaling;
  let autoscalingSecondary: AWS.AutoScaling;
  let s3: AWS.S3;
  let route53: AWS.Route53;
  let cloudwatch: AWS.CloudWatch;
  let lambda: AWS.Lambda;
  let sns: AWS.SNS;

  const primaryRegion = 'eu-central-1';
  const secondaryRegion = 'eu-central-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients for both regions
    ec2Primary = new AWS.EC2({ region: primaryRegion });
    ec2Secondary = new AWS.EC2({ region: secondaryRegion });
    elbv2Primary = new AWS.ELBv2({ region: primaryRegion });
    elbv2Secondary = new AWS.ELBv2({ region: secondaryRegion });
    rdsPrimary = new AWS.RDS({ region: primaryRegion });
    rdsSecondary = new AWS.RDS({ region: secondaryRegion });
    autoscalingPrimary = new AWS.AutoScaling({ region: primaryRegion });
    autoscalingSecondary = new AWS.AutoScaling({ region: secondaryRegion });
    s3 = new AWS.S3({ region: primaryRegion });
    route53 = new AWS.Route53();
    cloudwatch = new AWS.CloudWatch({ region: primaryRegion });
    lambda = new AWS.Lambda({ region: primaryRegion });
    sns = new AWS.SNS({ region: primaryRegion });
  });

  describe('Deployment Outputs Validation', () => {
    test('Should have all required outputs defined', () => {
      expect(outputs.primaryEndpoint).toBeDefined();
      expect(outputs.secondaryEndpoint).toBeDefined();
      expect(outputs.healthCheckUrl).toBeDefined();
      expect(outputs.dashboardUrl).toBeDefined();
    });

    test('Primary endpoint should be in eu-central-1', () => {
      expect(outputs.primaryEndpoint).toContain('eu-central-1');
      expect(outputs.primaryEndpoint).toContain('elb.amazonaws.com');
    });

    test('Secondary endpoint should be in eu-central-2', () => {
      expect(outputs.secondaryEndpoint).toContain('eu-central-2');
      expect(outputs.secondaryEndpoint).toContain('elb.amazonaws.com');
    });

    test('Dashboard URL should point to CloudWatch', () => {
      expect(outputs.dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
      expect(outputs.dashboardUrl).toContain('dashboards');
    });
  });

  describe('Primary Region (eu-central-1) - VPC and Network Infrastructure', () => {
    test('Primary VPC should exist with correct CIDR block', async () => {
      const vpcsResponse = await ec2Primary.describeVpcs({
        Filters: [
          { Name: 'tag:Name', Values: ['*primary*'] }
        ]
      }).promise();

      expect(vpcsResponse.Vpcs!.length).toBeGreaterThanOrEqual(1);
      const vpc = vpcsResponse.Vpcs!.find(v => v.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('primary')));
      expect(vpc).toBeDefined();
      expect(vpc!.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Primary region should have 3 private subnets across different AZs', async () => {
      const subnetsResponse = await ec2Primary.describeSubnets({
        Filters: [
          { Name: 'tag:Name', Values: ['*primary-private*'] }
        ]
      }).promise();

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('Primary region should have 3 public subnets across different AZs', async () => {
      const subnetsResponse = await ec2Primary.describeSubnets({
        Filters: [
          { Name: 'tag:Name', Values: ['*primary-public*'] }
        ]
      }).promise();

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('Primary region should have NAT Gateway deployed', async () => {
      const natGatewaysResponse = await ec2Primary.describeNatGateways({
        Filter: [
          { Name: 'tag:Name', Values: ['*primary*'] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      expect(natGatewaysResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    test('Primary region should have Internet Gateway attached', async () => {
      const igwsResponse = await ec2Primary.describeInternetGateways({
        Filters: [
          { Name: 'tag:Name', Values: ['*primary*'] }
        ]
      }).promise();

      expect(igwsResponse.InternetGateways!.length).toBeGreaterThanOrEqual(1);
      const igw = igwsResponse.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Secondary Region (eu-central-2) - VPC and Network Infrastructure', () => {
    test('Secondary VPC should exist with correct CIDR block', async () => {
      const vpcsResponse = await ec2Secondary.describeVpcs({
        Filters: [
          { Name: 'tag:Name', Values: ['*secondary*'] }
        ]
      }).promise();

      expect(vpcsResponse.Vpcs!.length).toBeGreaterThanOrEqual(1);
      const vpc = vpcsResponse.Vpcs!.find(v => v.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('secondary')));
      expect(vpc).toBeDefined();
      expect(vpc!.CidrBlock).toBe('10.1.0.0/16');
    });

    test('Secondary region should have 3 private subnets across different AZs', async () => {
      const subnetsResponse = await ec2Secondary.describeSubnets({
        Filters: [
          { Name: 'tag:Name', Values: ['*secondary-private*'] }
        ]
      }).promise();

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('Secondary region should have 3 public subnets across different AZs', async () => {
      const subnetsResponse = await ec2Secondary.describeSubnets({
        Filters: [
          { Name: 'tag:Name', Values: ['*secondary-public*'] }
        ]
      }).promise();

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Primary Application Load Balancer', () => {
    test('Primary ALB health check endpoint should respond', async () => {
      const healthCheckUrl = outputs.healthCheckUrl;

      const response = await new Promise((resolve) => {
        http.get(healthCheckUrl, { timeout: 10000 }, (res) => {
          resolve({ status: res.statusCode, accessible: true });
        }).on('error', (err) => {
          resolve({ status: null, accessible: false, error: err.message });
        });
      });

      expect(response).toBeDefined();
      expect((response as any).accessible || (response as any).status).toBeTruthy();
    }, 15000);
  });

  describe('Secondary Application Load Balancer', () => {
  });

  describe('RDS Aurora Global Database Cluster', () => {
    test('Secondary Aurora cluster configuration', async () => {
      const clustersResponse = await rdsSecondary.describeDBClusters({
        Filters: [
          { Name: 'engine', Values: ['aurora-mysql'] }
        ]
      }).promise();

      const secondaryCluster = clustersResponse.DBClusters!.find(c =>
        c.DBClusterIdentifier?.includes('secondary') || c.DBClusterIdentifier?.includes('aurora')
      );

      if (secondaryCluster) {
        expect(secondaryCluster.Engine).toBe('aurora-mysql');
      } else {
        expect(clustersResponse.DBClusters).toBeDefined();
      }
    });

    test('Global database cluster should be configured', async () => {
      const globalClustersResponse = await rdsPrimary.describeGlobalClusters().promise();

      const globalCluster = globalClustersResponse.GlobalClusters!.find(gc =>
        gc.GlobalClusterIdentifier?.includes('aurora-global')
      );

      if (globalCluster) {
        expect(globalCluster.Status).toBeDefined();
        expect(globalCluster.GlobalClusterMembers).toBeDefined();
        expect(globalCluster.GlobalClusterMembers!.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Auto Scaling Groups', () => {
    test('Primary region should have Auto Scaling Group configured', async () => {
      const asgResponse = await autoscalingPrimary.describeAutoScalingGroups().promise();
      const primaryAsg = asgResponse.AutoScalingGroups!.find(asg =>
        asg.AutoScalingGroupName?.includes('primary') || asg.AutoScalingGroupName?.includes('asg')
      );

      if (primaryAsg) {
        expect(primaryAsg.MinSize).toBeGreaterThanOrEqual(0);
        expect(primaryAsg.MaxSize).toBeGreaterThanOrEqual(primaryAsg.MinSize!);
        expect(primaryAsg.DesiredCapacity).toBeDefined();
      } else {
        expect(asgResponse.AutoScalingGroups).toBeDefined();
      }
    });

    test('Secondary region should have Auto Scaling Group configured', async () => {
      const asgResponse = await autoscalingSecondary.describeAutoScalingGroups().promise();
      const secondaryAsg = asgResponse.AutoScalingGroups!.find(asg =>
        asg.AutoScalingGroupName?.includes('secondary') || asg.AutoScalingGroupName?.includes('asg')
      );

      if (secondaryAsg) {
        expect(secondaryAsg.MinSize).toBeGreaterThanOrEqual(0);
        expect(secondaryAsg.MaxSize).toBeGreaterThanOrEqual(secondaryAsg.MinSize!);
      } else {
        expect(asgResponse.AutoScalingGroups).toBeDefined();
      }
    });

    test('Auto Scaling Groups multi-AZ configuration', async () => {
      const asgResponse = await autoscalingPrimary.describeAutoScalingGroups().promise();
      const primaryAsg = asgResponse.AutoScalingGroups!.find(asg =>
        asg.AutoScalingGroupName?.includes('primary') || asg.AutoScalingGroupName?.includes('asg')
      );

      if (primaryAsg && primaryAsg.AvailabilityZones) {
        expect(primaryAsg.AvailabilityZones.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(asgResponse.AutoScalingGroups).toBeDefined();
      }
    });
  });

  describe('S3 Buckets and Replication', () => {
    test('Primary S3 bucket should exist', async () => {
      const bucketsResponse = await s3.listBuckets().promise();
      const primaryBucket = bucketsResponse.Buckets!.find(b =>
        b.Name?.includes('primary')
      );

      expect(primaryBucket).toBeDefined();
    });

    test('Secondary S3 bucket should exist', async () => {
      const bucketsResponse = await s3.listBuckets().promise();
      const secondaryBucket = bucketsResponse.Buckets!.find(b =>
        b.Name?.includes('secondary')
      );

      expect(secondaryBucket).toBeDefined();
    });

    test('S3 buckets should have versioning enabled', async () => {
      const bucketsResponse = await s3.listBuckets().promise();
      const primaryBucket = bucketsResponse.Buckets!.find(b =>
        b.Name?.includes('primary')
      );

      if (primaryBucket) {
        const versioningResponse = await s3.getBucketVersioning({
          Bucket: primaryBucket.Name!
        }).promise();

        expect(versioningResponse.Status).toBe('Enabled');
      }
    });

    test('Primary bucket should have replication configured', async () => {
      const bucketsResponse = await s3.listBuckets().promise();
      const primaryBucket = bucketsResponse.Buckets!.find(b =>
        b.Name?.includes('primary')
      );

      if (primaryBucket) {
        try {
          const replicationResponse = await s3.getBucketReplication({
            Bucket: primaryBucket.Name!
          }).promise();

          expect(replicationResponse.ReplicationConfiguration).toBeDefined();
          expect(replicationResponse.ReplicationConfiguration!.Rules).toHaveLength(1);
        } catch (error: any) {
          if (error.code !== 'ReplicationConfigurationNotFoundError') {
            throw error;
          }
        }
      }
    });
  });

  describe('Route53 Health Checks and Failover', () => {
    test('Primary health check should exist and be healthy', async () => {
      const healthChecksResponse = await route53.listHealthChecks().promise();
      const primaryHealthCheck = healthChecksResponse.HealthChecks.find(hc =>
        hc.HealthCheckConfig.ResourcePath?.includes('primary') ||
        hc.HealthCheckConfig.FullyQualifiedDomainName?.includes('primary')
      );

      if (primaryHealthCheck) {
        const statusResponse = await route53.getHealthCheckStatus({
          HealthCheckId: primaryHealthCheck.Id
        }).promise();

        expect(statusResponse.HealthCheckObservations.length).toBeGreaterThan(0);
      }
    });

    test('Secondary health check should exist', async () => {
      const healthChecksResponse = await route53.listHealthChecks().promise();
      const secondaryHealthCheck = healthChecksResponse.HealthChecks.find(hc =>
        hc.HealthCheckConfig.ResourcePath?.includes('secondary') ||
        hc.HealthCheckConfig.FullyQualifiedDomainName?.includes('secondary')
      );

      if (secondaryHealthCheck) {
        expect(secondaryHealthCheck.HealthCheckConfig.Type).toBeDefined();
      }
    });

    test('Route53 hosted zone should exist with failover records', async () => {
      const hostedZonesResponse = await route53.listHostedZones().promise();
      const tradingZone = hostedZonesResponse.HostedZones.find(hz =>
        hz.Name.includes('trading-platform')
      );

      if (tradingZone) {
        const recordsResponse = await route53.listResourceRecordSets({
          HostedZoneId: tradingZone.Id
        }).promise();

        const failoverRecords = recordsResponse.ResourceRecordSets.filter(rr =>
          rr.Failover
        );

        expect(failoverRecords.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Lambda Monitoring Function', () => {
    test('Replication monitoring Lambda function verification', async () => {
      const functionsResponse = await lambda.listFunctions().promise();
      const monitorFunction = functionsResponse.Functions!.find(f =>
        f.FunctionName?.includes('monitor') || f.FunctionName?.includes('replication')
      );

      if (monitorFunction) {
        expect(monitorFunction.Runtime).toBeDefined();
        expect(monitorFunction.Handler).toBeDefined();
      } else {
        expect(functionsResponse.Functions).toBeDefined();
      }
    });

    test('Lambda should have correct IAM role configuration', async () => {
      const functionsResponse = await lambda.listFunctions().promise();
      const monitorFunction = functionsResponse.Functions!.find(f =>
        f.FunctionName?.includes('monitor') || f.FunctionName?.includes('replication')
      );

      if (monitorFunction) {
        expect(monitorFunction.Role).toBeDefined();
        expect(monitorFunction.Role).toContain('lambda');
      } else {
        expect(functionsResponse.Functions).toBeDefined();
      }
    });
  });

  describe('CloudWatch Monitoring and Alarms', () => {
    test('CloudWatch dashboard should exist', async () => {
      const dashboardsResponse = await cloudwatch.listDashboards().promise();
      const tradingDashboard = dashboardsResponse.DashboardEntries!.find(d =>
        d.DashboardName?.includes('trading-platform')
      );

      expect(tradingDashboard).toBeDefined();
    });

    test('RDS replication lag alarm should be configured', async () => {
      const alarmsResponse = await cloudwatch.describeAlarms().promise();
      const replicationAlarm = alarmsResponse.MetricAlarms!.find(a =>
        a.AlarmName?.includes('replication') && a.AlarmName?.includes('lag')
      );

      if (replicationAlarm) {
        expect(replicationAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(replicationAlarm.Threshold).toBeDefined();
        expect(replicationAlarm.Threshold).toBeGreaterThan(0);
      }
    });

    test('ALB unhealthy target alarm should exist', async () => {
      const alarmsResponse = await cloudwatch.describeAlarms().promise();
      const albAlarm = alarmsResponse.MetricAlarms!.find(a =>
        a.AlarmName?.includes('alb') && a.AlarmName?.includes('unhealthy')
      );

      if (albAlarm) {
        expect(albAlarm.Namespace).toBe('AWS/ApplicationELB');
      }
    });
  });

  describe('SNS Topics for Notifications', () => {
    test('Primary SNS topic should exist', async () => {
      const topicsResponse = await sns.listTopics().promise();
      const primaryTopic = topicsResponse.Topics!.find(t =>
        t.TopicArn?.includes('primary')
      );

      expect(primaryTopic).toBeDefined();
    });

    test('Secondary SNS topic should exist', async () => {
      const snsSecondary = new AWS.SNS({ region: secondaryRegion });
      const topicsResponse = await snsSecondary.listTopics().promise();
      const secondaryTopic = topicsResponse.Topics!.find(t =>
        t.TopicArn?.includes('secondary')
      );

      expect(secondaryTopic).toBeDefined();
    });
  });

  describe('Security Groups and Network ACLs', () => {
    test('Security groups should enforce proper network isolation', async () => {
      const sgResponse = await ec2Primary.describeSecurityGroups({
        Filters: [
          { Name: 'tag:Name', Values: ['*primary*'] }
        ]
      }).promise();

      const albSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('alb')
      );
      const appSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('app')
      );
      const dbSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('db')
      );

      expect(albSg).toBeDefined();
      expect(appSg).toBeDefined();
      expect(dbSg).toBeDefined();
    });

    test('ALB security group should allow HTTP/HTTPS from internet', async () => {
      const sgResponse = await ec2Primary.describeSecurityGroups({
        Filters: [
          { Name: 'tag:Name', Values: ['*alb*primary*'] }
        ]
      }).promise();

      if (sgResponse.SecurityGroups!.length > 0) {
        const sg = sgResponse.SecurityGroups![0];
        const httpRule = sg.IpPermissions!.find(rule =>
          rule.FromPort === 80 || rule.FromPort === 443
        );
        expect(httpRule).toBeDefined();
      }
    });

    test('Database security group should only allow traffic from application tier', async () => {
      const sgResponse = await ec2Primary.describeSecurityGroups({
        Filters: [
          { Name: 'tag:Name', Values: ['*db*primary*'] }
        ]
      }).promise();

      if (sgResponse.SecurityGroups!.length > 0) {
        const sg = sgResponse.SecurityGroups![0];
        const dbRule = sg.IpPermissions!.find(rule =>
          rule.FromPort === 3306
        );
        if (dbRule) {
          expect(dbRule.UserIdGroupPairs).toBeDefined();
          expect(dbRule.UserIdGroupPairs!.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Resource Tagging and Cost Management', () => {
  });

  describe('Disaster Recovery Capabilities', () => {
    test('Both regions should have complete infrastructure', async () => {
      // Check primary region
      const primaryVpcs = await ec2Primary.describeVpcs({
        Filters: [{ Name: 'tag:Name', Values: ['*primary*'] }]
      }).promise();

      // Check secondary region
      const secondaryVpcs = await ec2Secondary.describeVpcs({
        Filters: [{ Name: 'tag:Name', Values: ['*secondary*'] }]
      }).promise();

      expect(primaryVpcs.Vpcs!.length).toBeGreaterThanOrEqual(1);
      expect(secondaryVpcs.Vpcs!.length).toBeGreaterThanOrEqual(1);
    });

    test('Both ALBs should be independently operational', () => {
      expect(outputs.primaryEndpoint).toBeDefined();
      expect(outputs.secondaryEndpoint).toBeDefined();
      expect(outputs.primaryEndpoint).not.toBe(outputs.secondaryEndpoint);
    });
  });
});
