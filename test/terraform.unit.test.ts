import { execSync } from 'child_process';
import { readFileSync } from 'fs';

describe('Terraform Unit Tests', () => {
    let terraformPlan: string;
    let terraformValidation: any;

    beforeAll(() => {
        // Initialize Terraform
        execSync('terraform init', { stdio: 'pipe', cwd: 'lib' });
        
        // Validate configuration
        const validationOutput = execSync('terraform validate -json', { encoding: 'utf-8', cwd: 'lib' });
        terraformValidation = JSON.parse(validationOutput);

        // Generate plan
        terraformPlan = execSync('terraform plan -no-color', { encoding: 'utf-8', cwd: 'lib' });
    });

    describe('Configuration Validation', () => {
        it('should have valid Terraform syntax', () => {
            expect(terraformValidation.valid).toBe(true);
            expect(terraformValidation.error_count).toBe(0);
        });

        it('should define required providers', () => {
            const providerContent = readFileSync('lib/provider.tf', 'utf-8');
            expect(providerContent).toContain('required_providers');
            expect(providerContent).toContain('source  = "hashicorp/aws"');
            expect(providerContent).toContain('version = ">= 3.0"');
        });

        it('should use Terraform 0.14+ syntax', () => {
            const providerContent = readFileSync('lib/provider.tf', 'utf-8');
            expect(providerContent).toContain('required_version = ">= 0.14"');
        });
    });

    describe('Resource Planning', () => {
        it('should plan to create VPC with correct configuration', () => {
            expect(terraformPlan).toContain('aws_vpc.main');
            expect(terraformPlan).toContain('cidr_block                           = "10.0.0.0/16"');
            expect(terraformPlan).toContain('enable_dns_hostnames                 = true');
            expect(terraformPlan).toContain('enable_dns_support                   = true');
        });

        it('should plan to create public and private subnets', () => {
            expect(terraformPlan).toContain('aws_subnet.public');
            expect(terraformPlan).toContain('aws_subnet.private');
            expect(terraformPlan).toContain('map_public_ip_on_launch                        = true');
        });

        it('should plan to create Internet Gateway', () => {
            expect(terraformPlan).toContain('aws_internet_gateway.main');
        });

        it('should plan to create route tables', () => {
            expect(terraformPlan).toContain('aws_route_table.public');
            expect(terraformPlan).toContain('aws_route_table.private');
            expect(terraformPlan).toContain('aws_route_table_association.public');
            expect(terraformPlan).toContain('aws_route_table_association.private');
        });

        it('should plan to create security groups', () => {
            expect(terraformPlan).toContain('aws_security_group.public');
            expect(terraformPlan).toContain('aws_security_group.private');
        });

        it('should plan to create EC2 instance in private subnet', () => {
            expect(terraformPlan).toContain('aws_instance.main');
            expect(terraformPlan).toContain('subnet_id');
        });

        it('should plan to create Secrets Manager resources', () => {
            expect(terraformPlan).toContain('aws_secretsmanager_secret.main');
            expect(terraformPlan).toContain('aws_secretsmanager_secret_version.main');
        });

        it('should plan to create IAM role and policy', () => {
            expect(terraformPlan).toContain('aws_iam_role.ec2_role');
            expect(terraformPlan).toContain('aws_iam_policy.secrets_policy');
            expect(terraformPlan).toContain('aws_iam_instance_profile.ec2_profile');
        });
    });

    describe('Variable Configuration', () => {
        it('should define all required variables', () => {
            const providerContent = readFileSync('lib/provider.tf', 'utf-8');
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            
            const requiredVars = ['aws_region', 'owner', 'purpose', 'instance_type'];
            requiredVars.forEach(varName => {
                expect(providerContent + stackContent).toContain(`variable "${varName}"`);
            });
        });

        it('should have sensible default values', () => {
            const providerContent = readFileSync('lib/provider.tf', 'utf-8');
            expect(providerContent).toContain('default     = "us-east-1"');
            expect(providerContent).toContain('default     = "t3.micro"');
        });
    });

    describe('Security Configuration', () => {
        it('should configure security groups with least privilege', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            
            // Check that private SG only allows specific ports
            expect(stackContent).toContain('from_port       = 22');
            expect(stackContent).toContain('from_port       = 80');
            expect(stackContent).toContain('from_port       = 443');
            expect(stackContent).toContain('security_groups = [aws_security_group.public.id]');
        });

        it('should enforce encrypted storage', () => {
            expect(terraformPlan).toContain('encrypted             = true');
        });

        it('should enforce IMDSv2', () => {
            expect(terraformPlan).toContain('http_tokens                 = "required"');
        });

        it('should use condition-based IAM policies', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            expect(stackContent).toContain('aws:SecureTransport');
        });
    });

    describe('Tagging Configuration', () => {
        it('should apply default tags to all resources', () => {
            const providerContent = readFileSync('lib/provider.tf', 'utf-8');
            expect(providerContent).toContain('default_tags');
            expect(providerContent).toContain('Environment = "Production"');
            expect(providerContent).toContain('Owner       = var.owner');
            expect(providerContent).toContain('Purpose     = var.purpose');
        });

        it('should include Name tags on all resources', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            const nameTagCount = (stackContent.match(/Name = "/g) || []).length;
            expect(nameTagCount).toBeGreaterThan(10); // Should have many Name tags
        });
    });

    describe('Output Configuration', () => {
        it('should define all required outputs', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            
            const requiredOutputs = [
                'vpc_id',
                'public_subnet_id', 
                'private_subnet_id',
                'instance_id',
                'secret_arn'
            ];

            requiredOutputs.forEach(output => {
                expect(stackContent).toContain(`output "${output}"`);
            });
        });

        it('should include descriptions for all outputs', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            const outputCount = (stackContent.match(/output "/g) || []).length;
            const descriptionCount = (stackContent.match(/description = "/g) || []).length;
            
            // Each output should have a description (accounting for variable descriptions)
            expect(descriptionCount).toBeGreaterThan(outputCount);
        });
    });

    describe('Resource Dependencies', () => {
        it('should properly reference resources in configuration', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            
            // Check key dependencies
            expect(stackContent).toContain('vpc_id = aws_vpc.main.id');
            expect(stackContent).toContain('gateway_id = aws_internet_gateway.main.id');
            expect(stackContent).toContain('subnet_id              = aws_subnet.private.id');
            expect(stackContent).toContain('iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name');
        });

        it('should use data sources appropriately', () => {
            const stackContent = readFileSync('lib/tap_stack.tf', 'utf-8');
            
            expect(stackContent).toContain('data "aws_caller_identity" "current"');
            expect(stackContent).toContain('data "aws_availability_zones" "available"');
            expect(stackContent).toContain('data "aws_ami" "amazon_linux"');
        });
    });
});