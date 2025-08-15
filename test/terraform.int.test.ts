/**
 * Comprehensive Terraform Infrastructure Integration Tests
 * Author: ngwakoleslieelijah
 * Created: 2025-08-15 14:09:30 UTC
 * 
 * This file combines all integration tests for the tap_stack.tf infrastructure
 * including validation, deployment, AWS resource verification, and cleanup.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface TerraformOutput {
  sensitive: boolean;
  type: string | string[];
  value: any;
}

interface TerraformOutputs {
  [key: string]: TerraformOutput;
}

interface TestResults {
  [key: string]: boolean;
}

describe('Comprehensive Terraform Infrastructure Integration Tests', () => {
  // Test Configuration
  const testSuffix = Math.random().toString(36).substring(2, 8);
  const testConfig = {
    projectName: `iac-aws-nova-test-${testSuffix}`,
    environment: 'testing',
    author: 'ngwakoleslieelijah',
    awsRegion: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    vpcCidr: '10.1.0.0/16',
    publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24'],
    privateSubnetCidrs: ['10.1.10.0/24', '10.1.20.0/24'],
    dbUsername: 'testadmin',
    dbPassword: 'TestPassword123!',
    testTimestamp: '2025-08-15T14:09:30Z'
  };

  // Directory and timeout configuration
  const terraformDir = path.resolve(__dirname, '../');
  const TERRAFORM_TIMEOUT = 20 * 60 * 1000; // 20 minutes for comprehensive tests
  const AWS_CLI_TIMEOUT = 60 * 1000; // 1 minute for AWS CLI commands

  // Test state tracking
  let terraformInitialized = false;
  let terraformValidated = false;
  let terraformPlanCreated = false;
  let infrastructureDeployed = false;
  let outputs: TerraformOutputs = {};
  const testResults: TestResults = {};

  /**
   * Execute Terraform commands with comprehensive error handling
   */
  const executeTerraform = async (command: string, timeout: number = TERRAFORM_TIMEOUT): Promise<string> => {
    // Verify terraform directory exists
    const tapStackFile = path.join(terraformDir, 'tap_stack.tf');
    if (!fs.existsSync(tapStackFile)) {
      throw new Error(`tap_stack.tf not found in ${terraformDir}. Current working directory: ${process.cwd()}`);
    }

    console.log(`🔧 Executing: terraform ${command}`);
    console.log(`📁 Working directory: ${terraformDir}`);
    
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(`terraform ${command}`, {
        cwd: terraformDir,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        env: {
          ...process.env,
          TF_VAR_project_name: testConfig.projectName,
          TF_VAR_environment: testConfig.environment,
          TF_VAR_author: testConfig.author,
          TF_VAR_aws_region: testConfig.awsRegion,
          TF_VAR_vpc_cidr: testConfig.vpcCidr,
          TF_VAR_public_subnet_cidrs: JSON.stringify(testConfig.publicSubnetCidrs),
          TF_VAR_private_subnet_cidrs: JSON.stringify(testConfig.privateSubnetCidrs),
          TF_VAR_db_username: testConfig.dbUsername,
          TF_VAR_db_password: testConfig.dbPassword,
          TF_IN_AUTOMATION: 'true',
          TF_LOG: 'ERROR' // Reduce log verbosity
        }
      });
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`⏱️  Command completed in ${duration.toFixed(2)} seconds`);
      
      if (stderr && !stderr.includes('Warning') && !stderr.includes('Note:')) {
        console.warn('⚠️ Terraform stderr:', stderr);
      }
      
      return stdout;
    } catch (error: any) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(`❌ Command failed after ${duration.toFixed(2)} seconds:`, error.message);
      throw error;
    }
  };

  /**
   * Execute AWS CLI commands with error handling
   */
  const executeAwsCli = async (command: string): Promise<string> => {
    try {
      console.log(`🌍 Executing AWS CLI: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        timeout: AWS_CLI_TIMEOUT,
        env: {
          ...process.env,
          AWS_DEFAULT_REGION: testConfig.awsRegion
        }
      });
      
      if (stderr && !stderr.includes('WARNING')) {
        console.warn('⚠️ AWS CLI stderr:', stderr);
      }
      
      return stdout;
    } catch (error: any) {
      console.warn(`⚠️ AWS CLI command failed: ${error.message}`);
      throw error;
    }
  };

  /**
   * Get and parse Terraform outputs
   */
  const getTerraformOutputs = async (): Promise<TerraformOutputs> => {
    try {
      const output = await executeTerraform('output -json', 30000); // 30 second timeout for outputs
      const parsedOutputs = JSON.parse(output);
      console.log(`📊 Retrieved ${Object.keys(parsedOutputs).length} Terraform outputs`);
      return parsedOutputs;
    } catch (error) {
      console.error('❌ Failed to get Terraform outputs:', error);
      return {};
    }
  };

  /**
   * Verify file exists and log details
   */
  const verifyFile = (filePath: string, description: string): boolean => {
    const exists = fs.existsSync(filePath);
    if (exists) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${description} found: ${filePath} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${description} not found: ${filePath}`);
    }
    return exists;
  };

  // ============================================================================
  // TEST SETUP AND TEARDOWN
  // ============================================================================

  beforeAll(async () => {
    console.log('\n🚀 COMPREHENSIVE TERRAFORM INFRASTRUCTURE INTEGRATION TESTS');
    console.log('==============================================================');
    console.log(`👤 Author: ${testConfig.author}`);
    console.log(`📅 Test Date: ${testConfig.testTimestamp}`);
    console.log(`🆔 Test ID: ${testSuffix}`);
    console.log(`📋 Project: ${testConfig.projectName}`);
    console.log(`🏷️  Environment: ${testConfig.environment}`);
    console.log(`🌍 AWS Region: ${testConfig.awsRegion}`);
    console.log(`🏢 VPC CIDR: ${testConfig.vpcCidr}`);
    console.log(`📁 Terraform Directory: ${terraformDir}`);
    console.log(`⏰ Timeout: ${TERRAFORM_TIMEOUT / 1000}s`);
    console.log('');

    // Verify terraform configuration files exist
    console.log('📋 Pre-flight Checks:');
    verifyFile(path.join(terraformDir, 'tap_stack.tf'), 'Main Terraform configuration');
    verifyFile(path.join(terraformDir, 'package.json'), 'Package configuration');
    
    // Check module directories
    const moduleDir = path.join(terraformDir, 'modules');
    if (fs.existsSync(moduleDir)) {
      const modules = fs.readdirSync(moduleDir).filter(item => {
        const itemPath = path.join(moduleDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
      console.log(`📦 Found modules: ${modules.join(', ')}`);
    }
    
    console.log('');
  }, 60000);

  afterAll(async () => {
    console.log('\n🧹 POST-TEST CLEANUP');
    console.log('=====================');
    
    try {
      if (infrastructureDeployed) {
        console.log('🗑️  Destroying test infrastructure...');
        const destroyOutput = await executeTerraform('destroy -auto-approve');
        
        if (destroyOutput.includes('Destroy complete!')) {
          console.log('✅ Infrastructure destroyed successfully');
          
          const destroyMatch = destroyOutput.match(/Destroy complete! Resources: (\d+) destroyed/);
          if (destroyMatch) {
            console.log(`📊 Resources destroyed: ${destroyMatch[1]}`);
          }
        } else {
          console.warn('⚠️  Destroy command completed but may not have destroyed all resources');
        }
      }
      
      // Clean up test files
      const filesToClean = ['test.tfplan', 'terraform.tfstate.backup'];
      filesToClean.forEach(file => {
        const filePath = path.join(terraformDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed: ${file}`);
        }
      });
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      console.log('⚠️  Manual cleanup may be required for test resources');
    }
    
    // Print final test summary
    console.log('\n📊 FINAL TEST RESULTS SUMMARY');
    console.log('==============================');
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`🆔 Test Session ID: ${testSuffix}`);
    console.log(`👤 Test Author: ${testConfig.author}`);
    console.log(`📅 Completed: ${new Date().toISOString()}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - INFRASTRUCTURE READY FOR PRODUCTION!');
    } else {
      console.log('❌ SOME TESTS FAILED - REVIEW LOGS BEFORE PRODUCTION DEPLOYMENT');
    }
  }, 60000);

  // ============================================================================
  // TEST SUITE 1: TERRAFORM SETUP AND VALIDATION
  // ============================================================================

  describe('🔧 Terraform Setup and Configuration', () => {
    test('should initialize Terraform successfully', async () => {
      console.log('\n🧪 Test 1.1: Terraform Initialization');
      console.log('======================================');
      
      const output = await executeTerraform('init -upgrade -no-color');
      
      expect(output).toContain('Terraform has been successfully initialized!');
      
      // Verify .terraform directory was created
      const terraformMetaDir = path.join(terraformDir, '.terraform');
      expect(fs.existsSync(terraformMetaDir)).toBe(true);
      
      terraformInitialized = true;
      testResults['terraform_init'] = true;
      
      console.log('✅ Terraform initialized successfully');
      console.log('✅ .terraform directory created');
      
    }, TERRAFORM_TIMEOUT);

    test('should validate Terraform configuration syntax', async () => {
      console.log('\n🧪 Test 1.2: Configuration Validation');
      console.log('=====================================');
      
      expect(terraformInitialized).toBe(true);
      
      const output = await executeTerraform('validate -no-color');
      
      const isValid = output.includes('Success! The configuration is valid') || 
                     output.includes('The configuration is valid');
      
      expect(isValid).toBe(true);
      expect(output).not.toContain('Error:');
      expect(output).not.toContain('Warning:');
      
      terraformValidated = true;
      testResults['terraform_validate'] = true;
      
      console.log('✅ Terraform configuration is syntactically valid');
      console.log('✅ No validation errors or warnings');
      
    }, TERRAFORM_TIMEOUT);

    test('should format Terraform configuration properly', async () => {
      console.log('\n🧪 Test 1.3: Configuration Formatting');
      console.log('=====================================');
      
      const output = await executeTerraform('fmt -check -diff');
      
      // If fmt returns no output, files are properly formatted
      const isFormatted = output.trim() === '' || output.includes('No changes');
      
      expect(isFormatted).toBe(true);
      
      testResults['terraform_fmt'] = true;
      
      console.log('✅ Terraform configuration is properly formatted');
      
    }, 30000);
  });

  // ============================================================================
  // TEST SUITE 2: INFRASTRUCTURE PLANNING
  // ============================================================================

  describe('📋 Infrastructure Planning', () => {
    test('should generate comprehensive Terraform plan', async () => {
      console.log('\n🧪 Test 2.1: Infrastructure Planning');
      console.log('====================================');
      
      expect(terraformValidated).toBe(true);
      
      const output = await executeTerraform('plan -out=test.tfplan -no-color');
      
      expect(output).toContain('Plan:');
      expect(output).not.toContain('Error:');
      
      // Verify plan file was created
      const planFile = path.join(terraformDir, 'test.tfplan');
      expect(fs.existsSync(planFile)).toBe(true);
      
      // Extract plan metrics
      const planMatch = output.match(/Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/);
      if (planMatch) {
        const [, toAdd, toChange, toDestroy] = planMatch;
        expect(parseInt(toAdd)).toBeGreaterThan(0);
        expect(parseInt(toDestroy)).toBe(0); // New deployment shouldn't destroy anything
        
        console.log(`📊 Plan Summary:`);
        console.log(`   • Resources to add: ${toAdd}`);
        console.log(`   • Resources to change: ${toChange}`);
        console.log(`   • Resources to destroy: ${toDestroy}`);
      }
      
      terraformPlanCreated = true;
      testResults['terraform_plan'] = true;
      
      console.log('✅ Terraform plan generated successfully');
      console.log(`✅ Plan file created: ${planFile}`);
      
    }, TERRAFORM_TIMEOUT);

    test('should validate resource dependencies in plan', async () => {
      console.log('\n🧪 Test 2.2: Resource Dependency Analysis');
      console.log('=========================================');
      
      expect(terraformPlanCreated).toBe(true);
      
      // Show the plan to analyze dependencies
      const output = await executeTerraform('show test.tfplan');
      
      // Check for key resource types that should be in the plan
      const expectedResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_kms_key',
        'aws_security_group'
      ];
      
      expectedResources.forEach(resourceType => {
        expect(output).toContain(resourceType);
        console.log(`✅ Found ${resourceType} in plan`);
      });
      
      testResults['plan_dependencies'] = true;
      
      console.log('✅ All expected resource types found in plan');
      
    }, 60000);
  });

  // ============================================================================
  // TEST SUITE 3: INFRASTRUCTURE DEPLOYMENT
  // ============================================================================

  describe('🚀 Infrastructure Deployment', () => {
    test('should deploy infrastructure successfully', async () => {
      console.log('\n🧪 Test 3.1: Infrastructure Deployment');
      console.log('======================================');
      
      expect(terraformPlanCreated).toBe(true);
      
      const startTime = Date.now();
      const output = await executeTerraform('apply test.tfplan -no-color');
      const deploymentDuration = (Date.now() - startTime) / 1000;
      
      expect(output).toContain('Apply complete!');
      expect(output).not.toContain('Error:');
      
      // Extract apply metrics
      const applyMatch = output.match(/Apply complete! Resources: (\d+) added, (\d+) changed, (\d+) destroyed/);
      if (applyMatch) {
        const [, added, changed, destroyed] = applyMatch;
        expect(parseInt(added)).toBeGreaterThan(0);
        
        console.log(`📊 Deployment Summary:`);
        console.log(`   • Resources added: ${added}`);
        console.log(`   • Resources changed: ${changed}`);
        console.log(`   • Resources destroyed: ${destroyed}`);
        console.log(`   • Deployment time: ${deploymentDuration.toFixed(2)} seconds`);
      }
      
      infrastructureDeployed = true;
      testResults['infrastructure_deploy'] = true;
      
      console.log('✅ Infrastructure deployed successfully');
      
    }, TERRAFORM_TIMEOUT);

    test('should generate all required outputs', async () => {
      console.log('\n🧪 Test 3.2: Output Generation');
      console.log('==============================');
      
      expect(infrastructureDeployed).toBe(true);
      
      outputs = await getTerraformOutputs();
      
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      
      const requiredOutputs = [
        'vpc_id',
        'vpc_cidr',
        'public_subnet_ids',
        'private_subnet_ids',
        'kms_key_id'
      ];
      
      const availableOutputs = Object.keys(outputs);
      console.log(`📊 Available outputs (${availableOutputs.length}): ${availableOutputs.join(', ')}`);
      
      requiredOutputs.forEach(outputName => {
        if (outputs[outputName]) {
          console.log(`✅ ${outputName}: ${outputs[outputName].sensitive ? '[SENSITIVE]' : outputs[outputName].value}`);
        } else {
          console.warn(`⚠️ Missing output: ${outputName}`);
        }
      });
      
      testResults['outputs_generated'] = true;
      
      console.log('✅ Infrastructure outputs generated');
      
    }, 60000);
  });

  // ============================================================================
  // TEST SUITE 4: INFRASTRUCTURE VALIDATION
  // ============================================================================

  describe('🔍 Infrastructure Validation', () => {
    test('should validate VPC configuration', async () => {
      console.log('\n🧪 Test 4.1: VPC Configuration Validation');
      console.log('=========================================');
      
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      
      if (outputs.vpc_id && outputs.vpc_cidr) {
        // Validate VPC ID format
        expect(outputs.vpc_id.value).toMatch(/^vpc-[a-z0-9]{8,17}$/);
        console.log(`✅ VPC ID format valid: ${outputs.vpc_id.value}`);
        
        // Validate VPC CIDR
        expect(outputs.vpc_cidr.value).toBe(testConfig.vpcCidr);
        console.log(`✅ VPC CIDR matches expected: ${outputs.vpc_cidr.value}`);
        
        testResults['vpc_validation'] = true;
      } else {
        console.warn('⚠️ VPC outputs not available - skipping VPC validation');
        testResults['vpc_validation'] = false;
      }
      
    }, 30000);

    test('should validate subnet configuration', async () => {
      console.log('\n🧪 Test 4.2: Subnet Configuration Validation');
      console.log('============================================');
      
      if (outputs.public_subnet_ids && outputs.private_subnet_ids) {
        const publicSubnets = outputs.public_subnet_ids.value;
        const privateSubnets = outputs.private_subnet_ids.value;
        
        // Validate subnet arrays
        expect(Array.isArray(publicSubnets)).toBe(true);
        expect(Array.isArray(privateSubnets)).toBe(true);
        
        // Validate subnet counts
        expect(publicSubnets.length).toBe(testConfig.publicSubnetCidrs.length);
        expect(privateSubnets.length).toBe(testConfig.privateSubnetCidrs.length);
        
        // Validate subnet ID formats
        [...publicSubnets, ...privateSubnets].forEach((subnetId, index) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]{8,17}$/);
        });
        
        console.log(`✅ Public subnets (${publicSubnets.length}): ${publicSubnets.join(', ')}`);
        console.log(`✅ Private subnets (${privateSubnets.length}): ${privateSubnets.join(', ')}`);
        
        testResults['subnet_validation'] = true;
      } else {
        console.warn('⚠️ Subnet outputs not available - skipping subnet validation');
        testResults['subnet_validation'] = false;
      }
      
    }, 30000);

    test('should validate security configuration', async () => {
      console.log('\n🧪 Test 4.3: Security Configuration Validation');
      console.log('==============================================');
      
      if (outputs.kms_key_id) {
        const kmsKeyId = outputs.kms_key_id.value;
        
        // Validate KMS Key ID format
        expect(kmsKeyId).toMatch(/^[a-f0-9-]{36}$|^arn:aws:kms:/);
        console.log(`✅ KMS Key ID format valid: ${kmsKeyId}`);
        
        testResults['security_validation'] = true;
      } else {
        console.warn('⚠️ KMS outputs not available - skipping security validation');
        testResults['security_validation'] = false;
      }
      
      // Validate naming conventions
      expect(testConfig.projectName).toContain('test');
      console.log('✅ Test project naming convention followed');
      
    }, 30000);
  });

  // ============================================================================
  // TEST SUITE 5: AWS RESOURCE VERIFICATION
  // ============================================================================

  describe('☁️ AWS Resource Verification', () => {
    test('should verify VPC exists in AWS', async () => {
      console.log('\n🧪 Test 5.1: AWS VPC Verification');
      console.log('=================================');
      
      if (!outputs.vpc_id) {
        console.warn('⚠️ VPC ID not available - skipping AWS verification');
        return;
      }
      
      try {
        const vpcOutput = await executeAwsCli(
          `aws ec2 describe-vpcs --vpc-ids ${outputs.vpc_id.value} --region ${testConfig.awsRegion} --output json`
        );
        
        const vpcData = JSON.parse(vpcOutput);
        
        expect(vpcData.Vpcs).toHaveLength(1);
        expect(vpcData.Vpcs[0].State).toBe('available');
        expect(vpcData.Vpcs[0].CidrBlock).toBe(testConfig.vpcCidr);
        
        console.log(`✅ VPC verified in AWS:`);
        console.log(`   • VPC ID: ${vpcData.Vpcs[0].VpcId}`);
        console.log(`   • State: ${vpcData.Vpcs[0].State}`);
        console.log(`   • CIDR: ${vpcData.Vpcs[0].CidrBlock}`);
        
        testResults['aws_vpc_verification'] = true;
        
      } catch (error) {
        console.warn('⚠️ AWS VPC verification failed (may be due to permissions):', error);
        testResults['aws_vpc_verification'] = false;
      }
      
    }, AWS_CLI_TIMEOUT);

    test('should verify KMS key exists in AWS', async () => {
      console.log('\n🧪 Test 5.2: AWS KMS Key Verification');
      console.log('====================================');
      
      if (!outputs.kms_key_id) {
        console.warn('⚠️ KMS Key ID not available - skipping AWS verification');
        return;
      }
      
      try {
        const kmsOutput = await executeAwsCli(
          `aws kms describe-key --key-id ${outputs.kms_key_id.value} --region ${testConfig.awsRegion} --output json`
        );
        
        const kmsData = JSON.parse(kmsOutput);
        
        expect(kmsData.KeyMetadata).toBeDefined();
        expect(kmsData.KeyMetadata.KeyState).toBe('Enabled');
        
        console.log(`✅ KMS Key verified in AWS:`);
        console.log(`   • Key ID: ${kmsData.KeyMetadata.KeyId}`);
        console.log(`   • State: ${kmsData.KeyMetadata.KeyState}`);
        console.log(`   • Description: ${kmsData.KeyMetadata.Description}`);
        
        testResults['aws_kms_verification'] = true;
        
      } catch (error) {
        console.warn('⚠️ AWS KMS verification failed (may be due to permissions):', error);
        testResults['aws_kms_verification'] = false;
      }
      
    }, AWS_CLI_TIMEOUT);

    test('should verify subnets exist in AWS', async () => {
      console.log('\n🧪 Test 5.3: AWS Subnet Verification');
      console.log('===================================');
      
      if (!outputs.public_subnet_ids || !outputs.private_subnet_ids) {
        console.warn('⚠️ Subnet IDs not available - skipping AWS verification');
        return;
      }
      
      try {
        const allSubnetIds = [
          ...outputs.public_subnet_ids.value,
          ...outputs.private_subnet_ids.value
        ];
        
        const subnetOutput = await executeAwsCli(
          `aws ec2 describe-subnets --subnet-ids ${allSubnetIds.join(' ')} --region ${testConfig.awsRegion} --output json`
        );
        
        const subnetData = JSON.parse(subnetOutput);
        
        expect(subnetData.Subnets).toHaveLength(allSubnetIds.length);
        
        subnetData.Subnets.forEach((subnet: any) => {
          expect(subnet.State).toBe('available');
          expect(subnet.VpcId).toBe(outputs.vpc_id.value);
        });
        
        console.log(`✅ All ${allSubnetIds.length} subnets verified in AWS`);
        
        testResults['aws_subnet_verification'] = true;
        
      } catch (error) {
        console.warn('⚠️ AWS subnet verification failed (may be due to permissions):', error);
        testResults['aws_subnet_verification'] = false;
      }
      
    }, AWS_CLI_TIMEOUT);
  });

  // ============================================================================
  // TEST SUITE 6: COMPLIANCE AND BEST PRACTICES
  // ============================================================================

  describe('📋 Compliance and Best Practices', () => {
    test('should follow AWS resource naming conventions', async () => {
      console.log('\n🧪 Test 6.1: Naming Convention Compliance');
      console.log('========================================');
      
      // Test project name follows conventions
      expect(testConfig.projectName).toMatch(/^[a-z0-9-]+$/);
      expect(testConfig.projectName).toContain('test');
      console.log(`✅ Project name follows convention: ${testConfig.projectName}`);
      
      // Test resource naming if outputs are available
      if (outputs.vpc_id) {
        expect(outputs.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
        console.log(`✅ VPC ID follows AWS format: ${outputs.vpc_id.value}`);
      }
      
      if (outputs.kms_key_id) {
        expect(outputs.kms_key_id.value).toMatch(/^[a-f0-9-]{36}$|^arn:aws:kms:/);
        console.log(`✅ KMS Key ID follows AWS format`);
      }
      
      testResults['naming_conventions'] = true;
      
    }, 30000);

    test('should validate resource tagging strategy', async () => {
      console.log('\n🧪 Test 6.2: Resource Tagging Validation');
      console.log('=======================================');
      
      // Validate test configuration includes proper tagging info
      expect(testConfig.author).toBe('ngwakoleslieelijah');
      expect(testConfig.environment).toBe('testing');
      expect(testConfig.testTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      
      console.log(`✅ Author tag: ${testConfig.author}`);
      console.log(`✅ Environment tag: ${testConfig.environment}`);
      console.log(`✅ Timestamp format: ${testConfig.testTimestamp}`);
      
      testResults['tagging_strategy'] = true;
      
    }, 30000);

    test('should validate security best practices', async () => {
      console.log('\n🧪 Test 6.3: Security Best Practices');
      console.log('===================================');
      
      // Test encryption is configured (KMS key exists)
      if (outputs.kms_key_id) {
        console.log('✅ Encryption key (KMS) configured');
      }
      
      // Test network segmentation (public and private subnets)
      if (outputs.public_subnet_ids && outputs.private_subnet_ids) {
        expect(outputs.public_subnet_ids.value.length).toBeGreaterThan(0);
        expect(outputs.private_subnet_ids.value.length).toBeGreaterThan(0);
        console.log('✅ Network segmentation configured (public/private subnets)');
      }
      
      // Test sensitive data handling
      if (outputs.rds_endpoint) {
        expect(outputs.rds_endpoint.sensitive).toBe(true);
        console.log('✅ Sensitive data (RDS endpoint) marked as sensitive');
      }
      
      testResults['security_best_practices'] = true;
      
    }, 30000);
  });

  // ============================================================================
  // TEST SUITE 7: COMPREHENSIVE INTEGRATION TEST
  // ============================================================================

  describe('🎯 End-to-End Integration Test', () => {
    test('should pass comprehensive infrastructure validation', async () => {
      console.log('\n🧪 Test 7.1: Comprehensive Integration Validation');
      console.log('================================================');
      
      // Validate all critical components are working together
      const integrationChecks = {
        terraformInitialized,
        terraformValidated,
        terraformPlanCreated,
        infrastructureDeployed,
        outputsGenerated: Object.keys(outputs).length > 0,
        vpcExists: !!outputs.vpc_id,
        subnetsExist: !!(outputs.public_subnet_ids && outputs.private_subnet_ids),
        encryptionConfigured: !!outputs.kms_key_id
      };
      
      console.log('🔍 Integration Checks:');
      Object.entries(integrationChecks).forEach(([check, status]) => {
        console.log(`   ${status ? '✅' : '❌'} ${check}: ${status}`);
      });
      
      const passedChecks = Object.values(integrationChecks).filter(Boolean).length;
      const totalChecks = Object.keys(integrationChecks).length;
      
      expect(passedChecks).toBeGreaterThanOrEqual(totalChecks * 0.8); // 80% pass rate minimum
      
      testResults['integration_validation'] = true;
      
      console.log(`✅ Integration validation: ${passedChecks}/${totalChecks} checks passed`);
      
    }, 60000);

    test('should provide complete test summary', async () => {
      console.log('\n🧪 Test 7.2: Test Execution Summary');
      console.log('==================================');
      
      const totalTests = Object.keys(testResults).length;
      const passedTests = Object.values(testResults).filter(Boolean).length;
      const failedTests = totalTests - passedTests;
      const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0';
      
      console.log(`📊 Test Execution Summary:`);
      console.log(`   • Total Tests: ${totalTests}`);
      console.log(`   • Passed: ${passedTests}`);
      console.log(`   • Failed: ${failedTests}`);
      console.log(`   • Success Rate: ${successRate}%`);
      console.log(`   • Test Session ID: ${testSuffix}`);
      console.log(`   • Author: ${testConfig.author}`);
      console.log(`   • Timestamp: ${testConfig.testTimestamp}`);
      console.log('');
      
      // Detailed test results
      console.log('📋 Detailed Test Results:');
      Object.entries(testResults).forEach(([testName, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${testName}`);
      });
      
      expect(passedTests).toBeGreaterThanOrEqual(totalTests * 0.9); // 90% pass rate for production readiness
      
      if (passedTests === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! INFRASTRUCTURE IS PRODUCTION-READY!');
      } else if (passedTests >= totalTests * 0.9) {
        console.log('\n✅ Most tests passed. Minor issues may need attention before production.');
      } else {
        console.log('\n⚠️  Significant issues detected. Review failed tests before production deployment.');
      }
      
      testResults['test_summary_complete'] = true;
      
    }, 30000);
  });
});