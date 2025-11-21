import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CloudFormation Stack Integration Tests', () => {
  let outputs;

  beforeAll(() => {
    const outputsPath = join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('Stack Outputs Validation', () => {
    test('should have VPC ID output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should have public subnet outputs', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should have private subnet outputs', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should have ECS cluster name output', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSClusterName).toMatch(/^cluster-[a-z0-9-]+$/);
    });

    test('should have ECS service name output', () => {
      expect(outputs.ECSServiceName).toBeDefined();
      expect(outputs.ECSServiceName).toMatch(/^svc-[a-z0-9-]+$/);
    });

    test('should have Load Balancer DNS output', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('elb.amazonaws.com');
    });

    test('should have Load Balancer ARN output', () => {
      expect(outputs.LoadBalancerArn).toBeDefined();
      expect(outputs.LoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:loadbalancer\/app\//);
    });

    test('should have Target Group ARN output', () => {
      expect(outputs.TargetGroupArn).toBeDefined();
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:targetgroup\//);
    });

    test('should have DynamoDB table name output', () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName).toMatch(/^table-[a-z0-9-]+$/);
    });

    test('should have DynamoDB stream ARN output', () => {
      expect(outputs.DynamoDBStreamArn).toBeDefined();
      expect(outputs.DynamoDBStreamArn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\/[^\/]+\/stream\//);
    });

    test('should have DynamoDB table ARN output', () => {
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.DynamoDBTableArn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\//);
    });

    test('should have CloudWatch log group output', () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('should have CloudWatch log group name output', () => {
      expect(outputs.CloudWatchLogGroupName).toBeDefined();
      expect(outputs.CloudWatchLogGroupName).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('should have SNS topic ARN output', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:/);
    });

    test('should have SSM parameter paths output', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).toBeDefined();
      expect(outputs.SSMParameterAPIKey).toBeDefined();
      expect(outputs.SSMParameterDatabaseEndpoint).toMatch(/^\/[^\/]+\/[^\/]+\/database-endpoint$/);
      expect(outputs.SSMParameterAPIKey).toMatch(/^\/[^\/]+\/[^\/]+\/api-key$/);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('ECS cluster name should follow naming convention', () => {
      expect(outputs.ECSClusterName).toMatch(/^cluster-[a-z0-9-]+$/);
    });

    test('ECS service name should follow naming convention', () => {
      expect(outputs.ECSServiceName).toMatch(/^svc-[a-z0-9-]+$/);
    });

    test('DynamoDB table name should follow naming convention', () => {
      expect(outputs.DynamoDBTableName).toMatch(/^table-[a-z0-9-]+$/);
    });

    test('CloudWatch log group should follow naming convention', () => {
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('Load Balancer name should follow naming convention', () => {
      const lbName = outputs.LoadBalancerDNS.split('.')[0];
      expect(lbName).toMatch(/^alb-[a-z0-9-]+/);
    });
  });

  describe('Multi-AZ Configuration', () => {
    test('should have two public subnets for multi-AZ', () => {
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
    });

    test('should have two private subnets for multi-AZ', () => {
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });
  });

  describe('Load Balancer Integration', () => {
    test('Load Balancer DNS should be accessible', () => {
      expect(outputs.LoadBalancerDNS).toBeTruthy();
      expect(outputs.LoadBalancerDNS.length).toBeGreaterThan(0);
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
    });

    test('Load Balancer ARN should match DNS naming', () => {
      const lbName = outputs.LoadBalancerDNS.split('.')[0];
      const arnParts = outputs.LoadBalancerArn.split('/');
      // ARN format: arn:aws:elasticloadbalancing:region:account:loadbalancer/app/name/id
      // The name is the second-to-last part
      const lbArnName = arnParts[arnParts.length - 2];
      expect(lbName).toContain(lbArnName);
    });

    test('Target Group ARN should be valid', () => {
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:targetgroup\/[^\/]+\//);
    });
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table ARN should match table name', () => {
      expect(outputs.DynamoDBTableArn).toContain(outputs.DynamoDBTableName);
    });

    test('DynamoDB table should be in correct region', () => {
      expect(outputs.DynamoDBTableArn).toContain('us-east-1');
    });
  });

  describe('Monitoring Integration', () => {
    test('CloudWatch log group should be properly formatted', () => {
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('SNS topic ARN should be in correct region', () => {
      expect(outputs.SNSTopicArn).toContain('us-east-1');
    });

    test('SNS topic should have proper naming', () => {
      const topicName = outputs.SNSTopicArn.split(':').pop();
      expect(topicName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Configuration Management', () => {
    test('SSM parameter paths should be properly formatted', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).toMatch(/^\/[^\/]+\/[^\/]+\/database-endpoint$/);
      expect(outputs.SSMParameterAPIKey).toMatch(/^\/[^\/]+\/[^\/]+\/api-key$/);
    });

    test('SSM parameters should have distinct paths', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).not.toBe(outputs.SSMParameterAPIKey);
    });
  });

  describe('Resource Consistency', () => {
    test('all ARNs should use same AWS account ID', () => {
      const arns = [
        outputs.LoadBalancerArn,
        outputs.TargetGroupArn,
        outputs.DynamoDBTableArn,
        outputs.SNSTopicArn
      ];

      const accountIds = arns.map(arn => {
        const match = arn.match(/:(\d+):/);
        return match ? match[1] : null;
      });

      const uniqueAccountIds = [...new Set(accountIds.filter(id => id !== null))];
      expect(uniqueAccountIds.length).toBe(1);
      expect(uniqueAccountIds[0]).toMatch(/^\d+$/);
    });

    test('all resources should be in us-east-1 region', () => {
      const regionalResources = [
        outputs.LoadBalancerArn,
        outputs.TargetGroupArn,
        outputs.DynamoDBTableArn,
        outputs.SNSTopicArn
      ];

      regionalResources.forEach(resource => {
        expect(resource).toContain('us-east-1');
      });
    });
  });

  describe('Outputs Completeness', () => {
    test('should have all required networking outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have all required compute outputs', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
    });

    test('should have all required load balancer outputs', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerArn).toBeDefined();
      expect(outputs.TargetGroupArn).toBeDefined();
    });

    test('should have all required data storage outputs', () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.DynamoDBStreamArn).toBeDefined();
    });

    test('should have all required monitoring outputs', () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();
      expect(outputs.CloudWatchLogGroupName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('should have all required configuration outputs', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).toBeDefined();
      expect(outputs.SSMParameterAPIKey).toBeDefined();
    });
  });
});
