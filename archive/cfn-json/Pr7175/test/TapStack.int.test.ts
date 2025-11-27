import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  WAFV2Client,
  GetWebACLCommand,
  GetIPSetCommand,
  GetLoggingConfigurationCommand,
  ListResourcesForWebACLCommand,
} from '@aws-sdk/client-wafv2';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string> = {};
  let stackName: string;
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  
  const cfnClient = new CloudFormationClient({ region });
  const s3Client = new S3Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const wafClient = new WAFV2Client({ region });

  beforeAll(async () => {
    // Dynamically discover stack name from environment or by listing stacks
    // In CI/CD, ENVIRONMENT_SUFFIX should be set (e.g., pr7175)
    if (process.env.ENVIRONMENT_SUFFIX) {
      stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX}`;
      console.log(`Using stack name from ENVIRONMENT_SUFFIX: ${stackName}`);
    } else {
      // Fallback: Try to find the most recent TapStack
      console.log('ENVIRONMENT_SUFFIX not set, searching for TapStack stacks...');
      const listCommand = new ListStacksCommand({
        StackStatusFilter: [
          'CREATE_COMPLETE',
          'UPDATE_COMPLETE',
          'CREATE_IN_PROGRESS',
          'UPDATE_IN_PROGRESS',
        ],
      });
      const listResponse = await cfnClient.send(listCommand);
      const tapStacks = listResponse.StackSummaries?.filter(
        (s) => s.StackName?.startsWith('TapStack')
      ) || [];
      
      if (tapStacks.length === 0) {
        throw new Error(
          'No TapStack found. Either set ENVIRONMENT_SUFFIX environment variable ' +
          'or ensure a TapStack is deployed.'
        );
      }
      
      // Sort by creation time and get the most recent
      tapStacks.sort((a, b) => {
        const timeA = a.CreationTime?.getTime() || 0;
        const timeB = b.CreationTime?.getTime() || 0;
        return timeB - timeA;
      });
      
      stackName = tapStacks[0].StackName!;
      console.log(`Discovered most recent stack: ${stackName}`);
    }

    // Verify stack exists and get outputs dynamically
    let stackResponse;
    try {
      const describeCommand = new DescribeStacksCommand({ StackName: stackName });
      stackResponse = await cfnClient.send(describeCommand);
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.message?.includes('does not exist')) {
        throw new Error(
          `Stack ${stackName} not found. Deploy the stack first. ` +
          `If using CI/CD, ensure ENVIRONMENT_SUFFIX is set correctly.`
        );
      }
      throw error;
    }
    
    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found. Deploy the stack first.`);
    }

    const stack = stackResponse.Stacks[0];
    const validStatuses = ['CREATE_COMPLETE', 'UPDATE_COMPLETE'];
    if (!validStatuses.includes(stack.StackStatus!)) {
      throw new Error(
        `Stack ${stackName} is not in a valid state. ` +
        `Current status: ${stack.StackStatus}. ` +
        `Expected: ${validStatuses.join(' or ')}`
      );
    }

    // Extract outputs dynamically
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }

    // Verify we have the required outputs
    const requiredOutputs = [
      'WebACLArn',
      'WebACLId',
      'WAFLogBucketName',
      'WAFLogBucketArn',
      'TestALBArn',
      'TestALBDNSName',
      'OfficeIPSetArn',
    ];

    const missingOutputs = requiredOutputs.filter((key) => !outputs[key]);
    if (missingOutputs.length > 0) {
      throw new Error(
        `Missing required stack outputs: ${missingOutputs.join(', ')}. ` +
        `Found outputs: ${Object.keys(outputs).join(', ')}. ` +
        `Stack: ${stackName}`
      );
    }

    console.log(
      `✅ Stack ${stackName} discovered successfully with ${Object.keys(outputs).length} outputs`
    );
  });

  describe('Stack Discovery and Outputs', () => {
    test('should have discovered stack name', () => {
      expect(stackName).toBeDefined();
      expect(stackName).toMatch(/^TapStack/);
    });

    test('should have all required outputs', () => {
      expect(outputs.WebACLArn).toBeDefined();
      expect(outputs.WebACLId).toBeDefined();
      expect(outputs.WAFLogBucketName).toBeDefined();
      expect(outputs.WAFLogBucketArn).toBeDefined();
      expect(outputs.TestALBArn).toBeDefined();
      expect(outputs.TestALBDNSName).toBeDefined();
      expect(outputs.OfficeIPSetArn).toBeDefined();
    });

    test('outputs should have valid formats', () => {
      expect(outputs.WebACLArn).toMatch(/^arn:aws:wafv2:/);
      expect(outputs.WAFLogBucketArn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.TestALBArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.OfficeIPSetArn).toMatch(/^arn:aws:wafv2:/);
      expect(outputs.TestALBDNSName).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('S3 Bucket for WAF Logs', () => {
    test('should exist and be accessible', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.WAFLogBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.WAFLogBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.WAFLogBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('should have proper bucket policy', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.WAFLogBucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();

      // Check for log delivery statement
      const logDeliveryStatement = policy.Statement.find(
        (s: any) => s.Sid === 'AWSLogDeliveryWrite'
      );
      expect(logDeliveryStatement).toBeDefined();
      expect(logDeliveryStatement.Principal.Service).toBe('delivery.logs.amazonaws.com');
    });
  });

  describe('Application Load Balancer', () => {
    test('should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.TestALBArn],
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBe(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    test('should be internet-facing', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.TestALBArn],
      });
      const response = await elbClient.send(command);
      const lb = response.LoadBalancers![0];
      expect(lb.Scheme).toBe('internet-facing');
      expect(lb.Type).toBe('application');
    });

    test('should have proper configuration', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.TestALBArn],
      });
      const response = await elbClient.send(command);
      const lb = response.LoadBalancers![0];
      expect(lb.DNSName).toBe(outputs.TestALBDNSName);
      expect(lb.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    });

    test('should have HTTP listener', async () => {
      const command = new DescribeListenersCommand({
        LoadBalancerArn: outputs.TestALBArn,
      });
      const response = await elbClient.send(command);
      expect(response.Listeners).toBeDefined();
      expect(response.Listeners?.length).toBeGreaterThan(0);

      const httpListener = response.Listeners!.find((l) => l.Protocol === 'HTTP');
      expect(httpListener).toBeDefined();
      expect(httpListener!.Port).toBe(80);
    });

    test('should have target group', async () => {
      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: outputs.TestALBArn,
      });
      const listenersResponse = await elbClient.send(listenersCommand);
      const listener = listenersResponse.Listeners![0];

      // Check if action is FixedResponse or has TargetGroupArn
      const action = listener.DefaultActions![0];
      if (action.Type === 'fixed-response') {
        expect(action.FixedResponseConfig).toBeDefined();
        expect(action.FixedResponseConfig!.StatusCode).toBe('200');
      } else {
        const targetGroupArn = action.TargetGroupArn;
        expect(targetGroupArn).toBeDefined();

        const tgCommand = new DescribeTargetGroupsCommand({
          TargetGroupArns: [targetGroupArn!],
        });
        const tgResponse = await elbClient.send(tgCommand);
        expect(tgResponse.TargetGroups).toBeDefined();
        expect(tgResponse.TargetGroups![0].Protocol).toBe('HTTP');
        expect(tgResponse.TargetGroups![0].Port).toBe(80);
      }
    });
  });

  describe('WAF Web ACL', () => {
    test('should exist and be accessible', async () => {
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2]; // Format: arn:aws:wafv2:region:account:regional/webacl/NAME/ID

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const response = await wafClient.send(command);
      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.ARN).toBe(outputs.WebACLArn);
    });

    test('should have rate limiting rule', async () => {
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2];

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const response = await wafClient.send(command);
      const rules = response.WebACL!.Rules || [];

      const rateLimitRule = rules.find((rule) =>
        rule.Statement?.RateBasedStatement !== undefined
      );
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule!.Statement!.RateBasedStatement!.Limit).toBe(2000);
    });

    test('should have geo-blocking rule', async () => {
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2];

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const response = await wafClient.send(command);
      const rules = response.WebACL!.Rules || [];

      const geoBlockRule = rules.find((rule) =>
        rule.Statement?.GeoMatchStatement !== undefined
      );
      expect(geoBlockRule).toBeDefined();
      expect(geoBlockRule!.Statement!.GeoMatchStatement!.CountryCodes).toBeDefined();
      expect(geoBlockRule!.Statement!.GeoMatchStatement!.CountryCodes!.length).toBeGreaterThan(0);
    });

    test('should have SQL injection protection rule', async () => {
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2];

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const response = await wafClient.send(command);
      const rules = response.WebACL!.Rules || [];

      const sqlInjectionRule = rules.find((rule) =>
        rule.Statement?.ManagedRuleGroupStatement !== undefined
      );
      expect(sqlInjectionRule).toBeDefined();
      expect(sqlInjectionRule!.Statement!.ManagedRuleGroupStatement!.VendorName).toBe('AWS');
    });

    test('should have IP allowlist rule', async () => {
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2];

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const response = await wafClient.send(command);
      const rules = response.WebACL!.Rules || [];

      const ipAllowlistRule = rules.find((rule) =>
        rule.Statement?.IPSetReferenceStatement !== undefined
      );
      expect(ipAllowlistRule).toBeDefined();
      expect(ipAllowlistRule!.Statement!.IPSetReferenceStatement!.ARN).toBe(outputs.OfficeIPSetArn);
    });

    test('should have CloudWatch metrics enabled', async () => {
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2];

      const command = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const response = await wafClient.send(command);
      expect(response.WebACL!.VisibilityConfig).toBeDefined();
      expect(response.WebACL!.VisibilityConfig!.CloudWatchMetricsEnabled).toBe(true);
      expect(response.WebACL!.VisibilityConfig!.SampledRequestsEnabled).toBe(true);
    });

    test('should be associated with ALB', async () => {
      const command = new ListResourcesForWebACLCommand({
        WebACLArn: outputs.WebACLArn,
        ResourceType: 'APPLICATION_LOAD_BALANCER',
      });
      const response = await wafClient.send(command);
      expect(response.ResourceArns).toBeDefined();
      expect(response.ResourceArns?.length).toBeGreaterThan(0);
      expect(response.ResourceArns).toContain(outputs.TestALBArn);
    });
  });

  describe('IP Set', () => {
    test('should exist and be accessible', async () => {
      const ipSetId = outputs.OfficeIPSetArn.split('/').pop();
      const ipSetName = outputs.OfficeIPSetArn.split('/')[outputs.OfficeIPSetArn.split('/').length - 2];

      const command = new GetIPSetCommand({
        Scope: 'REGIONAL',
        Id: ipSetId,
        Name: ipSetName,
      });
      const response = await wafClient.send(command);
      expect(response.IPSet).toBeDefined();
      expect(response.IPSet!.ARN).toBe(outputs.OfficeIPSetArn);
    });

    test('should be configured for IPv4', async () => {
      const ipSetId = outputs.OfficeIPSetArn.split('/').pop();
      const ipSetName = outputs.OfficeIPSetArn.split('/')[outputs.OfficeIPSetArn.split('/').length - 2];

      const command = new GetIPSetCommand({
        Scope: 'REGIONAL',
        Id: ipSetId,
        Name: ipSetName,
      });
      const response = await wafClient.send(command);
      expect(response.IPSet!.IPAddressVersion).toBe('IPV4');
    });
  });

  describe('WAF Logging Configuration', () => {
    test('should exist and be configured', async () => {
      const command = new GetLoggingConfigurationCommand({
        ResourceArn: outputs.WebACLArn,
      });
      const response = await wafClient.send(command);
      expect(response.LoggingConfiguration).toBeDefined();
      expect(response.LoggingConfiguration!.ResourceArn).toBe(outputs.WebACLArn);
    });

    test('should log to S3 bucket', async () => {
      const command = new GetLoggingConfigurationCommand({
        ResourceArn: outputs.WebACLArn,
      });
      const response = await wafClient.send(command);
      expect(response.LoggingConfiguration!.LogDestinationConfigs).toBeDefined();
      expect(response.LoggingConfiguration!.LogDestinationConfigs!.length).toBeGreaterThan(0);

      const logDestination = response.LoggingConfiguration!.LogDestinationConfigs![0];
      expect(logDestination).toContain(outputs.WAFLogBucketName);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should have complete WAF protection pipeline', async () => {
      // Verify WAF Web ACL
      const arnParts = outputs.WebACLArn.split('/');
      const webACLName = arnParts[2];

      const webACLCommand = new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: outputs.WebACLId,
        Name: webACLName,
      });
      const webACL = await wafClient.send(webACLCommand);
      expect(webACL.WebACL).toBeDefined();

      // Verify ALB
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.TestALBArn],
      });
      const alb = await elbClient.send(albCommand);
      expect(alb.LoadBalancers![0].State?.Code).toBe('active');

      // Verify WAF-ALB association
      const assocCommand = new ListResourcesForWebACLCommand({
        WebACLArn: outputs.WebACLArn,
        ResourceType: 'APPLICATION_LOAD_BALANCER',
      });
      const assoc = await wafClient.send(assocCommand);
      expect(assoc.ResourceArns).toContain(outputs.TestALBArn);

      // Verify logging
      const logCommand = new GetLoggingConfigurationCommand({
        ResourceArn: outputs.WebACLArn,
      });
      const logging = await wafClient.send(logCommand);
      expect(logging.LoggingConfiguration).toBeDefined();

      // Verify S3 bucket
      const s3Command = new GetBucketEncryptionCommand({
        Bucket: outputs.WAFLogBucketName,
      });
      const s3Bucket = await s3Client.send(s3Command);
      expect(s3Bucket.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });
});
