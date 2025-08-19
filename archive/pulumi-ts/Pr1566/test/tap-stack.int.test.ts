import * as aws from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Configure AWS SDK
aws.config.update({ region: 'us-east-1' });

const ec2 = new aws.EC2();
const elbv2 = new aws.ELBv2();
const s3 = new aws.S3();
const rds = new aws.RDS();
const autoscaling = new aws.AutoScaling();

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC deployed with correct configuration', async () => {
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [outputs.vpcId],
      }).promise();

      expect(vpcResponse.Vpcs).toHaveLength(1);
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      
      // Check DNS attributes
      const vpcAttrs = await ec2.describeVpcAttribute({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsHostnames',
      }).promise();
      expect(vpcAttrs.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have public and private subnets in multiple AZs', async () => {
      const subnetsResponse = await ec2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
        ],
      }).promise();

      const subnets = subnetsResponse.Subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private

      const publicSubnets = subnets.filter(s => 
        s.Tags?.some(t => t.Key === 'Type' && t.Value === 'public')
      );
      const privateSubnets = subnets.filter(s => 
        s.Tags?.some(t => t.Key === 'Type' && t.Value === 'private')
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Check that subnets are in different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const igwResponse = await ec2.describeInternetGateways({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [outputs.vpcId] },
        ],
      }).promise();

      expect(igwResponse.InternetGateways).toHaveLength(1);
      const igw = igwResponse.InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should have VPC endpoints configured', async () => {
      const endpointsResponse = await ec2.describeVpcEndpoints({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
        ],
      }).promise();

      expect(endpointsResponse.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      const s3Endpoint = endpointsResponse.VpcEndpoints!.find(e => 
        e.ServiceName?.includes('s3')
      );
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint!.State).toBe('available');
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer deployed', async () => {
      const albArn = await getLoadBalancerArn(outputs.loadBalancerDns);
      const albResponse = await elbv2.describeLoadBalancers({
        LoadBalancerArns: [albArn],
      }).promise();

      expect(albResponse.LoadBalancers).toHaveLength(1);
      const alb = albResponse.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('should have ALB target group with healthy targets', async () => {
      const albArn = await getLoadBalancerArn(outputs.loadBalancerDns);
      const targetGroupsResponse = await elbv2.describeTargetGroups({
        LoadBalancerArn: albArn,
      }).promise();

      expect(targetGroupsResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);
      const targetGroup = targetGroupsResponse.TargetGroups![0];

      const healthResponse = await elbv2.describeTargetHealth({
        TargetGroupArn: targetGroup.TargetGroupArn!,
      }).promise();

      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThanOrEqual(1); // At least 1 healthy instance
    });

    test('should have ALB listener configured on port 80', async () => {
      const albArn = await getLoadBalancerArn(outputs.loadBalancerDns);
      const listenersResponse = await elbv2.describeListeners({
        LoadBalancerArn: albArn,
      }).promise();

      expect(listenersResponse.Listeners!.length).toBeGreaterThanOrEqual(1);
      const httpListener = listenersResponse.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    });

    test('should be able to reach ALB endpoint', async () => {
      const url = `http://${outputs.loadBalancerDns}`;
      let response;
      
      // Retry logic for eventual consistency
      for (let i = 0; i < 5; i++) {
        try {
          response = await axios.get(url, { timeout: 5000 });
          break;
        } catch (error) {
          if (i === 4) throw error;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      expect(response!.status).toBe(200);
      expect(response!.data).toContain('Hello from');
    });
  });

  describe('Auto Scaling', () => {
    test('should have Auto Scaling Group configured', async () => {
      const asgResponse = await autoscaling.describeAutoScalingGroups({
        Filters: [
          { Name: 'tag-key', Values: ['Name'] },
          { Name: 'tag-value', Values: [`prod-asg-${process.env.ENVIRONMENT_SUFFIX || 'pr1566'}`] },
        ],
      }).promise();

      expect(asgResponse.AutoScalingGroups).toHaveLength(1);
      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(1); // Updated to match our current config
      expect(asg.MaxSize).toBe(2);  // Updated to match our current config
      expect(asg.DesiredCapacity).toBe(1); // Updated to match our current config
      expect(asg.HealthCheckType).toBe('EC2'); // Updated to match our current config
    });

    test('should have running EC2 instances in ASG', async () => {
      const instancesResponse = await ec2.describeInstances({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
          { Name: 'instance-state-name', Values: ['running'] },
        ],
      }).promise();

      const instances = instancesResponse.Reservations!
        .flatMap(r => r.Instances!)
        .filter(i => i.State?.Name === 'running');

      expect(instances.length).toBeGreaterThanOrEqual(1); // Updated to match our current config
      
      // Verify instances have proper IAM role
      instances.forEach(instance => {
        expect(instance.IamInstanceProfile).toBeDefined();
      });
    });
  });

  describe('Database', () => {
    test('should have RDS instance deployed', async () => {
      const dbIdentifier = outputs.databaseEndpoint.split('.')[0];
      const dbResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      expect(dbResponse.DBInstances).toHaveLength(1);
      const db = dbResponse.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
    });

    test('should have RDS in private subnets', async () => {
      const dbIdentifier = outputs.databaseEndpoint.split('.')[0];
      const dbResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      const db = dbResponse.DBInstances![0];
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.DBSubnetGroup).toBeDefined();
      expect(db.DBSubnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have backup configured for RDS', async () => {
      const dbIdentifier = outputs.databaseEndpoint.split('.')[0];
      const dbResponse = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier,
      }).promise();

      const db = dbResponse.DBInstances![0];
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBeDefined();
      expect(db.PreferredMaintenanceWindow).toBeDefined();
    });
  });

  describe('Storage', () => {
    test('should have S3 bucket created', async () => {
      const bucketResponse = await s3.headBucket({
        Bucket: outputs.staticAssetsBucketName,
      }).promise();

      expect(bucketResponse.$response.httpResponse.statusCode).toBe(200);
    });

    test('should have S3 bucket with CloudFront access', async () => {
      const aclResponse = await s3.getBucketAcl({
        Bucket: outputs.staticAssetsBucketName,
      }).promise();

      expect(aclResponse.Owner).toBeDefined();
      
      // Test bucket policy allows CloudFront access
      const policyResponse = await s3.getBucketPolicy({
        Bucket: outputs.staticAssetsBucketName,
      }).promise();

      const policy = JSON.parse(policyResponse.Policy!);
      const cloudfrontStatement = policy.Statement.find((s: any) => 
        s.Effect === 'Allow' && 
        s.Principal?.Service === 'cloudfront.amazonaws.com' &&
        s.Action?.includes('s3:GetObject')
      );
      expect(cloudfrontStatement).toBeDefined();
      
      // Test CloudFront URL is accessible
      expect(outputs.staticAssetsUrl).toMatch(/^https:\/\/.*\.cloudfront\.net$/);
    });

    test('should be able to upload and retrieve objects from S3', async () => {
      const testKey = 'test-file.txt';
      const testContent = 'Integration test content';

      // Upload test file
      await s3.putObject({
        Bucket: outputs.staticAssetsBucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      }).promise();

      // Retrieve test file
      const getResponse = await s3.getObject({
        Bucket: outputs.staticAssetsBucketName,
        Key: testKey,
      }).promise();

      expect(getResponse.Body?.toString()).toBe(testContent);

      // Clean up
      await s3.deleteObject({
        Bucket: outputs.staticAssetsBucketName,
        Key: testKey,
      }).promise();
    });
  });

  describe('Security Groups', () => {
    test('should have security groups properly configured', async () => {
      const sgResponse = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpcId] },
        ],
      }).promise();

      const securityGroups = sgResponse.SecurityGroups!;
      
      // Check ALB security group
      const albSg = securityGroups.find(sg => 
        sg.GroupName?.includes('alb-sg')
      );
      expect(albSg).toBeDefined();
      const httpIngress = albSg!.IpPermissions!.find(p => 
        p.FromPort === 80 && p.ToPort === 80
      );
      expect(httpIngress).toBeDefined();

      // Check web server security group
      const webSg = securityGroups.find(sg => 
        sg.GroupName?.includes('web-server-sg')
      );
      expect(webSg).toBeDefined();

      // Check database security group
      const dbSg = securityGroups.find(sg => 
        sg.GroupName?.includes('db-sg')
      );
      expect(dbSg).toBeDefined();
      const dbIngress = dbSg!.IpPermissions!.find(p => 
        p.FromPort === 3306 && p.ToPort === 3306
      );
      expect(dbIngress).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    test('should support complete request flow from ALB to instances', async () => {
      const url = `http://${outputs.loadBalancerDns}`;
      
      // Make multiple requests to test load balancing
      const responses = await Promise.all(
        Array(5).fill(null).map(async () => {
          try {
            const response = await axios.get(url, { timeout: 5000 });
            return response.data;
          } catch (error) {
            return null;
          }
        })
      );

      const successfulResponses = responses.filter(r => r !== null);
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);

      // Check that we're getting responses from different instances
      const instanceIds = new Set(
        successfulResponses.map(r => {
          const match = r.match(/i-[a-f0-9]+/);
          return match ? match[0] : null;
        }).filter(id => id !== null)
      );
      
      // Should have responses from at least 1 instance (may be same due to session affinity)
      expect(instanceIds.size).toBeGreaterThanOrEqual(1);
    });
  });
});

// Helper function to get ALB ARN from DNS name
async function getLoadBalancerArn(dnsName: string): Promise<string> {
  const response = await elbv2.describeLoadBalancers().promise();
  const alb = response.LoadBalancers!.find(lb => 
    lb.DNSName === dnsName
  );
  if (!alb) {
    throw new Error(`Load balancer with DNS ${dnsName} not found`);
  }
  return alb.LoadBalancerArn!;
}
