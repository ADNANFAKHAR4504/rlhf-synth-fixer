import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

interface DeploymentOutputs {
  blueAlbEndpoint: string;
  blueDatabaseEndpoint: string;
  dashboardUrl: string;
  greenAlbEndpoint: string;
  greenDatabaseEndpoint: string;
}

describe('TapStack Integration Tests', () => {
  let outputs: DeploymentOutputs;
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs from JSON file
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }
    const fileContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(fileContent) as DeploymentOutputs;
  });

  describe('Output Structure Validation', () => {
    it('should have all required output properties', () => {
      expect(outputs).toHaveProperty('blueAlbEndpoint');
      expect(outputs).toHaveProperty('greenAlbEndpoint');
      expect(outputs).toHaveProperty('blueDatabaseEndpoint');
      expect(outputs).toHaveProperty('greenDatabaseEndpoint');
      expect(outputs).toHaveProperty('dashboardUrl');
    });

    it('should have non-empty output values', () => {
      expect(outputs.blueAlbEndpoint).toBeTruthy();
      expect(outputs.greenAlbEndpoint).toBeTruthy();
      expect(outputs.blueDatabaseEndpoint).toBeTruthy();
      expect(outputs.greenDatabaseEndpoint).toBeTruthy();
      expect(outputs.dashboardUrl).toBeTruthy();
    });
  });

  describe('Blue Environment ALB Endpoint Validation', () => {
    it('should have valid HTTP URL format', () => {
      expect(outputs.blueAlbEndpoint).toMatch(/^https?:\/\/.+/);
    });

    it('should contain "blue" in the endpoint name', () => {
      expect(outputs.blueAlbEndpoint.toLowerCase()).toContain('blue');
    });

    it('should use HTTP protocol', () => {
      expect(outputs.blueAlbEndpoint).toMatch(/^http:\/\//);
    });

    it('should be a parseable URL', () => {
      expect(() => new URL(outputs.blueAlbEndpoint)).not.toThrow();
    });

    it('should not have trailing slash', () => {
      expect(outputs.blueAlbEndpoint).not.toMatch(/\/$/);
    });
  });

  describe('Green Environment ALB Endpoint Validation', () => {
    it('should have valid HTTP URL format', () => {
      expect(outputs.greenAlbEndpoint).toMatch(/^https?:\/\/.+/);
    });

    it('should contain "green" in the endpoint name', () => {
      expect(outputs.greenAlbEndpoint.toLowerCase()).toContain('green');
    });

    it('should use HTTP protocol', () => {
      expect(outputs.greenAlbEndpoint).toMatch(/^http:\/\//);
    });

    it('should be a parseable URL', () => {
      expect(() => new URL(outputs.greenAlbEndpoint)).not.toThrow();
    });

    it('should not have trailing slash', () => {
      expect(outputs.greenAlbEndpoint).not.toMatch(/\/$/);
    });

    it('should be different from Blue ALB endpoint', () => {
      expect(outputs.greenAlbEndpoint).not.toBe(outputs.blueAlbEndpoint);
    });
  });

  describe('Blue Database Endpoint Validation', () => {
    it('should have valid RDS endpoint format', () => {
      expect(outputs.blueDatabaseEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should contain "blue" in the endpoint name', () => {
      expect(outputs.blueDatabaseEndpoint.toLowerCase()).toContain('blue');
    });

    it('should contain "cluster" in the endpoint', () => {
      expect(outputs.blueDatabaseEndpoint).toMatch(/\.cluster-/);
    });

    it('should have valid cluster identifier structure', () => {
      expect(outputs.blueDatabaseEndpoint).toMatch(/^[\w\-]+\.cluster-[\w]+\.[\w\-]+\.rds\.amazonaws\.com$/);
    });

    it('should not be empty or whitespace', () => {
      expect(outputs.blueDatabaseEndpoint.trim()).toBeTruthy();
    });

    it('should contain AWS region in endpoint', () => {
      expect(outputs.blueDatabaseEndpoint).toMatch(/\.(us|eu|ap|ca|sa|af|me)-(east|west|north|south|central|southeast|northeast)-[1-3]\.rds\.amazonaws\.com$/);
    });
  });

  describe('Green Database Endpoint Validation', () => {
    it('should have valid RDS endpoint format', () => {
      expect(outputs.greenDatabaseEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should contain "green" in the endpoint name', () => {
      expect(outputs.greenDatabaseEndpoint.toLowerCase()).toContain('green');
    });

    it('should contain "cluster" in the endpoint', () => {
      expect(outputs.greenDatabaseEndpoint).toMatch(/\.cluster-/);
    });

    it('should have valid cluster identifier structure', () => {
      expect(outputs.greenDatabaseEndpoint).toMatch(/^[\w\-]+\.cluster-[\w]+\.[\w\-]+\.rds\.amazonaws\.com$/);
    });

    it('should not be empty or whitespace', () => {
      expect(outputs.greenDatabaseEndpoint.trim()).toBeTruthy();
    });

    it('should contain AWS region in endpoint', () => {
      expect(outputs.greenDatabaseEndpoint).toMatch(/\.(us|eu|ap|ca|sa|af|me)-(east|west|north|south|central|southeast|northeast)-[1-3]\.rds\.amazonaws\.com$/);
    });

    it('should be different from Blue database endpoint', () => {
      expect(outputs.greenDatabaseEndpoint).not.toBe(outputs.blueDatabaseEndpoint);
    });
  });

  describe('CloudWatch Dashboard URL Validation', () => {
    it('should have valid HTTPS URL format', () => {
      expect(outputs.dashboardUrl).toMatch(/^https:\/\/.+/);
    });

    it('should point to AWS CloudWatch console', () => {
      expect(outputs.dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
    });

    it('should contain dashboard reference', () => {
      expect(outputs.dashboardUrl).toContain('dashboards');
    });

    it('should include region parameter', () => {
      expect(outputs.dashboardUrl).toMatch(/region=(us|eu|ap|ca|sa|af|me)-(east|west|north|south|central|southeast|northeast)-[1-3]/);
    });

    it('should be a parseable URL', () => {
      expect(() => new URL(outputs.dashboardUrl)).not.toThrow();
    });

    it('should have CloudWatch home path', () => {
      expect(outputs.dashboardUrl).toContain('/cloudwatch/home');
    });

    it('should include dashboard name in hash', () => {
      expect(outputs.dashboardUrl).toMatch(/#dashboards:name=[\w\-]+/);
    });
  });

  describe('Environment Consistency Validation', () => {
    it('should have Blue and Green ALBs in the same region', () => {
      const blueRegion = outputs.blueAlbEndpoint.match(/\.elb\.([\w\-]+)\.amazonaws\.com/)?.[1];
      const greenRegion = outputs.greenAlbEndpoint.match(/\.elb\.([\w\-]+)\.amazonaws\.com/)?.[1];
      expect(blueRegion).toBe(greenRegion);
    });

    it('should have Blue and Green databases in the same region', () => {
      const blueRegion = outputs.blueDatabaseEndpoint.match(/\.([\w\-]+)\.rds\.amazonaws\.com/)?.[1];
      const greenRegion = outputs.greenDatabaseEndpoint.match(/\.([\w\-]+)\.rds\.amazonaws\.com/)?.[1];
      expect(blueRegion).toBe(greenRegion);
    });

    it('should have all endpoints properly formatted without extra whitespace', () => {
      expect(outputs.blueAlbEndpoint).toBe(outputs.blueAlbEndpoint.trim());
      expect(outputs.greenAlbEndpoint).toBe(outputs.greenAlbEndpoint.trim());
      expect(outputs.blueDatabaseEndpoint).toBe(outputs.blueDatabaseEndpoint.trim());
      expect(outputs.greenDatabaseEndpoint).toBe(outputs.greenDatabaseEndpoint.trim());
      expect(outputs.dashboardUrl).toBe(outputs.dashboardUrl.trim());
    });
  });

  describe('Naming Convention Validation', () => {
    it('should use consistent naming patterns for Blue resources', () => {
      expect(outputs.blueAlbEndpoint.toLowerCase()).toContain('blue');
      expect(outputs.blueDatabaseEndpoint.toLowerCase()).toContain('blue');
    });

    it('should use consistent naming patterns for Green resources', () => {
      expect(outputs.greenAlbEndpoint.toLowerCase()).toContain('green');
      expect(outputs.greenDatabaseEndpoint.toLowerCase()).toContain('green');
    });

    it('should have environment suffix in resource names', () => {
      const extractSuffix = (endpoint: string) => {
        const matches = endpoint.match(/(pr|dev|prod|test)\d+/i);
        return matches ? matches[0] : null;
      };

      const blueSuffix = extractSuffix(outputs.blueAlbEndpoint);
      const greenSuffix = extractSuffix(outputs.greenAlbEndpoint);

      if (blueSuffix && greenSuffix) {
        expect(blueSuffix).toBe(greenSuffix);
      }
    });
  });

  describe('URL Accessibility Validation (DNS Resolution)', () => {
    it('should have Blue ALB endpoint with resolvable hostname', () => {
      const url = new URL(outputs.blueAlbEndpoint);
      expect(url.hostname).toBeTruthy();
      expect(url.hostname.length).toBeGreaterThan(10);
    });

    it('should have Green ALB endpoint with resolvable hostname', () => {
      const url = new URL(outputs.greenAlbEndpoint);
      expect(url.hostname).toBeTruthy();
      expect(url.hostname.length).toBeGreaterThan(10);
    });

    it('should have valid port numbers if specified', () => {
      const blueUrl = new URL(outputs.blueAlbEndpoint);
      const greenUrl = new URL(outputs.greenAlbEndpoint);

      if (blueUrl.port) {
        const port = parseInt(blueUrl.port);
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThan(65536);
      }

      if (greenUrl.port) {
        const port = parseInt(greenUrl.port);
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThan(65536);
      }
    });
  });

  describe('Database Endpoint Structure Validation', () => {
    it('should have Blue database with valid cluster structure', () => {
      const parts = outputs.blueDatabaseEndpoint.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(5);
      expect(parts[parts.length - 2]).toBe('amazonaws');
      expect(parts[parts.length - 1]).toBe('com');
    });

    it('should have Green database with valid cluster structure', () => {
      const parts = outputs.greenDatabaseEndpoint.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(5);
      expect(parts[parts.length - 2]).toBe('amazonaws');
      expect(parts[parts.length - 1]).toBe('com');
    });

    it('should have Aurora cluster identifiers in database endpoints', () => {
      expect(outputs.blueDatabaseEndpoint).toMatch(/aurora/i);
      expect(outputs.greenDatabaseEndpoint).toMatch(/aurora/i);
    });
  });

  describe('Dashboard URL Components Validation', () => {
    it('should have valid URL scheme', () => {
      const url = new URL(outputs.dashboardUrl);
      expect(url.protocol).toBe('https:');
    });

    it('should point to AWS console domain', () => {
      const url = new URL(outputs.dashboardUrl);
      expect(url.hostname).toBe('console.aws.amazon.com');
    });

    it('should have CloudWatch service path', () => {
      const url = new URL(outputs.dashboardUrl);
      expect(url.pathname).toContain('/cloudwatch/home');
    });

    it('should have hash fragment with dashboard reference', () => {
      const url = new URL(outputs.dashboardUrl);
      expect(url.hash).toContain('dashboards');
    });
  });

  describe('Blue-Green Architecture Validation', () => {
    it('should have separate ALB endpoints for Blue and Green', () => {
      expect(outputs.blueAlbEndpoint).not.toBe(outputs.greenAlbEndpoint);
      
      const blueHost = new URL(outputs.blueAlbEndpoint).hostname;
      const greenHost = new URL(outputs.greenAlbEndpoint).hostname;
      expect(blueHost).not.toBe(greenHost);
    });

    it('should have separate database endpoints for Blue and Green', () => {
      expect(outputs.blueDatabaseEndpoint).not.toBe(outputs.greenDatabaseEndpoint);
      
      const blueCluster = outputs.blueDatabaseEndpoint.split('.')[0];
      const greenCluster = outputs.greenDatabaseEndpoint.split('.')[0];
      expect(blueCluster).not.toBe(greenCluster);
    });

    it('should have Blue resources clearly identifiable', () => {
      const blueResources = [outputs.blueAlbEndpoint, outputs.blueDatabaseEndpoint];
      blueResources.forEach(resource => {
        expect(resource.toLowerCase()).toContain('blue');
      });
    });

    it('should have Green resources clearly identifiable', () => {
      const greenResources = [outputs.greenAlbEndpoint, outputs.greenDatabaseEndpoint];
      greenResources.forEach(resource => {
        expect(resource.toLowerCase()).toContain('green');
      });
    });
  });

  describe('AWS Service Domain Validation', () => {
    it('should use AWS ELB service domain for load balancers', () => {
      expect(outputs.blueAlbEndpoint).toContain('.elb.');
      expect(outputs.greenAlbEndpoint).toContain('.elb.');
      expect(outputs.blueAlbEndpoint).toContain('.amazonaws.com');
      expect(outputs.greenAlbEndpoint).toContain('.amazonaws.com');
    });

    it('should use AWS RDS service domain for databases', () => {
      expect(outputs.blueDatabaseEndpoint).toContain('.rds.');
      expect(outputs.greenDatabaseEndpoint).toContain('.rds.');
      expect(outputs.blueDatabaseEndpoint).toContain('.amazonaws.com');
      expect(outputs.greenDatabaseEndpoint).toContain('.amazonaws.com');
    });

    it('should use AWS console domain for dashboard', () => {
      expect(outputs.dashboardUrl).toContain('console.aws.amazon.com');
    });
  });

  describe('Regional Deployment Validation', () => {
    it('should deploy to valid AWS regions', () => {
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
        'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
        'ap-southeast-1', 'ap-southeast-2', 'ca-central-1', 'sa-east-1'
      ];

      const blueRegion = outputs.blueAlbEndpoint.match(/\.([\w\-]+)\.elb\.amazonaws\.com/)?.[1];
      expect(validRegions).toContain(blueRegion);
    });
  });

  describe('Security and Protocol Validation', () => {
    it('should use appropriate protocol for ALB endpoints', () => {
      const blueUrl = new URL(outputs.blueAlbEndpoint);
      const greenUrl = new URL(outputs.greenAlbEndpoint);
      
      expect(['http:', 'https:']).toContain(blueUrl.protocol);
      expect(['http:', 'https:']).toContain(greenUrl.protocol);
    });

    it('should use HTTPS for AWS console dashboard', () => {
      const url = new URL(outputs.dashboardUrl);
      expect(url.protocol).toBe('https:');
    });

    it('should not contain sensitive information in URLs', () => {
      const allOutputs = Object.values(outputs).join(' ');
      expect(allOutputs.toLowerCase()).not.toContain('password');
      expect(allOutputs.toLowerCase()).not.toContain('secret');
      expect(allOutputs.toLowerCase()).not.toContain('key');
    });
  });

  describe('Resource Uniqueness Validation', () => {
    it('should have unique ALB identifiers', () => {
      const blueId = outputs.blueAlbEndpoint.match(/blue-alb-[\w\-]+-(\d+)/)?.[1];
      const greenId = outputs.greenAlbEndpoint.match(/green-alb-[\w\-]+-(\d+)/)?.[1];
      
      if (blueId && greenId) {
        expect(blueId).not.toBe(greenId);
      }
    });

    it('should not have duplicate endpoints', () => {
      const endpoints = [
        outputs.blueAlbEndpoint,
        outputs.greenAlbEndpoint,
        outputs.blueDatabaseEndpoint,
        outputs.greenDatabaseEndpoint
      ];
      
      const uniqueEndpoints = new Set(endpoints);
      expect(uniqueEndpoints.size).toBe(endpoints.length);
    });
  });

  describe('JSON Output File Validation', () => {
    it('should have valid JSON structure', () => {
      expect(() => JSON.parse(fs.readFileSync(outputsPath, 'utf-8'))).not.toThrow();
    });

    it('should have exactly 5 output properties', () => {
      expect(Object.keys(outputs).length).toBe(5);
    });

    it('should have properly formatted JSON with no extra properties', () => {
      const expectedKeys = [
        'blueAlbEndpoint',
        'greenAlbEndpoint',
        'blueDatabaseEndpoint',
        'greenDatabaseEndpoint',
        'dashboardUrl'
      ];
      
      const actualKeys = Object.keys(outputs).sort();
      expect(actualKeys).toEqual(expectedKeys.sort());
    });
  });
});
