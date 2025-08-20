import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration', () => {
  const libDir = path.join(__dirname, '..', 'lib');
  
  test('should have all required Terraform files', () => {
    const requiredFiles = [
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'provider.tf',
      'locals.tf'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(libDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('should have valid Terraform syntax in main.tf', () => {
    const mainTfPath = path.join(libDir, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');
    
    expect(content).toContain('resource');
    expect(content).toContain('data');
    expect(content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{/)).toBeTruthy();
  });

  test('should have proper resource naming conventions', () => {
    const files = [
      'main.tf',
      'ec2.tf',
      'rds.tf',
      's3.tf',
      'monitoring.tf',
      'cloudfront_waf.tf'
    ];

    files.forEach(file => {
      const filePath = path.join(libDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('random_id.bucket_suffix.hex')) {
          expect(content).toMatch(/\${[^}]*random_id\.bucket_suffix\.hex[^}]*}/);
        }
      }
    });
  });

  test('should use local.project_prefix in resource names', () => {
    const files = ['main.tf', 'ec2.tf', 'rds.tf', 's3.tf', 'monitoring.tf'];
    
    files.forEach(file => {
      const filePath = path.join(libDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('resource ')) {
          expect(content).toMatch(/\${local\.project_prefix}/);
        }
      }
    });
  });
});