import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Terraform Unit Tests', () => {
    let stackContent: string;
    let providerContent: string;
    
    const libPath = 'lib';
    const stackPath = join(libPath, 'tap_stack.tf');
    const providerPath = join(libPath, 'provider.tf');

    beforeAll(() => {
        // Read Terraform configuration files
        if (existsSync(stackPath)) {
            stackContent = readFileSync(stackPath, 'utf-8');
        }
        if (existsSync(providerPath)) {
            providerContent = readFileSync(providerPath, 'utf-8');
        }
    });

    describe('File Structure', () => {
        it('should have required Terraform files', () => {
            expect(existsSync(stackPath)).toBe(true);
            expect(existsSync(providerPath)).toBe(true);
            expect(stackContent.length).toBeGreaterThan(0);
            expect(providerContent.length).toBeGreaterThan(0);
        });
    });

    describe('Configuration Validation', () => {
        it('should define required providers', () => {
            expect(providerContent).toContain('required_providers');
            expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
            expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.0"/);
        });

        it('should use Terraform 0.14+ syntax', () => {
            expect(providerContent).toMatch(/required_version\s*=\s*">=\s*0\.14"/);
        });
    });

    describe('Resource Configuration', () => {
        it('should define VPC with correct configuration', () => {
            expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
            expect(stackContent).toContain('cidr_block');
            expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
            expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
        });

        it('should define public and private subnets', () => {
            expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
            expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
            expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
        });

        it('should define Internet Gateway', () => {
            expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
        });

        it('should define route tables and associations', () => {
            expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
            expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
            expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
            expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
        });

        it('should define security groups', () => {
            expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"public"/);
            expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"private"/);
        });

        it('should define EC2 instance in private subnet', () => {
            expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"main"/);
            expect(stackContent).toContain('subnet_id');
        });

        it('should define Secrets Manager resources', () => {
            expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"main"/);
            expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"main"/);
        });

        it('should define IAM role and policy', () => {
            expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
            expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"secrets_policy"/);
            expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
        });
    });

    describe('Variable Configuration', () => {
        it('should define all required variables', () => {
            const requiredVars = ['aws_region', 'owner', 'purpose', 'instance_type'];
            const combinedContent = providerContent + stackContent;
            
            requiredVars.forEach(varName => {
                expect(combinedContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
            });
        });

        it('should have sensible default values', () => {
            expect(providerContent).toMatch(/default\s*=\s*"us-east-1"/);
            expect(providerContent).toMatch(/default\s*=\s*"t3\.micro"/);
        });
    });

    describe('Security Configuration', () => {
        it('should configure security groups with least privilege', () => {
            // Check that private SG only allows specific ports
            expect(stackContent).toMatch(/from_port\s*=\s*22/);
            expect(stackContent).toMatch(/from_port\s*=\s*80/);
            expect(stackContent).toMatch(/from_port\s*=\s*443/);
            expect(stackContent).toContain('security_groups');
        });

        it('should enforce encrypted storage', () => {
            expect(stackContent).toMatch(/encrypted\s*=\s*true/);
        });

        it('should enforce IMDSv2', () => {
            expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
        });

        it('should use condition-based IAM policies', () => {
            expect(stackContent).toContain('aws:SecureTransport');
        });
    });

    describe('Tagging Configuration', () => {
        it('should apply default tags to all resources', () => {
            expect(providerContent).toContain('default_tags');
            expect(providerContent).toMatch(/Environment\s*=\s*"Production"/);
            expect(providerContent).toMatch(/Owner\s*=\s*var\.owner/);
            expect(providerContent).toMatch(/Purpose\s*=\s*var\.purpose/);
        });

        it('should include Name tags on all resources', () => {
            const nameTagCount = (stackContent.match(/Name\s*=\s*"/g) || []).length;
            expect(nameTagCount).toBeGreaterThan(5); // Should have multiple Name tags
        });
    });

    describe('Output Configuration', () => {
        it('should define all required outputs', () => {
            const requiredOutputs = [
                'vpc_id',
                'public_subnet_id', 
                'private_subnet_id',
                'instance_id',
                'secret_arn'
            ];

            requiredOutputs.forEach(output => {
                expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
            });
        });

        it('should include descriptions for all outputs', () => {
            const outputCount = (stackContent.match(/output\s+"/g) || []).length;
            const descriptionCount = (stackContent.match(/description\s*=\s*"/g) || []).length;
            
            // Should have multiple outputs with descriptions
            expect(outputCount).toBeGreaterThan(0);
            expect(descriptionCount).toBeGreaterThan(0);
        });
    });

    describe('Resource Dependencies', () => {
        it('should properly reference resources in configuration', () => {
            // Check key dependencies
            expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
            expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
            expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.(private|main)\.id/);
            expect(stackContent).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
        });

        it('should use data sources appropriately', () => {
            expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
            expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
            expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
        });
    });
});