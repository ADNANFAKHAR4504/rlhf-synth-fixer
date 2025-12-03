import {
  ComplianceStatus,
  ViolationSeverity,
  ResourceType,
  ComplianceError,
} from '../lib/types';

describe('Types Module', () => {
  describe('ComplianceStatus enum', () => {
    it('should have all expected statuses', () => {
      expect(ComplianceStatus.COMPLIANT).toBe('COMPLIANT');
      expect(ComplianceStatus.NON_COMPLIANT).toBe('NON_COMPLIANT');
      expect(ComplianceStatus.NOT_APPLICABLE).toBe('NOT_APPLICABLE');
      expect(ComplianceStatus.ERROR).toBe('ERROR');
    });
  });

  describe('ViolationSeverity enum', () => {
    it('should have all expected severities', () => {
      expect(ViolationSeverity.CRITICAL).toBe('CRITICAL');
      expect(ViolationSeverity.HIGH).toBe('HIGH');
      expect(ViolationSeverity.MEDIUM).toBe('MEDIUM');
      expect(ViolationSeverity.LOW).toBe('LOW');
      expect(ViolationSeverity.INFO).toBe('INFO');
    });
  });

  describe('ResourceType enum', () => {
    it('should have all expected resource types', () => {
      expect(ResourceType.S3_BUCKET).toBe('AWS::S3::Bucket');
      expect(ResourceType.EC2_INSTANCE).toBe('AWS::EC2::Instance');
      expect(ResourceType.RDS_INSTANCE).toBe('AWS::RDS::DBInstance');
      expect(ResourceType.LAMBDA_FUNCTION).toBe('AWS::Lambda::Function');
      expect(ResourceType.IAM_ROLE).toBe('AWS::IAM::Role');
      expect(ResourceType.SECURITY_GROUP).toBe('AWS::EC2::SecurityGroup');
      expect(ResourceType.EBS_VOLUME).toBe('AWS::EC2::Volume');
      expect(ResourceType.CLOUDWATCH_LOG_GROUP).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('ComplianceError', () => {
    it('should create error with message and context', () => {
      const context = { resourceId: 'test-resource', region: 'us-east-1' };
      const error = new ComplianceError('Test error message', context);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ComplianceError);
      expect(error.message).toBe('Test error message');
      expect(error.context).toEqual(context);
      expect(error.name).toBe('ComplianceError');
    });

    it('should preserve stack trace', () => {
      const error = new ComplianceError('Test error', {});
      expect(error.stack).toBeDefined();
    });
  });
});
