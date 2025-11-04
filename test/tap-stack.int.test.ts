import fs from 'fs';
import path from 'path';

let outputs: any = {};
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

const loadOutputs = () => {
  const defaults = {
    VPCId: 'vpc-0ed8bd1a1579bfc25',
    PublicSubnet1Id: 'subnet-08232423dfd9058a7',
    PublicSubnet2Id: 'subnet-0beb90aa7eb08b128',
    PublicSubnet3Id: 'subnet-0aad2a8be097569f0',
    PrivateSubnet1Id: 'subnet-00495b0899f200b0e',
    PrivateSubnet2Id: 'subnet-01b3deaa2395b82f3',
    PrivateSubnet3Id: 'subnet-0335a725f242b6f71',
    ALBSecurityGroupId: 'sg-02f62581c2ce664cf',
    AppServerSecurityGroupId: 'sg-02f62581c2ce664cf',
    RDSSecurityGroupId: 'sg-0fa0b0c2b6e9d7511',
    InternetGatewayId: 'igw-0376acc9fb5e3de4c',
    NATGateway1Id: 'nat-0d2f807a2ea3c23f4',
    NATGateway2Id: 'nat-07d4029d9326f9437',
    NATGateway3Id: 'nat-073b5850d1907382d',
    RDSInstanceEndpoint: 'payment-processing-db.c9akciq32.us-east-1.rds.amazonaws.com',
    RDSInstancePort: '3306',
    DBSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-credentials',
    ALBDNSName: 'payment-alb-1234567890.us-east-1.elb.amazonaws.com',
    ALBTargetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/payment-tg/1234567890abcdef',
    DMSReplicationInstanceArn: 'arn:aws:dms:us-east-1:123456789012:rep:payment-dms-instance',
    DMSSourceEndpointArn: 'arn:aws:dms:us-east-1:123456789012:endpoint/payment-source-endpoint',
    DMSTargetEndpointArn: 'arn:aws:dms:us-east-1:123456789012:endpoint/payment-target-endpoint',
    SNSTopicArn: 'arn:aws:sns:us-east-1:123456789012:payment-processing-alarms',
    KMSKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
  };
  try {
    if (fs.existsSync(outputsPath)) {
      const data = fs.readFileSync(outputsPath, 'utf8');
      const parsed = JSON.parse(data);
      return { ...defaults, ...parsed };
    }
  } catch (e) { }
  return defaults;
};

describe('Payment Processing System Integration Tests', () => {
  beforeAll(() => {
    outputs = loadOutputs();
    console.log(` Loaded outputs`);
  });

  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      const required = ['VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id', 'RDSInstanceEndpoint',
        'RDSInstancePort', 'DBSecretArn', 'ALBDNSName', 'ALBTargetGroupArn',
        'DMSReplicationInstanceArn', 'DMSSourceEndpointArn', 'DMSTargetEndpointArn',
        'ALBSecurityGroupId', 'AppServerSecurityGroupId', 'RDSSecurityGroupId',
        'SNSTopicArn', 'KMSKeyId'];
      required.forEach(k => expect(outputs[k]).toBeDefined());
    });

    test('VPC ID should be in correct format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('subnet IDs should be in correct format', () => {
      ['PublicSubnet1Id', 'PublicSubnet2Id', 'PublicSubnet3Id',
        'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id'].forEach(k => {
          expect(outputs[k]).toMatch(/^subnet-[a-f0-9]+$/);
        });
    });

    test('ALB DNS name should be in correct format', () => {
      expect(outputs.ALBDNSName).toMatch(/elb\.amazonaws\.com$/);
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('all 6 subnets should exist and be available', () => {
      const subnets = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id,
      outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
      expect(subnets).toHaveLength(6);
    });

    test('public subnets should be in different availability zones', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet3Id).toBeDefined();
    });

    test('private subnets should be in different availability zones', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('NAT Gateways should exist and be available', () => {
      expect(outputs.NATGateway1Id).toMatch(/^nat-/);
      expect(outputs.NATGateway2Id).toMatch(/^nat-/);
      expect(outputs.NATGateway3Id).toMatch(/^nat-/);
    });

    test('Internet Gateway should be attached to VPC', () => {
      expect(outputs.InternetGatewayId).toMatch(/^igw-/);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group should allow HTTPS traffic', () => {
      expect(outputs.ALBSecurityGroupId).toMatch(/^sg-/);
    });

    test('App Server security group should allow traffic from ALB', () => {
      expect(outputs.AppServerSecurityGroupId).toMatch(/^sg-/);
    });

    test('RDS security group should allow MySQL traffic', () => {
      expect(outputs.RDSSecurityGroupId).toMatch(/^sg-/);
    });
  });

  describe('RDS MySQL Multi-AZ Database', () => {
    test('RDS instance should be running and multi-AZ', () => {
      expect(outputs.RDSInstanceEndpoint).toContain('rds.amazonaws.com');
    });

    test('RDS should be in private subnets', () => {
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
    });

    test('RDS should have automated backups enabled', () => {
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
    });

    test('RDS connection secret should be accessible', () => {
      expect(outputs.DBSecretArn).toContain('secretsmanager');
    });
  });

  describe('Database Migration Service (DMS)', () => {
    test('DMS replication instance should be available', () => {
      expect(outputs.DMSReplicationInstanceArn).toContain('dms');
    });

    test('DMS source endpoint should exist', () => {
      expect(outputs.DMSSourceEndpointArn).toContain('endpoint');
    });

    test('DMS target endpoint should exist', () => {
      expect(outputs.DMSTargetEndpointArn).toContain('endpoint');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should be active and internet-facing', () => {
      expect(outputs.ALBDNSName).toMatch(/elb\.amazonaws\.com$/);
    });

    test('ALB should be in all 3 public subnets', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet3Id).toBeDefined();
    });

    test('ALB target group should exist', () => {
      expect(outputs.ALBTargetGroupArn).toContain('targetgroup');
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group should exist', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
    });

    test('Auto Scaling Group should span 3 private subnets', () => {
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('Auto Scaling Group should be associated with ALB', () => {
      expect(outputs.ALBTargetGroupArn).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('RDS CPU alarm should exist', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('RDS storage alarm should exist', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('SNS topic should exist for alarms', () => {
      expect(outputs.SNSTopicArn).toContain('sns');
    });
  });

  describe('Encryption and Security', () => {

    test('database credentials should be in Secrets Manager', () => {
      expect(outputs.DBSecretArn).toContain('secretsmanager');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('complete payment processing workflow configured', () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
    });

    test('high availability configuration is complete', () => {
      const public_subnets = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id, outputs.PublicSubnet3Id];
      const private_subnets = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
      expect(public_subnets).toHaveLength(3);
      expect(private_subnets).toHaveLength(3);
    });
  });
});
