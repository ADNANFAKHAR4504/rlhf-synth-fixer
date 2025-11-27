import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketPolicyCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  WAFV2Client,
  GetWebACLCommand,
  ListResourcesForWebACLCommand,
} from '@aws-sdk/client-wafv2';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

if (!fs.existsSync(outputsPath)) {
  throw new Error(
    'cfn-outputs/flat-outputs.json not found. Run the stack and export outputs before executing integration tests.'
  );
}

const outputs: any = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
const region = process.env.AWS_REGION || outputs.StackRegion;

// Initialize AWS clients
const cloudFrontClient = new CloudFrontClient({ region });
const ec2Client = new EC2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const secretsManagerClient = new SecretsManagerClient({ region });
const wafClient = new WAFV2Client({ region });
const ssmClient = new SSMClient({ region });

describe('TapStack Integration Tests - Live AWS Resources', () => {
  describe('VPC and Networking Resources', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('Public and private subnets exist in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(4);

      const publicSubnets = response.Subnets!.filter(
        s =>
          s.SubnetId === outputs.PublicSubnet1Id ||
          s.SubnetId === outputs.PublicSubnet2Id
      );
      const privateSubnets = response.Subnets!.filter(
        s =>
          s.SubnetId === outputs.PrivateSubnet1Id ||
          s.SubnetId === outputs.PrivateSubnet2Id
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
      expect(publicSubnets[0].AvailabilityZone).not.toBe(
        publicSubnets[1].AvailabilityZone
      );
      expect(privateSubnets[0].AvailabilityZone).not.toBe(
        privateSubnets[1].AvailabilityZone
      );
    });

    test('Security groups are configured with correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.ALBSecurityGroupId,
          outputs.WebServerSecurityGroupId,
          outputs.DatabaseSecurityGroupId,
        ],
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(3);

      const albSg = response.SecurityGroups!.find(
        sg => sg.GroupId === outputs.ALBSecurityGroupId
      );
      const webSg = response.SecurityGroups!.find(
        sg => sg.GroupId === outputs.WebServerSecurityGroupId
      );
      const dbSg = response.SecurityGroups!.find(
        sg => sg.GroupId === outputs.DatabaseSecurityGroupId
      );

      expect(albSg).toBeDefined();
      expect(albSg!.IpPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80 }),
          expect.objectContaining({ FromPort: 443, ToPort: 443 }),
        ])
      );

      expect(webSg).toBeDefined();
      expect(webSg!.IpPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80 }),
          expect.objectContaining({ FromPort: 22, ToPort: 22 }),
        ])
      );

      expect(dbSg).toBeDefined();
      expect(dbSg!.IpPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 5432, ToPort: 5432 }),
        ])
      );
    });
  });

  describe('S3 and CloudFront - Static Content Delivery', () => {
    test('Static website bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: outputs.S3BucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Static website bucket has objects (index.html, error.html)', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      const objectKeys = response.Contents?.map(obj => obj.Key) || [];
      expect(objectKeys).toContain('index.html');
      expect(objectKeys).toContain('error.html');
    });

    test('Static website bucket policy allows CloudFront OAI access', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
            Principal: expect.objectContaining({
              AWS: expect.stringContaining('CloudFront'),
            }),
            Action: 's3:GetObject',
          }),
        ])
      );
    });

    test('CloudFront distribution exists and is deployed', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      expect(response.Distribution).toBeDefined();
      expect(response.Distribution!.Status).toBe('Deployed');
      expect(response.Distribution!.DistributionConfig.Enabled).toBe(true);
      expect(response.Distribution!.DistributionConfig.DefaultRootObject).toBe(
        'index.html'
      );
    });

    test('CloudFront distribution uses S3 origin', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      const origins = response.Distribution!.DistributionConfig.Origins;
      expect(origins.Items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            DomainName: expect.stringContaining(outputs.S3BucketName),
            S3OriginConfig: expect.any(Object),
          }),
        ])
      );
    });

    test('CloudFront distribution redirects HTTP to HTTPS', async () => {
      const command = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const response = await cloudFrontClient.send(command);
      const defaultBehavior =
        response.Distribution!.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('Application Load Balancer and Compute', () => {
    test('Application Load Balancer exists and is active', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      });
      const response = await elbv2Client.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
    });

    test('Target group exists and has health checks configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.TargetGroupArn],
      });
      const response = await elbv2Client.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    });

    test('Target group has healthy targets', async () => {
      const command = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.TargetGroupArn,
      });
      const response = await elbv2Client.send(command);
      expect(response.TargetHealthDescriptions).toBeDefined();
      const healthyTargets = response.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    });

    test('Auto Scaling Group exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('EC2 instances in Auto Scaling Group are running', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups![0];
      const instanceIds = asg.Instances?.map(i => i.InstanceId) || [];

      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });
        const instancesResponse = await ec2Client.send(instancesCommand);
        const runningInstances = instancesResponse.Reservations!.flatMap(r =>
          r.Instances!.filter(i => i.State?.Name === 'running')
        );
        expect(runningInstances.length).toBeGreaterThan(0);
      }
    });

    test('Management server instance exists with Elastic IP', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.ManagementServerInstanceId],
      });
      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.PublicIpAddress).toBe(outputs.ManagementServerPublicIP);
    });
  });

  describe('RDS Database', () => {
    test('PostgreSQL database instance exists and is available', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint.split('.')[0],
      });
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.StorageEncrypted).toBe(true);
    });

    test('Database is in private subnets', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint.split('.')[0],
      });
      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];
      const dbSubnetGroup = db.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup!.Subnets).toBeDefined();
      const subnetIds = dbSubnetGroup!.Subnets!.map(s => s.SubnetIdentifier);
      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
    });

    test('Database password secret exists in Secrets Manager', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DatabaseSecretArn,
      });
      const response = await secretsManagerClient.send(command);
      expect(response.ARN).toBe(outputs.DatabaseSecretArn);
      expect(response.Name).toContain('db-password');
    });
  });

  describe('WAF and Security', () => {
    test('WAF Web ACL exists and is associated with ALB', async () => {
      // WAF ARN format: arn:aws:wafv2:region:account-id:regional/webacl/name/id
      const wafArnParts = outputs.WAFWebACLArn.split('/');
      const webAclId = wafArnParts[wafArnParts.length - 1];
      const webAclName = wafArnParts[wafArnParts.length - 2];

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: webAclId,
        Name: webAclName,
      });
      const response = await wafClient.send(command);
      expect(response.WebACL).toBeDefined();
      expect(outputs.WAFWebACLArn).toContain('regional');

      const resourcesCommand = new ListResourcesForWebACLCommand({
        WebACLArn: outputs.WAFWebACLArn,
        ResourceType: 'APPLICATION_LOAD_BALANCER',
      });
      const resourcesResponse = await wafClient.send(resourcesCommand);
      expect(resourcesResponse.ResourceArns).toContain(
        outputs.ApplicationLoadBalancerArn
      );
    });
  });

  describe('Monitoring and Alarms', () => {
    test('SNS alarm topic exists with email subscription', async () => {
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);
      const topic = listResponse.Topics!.find(
        t => t.TopicArn === outputs.AlarmTopicArn
      );
      expect(topic).toBeDefined();

      const attributesCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn,
      });
      const attributesResponse = await snsClient.send(attributesCommand);
      expect(attributesResponse.Attributes).toBeDefined();
    });

    test('CloudWatch alarms exist for CPU, database, and target health', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: outputs.StackName,
      });
      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();

      const alarmNames = response.MetricAlarms!.map(a => a.AlarmName);
      expect(alarmNames.some(n => n?.includes('HighCPU'))).toBe(true);
      expect(alarmNames.some(n => n?.includes('Database'))).toBe(true);
      expect(alarmNames.some(n => n?.includes('UnhealthyTargets'))).toBe(true);
    });
  });

  describe('End-to-End Data Flow', () => {
    test('CloudFront serves content from S3 bucket', async () => {
      // Get CloudFront distribution domain
      const cfCommand = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const cfResponse = await cloudFrontClient.send(cfCommand);
      const cfDomain = cfResponse.Distribution!.DomainName;

      // Make HTTP request to CloudFront
      const response = await fetch(`https://${cfDomain}/index.html`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain('Startup Platform');
      expect(content).toContain('Welcome');
    });

    test('ALB routes requests to healthy EC2 instances', async () => {
      // Get ALB DNS name
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      });
      const albResponse = await elbv2Client.send(albCommand);
      const albDns = albResponse.LoadBalancers![0].DNSName;

      // Make HTTP request to ALB
      const response = await fetch(`http://${albDns}/`);
      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toContain('Welcome');
    });

    test('EC2 instances can write to S3 bucket', async () => {
      // Execute command on management server to write to S3
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = `Test data written at ${new Date().toISOString()}`;

      const command = new SendCommandCommand({
        InstanceIds: [outputs.ManagementServerInstanceId],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: [
            `aws s3 cp - s3://${outputs.S3BucketName}/${testKey} <<< "${testContent}"`,
          ],
        },
      });

      const sendResponse = await ssmClient.send(command);
      const commandId = sendResponse.Command!.CommandId;

      // Wait for command to complete
      let status = 'InProgress';
      let attempts = 0;
      while (status === 'InProgress' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusCommand = new GetCommandInvocationCommand({
          CommandId: commandId!,
          InstanceId: outputs.ManagementServerInstanceId,
        });
        const statusResponse = await ssmClient.send(statusCommand);
        status = statusResponse.Status || 'InProgress';
        attempts++;
      }

      expect(status).toBe('Success');

      // Verify file was written to S3
      const getCommand = new GetObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
      });
      const s3Response = await s3Client.send(getCommand);
      const s3Content = await s3Response.Body!.transformToString();
      expect(s3Content.trim()).toBe(testContent);

      // Clean up test file
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.S3BucketName,
          Key: testKey,
        })
      );
    });

    test('EC2 instances can read from Secrets Manager', async () => {
      // Execute command on management server to read secret
      const command = new SendCommandCommand({
        InstanceIds: [outputs.ManagementServerInstanceId],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: [
            `aws secretsmanager get-secret-value --secret-id ${outputs.DatabaseSecretArn} --query SecretString --output text`,
          ],
        },
      });

      const sendResponse = await ssmClient.send(command);
      const commandId = sendResponse.Command!.CommandId;

      // Wait for command to complete
      let status = 'InProgress';
      let attempts = 0;
      while (status === 'InProgress' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusCommand = new GetCommandInvocationCommand({
          CommandId: commandId!,
          InstanceId: outputs.ManagementServerInstanceId,
        });
        const statusResponse = await ssmClient.send(statusCommand);
        status = statusResponse.Status || 'InProgress';
        attempts++;
      }

      expect(status).toBe('Success');
      const output = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId!,
          InstanceId: outputs.ManagementServerInstanceId,
        })
      );
      expect(output.StandardOutputContent).toBeDefined();
      const secret = JSON.parse(output.StandardOutputContent!);
      expect(secret.password).toBeDefined();
      expect(secret.username).toBeDefined();
    });

    test('EC2 instances can connect to RDS database', async () => {
      // Get database password from Secrets Manager
      const secretCommand = new GetSecretValueCommand({
        SecretId: outputs.DatabaseSecretArn,
      });
      const secretResponse = await secretsManagerClient.send(secretCommand);
      const secret = JSON.parse(secretResponse.SecretString!);
      const dbPassword = secret.password;
      const dbUsername = secret.username || 'dbadmin';

      // Execute command on EC2 to test database connection
      const command = new SendCommandCommand({
        InstanceIds: [outputs.ManagementServerInstanceId],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands: [
            `PGPASSWORD='${dbPassword}' psql -h ${outputs.DatabaseEndpoint} -p ${outputs.DatabasePort} -U ${dbUsername} -d startupdb -c "SELECT version();"`,
          ],
        },
      });

      const sendResponse = await ssmClient.send(command);
      const commandId = sendResponse.Command!.CommandId;

      // Wait for command to complete
      let status = 'InProgress';
      let attempts = 0;
      while (status === 'InProgress' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusCommand = new GetCommandInvocationCommand({
          CommandId: commandId!,
          InstanceId: outputs.ManagementServerInstanceId,
        });
        const statusResponse = await ssmClient.send(statusCommand);
        status = statusResponse.Status || 'InProgress';
        attempts++;
      }

      expect(status).toBe('Success');
      const output = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId!,
          InstanceId: outputs.ManagementServerInstanceId,
        })
      );
      expect(output.StandardOutputContent).toBeDefined();
      expect(output.StandardOutputContent).toContain('PostgreSQL');
    });

    test('Complete data flow: User Request -> CloudFront -> S3 (static) and ALB -> EC2 -> RDS (dynamic)', async () => {
      // Verify S3 bucket has content
      const s3ListCommand = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
      });
      const s3Response = await s3Client.send(s3ListCommand);
      expect(s3Response.Contents?.length).toBeGreaterThan(0);

      // Verify CloudFront distribution is deployed and serves content
      const cfCommand = new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId,
      });
      const cfResponse = await cloudFrontClient.send(cfCommand);
      expect(cfResponse.Distribution!.Status).toBe('Deployed');
      const cfDomain = cfResponse.Distribution!.DomainName;

      // Test CloudFront -> S3 flow
      const cfResponse_http = await fetch(`https://${cfDomain}/index.html`);
      expect(cfResponse_http.status).toBe(200);

      // Verify ALB is active and routes to EC2
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      });
      const albResponse = await elbv2Client.send(albCommand);
      expect(albResponse.LoadBalancers![0].State.Code).toBe('active');
      const albDns = albResponse.LoadBalancers![0].DNSName;

      // Test ALB -> EC2 flow
      const albResponse_http = await fetch(`http://${albDns}/`);
      expect(albResponse_http.status).toBe(200);

      // Verify targets are healthy
      const tgCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.TargetGroupArn,
      });
      const tgResponse = await elbv2Client.send(tgCommand);
      const healthyTargets = tgResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThan(0);

      // Verify database is available and accessible
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.DatabaseEndpoint.split('.')[0],
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toBe('available');

      // All components are operational and data flows correctly
      expect(true).toBe(true);
    });
  });

  describe('Resource Cleanup Verification', () => {
    test('All resources are properly tagged for identification', async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Owner' }),
          expect.objectContaining({ Key: 'Project' }),
          expect.objectContaining({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ])
      );
    });
  });
});
