import fs from 'fs';
import path from 'path';
import { parse } from 'hcl2-parser';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MAIN_TF = path.join(LIB_DIR, 'main.tf');
const VARIABLES_TF = path.join(LIB_DIR, 'variables.tf');
const OUTPUTS_TF = path.join(LIB_DIR, 'outputs.tf');
const PROVIDER_TF = path.join(LIB_DIR, 'provider.tf');

describe('Terraform Infrastructure Analysis - Unit Tests', () => {
  describe('File Existence', () => {
    test('main.tf exists', () => {
      expect(fs.existsSync(MAIN_TF)).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fs.existsSync(VARIABLES_TF)).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
    });

    test('provider.tf exists', () => {
      expect(fs.existsSync(PROVIDER_TF)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('provider.tf configures AWS provider', () => {
      const content = fs.readFileSync(PROVIDER_TF, 'utf8');
      expect(content).toContain('provider');
      expect(content).toContain('aws');
    });

    test('main.tf declares required providers', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toContain('hashicorp/aws');
      expect(content).toContain('hashicorp/local');
    });

    test('main.tf specifies required Terraform version', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });
  });

  describe('Variables Configuration', () => {
    test('variables.tf declares aws_region variable', () => {
      const content = fs.readFileSync(VARIABLES_TF, 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toContain('default');
      expect(content).toContain('us-east-1');
    });

    test('variables.tf declares environment_suffix variable', () => {
      const content = fs.readFileSync(VARIABLES_TF, 'utf8');
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test('variables.tf declares output_dir variable', () => {
      const content = fs.readFileSync(VARIABLES_TF, 'utf8');
      expect(content).toMatch(/variable\s+"output_dir"/);
    });
  });

  describe('Data Sources', () => {
    test('main.tf declares EC2 instances data source', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/data\s+"aws_instances"\s+"all"/);
    });

    test('main.tf declares security groups data source', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/data\s+"aws_security_groups"\s+"all"/);
    });

    test('main.tf declares IAM roles data source', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/data\s+"aws_iam_roles"\s+"all"/);
    });

    test('main.tf declares VPCs data source', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/data\s+"aws_vpcs"\s+"all"/);
    });

    test('main.tf declares RDS instances data source', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/data\s+"aws_db_instances"\s+"all"/);
    });
  });

  describe('Local Variables', () => {
    test('main.tf defines locals block', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/locals\s*{/);
    });

    test('main.tf defines timestamp local', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/timestamp\s*=\s*formatdate/);
    });

    test('main.tf defines required_tags local', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toContain('required_tags');
      expect(content).toContain('Environment');
      expect(content).toContain('Owner');
      expect(content).toContain('CostCenter');
    });

    test('main.tf defines ec2_cost_map local', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toContain('ec2_cost_map');
      expect(content).toContain('t2.micro');
      expect(content).toContain('t3.micro');
    });
  });

  describe('Report Generation', () => {
    test('main.tf creates EC2 analysis report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"ec2_analysis"/);
      expect(content).toContain('ec2-analysis-');
    });

    test('main.tf creates security group analysis report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"security_group_analysis"/);
      expect(content).toContain('security-group-analysis-');
    });

    test('main.tf creates S3 analysis report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"s3_analysis"/);
      expect(content).toContain('s3-analysis-');
    });

    test('main.tf creates IAM analysis report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"iam_analysis"/);
      expect(content).toContain('iam-analysis-');
    });

    test('main.tf creates VPC analysis report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"vpc_analysis"/);
      expect(content).toContain('vpc-analysis-');
    });

    test('main.tf creates RDS analysis report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"rds_analysis"/);
      expect(content).toContain('rds-analysis-');
    });

    test('main.tf creates cost estimation report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"cost_estimation"/);
      expect(content).toContain('cost-estimation-');
    });

    test('main.tf creates summary report', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"summary"/);
      expect(content).toContain('summary-');
    });
  });

  describe('Report Filename Convention', () => {
    test('all reports include environment_suffix in filename', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      const reportNames = [
        'ec2-analysis',
        'security-group-analysis',
        's3-analysis',
        'iam-analysis',
        'vpc-analysis',
        'rds-analysis',
        'cost-estimation',
        'summary',
      ];

      reportNames.forEach((name) => {
        expect(content).toMatch(
          new RegExp(`${name}-\\$\\{var\\.environment_suffix\\}\\.json`)
        );
      });
    });
  });

  describe('Output Configuration', () => {
    test('outputs.tf defines analysis_summary output', () => {
      const content = fs.readFileSync(OUTPUTS_TF, 'utf8');
      expect(content).toMatch(/output\s+"analysis_summary"/);
    });

    test('outputs.tf defines critical_findings output', () => {
      const content = fs.readFileSync(OUTPUTS_TF, 'utf8');
      expect(content).toMatch(/output\s+"critical_findings"/);
    });

    test('outputs.tf defines reports_generated output', () => {
      const content = fs.readFileSync(OUTPUTS_TF, 'utf8');
      expect(content).toMatch(/output\s+"reports_generated"/);
    });
  });

  describe('Analysis Logic', () => {
    test('main.tf includes EC2 instance analysis logic', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toContain('ec2_instances');
      expect(content).toContain('missing_tags');
      expect(content).toContain('has_compliance_issues');
    });

    test('main.tf includes cost analysis logic', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toContain('ec2_cost_analysis');
      expect(content).toContain('total_ec2_cost');
      expect(content).toContain('estimated_monthly_cost');
    });

    test('main.tf includes security group analysis logic', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toContain('security_groups');
      expect(content).toContain('has_unrestricted_access');
    });
  });

  describe('JSON Encoding', () => {
    test('all reports use jsonencode function', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      const reportResources = [
        'ec2_analysis',
        'security_group_analysis',
        's3_analysis',
        'iam_analysis',
        'vpc_analysis',
        'rds_analysis',
        'cost_estimation',
        'summary',
      ];

      reportResources.forEach((resource) => {
        const resourceBlock = new RegExp(
          `resource\\s+"local_file"\\s+"${resource}"[\\s\\S]*?jsonencode`
        );
        expect(content).toMatch(resourceBlock);
      });
    });
  });

  describe('Dependencies', () => {
    test('report files depend on output_dir creation', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      const reportResources = [
        'ec2_analysis',
        'security_group_analysis',
        's3_analysis',
        'iam_analysis',
        'vpc_analysis',
        'rds_analysis',
        'cost_estimation',
      ];

      reportResources.forEach((resource) => {
        const dependsPattern = new RegExp(
          `resource\\s+"local_file"\\s+"${resource}"[\\s\\S]*?depends_on\\s*=\\s*\\[\\s*local_file\\.output_dir`
        );
        expect(content).toMatch(dependsPattern);
      });
    });

    test('summary report depends on all other reports', () => {
      const content = fs.readFileSync(MAIN_TF, 'utf8');
      expect(content).toMatch(/resource\s+"local_file"\s+"summary"[\s\S]*?depends_on/);
      expect(content).toContain('local_file.ec2_analysis');
      expect(content).toContain('local_file.security_group_analysis');
      expect(content).toContain('local_file.rds_analysis');
    });
  });

  describe('README Documentation', () => {
    test('README.md exists', () => {
      const readmePath = path.join(LIB_DIR, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('README.md contains usage instructions', () => {
      const readmePath = path.join(LIB_DIR, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf8');
      expect(content).toContain('terraform init');
      expect(content).toContain('terraform apply');
    });
  });

  describe('AWS Region Configuration', () => {
    test('AWS_REGION file exists', () => {
      const regionPath = path.join(LIB_DIR, 'AWS_REGION');
      expect(fs.existsSync(regionPath)).toBe(true);
    });

    test('AWS_REGION file contains valid region', () => {
      const regionPath = path.join(LIB_DIR, 'AWS_REGION');
      const content = fs.readFileSync(regionPath, 'utf8').trim();
      expect(content).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
  });
});
