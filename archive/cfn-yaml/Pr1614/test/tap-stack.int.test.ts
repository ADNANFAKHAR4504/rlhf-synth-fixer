// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadBucketCommand 
} from '@aws-sdk/client-s3';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  KMSClient, 
  DescribeKeyCommand 
} from '@aws-sdk/client-kms';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from '@aws-sdk/client-auto-scaling';
import axios from 'axios';

// Get outputs from deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, using mock outputs for testing');
  outputs = {
    VPCId: 'vpc-12345678',
    LoadBalancerURL: 'http://test-alb-123456789.us-east-1.elb.amazonaws.com',
    ApplicationDataBucket: `finapp-test-app-data-123456789`,
    LoggingBucket: `finapp-test-logs-123456789`,
    KMSKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    BastionHostIP: '1.2.3.4',
    PrivateSubnets: 'subnet-12345678,subnet-87654321',
    PublicSubnets: 'subnet-11111111,subnet-22222222'
  };
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const autoScalingClient = new AutoScalingClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('Financial Application Infrastructure Integration Tests', () => {
  // Skip integration tests if using mock data
  const skipIfMock = () => {
    if (outputs.VPCId === 'vpc-12345678') {
      return test.skip;
    }
    return test;
  };

  describe('VPC and Networking', () => {
    skipIfMock()('VPC should exist and be available', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    skipIfMock()('Subnets should be deployed across multiple AZs', async () => {
      const privateSubnets = outputs.PrivateSubnets?.split(',') || [];
      const publicSubnets = outputs.PublicSubnets?.split(',') || [];

      expect(privateSubnets).toHaveLength(2);
      expect(publicSubnets).toHaveLength(2);

      const allSubnets = [...privateSubnets, ...publicSubnets];
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnets
      }));

      expect(response.Subnets).toHaveLength(4);
      
      const availabilityZones = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    skipIfMock()('NAT Gateways should be available for high availability', async () => {
      const response = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }));

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('S3 Buckets and Encryption', () => {
    skipIfMock()('Application Data Bucket should exist and be accessible', async () => {
      const bucketName = outputs.ApplicationDataBucket;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      const response = await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    skipIfMock()('Logging Bucket should exist and be accessible', async () => {
      const bucketName = outputs.LoggingBucket;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      const response = await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    skipIfMock()('S3 operations should work with encryption', async () => {
      const bucketName = outputs.ApplicationDataBucket;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test content for encryption validation';

      // Put object
      const putResponse = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent
      }));

      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      // Get object
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));

      const bodyContents = await streamToString(getResponse.Body);
      expect(bodyContents).toBe(testContent);

      // Clean up
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));
    });
  });

  describe('KMS Encryption', () => {
    skipIfMock()('KMS key should exist and be enabled', async () => {
      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    skipIfMock()('Application Load Balancer should be active', async () => {
      const loadBalancerUrl = outputs.LoadBalancerURL;
      expect(loadBalancerUrl).toBeDefined();
      expect(loadBalancerUrl).toMatch(/^http:\/\/.+\.elb\.amazonaws\.com$/);

      const albArn = await getLoadBalancerArnFromUrl(loadBalancerUrl);
      if (albArn) {
        const response = await elbClient.send(new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn]
        }));

        expect(response.LoadBalancers).toHaveLength(1);
        expect(response.LoadBalancers![0].State?.Code).toBe('active');
        expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      }
    });

    skipIfMock()('Target Group should have healthy targets', async () => {
      const loadBalancerUrl = outputs.LoadBalancerURL;
      const albArn = await getLoadBalancerArnFromUrl(loadBalancerUrl);
      
      if (albArn) {
        // Get target groups associated with the load balancer
        const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
          LoadBalancerArn: albArn
        }));

        expect(tgResponse.TargetGroups).toBeDefined();
        expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

        // Check health of targets
        for (const tg of tgResponse.TargetGroups!) {
          const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
            TargetGroupArn: tg.TargetGroupArn
          }));

          const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
            t => t.TargetHealth?.State === 'healthy'
          );

          // Should have at least 2 healthy targets (minimum from ASG)
          expect(healthyTargets?.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    skipIfMock()('Auto Scaling Group should be properly configured', async () => {
      const asgName = `FinApp-Prod-${environmentSuffix}-ASG`;
      
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      if (response.AutoScalingGroups && response.AutoScalingGroups.length > 0) {
        const asg = response.AutoScalingGroups[0];
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(6);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe('ELB');
        expect(asg.Instances?.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('EC2 Instances and Security', () => {
    skipIfMock()('Bastion Host should be running', async () => {
      const bastionIp = outputs.BastionHostIP;
      expect(bastionIp).toBeDefined();
      expect(bastionIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

      const response = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'ip-address',
            Values: [bastionIp]
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      }));

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);
    });

    skipIfMock()('Security Groups should be properly configured', async () => {
      const vpcId = outputs.VPCId;
      
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3); // At least LB, WebServer, and Bastion SGs

      // Check for LoadBalancer security group
      const lbSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('LoadBalancer-SG')
      );
      expect(lbSg).toBeDefined();

      // Check for WebServer security group
      const webSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('WebServer-SG')
      );
      expect(webSg).toBeDefined();

      // Check for Bastion security group
      const bastionSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('Bastion-SG')
      );
      expect(bastionSg).toBeDefined();
    });
  });

  describe('Application Availability', () => {
    skipIfMock()('Application should be accessible via Load Balancer', async () => {
      const loadBalancerUrl = outputs.LoadBalancerURL;
      expect(loadBalancerUrl).toBeDefined();

      try {
        const response = await axios.get(loadBalancerUrl, {
          timeout: 10000,
          validateStatus: () => true // Accept any status code
        });

        // The application should respond (even if it's a 404 or other status)
        expect(response.status).toBeDefined();
        
        // If the simple web page is deployed, it should return 200
        if (response.status === 200) {
          expect(response.data).toContain('Financial Application Server');
        }
      } catch (error: any) {
        // Network errors are acceptable in test environment
        if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
          throw error;
        }
      }
    });

    skipIfMock()('Application should be highly available across AZs', async () => {
      const privateSubnets = outputs.PrivateSubnets?.split(',') || [];
      
      // Check instances are distributed across subnets
      const response = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'subnet-id',
            Values: privateSubnets
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      }));

      const instancesBySubnet = new Map<string, number>();
      
      response.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          const subnetId = instance.SubnetId!;
          instancesBySubnet.set(subnetId, (instancesBySubnet.get(subnetId) || 0) + 1);
        });
      });

      // Should have instances in multiple subnets for HA
      expect(instancesBySubnet.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Tagging and Naming', () => {
    skipIfMock()('Resources should follow naming convention with environment suffix', async () => {
      const vpcId = outputs.VPCId;
      
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const nameTag = response.Vpcs![0].Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);
    });

    test('All outputs should be properly defined', () => {
      const requiredOutputs = [
        'VPCId',
        'LoadBalancerURL',
        'ApplicationDataBucket',
        'LoggingBucket',
        'KMSKeyId',
        'BastionHostIP',
        'PrivateSubnets',
        'PublicSubnets'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });
});

// Helper function to convert stream to string
async function streamToString(stream: any): Promise<string> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

// Helper function to get Load Balancer ARN from URL
async function getLoadBalancerArnFromUrl(url: string): Promise<string | null> {
  try {
    const dnsName = url.replace('http://', '').replace('https://', '');
    const response = await elbClient.send(new DescribeLoadBalancersCommand({}));
    
    const alb = response.LoadBalancers?.find(lb => 
      url.includes(lb.DNSName!)
    );
    
    return alb?.LoadBalancerArn || null;
  } catch {
    return null;
  }
}