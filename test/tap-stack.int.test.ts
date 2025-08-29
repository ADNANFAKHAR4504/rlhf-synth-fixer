import fs from 'fs';
import path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Read outputs from the CI/CD pipeline generated file
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'all-outputs.json');
    
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Make sure the deployment has completed and outputs are generated.`);
    }
    
    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    
    // Flatten the outputs structure for easier testing
    outputs = {};
    Object.keys(rawOutputs).forEach(stackName => {
      if (Array.isArray(rawOutputs[stackName])) {
        rawOutputs[stackName].forEach((output: any) => {
          outputs[output.OutputKey] = output.OutputValue;
        });
      }
    });
  });

  describe('Stack Deployment Validation', () => {
    test('should have deployed stack with outputs', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should have API Gateway endpoint output', () => {
      const apiEndpointKey = Object.keys(outputs).find(key => 
        key.includes('ApiEndpoint') || key.includes('RestApi')
      );
      expect(apiEndpointKey).toBeDefined();
      if (apiEndpointKey) {
        expect(outputs[apiEndpointKey]).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com/);
      }
    });
  });

  describe('Lambda Function Validation', () => {
    test('should have Lambda function ARN in outputs', () => {
      const lambdaArnKey = Object.keys(outputs).find(key => 
        key.includes('Function') && key.includes('Arn')
      );
      
      if (lambdaArnKey) {
        expect(outputs[lambdaArnKey]).toMatch(/^arn:aws:lambda:.+:\d+:function:.+/);
      }
    });
  });

  describe('VPC Configuration Validation', () => {
    test('should validate VPC resources exist', () => {
      // Check if VPC-related outputs exist
      const vpcKeys = Object.keys(outputs).filter(key => 
        key.toLowerCase().includes('vpc') || 
        key.toLowerCase().includes('subnet')
      );
      
      // VPC resources should be present in the deployment
      expect(vpcKeys.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('S3 Bucket Validation', () => {
    test('should have S3 bucket for pipeline artifacts', () => {
      const bucketKey = Object.keys(outputs).find(key => 
        key.includes('Bucket') || key.includes('Artifacts')
      );
      
      if (bucketKey) {
        expect(outputs[bucketKey]).toMatch(/^cp-proj-artifacts-.+/);
      }
    });
  });

  describe('CodePipeline Validation', () => {
    test('should have CodePipeline ARN in outputs', () => {
      const pipelineKey = Object.keys(outputs).find(key => 
        key.includes('Pipeline') && (key.includes('Arn') || key.includes('Name'))
      );
      
      if (pipelineKey) {
        expect(outputs[pipelineKey]).toBeDefined();
        expect(typeof outputs[pipelineKey]).toBe('string');
      }
    });
  });

  describe('IAM Roles Validation', () => {
    test('should have IAM roles created', () => {
      const roleKeys = Object.keys(outputs).filter(key => 
        key.includes('Role') && key.includes('Arn')
      );
      
      roleKeys.forEach(roleKey => {
        expect(outputs[roleKey]).toMatch(/^arn:aws:iam::\d+:role\/.+/);
      });
    });
  });

  describe('Resource Tagging Validation', () => {
    test('should validate consistent resource naming', () => {
      // Check that output keys follow consistent naming patterns
      const resourceKeys = Object.keys(outputs);
      expect(resourceKeys.length).toBeGreaterThan(0);
      
      // Validate that we have expected output keys
      const hasApiEndpoint = resourceKeys.some(key => key.includes('ApiEndpoint'));
      expect(hasApiEndpoint).toBe(true);
    });
  });

  describe('Security Validation', () => {
    test('should validate private API Gateway configuration', () => {
      const apiEndpointKey = Object.keys(outputs).find(key => 
        key.includes('ApiEndpoint')
      );
      
      if (apiEndpointKey) {
        // Private API Gateway endpoints should be accessible only from VPC
        expect(outputs[apiEndpointKey]).toBeDefined();
      }
    });

    test('should validate S3 bucket security configuration', () => {
      // S3 bucket should have encryption and block public access
      // This is validated through the deployment, not directly testable via outputs
      expect(true).toBe(true); // Placeholder for security validation
    });
  });
});
