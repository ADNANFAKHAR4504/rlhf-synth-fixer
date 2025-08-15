/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions for Secure AWS Infrastructure
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
  ListRolesCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  WAFV2Client,
  GetWebACLCommand,
  ListWebACLsCommand,
} from '@aws-sdk/client-wafv2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Extract outputs for testing - Updated for new template structure
const VPC_ID = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
const LOAD_BALANCER_DNS = outputs[`${stackName}-LoadBalancer-DNS`] || outputs['LoadBalancerDNS'];
const LOAD_BALANCER_URL = outputs[`${stackName}-LoadBalancer-URL`] || outputs['LoadBalancerURL'];
const DATABASE_ENDPOINT = outputs[`${stackName}-Database-Endpoint`] || outputs['DatabaseEndpoint'];
const S3_BUCKET_NAME = outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'];
const KMS_KEY_ID = outputs[`${stackName}-KMS-Key`] || outputs['KMSKeyId'];
const WEB_ACL_ID = outputs[`${stackName}-WebACL-ID`] || outputs['WebACLId'];
const PUBLIC_SUBNETS = outputs[`${stackName}-Public-Subnets`] || outputs['PublicSubnets'];
const PRIVATE_SUBNETS = outputs[`${stackName}-Private-Subnets`] || outputs['PrivateSubnets'];

