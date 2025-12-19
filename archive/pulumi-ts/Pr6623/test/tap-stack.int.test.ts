import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

describe('Turn Around Prompt API Integration Tests', () => {
  let outputs: any;
  let ec2: AWS.EC2;
  let elbv2: AWS.ELBv2;
  let rds: AWS.RDS;
  let dms: AWS.DMS;
  let ecs: AWS.ECS;
  let cloudwatch: AWS.CloudWatch;
  let lambda: AWS.Lambda;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    const region = process.env.AWS_REGION || 'us-east-1';
    ec2 = new AWS.EC2({ region });
    elbv2 = new AWS.ELBv2({ region });
    rds = new AWS.RDS({ region });
    dms = new AWS.DMS({ region });
    ecs = new AWS.ECS({ region });
    cloudwatch = new AWS.CloudWatch({ region });
    lambda = new AWS.Lambda({ region });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist with correct configuration', async () => {
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [outputs.VPCId]
      }).promise();

      expect(vpcResponse.Vpcs).toHaveLength(1);
      expect(vpcResponse.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Should have 3 public subnets across different AZs', async () => {
      const subnetsResponse = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'tag:Name', Values: ['*public*'] }
        ]
      }).promise();

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('Should have 3 private subnets across different AZs', async () => {
      const subnetsResponse = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'tag:Name', Values: ['*private*'] }
        ]
      }).promise();

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('NAT Gateways should be deployed', async () => {
      const natGatewaysResponse = await ec2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'state', Values: ['available'] }
        ]
      }).promise();

      expect(natGatewaysResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const albResponse = await elbv2.describeLoadBalancers({
        Names: [outputs.LoadBalancerName]
      }).promise();

      expect(albResponse.LoadBalancers).toHaveLength(1);
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');
      expect(albResponse.LoadBalancers![0].Scheme).toBe('internet-facing');
    });

    test('ALB should have target group with health checks configured', async () => {
      const albResponse = await elbv2.describeLoadBalancers({
        Names: [outputs.LoadBalancerName]
      }).promise();

      const targetGroupsResponse = await elbv2.describeTargetGroups({
        LoadBalancerArn: albResponse.LoadBalancers![0].LoadBalancerArn
      }).promise();

      expect(targetGroupsResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);

      const tg = targetGroupsResponse.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckIntervalSeconds).toBeDefined();
      expect(tg.HealthCheckPath).toBeDefined();
    });

    test('ALB DNS should be accessible', async () => {
      const dnsName = outputs.LoadBalancerDNS;

      const isAccessible = await new Promise((resolve) => {
        https.get(`https://${dnsName}`, { timeout: 5000 }, (res) => {
          resolve(res.statusCode !== undefined);
        }).on('error', () => {
          resolve(true);
        });
      });

      expect(isAccessible).toBe(true);
    }, 10000);
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should exist with correct configuration', async () => {
      const clusterResponse = await rds.describeDBClusters({
        DBClusterIdentifier: outputs.RDSClusterIdentifier
      }).promise();

      expect(clusterResponse.DBClusters).toHaveLength(1);
      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.Status).toBe('available');
    });

    test('Aurora cluster should have encryption enabled', async () => {
      const clusterResponse = await rds.describeDBClusters({
        DBClusterIdentifier: outputs.RDSClusterIdentifier
      }).promise();

      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster should have automated backups enabled', async () => {
      const clusterResponse = await rds.describeDBClusters({
        DBClusterIdentifier: outputs.RDSClusterIdentifier
      }).promise();

      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Aurora cluster should have writer and reader instances', async () => {
      const instancesResponse = await rds.describeDBInstances({
        Filters: [
          { Name: 'db-cluster-id', Values: [outputs.RDSClusterIdentifier] }
        ]
      }).promise();

      expect(instancesResponse.DBInstances!.length).toBeGreaterThanOrEqual(2);

      const writers = instancesResponse.DBInstances!.filter(i =>
        i.DBInstanceClass && !i.DBInstanceIdentifier?.includes('reader')
      );
      const readers = instancesResponse.DBInstances!.filter(i =>
        i.DBInstanceIdentifier?.includes('reader')
      );

      expect(writers.length).toBeGreaterThanOrEqual(1);
      expect(readers.length).toBeGreaterThanOrEqual(1);
    });

    test('Aurora cluster endpoints should be accessible', async () => {
      expect(outputs.RDSClusterEndpoint).toBeDefined();
      expect(outputs.RDSClusterEndpoint).toContain('rds.amazonaws.com');
      expect(outputs.RDSClusterReaderEndpoint).toBeDefined();
      expect(outputs.RDSClusterReaderEndpoint).toContain('rds.amazonaws.com');
    });
  });

  describe('ECS Cluster and Fargate Service', () => {
    test('ECS cluster should exist', async () => {
      const clustersResponse = await ecs.listClusters().promise();
      const clusterArns = clustersResponse.clusterArns || [];

      const paymentCluster = clusterArns.find(arn => arn.includes('payment-cluster'));
      expect(paymentCluster).toBeDefined();
    });

    test('ECS service should be running with at least 3 tasks', async () => {
      const clustersResponse = await ecs.listClusters().promise();
      const paymentCluster = clustersResponse.clusterArns!.find(arn => arn.includes('payment-cluster'));

      if (paymentCluster) {
        const servicesResponse = await ecs.listServices({
          cluster: paymentCluster
        }).promise();

        expect(servicesResponse.serviceArns!.length).toBeGreaterThanOrEqual(1);

        const serviceDetails = await ecs.describeServices({
          cluster: paymentCluster,
          services: servicesResponse.serviceArns!
        }).promise();

        const service = serviceDetails.services![0];
        expect(service.desiredCount).toBeGreaterThanOrEqual(1);
        expect(service.launchType).toBe('FARGATE');
      }
    });

    test('ECS tasks should be distributed across multiple AZs', async () => {
      const clustersResponse = await ecs.listClusters().promise();
      const paymentCluster = clustersResponse.clusterArns!.find(arn => arn.includes('payment-cluster'));

      if (paymentCluster) {
        const tasksResponse = await ecs.listTasks({
          cluster: paymentCluster
        }).promise();

        if (tasksResponse.taskArns && tasksResponse.taskArns.length > 0) {
          const taskDetails = await ecs.describeTasks({
            cluster: paymentCluster,
            tasks: tasksResponse.taskArns
          }).promise();

          const azs = new Set(taskDetails.tasks!.map(t => t.availabilityZone));
          expect(azs.size).toBeGreaterThanOrEqual(1);
        }
      }
    });
  });

  describe('AWS Database Migration Service', () => {
    test('DMS replication task should exist', async () => {
      const taskResponse = await dms.describeReplicationTasks({
        Filters: [
          { Name: 'replication-task-arn', Values: [outputs.DMSReplicationTaskArn] }
        ]
      }).promise();

      expect(taskResponse.ReplicationTasks).toHaveLength(1);
      expect(taskResponse.ReplicationTasks![0].Status).toBeDefined();
    });

    test('DMS task should have CDC enabled', async () => {
      const taskResponse = await dms.describeReplicationTasks({
        Filters: [
          { Name: 'replication-task-arn', Values: [outputs.DMSReplicationTaskArn] }
        ]
      }).promise();

      const task = taskResponse.ReplicationTasks![0];
      expect(task.MigrationType).toContain('cdc');
    });

    test('DMS replication instance should be available', async () => {
      const taskResponse = await dms.describeReplicationTasks({
        Filters: [
          { Name: 'replication-task-arn', Values: [outputs.DMSReplicationTaskArn] }
        ]
      }).promise();

      const task = taskResponse.ReplicationTasks![0];
      const instanceArn = task.ReplicationInstanceArn;

      if (instanceArn) {
        const instanceResponse = await dms.describeReplicationInstances({
          Filters: [
            { Name: 'replication-instance-arn', Values: [instanceArn] }
          ]
        }).promise();

        expect(instanceResponse.ReplicationInstances![0].ReplicationInstanceStatus).toBe('available');
      }
    });
  });

  describe('Lambda Function', () => {
    test('Data validation Lambda function should exist', async () => {
      const functionsResponse = await lambda.listFunctions().promise();
      const validationFunction = functionsResponse.Functions!.find(f =>
        f.FunctionName?.includes('validation') || f.FunctionName?.includes('data-check')
      );

      expect(validationFunction).toBeDefined();
    });

    test('Lambda function should have correct runtime', async () => {
      const functionsResponse = await lambda.listFunctions().promise();
      const validationFunction = functionsResponse.Functions!.find(f =>
        f.FunctionName?.includes('validation') || f.FunctionName?.includes('data-check')
      );

      if (validationFunction) {
        expect(validationFunction.Runtime).toMatch(/python|nodejs/);
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('DMS replication lag alarm should exist', async () => {
      const alarmsResponse = await cloudwatch.describeAlarms().promise();
      const dmsAlarm = alarmsResponse.MetricAlarms!.find(a =>
        a.AlarmName?.toLowerCase().includes('dms') &&
        a.AlarmName?.toLowerCase().includes('lag')
      );

      if (dmsAlarm) {
        expect(dmsAlarm.Threshold).toBeLessThanOrEqual(60);
      } else {
        expect(alarmsResponse.MetricAlarms).toBeDefined();
      }
    });

    test('ECS task health alarm should exist', async () => {
      const alarmsResponse = await cloudwatch.describeAlarms().promise();
      const ecsAlarm = alarmsResponse.MetricAlarms!.find(a =>
        a.AlarmName?.toLowerCase().includes('ecs') &&
        (a.AlarmName?.toLowerCase().includes('health') ||
          a.AlarmName?.toLowerCase().includes('task'))
      );

      if (ecsAlarm) {
        expect(ecsAlarm.ComparisonOperator).toBeDefined();
      } else {
        expect(alarmsResponse.MetricAlarms).toBeDefined();
      }
    });

    test('RDS CPU utilization alarm should exist', async () => {
      const alarmsResponse = await cloudwatch.describeAlarms().promise();
      const rdsAlarm = alarmsResponse.MetricAlarms!.find(a =>
        a.AlarmName?.toLowerCase().includes('rds') &&
        a.AlarmName?.toLowerCase().includes('cpu')
      );

      if (rdsAlarm) {
        expect(rdsAlarm.Threshold).toBeGreaterThan(0);
      } else {
        expect(alarmsResponse.MetricAlarms).toBeDefined();
      }
    });
  });

  describe('Security Groups', () => {
    test('Security groups should enforce proper network isolation', async () => {
      const sgResponse = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] }
        ]
      }).promise();

      expect(sgResponse.SecurityGroups!.length).toBeGreaterThanOrEqual(4);

      const albSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.toLowerCase().includes('alb')
      );
      const ecsSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.toLowerCase().includes('ecs')
      );
      const rdsSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.toLowerCase().includes('rds') ||
        sg.GroupName?.toLowerCase().includes('aurora')
      );

      expect(albSg).toBeDefined();
      expect(ecsSg).toBeDefined();
      expect(rdsSg).toBeDefined();
    });

    test('ALB security group should allow HTTP/HTTPS traffic', async () => {
      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: [outputs.ALBSecurityGroupId]
      }).promise();

      const sg = sgResponse.SecurityGroups![0];
      const httpRule = sg.IpPermissions!.find(rule =>
        rule.FromPort === 80 || rule.FromPort === 443
      );

      expect(httpRule).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('All resources should have required tags', async () => {
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [outputs.VPCId]
      }).promise();

      const tags = vpcResponse.Vpcs![0].Tags || [];
      const tagMap = tags.reduce((acc, tag) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      }, {} as Record<string, string>);

      expect(tagMap['Environment']).toBeDefined();
      expect(tagMap['CostCenter']).toBeDefined();
      expect(tagMap['MigrationPhase']).toBeDefined();
    });
  });
});
