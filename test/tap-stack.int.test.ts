// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Integration Tests', () => {
  it('should have ALB DNS output', () => {
    expect(outputs).toHaveProperty('ALBDNSName');
    expect(typeof outputs.ALBDNSName).toBe('string');
    expect(outputs.ALBDNSName.length).toBeGreaterThan(0);
  });

  it('should have RDS Endpoint output', () => {
    expect(outputs).toHaveProperty('RDSEndpoint');
    expect(typeof outputs.RDSEndpoint).toBe('string');
    expect(outputs.RDSEndpoint.length).toBeGreaterThan(0);
  });

  it('should have VPC and subnet outputs', () => {
    expect(outputs).toHaveProperty('VPCId');
    expect(outputs).toHaveProperty('PublicSubnet1Id');
    expect(outputs).toHaveProperty('PublicSubnet2Id');
    expect(outputs).toHaveProperty('PrivateSubnet1Id');
    expect(outputs).toHaveProperty('PrivateSubnet2Id');
  });

  it('should respond to HTTP on ALB DNS', async () => {
    // Note: This test assumes the ALB forwards to a healthy instance running HTTP server on port 80
    const albDns = outputs.ALBDNSName.startsWith('http')
      ? outputs.ALBDNSName
      : `http://${outputs.ALBDNSName}`;
    const response = await axios.get(albDns, { timeout: 10000 });
    expect(response.status).toBe(200);
    // Optionally check for content
    expect(response.data).toBeDefined();
  });

  // Add more integration tests as needed, e.g., DB connectivity, etc.
});