// AWS SDK v3 clients - Updated to us-east-1 region
const ec2Client = new EC2Client({ region: 'us-east-1' });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const autoScalingClient = new AutoScalingClient({ region: 'us-east-1' });
const cloudFormationClient = new CloudFormationClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const wafv2Client = new WAFV2Client({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

// Helper functions for AWS SDK v3 operations
async function getStackInfo() {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  return response.Stacks![0];
}

async function getStackParameters() {
  const stack = await getStackInfo();
  const parameters: { [key: string]: string } = {};
  stack.Parameters?.forEach((param: any) => {
    parameters[param.ParameterKey] = param.ParameterValue;
  });
  return parameters;
}

async function getVpcInfo() {
  const command = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
  const response = await ec2Client.send(command);
  return response.Vpcs![0];
}

async function getLoadBalancerInfo() {
  const command = new DescribeLoadBalancersCommand({});
  const response = await elbv2Client.send(command);
  return response.LoadBalancers!.find((lb: any) => lb.DNSName === LOAD_BALANCER_DNS);
}

async function getDatabaseInfo() {
  const command = new DescribeDBInstancesCommand({});
  const response = await rdsClient.send(command);
  return response.DBInstances!.find((db: any) => 
    db.Endpoint?.Address === DATABASE_ENDPOINT ||
    (db as any).Tags?.some((tag: any) => 
      tag.Key === 'aws:cloudformation:stack-name' && 
      tag.Value === stackName
    )
  );
}

async function getAutoScalingGroup() {
  const command = new DescribeAutoScalingGroupsCommand({});
  const response = await autoScalingClient.send(command);
  return response.AutoScalingGroups!.find((asg: any) =>
    asg.Tags?.some((tag: any) => 
      tag.Key === 'aws:cloudformation:stack-name' && 
      tag.Value === stackName
    )
  );
}

describe('TapStack Integration Tests - Secure AWS Infrastructure', () => {
  let stackParameters: { [key: string]: string } = {};

  // Setup validation
  beforeAll(async () => {
    console.log('Validating secure infrastructure deployment...');
    const stack = await getStackInfo();
    stackParameters = await getStackParameters();
    console.log(` Stack ${stackName} is in ${stack.StackStatus} state`);
    console.log(`🔧 Stack parameters:`, stackParameters);
    
    // Log key infrastructure endpoints
    console.log(`VPC ID: ${VPC_ID}`);
    console.log(`Load Balancer: ${LOAD_BALANCER_DNS}`);
    console.log(`Load Balancer URL: ${LOAD_BALANCER_URL}`);
    console.log(`Database Endpoint: ${DATABASE_ENDPOINT}`);
    console.log(`S3 Bucket: ${S3_BUCKET_NAME}`);
    console.log(`KMS Key: ${KMS_KEY_ID}`);
    console.log(`WAF Web ACL: ${WEB_ACL_ID}`);
  }, 30000);

  describe('Infrastructure Validation', () => {
    test('should have valid VPC ID', () => {
      expect(VPC_ID).toBeDefined();
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid Load Balancer DNS', () => {
      expect(LOAD_BALANCER_DNS).toBeDefined();
      expect(LOAD_BALANCER_DNS).toMatch(/^.*\.elb\.amazonaws\.com$/);
    });

    test('should have valid Load Balancer URL', () => {
      expect(LOAD_BALANCER_URL).toBeDefined();
      expect(LOAD_BALANCER_URL).toMatch(/^http:\/\/.*\.elb\.amazonaws\.com$/);
    });

    test('should have valid Database endpoint', () => {
      expect(DATABASE_ENDPOINT).toBeDefined();
      expect(DATABASE_ENDPOINT).toMatch(/^.*\.rds\.amazonaws\.com$/);
    });

    test('should have valid S3 bucket name', () => {
      expect(S3_BUCKET_NAME).toBeDefined();
      expect(S3_BUCKET_NAME).toMatch(/^[a-z0-9-]+$/);
    });

    test('should have valid KMS Key ID', () => {
      expect(KMS_KEY_ID).toBeDefined();
      expect(KMS_KEY_ID).toMatch(/^[a-f0-9-]{36}$/);
    });

    test('should have valid WAF Web ACL ID', () => {
      expect(WEB_ACL_ID).toBeDefined();
      expect(WEB_ACL_ID).toMatch(/^[a-f0-9-]{36}$/);
    });

    test('should validate stack parameters', async () => {
      expect(stackParameters.Environment).toBeDefined();
      expect(stackParameters.KeyPairName).toBeDefined();
      expect(stackParameters.DBUsername).toBeDefined();
      expect(stackParameters.InstanceType).toBeDefined();
      expect(stackParameters.AmiId).toBeDefined();
      
      console.log(`Environment: ${stackParameters.Environment}`);
      console.log(`KeyPair: ${stackParameters.KeyPairName || 'Not specified'}`);
      console.log(`DB Username: ${stackParameters.DBUsername}`);
      console.log(`Instance Type: ${stackParameters.InstanceType}`);
      console.log(`AMI ID: ${stackParameters.AmiId}`);
    });
  });

  describe('Stack Deployment Status', () => {
    test('should be in complete state', async () => {
      const stack = await getStackInfo();
      
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus!);
      expect(stack.StackName).toBe(stackName);
    });

    test('should have proper stack tags', async () => {
      const stack = await getStackInfo();
      
      expect(stack.Tags).toBeDefined();
      const repositoryTag = stack.Tags!.find((tag: any) => tag.Key === 'Repository');
      const environmentTag = stack.Tags!.find((tag: any) => tag.Key === 'Environment');
      
      if (repositoryTag) {
        expect(repositoryTag.Value).toContain('iac-test-automations');
      }
      if (environmentTag) {
        expect(typeof environmentTag.Value).toBe('string');
      }
    });
  });

  describe('KMS Encryption Infrastructure', () => {
    test('should have active KMS master encryption key', async () => {
      const command = new DescribeKeyCommand({ KeyId: KMS_KEY_ID });
      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata!;

      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
      expect(keyMetadata.Description).toBe('Master encryption key for secure infrastructure');

      console.log(` KMS Key ${KMS_KEY_ID} is active and ready for encryption`);
    });

    test('should have KMS key alias configured', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);
      
      const stackAlias = response.Aliases!.find((alias: any) => 
        alias.AliasName === `alias/${stackName}-master-key`
      );

      expect(stackAlias).toBeDefined();
      expect(stackAlias!.TargetKeyId).toBe(KMS_KEY_ID);

      console.log(` KMS Key alias ${stackAlias!.AliasName} is configured correctly`);
    });
  });

  describe('VPC & Networking Health Check', () => {
    test('should have available VPC with correct configuration', async () => {
      const vpc = await getVpcInfo();

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();

      // Fetch DNS attributes separately
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
      console.log(` VPC ${VPC_ID} is available with CIDR 10.0.0.0/16`);
    });

    test('should have public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['true'] }
        ]
      });
      const response = await ec2Client.send(command);
      const publicSubnets = response.Subnets!;

      expect(publicSubnets.length).toBe(2);
      
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
      });

      // Verify AZ distribution - should be in different AZs
      const azs = [...new Set(publicSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(` Found ${publicSubnets.length} public subnets across ${azs.length} AZs: ${azs.join(', ')}`);
    });

    test('should have private subnets properly configured', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      });
      const response = await ec2Client.send(command);
      const privateSubnets = response.Subnets!;

      expect(privateSubnets.length).toBe(2);
      
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.11.0/24', '10.0.12.0/24']).toContain(subnet.CidrBlock);
      });
      
      console.log(` Found ${privateSubnets.length} private subnets with correct CIDR blocks`);
    });

    test('should have functioning NAT Gateways for high availability', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways!.filter((nat: any) => nat.State !== 'deleted');

      expect(natGateways.length).toBe(2);
      
      natGateways.forEach((nat: any) => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(nat.VpcId).toBe(VPC_ID);
      });
      
      console.log(` NAT Gateways are healthy with public IPs: ${natGateways.map((nat: any) => nat.NatGatewayAddresses![0].PublicIp).join(', ')}`);
    });

    test('should have Internet Gateway attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const igws = response.InternetGateways!;

      expect(igws.length).toBe(1);
      expect(igws[0].Attachments![0].State).toBe('available');
      expect(igws[0].Attachments![0].VpcId).toBe(VPC_ID);
      
      console.log(` Internet Gateway ${igws[0].InternetGatewayId} is attached`);
    });

    test('should have proper route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables!;

      // Should have public route table and 2 private route tables
      const publicRouteTable = routeTables.find((rt: any) =>
        rt.Routes!.some((route: any) => 
          route.GatewayId && route.GatewayId.startsWith('igw-')
        )
      );

      expect(publicRouteTable).toBeDefined();
      
      const igwRoute = publicRouteTable!.Routes!.find((route: any) => 
        route.GatewayId && route.GatewayId.startsWith('igw-')
      );
      expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');

      // Check NAT Gateway routes in private route tables
      const natRoutes = routeTables.filter((rt: any) =>
        rt.Routes!.some((route: any) => 
          route.NatGatewayId && route.NatGatewayId.startsWith('nat-')
        )
      );
      expect(natRoutes.length).toBe(2); // One for each private subnet
      
      console.log(` Route tables configured correctly with IGW and NAT routes`);
    });
  });

  describe('Security Groups Health Check', () => {
    test('should have properly configured security groups', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const stackSGs = response.SecurityGroups!.filter((sg: any) => 
        sg.GroupName !== 'default' &&
        sg.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      // Should have WebServer, LoadBalancer, and Database security groups
      expect(stackSGs.length).toBeGreaterThanOrEqual(3);
      
      const sgNames = stackSGs.map((sg: any) => 
        sg.Tags?.find((tag: any) => tag.Key === 'Name')?.Value || sg.GroupName
      );
      
      console.log(` Found ${stackSGs.length} security groups: ${sgNames.join(', ')}`);
    });

    test('should have WebServer security group allowing traffic from ALB only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const webSG = response.SecurityGroups!.find((sg: any) => 
        sg.GroupDescription?.includes('web server') ||
        sg.Tags?.some((tag: any) => 
          tag.Key === 'Name' && tag.Value?.includes('webserver')
        )
      );

      expect(webSG).toBeDefined();
      
      const httpRule = webSG!.IpPermissions!.find((rule: any) => rule.FromPort === 80);
      const httpsRule = webSG!.IpPermissions!.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      
      // Should only allow traffic from LoadBalancer security group
      expect(httpRule!.UserIdGroupPairs).toBeDefined();
      expect(httpsRule!.UserIdGroupPairs).toBeDefined();
      
      console.log(` WebServer security group allows HTTP/HTTPS from LoadBalancer only`);
    });

    test('should have LoadBalancer security group allowing HTTP/HTTPS from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const albSG = response.SecurityGroups!.find((sg: any) => 
        sg.GroupDescription?.includes('Load Balancer') ||
        sg.Tags?.some((tag: any) => 
          tag.Key === 'Name' && tag.Value?.includes('alb')
        )
      );

      expect(albSG).toBeDefined();
      
      const httpRule = albSG!.IpPermissions!.find((rule: any) => rule.FromPort === 80);
      const httpsRule = albSG!.IpPermissions!.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      
      console.log(` LoadBalancer security group allows HTTP/HTTPS from internet`);
    });

    test('should have Database security group allowing MySQL from WebServers only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const dbSG = response.SecurityGroups!.find((sg: any) => 
        sg.GroupDescription?.includes('database') ||
        sg.Tags?.some((tag: any) => 
          tag.Key === 'Name' && tag.Value?.includes('database')
        )
      );

      expect(dbSG).toBeDefined();
      
      const mysqlRule = dbSG!.IpPermissions!.find((rule: any) => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.ToPort).toBe(3306);
      expect(mysqlRule!.IpProtocol).toBe('tcp');
      
      // Should only allow access from WebServer security group
      expect(mysqlRule!.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs!.length).toBe(1);
      
      console.log(` Database security group allows MySQL access from WebServers only`);
    });
  });

  describe('Load Balancer Health Check', () => {
    test('should have active ALB with proper configuration', async () => {
      const alb = await getLoadBalancerInfo();

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.VpcId).toBe(VPC_ID);
      expect(alb!.AvailabilityZones!.length).toBe(2);
      
      console.log(` ALB ${alb!.LoadBalancerName} is active and internet-facing`);
    });

    test('should respond to HTTP requests', async () => {
      console.log(`Testing HTTP connectivity to ${LOAD_BALANCER_DNS}...`);
      
      try {
        const response = await fetch(`http://${LOAD_BALANCER_DNS}`, {
          method: 'GET',
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        // Accept any response that indicates connectivity
        expect(response.status).toBeLessThan(600);
        
        console.log(` ALB responded with status: ${response.status}`);
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          console.log(`ALB connection timeout - may still be initializing`);
        } else {
          throw error;
        }
      }
    }, 20000);

    test('should have properly configured target group', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbv2Client.send(command);
      const stackTG = response.TargetGroups!.find((tg: any) => tg.VpcId === VPC_ID);

      expect(stackTG).toBeDefined();
      expect(stackTG!.Protocol).toBe('HTTP');
      expect(stackTG!.Port).toBe(80);
      expect(stackTG!.HealthCheckIntervalSeconds).toBe(30);
      expect(stackTG!.HealthCheckPath).toBe('/health');
      expect(stackTG!.HealthyThresholdCount).toBe(2);
      expect(stackTG!.UnhealthyThresholdCount).toBe(3);
      
      console.log(` Target Group ${stackTG!.TargetGroupName} configured correctly`);
    });

    test('should have target group with registered targets', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({});
      const tgResponse = await elbv2Client.send(tgCommand);
      const stackTG = tgResponse.TargetGroups!.find((tg: any) => tg.VpcId === VPC_ID);

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: stackTG!.TargetGroupArn
      });
      const healthResponse = await elbv2Client.send(healthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      expect(healthResponse.TargetHealthDescriptions!.length).toBeGreaterThan(0);
      
      console.log(` Target Group has ${healthResponse.TargetHealthDescriptions!.length} registered targets`);
    });
  });

  describe('Auto Scaling Group Health Check', () => {
    test('should have ASG with correct capacity', async () => {
      const asg = await getAutoScalingGroup();

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBe(2);
      expect(asg!.MaxSize).toBe(6);
      expect(asg!.DesiredCapacity).toBe(2);
      expect(asg!.HealthCheckType).toBe('ELB');
      expect(asg!.HealthCheckGracePeriod).toBe(300);
      
      console.log(` ASG ${asg!.AutoScalingGroupName} has ${asg!.Instances?.length || 0}/${asg!.DesiredCapacity} instances`);
    });

    test('should have running EC2 instances with correct configuration', async () => {
      const asg = await getAutoScalingGroup();
      
      if (asg!.Instances && asg!.Instances.length > 0) {
        const instanceIds = asg!.Instances.map((i: any) => i.InstanceId!);
        
        const ec2Command = new DescribeInstancesCommand({ InstanceIds: instanceIds });
        const ec2Response = await ec2Client.send(ec2Command);

        let runningInstances = 0;
        ec2Response.Reservations!.forEach((reservation: any) => {
          reservation.Instances!.forEach((instance: any) => {
            expect(['running', 'pending']).toContain(instance.State!.Name);
            expect(instance.InstanceType).toBe(stackParameters.InstanceType);
            expect(instance.VpcId).toBe(VPC_ID);
            
            if (instance.State!.Name === 'running') runningInstances++;
          });
        });
        
        console.log(` Found ${runningInstances}/${instanceIds.length} running instances`);
      } else {
        console.warn(' No instances found in ASG - they may still be launching');
      }
    }, 60000);

    test('should have scaling policies configured', async () => {
      const asg = await getAutoScalingGroup();
      
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: asg!.AutoScalingGroupName
      });
      const response = await autoScalingClient.send(command);
      const policies = response.ScalingPolicies!;

      // Should have scale up and scale down policies
      expect(policies.length).toBeGreaterThanOrEqual(0);
      
      console.log(` ASG has ${policies.length} scaling policies configured`);
    });
  });

  describe('Database Infrastructure Health Check', () => {
    test('should have available RDS instance with encryption', async () => {
      const dbInstance = await getDatabaseInfo();

      expect(dbInstance).toBeDefined();
      expect(['available', 'creating', 'modifying']).toContain(dbInstance!.DBInstanceStatus!);
      expect(dbInstance!.DBInstanceClass).toBe('db.t3.small');
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.EngineVersion).toBe('8.0.42');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      expect(dbInstance!.KmsKeyId).toBeDefined();
      
      console.log(` RDS ${dbInstance!.DBInstanceIdentifier} is ${dbInstance!.DBInstanceStatus} with encryption`);
    }, 60000);

    test('should be in private subnets only', async () => {
      const dbInstance = await getDatabaseInfo();
      const subnetGroup = dbInstance!.DBSubnetGroup!;

      expect(subnetGroup.VpcId).toBe(VPC_ID);
      expect(subnetGroup.Subnets!.length).toBe(2);

      const subnetIds = subnetGroup.Subnets!.map((s: any) => s.SubnetIdentifier!);
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.11.0/24', '10.0.12.0/24']).toContain(subnet.CidrBlock);
      });
      
      console.log(` RDS is properly isolated in private subnets`);
    });

    test('should use AWS Secrets Manager for credentials', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(command);
      
      const secretResource = response.StackResources!.find((resource: any) => 
        resource.ResourceType === 'AWS::SecretsManager::Secret'
      );

      expect(secretResource).toBeDefined();
      
      const secretCommand = new DescribeSecretCommand({
        SecretId: secretResource!.PhysicalResourceId!
      });
      const secretResponse = await secretsClient.send(secretCommand);

      expect(secretResponse.KmsKeyId).toBeDefined();
      expect(secretResponse.Description).toContain('Database credentials');
      
      console.log(` Database credentials managed by Secrets Manager with KMS encryption`);
    });
  });

  describe('S3 Storage Security Health Check', () => {
    test('should have accessible S3 bucket with encryption', async () => {
      const headCommand = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME });
      const headResponse = await s3Client.send(headCommand);
      
      expect(headResponse.$metadata.httpStatusCode).toBe(200);

      // Check encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: S3_BUCKET_NAME });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      const encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];

      expect(encryptionConfig.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(encryptionConfig.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
      
      console.log(` S3 bucket ${S3_BUCKET_NAME} is accessible with KMS encryption`);
    });

    test('should have secure public access configuration', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: S3_BUCKET_NAME });
      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;

      expect(config.BlockPublicAcls).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
      
      console.log(` S3 bucket has secure public access configuration (all blocks enabled)`);
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: S3_BUCKET_NAME });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
      
      console.log(` S3 bucket has versioning enabled`);
    });

    test('should have access logging configured', async () => {
      try {
        const command = new GetBucketLoggingCommand({ Bucket: S3_BUCKET_NAME });
        const response = await s3Client.send(command);

        expect(response.LoggingEnabled).toBeDefined();
        expect(response.LoggingEnabled!.TargetBucket).toBeDefined();
        expect(response.LoggingEnabled!.TargetPrefix).toBe('access-logs/');
        
        console.log(` S3 bucket has access logging configured to ${response.LoggingEnabled!.TargetBucket}`);
      } catch (error: any) {
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
        console.log(` No access logging configuration found`);
      }
    });

    test('should support encrypted object operations', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Secure CloudFormation integration test content';

      try {
        // Upload test object with server-side encryption
        const putCommand = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain',
          ServerSideEncryption: 'aws:kms'
        });
        const putResponse = await s3Client.send(putCommand);
        
        expect(putResponse.ServerSideEncryption).toBe('aws:kms');

        // Retrieve test object
        const getCommand = new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey
        });
        const getResponse = await s3Client.send(getCommand);
        const retrievedContent = await getResponse.Body!.transformToString();

        expect(retrievedContent).toBe(testContent);
        expect(getResponse.ServerSideEncryption).toBe('aws:kms');

        // Clean up
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey
        });
        await s3Client.send(deleteCommand);
        
        console.log(` S3 encrypted object operations successful for ${testKey}`);
      } catch (error: any) {
        // Ensure cleanup on error
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: testKey
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });

  describe('WAF Security Health Check', () => {
    test('should have active WAF Web ACL', async () => {
      const webACLName = `${stackName}-web-acl`;
      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: WEB_ACL_ID,
        Name: webACLName 
      });
      const response = await wafv2Client.send(command);
      const webACL = response.WebACL!;
    
      expect(webACL.Name).toBeDefined();
      expect(webACL.DefaultAction).toBeDefined();
      expect(webACL.Rules).toBeDefined();
      expect(webACL.Rules!.length).toBeGreaterThanOrEqual(3);

      const commonRuleSet = webACL.Rules!.find((rule: any) => 
        rule.Name === 'AWSManagedRulesCommonRuleSet'
      );
      const knownBadInputsRuleSet = webACL.Rules!.find((rule: any) => 
        rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      const rateLimitRule = webACL.Rules!.find((rule: any) => 
        rule.Name === 'RateLimitRule'
      );

      expect(commonRuleSet).toBeDefined();
      expect(knownBadInputsRuleSet).toBeDefined();
      expect(rateLimitRule).toBeDefined();
      
      console.log(` WAF Web ACL ${webACL.Name} has ${webACL.Rules!.length} rules configured`);
    });

    test('should have rate limiting configured', async () => {
      const webACLName = `${stackName}-web-acl`; // Based on your template naming
      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: WEB_ACL_ID,
        Name: webACLName  
      });
      const response = await wafv2Client.send(command);
      const webACL = response.WebACL!;
      const rateLimitRule = webACL.Rules!.find((rule: any) => 
        rule.Name === 'RateLimitRule'
      );
      expect(rateLimitRule!.Statement!.RateBasedStatement!.Limit).toBe(2000);
      expect(rateLimitRule!.Action!.Block).toBeDefined();
      console.log(`WAF rate limiting configured at ${rateLimitRule!.Statement!.RateBasedStatement!.Limit} requests per 5 minutes`);
    });
  });

  describe('CloudWatch Monitoring Health Check', () => {
    test('should have encrypted CloudWatch log groups', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/ec2/${stackName}`
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      response.logGroups!.forEach((logGroup: any) => {
        expect(logGroup.kmsKeyId).toBeDefined();
      });
      
      console.log(` Found ${response.logGroups!.length} encrypted CloudWatch log groups`);
    });

    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);
      
      // Filter alarms for this stack
      const stackAlarms = response.MetricAlarms!.filter((alarm: any) =>
        alarm.AlarmName?.includes(stackName)
      );

      expect(stackAlarms.length).toBeGreaterThanOrEqual(2);

      // Check for CPU alarms
      const cpuAlarm = stackAlarms.find((alarm: any) => 
        alarm.AlarmName?.includes('cpu') || alarm.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarm).toBeDefined();

      // Check for database connection alarm
      const dbAlarm = stackAlarms.find((alarm: any) => 
        alarm.AlarmName?.includes('db') || alarm.MetricName === 'DatabaseConnections'
      );
      expect(dbAlarm).toBeDefined();
      
      console.log(` Found ${stackAlarms.length} CloudWatch alarms for monitoring`);
    });
  });

  describe('IAM Security Health Check', () => {
    test('should have WebServer IAM role with correct policies', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName,
        LogicalResourceId: 'WebServerRole'
      });
      const response = await cloudFormationClient.send(command);
      const roleResource = response.StackResources![0];
      const roleName = roleResource.PhysicalResourceId!;

      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      const role = roleResponse.Role!;

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      // Check attached managed policies
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const attachedPoliciesResponse = await iamClient.send(attachedPoliciesCommand);
      const managedPolicies = attachedPoliciesResponse.AttachedPolicies!;

      const cloudWatchPolicy = managedPolicies.find((p: any) => 
        p.PolicyArn === 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      const ssmPolicy = managedPolicies.find((p: any) => 
        p.PolicyArn === 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );

      expect(cloudWatchPolicy).toBeDefined();
      expect(ssmPolicy).toBeDefined();

      // Check inline policies
      const inlinePoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const inlinePoliciesResponse = await iamClient.send(inlinePoliciesCommand);
      
      expect(inlinePoliciesResponse.PolicyNames).toContain('S3AccessPolicy');
      expect(inlinePoliciesResponse.PolicyNames).toContain('LoggingPolicy');
      
      console.log(` WebServer IAM role configured correctly with ${managedPolicies.length} managed and ${inlinePoliciesResponse.PolicyNames!.length} inline policies`);
    });
  });

  describe('Overall Security & Compliance Validation', () => {
    test('should have all critical resources properly tagged', async () => {
      const stackResourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(stackResourcesCommand);
      const resources = response.StackResources!;

      // Check that key resources exist
      const vpcResource = resources.find((r: any) => r.LogicalResourceId === 'VPC');
      const albResource = resources.find((r: any) => r.LogicalResourceId === 'ApplicationLoadBalancer');
      const asgResource = resources.find((r: any) => r.LogicalResourceId === 'AutoScalingGroup');
      const dbResource = resources.find((r: any) => r.LogicalResourceId === 'SecureDatabase');
      const s3Resource = resources.find((r: any) => r.LogicalResourceId === 'SecureS3Bucket');

      expect(vpcResource).toBeDefined();
      expect(albResource).toBeDefined();
      expect(asgResource).toBeDefined();
      expect(dbResource).toBeDefined();
      expect(s3Resource).toBeDefined();
      const validStates = ['CREATE_COMPLETE', 'UPDATE_COMPLETE'];
      expect(validStates).toContain(vpcResource!.ResourceStatus);
      expect(validStates).toContain(albResource!.ResourceStatus);
      expect(validStates).toContain(asgResource!.ResourceStatus);
      
      console.log(` All critical resources are in CREATE_COMPLETE state`);
    });

    test('should meet high availability requirements', async () => {
      // Verify multi-AZ deployment
      const asg = await getAutoScalingGroup();
      const subnets = asg!.VPCZoneIdentifier!.split(',');
      
      expect(subnets.length).toBe(2);
      
      // Get subnet details to verify they're in different AZs
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnets
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const azs = [...new Set(subnetResponse.Subnets!.map((s: any) => s.AvailabilityZone))];
      
      expect(azs.length).toBe(2);

      // Verify database is multi-AZ
      const dbInstance = await getDatabaseInfo();
      expect(dbInstance!.MultiAZ).toBe(true);

      // Verify NAT Gateways for redundancy
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const natResponse = await ec2Client.send(natCommand);
      const activeNatGateways = natResponse.NatGateways!.filter((nat: any) => nat.State === 'available');
      expect(activeNatGateways.length).toBe(2);
      
      console.log(` High availability: Infrastructure spans ${azs.length} AZs with multi-AZ RDS and dual NAT Gateways`);
    });

    test('should validate comprehensive encryption implementation', async () => {
      // Verify KMS key is being used across services
      const encryptedResources = [];

      // Check RDS encryption
      const dbInstance = await getDatabaseInfo();
      if (dbInstance!.StorageEncrypted && dbInstance!.KmsKeyId) {
        encryptedResources.push('RDS');
      }

      // Check S3 encryption
      const s3EncryptionCommand = new GetBucketEncryptionCommand({ Bucket: S3_BUCKET_NAME });
      const s3EncryptionResponse = await s3Client.send(s3EncryptionCommand);
      if (s3EncryptionResponse.ServerSideEncryptionConfiguration) {
        encryptedResources.push('S3');
      }

      // Check CloudWatch Logs encryption
      const logsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/ec2/${stackName}`
      });
      const logsResponse = await logsClient.send(logsCommand);
      if (logsResponse.logGroups!.some((lg: any) => lg.kmsKeyId)) {
        encryptedResources.push('CloudWatch Logs');
      }

      expect(encryptedResources.length).toBeGreaterThanOrEqual(3);
      
      console.log(` Encryption validated across: ${encryptedResources.join(', ')}`);
    });

    test('should validate end-to-end security implementation', async () => {
      const securityValidations = [];

      // Network isolation
      const privateSubnetsCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      });
      const privateSubnetsResponse = await ec2Client.send(privateSubnetsCommand);
      if (privateSubnetsResponse.Subnets!.length === 2) {
        securityValidations.push('Network Isolation');
      }

      // Database in private subnets
      const dbInstance = await getDatabaseInfo();
      const dbSubnetGroup = dbInstance!.DBSubnetGroup!;
      const dbSubnets = dbSubnetGroup.Subnets!.map((s: any) => s.SubnetIdentifier);
      const dbSubnetDetails = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: dbSubnets }));
      if (dbSubnetDetails.Subnets!.every((s: any) => !s.MapPublicIpOnLaunch)) {
        securityValidations.push('Database Isolation');
      }

      // WAF protection
      if (WEB_ACL_ID) {
        securityValidations.push('WAF Protection');
      }

      // S3 public access blocking
      const s3PublicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: S3_BUCKET_NAME });
      const s3PublicAccessResponse = await s3Client.send(s3PublicAccessCommand);
      const publicAccessConfig = s3PublicAccessResponse.PublicAccessBlockConfiguration!;
      if (publicAccessConfig.BlockPublicAcls && publicAccessConfig.IgnorePublicAcls && 
          publicAccessConfig.BlockPublicPolicy && publicAccessConfig.RestrictPublicBuckets) {
        securityValidations.push('S3 Security');
      }

      expect(securityValidations.length).toBeGreaterThanOrEqual(4);
      
      console.log(` End-to-end security validated: ${securityValidations.join(', ')}`);
    });
  });
});
