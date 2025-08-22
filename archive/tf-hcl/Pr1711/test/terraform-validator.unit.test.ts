// Unit tests for TerraformValidator module
// This tests edge cases and error conditions

import { TerraformValidator, parseSecurityGroupRules, validateResourceTags } from "../lib/terraform-validator";
import fs from "fs";
import path from "path";

describe("TerraformValidator Edge Cases", () => {
  describe("Invalid configurations", () => {
    test("validator handles missing variables", () => {
      const invalidConfig = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
        }
      `;
      
      // Create a temporary file for testing
      const tempPath = path.join(__dirname, "temp-invalid.tf");
      fs.writeFileSync(tempPath, invalidConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.hasVariable("nonexistent")).toBe(false);
      expect(validator.hasResource("aws_vpc", "nonexistent")).toBe(false);
      expect(validator.hasOutput("nonexistent")).toBe(false);
      
      // Clean up
      fs.unlinkSync(tempPath);
    });

    test("validator detects public access in security groups", () => {
      const publicAccessConfig = `
        resource "aws_security_group" "bad" {
          name = "bad-sg"
          
          ingress {
            from_port   = 80
            to_port     = 80
            protocol    = "tcp"
            cidr_blocks = ["0.0.0.0/0"]
          }
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-public.tf");
      fs.writeFileSync(tempPath, publicAccessConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateNoPublicAccess()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator detects missing EC2 security settings", () => {
      const insecureEC2Config = `
        resource "aws_instance" "web_server" {
          ami           = "ami-12345"
          instance_type = "t2.micro"
          
          # Missing encrypted = true
          root_block_device {
            volume_type           = "gp3"
            volume_size           = 8
            delete_on_termination = true
          }
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-ec2.tf");
      fs.writeFileSync(tempPath, insecureEC2Config);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateEC2SecurityConfig()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator detects missing VPC DNS settings", () => {
      const incompletVPCConfig = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
          # Missing DNS settings
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-vpc.tf");
      fs.writeFileSync(tempPath, incompletVPCConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateVPCConfig()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator detects public IP enabled on subnet", () => {
      const publicIPEnabledConfig = `
        resource "aws_subnet" "public" {
          vpc_id                  = "vpc-123"
          cidr_block              = "10.0.1.0/24"
          map_public_ip_on_launch = true
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-subnet.tf");
      fs.writeFileSync(tempPath, publicIPEnabledConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateSubnetConfig()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator detects missing NAT Gateway", () => {
      const noNATConfig = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
        }
        # Missing NAT Gateway
      `;
      
      const tempPath = path.join(__dirname, "temp-nonat.tf");
      fs.writeFileSync(tempPath, noNATConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateNATGateway()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator detects insufficient environment suffix usage", () => {
      const insufficientSuffixConfig = `
        resource "aws_vpc" "main" {
          tags = {
            Name = "vpc-static-name"
          }
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-suffix.tf");
      fs.writeFileSync(tempPath, insufficientSuffixConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateEnvironmentSuffixUsage()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator detects missing outputs", () => {
      const missingOutputsConfig = `
        output "vpc_id" {
          value = "vpc-123"
        }
        # Missing other required outputs
      `;
      
      const tempPath = path.join(__dirname, "temp-outputs.tf");
      fs.writeFileSync(tempPath, missingOutputsConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateOutputs()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator validateAll collects all errors", () => {
      const badConfig = `
        resource "aws_security_group" "bad" {
          ingress {
            cidr_blocks = ["0.0.0.0/0"]
          }
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-all-errors.tf");
      fs.writeFileSync(tempPath, badConfig);
      
      const validator = new TerraformValidator(tempPath);
      const result = validator.validateAll();
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Security groups allow traffic from 0.0.0.0/0');
      
      fs.unlinkSync(tempPath);
    });

    test("validator handles EC2 with public IP enabled", () => {
      const publicEC2Config = `
        resource "aws_instance" "web_server" {
          ami                         = "ami-12345"
          instance_type               = "t2.micro"
          associate_public_ip_address = true
          
          root_block_device {
            encrypted             = true
            delete_on_termination = true
          }
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-public-ec2.tf");
      fs.writeFileSync(tempPath, publicEC2Config);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateEC2SecurityConfig()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("validator handles EC2 without delete_on_termination", () => {
      const noDeletionConfig = `
        resource "aws_instance" "web_server" {
          ami                         = "ami-12345"
          instance_type               = "t2.micro"
          associate_public_ip_address = false
          
          root_block_device {
            encrypted             = true
            delete_on_termination = false
          }
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-no-delete.tf");
      fs.writeFileSync(tempPath, noDeletionConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateEC2SecurityConfig()).toBe(false);
      
      fs.unlinkSync(tempPath);
    });
  });

  describe("parseSecurityGroupRules edge cases", () => {
    test("handles empty configuration", () => {
      const emptyConfig = "";
      const result = parseSecurityGroupRules(emptyConfig);
      expect(result).toEqual([]);
    });

    test("handles security group without rules", () => {
      const noRulesConfig = `
        resource "aws_security_group" "empty" {
          name = "empty-sg"
        }
      `;
      
      const result = parseSecurityGroupRules(noRulesConfig);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("empty");
      expect(result[0].ingress_rules).toEqual([]);
      expect(result[0].egress_rules).toEqual([]);
    });

    test("handles malformed rules", () => {
      const malformedConfig = `
        resource "aws_security_group" "malformed" {
          ingress {
            # Missing required fields
          }
        }
      `;
      
      const result = parseSecurityGroupRules(malformedConfig);
      expect(result).toHaveLength(1);
      expect(result[0].ingress_rules[0].from_port).toBe(0);
      expect(result[0].ingress_rules[0].to_port).toBe(0);
      expect(result[0].ingress_rules[0].protocol).toBe("tcp");
      expect(result[0].ingress_rules[0].cidr_blocks).toEqual([]);
    });

    test("handles CIDR blocks with variables", () => {
      const varCidrConfig = `
        resource "aws_security_group" "var_cidr" {
          ingress {
            from_port   = 22
            to_port     = 22
            protocol    = "tcp"
            cidr_blocks = [var.allowed_cidr]
          }
        }
      `;
      
      const result = parseSecurityGroupRules(varCidrConfig);
      expect(result).toHaveLength(1);
      expect(result[0].ingress_rules[0].cidr_blocks).toEqual([]);
    });
  });

  describe("validateResourceTags edge cases", () => {
    test("handles missing resource", () => {
      const config = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
        }
      `;
      
      const result = validateResourceTags(config, "aws_vpc", "nonexistent");
      expect(result).toBe(false);
    });

    test("handles resource without tags", () => {
      const config = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
        }
      `;
      
      const result = validateResourceTags(config, "aws_vpc", "main");
      expect(result).toBe(false);
    });

    test("handles resource with incomplete tags", () => {
      const config = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
          tags = {
            Name = "vpc"
          }
        }
      `;
      
      const result = validateResourceTags(config, "aws_vpc", "main");
      expect(result).toBe(false);
    });

    test("handles resource with complete tags", () => {
      const config = `
        resource "aws_vpc" "main" {
          cidr_block = "10.0.0.0/16"
          tags = {
            Name        = "vpc"
            Environment = "dev"
            ManagedBy   = "terraform"
          }
        }
      `;
      
      const result = validateResourceTags(config, "aws_vpc", "main");
      expect(result).toBe(true);
    });
  });

  describe("Validator with wrong CIDR blocks", () => {
    test("detects incorrect HTTP CIDR block", () => {
      const wrongCidrConfig = `
        variable "allowed_http_cidr" {
          default = "10.0.0.0/24"
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-wrong-http.tf");
      fs.writeFileSync(tempPath, wrongCidrConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateCidrBlock("allowed_http_cidr", "192.168.1.0/24")).toBe(false);
      
      fs.unlinkSync(tempPath);
    });

    test("detects incorrect SSH CIDR block", () => {
      const wrongCidrConfig = `
        variable "allowed_ssh_cidr" {
          default = "10.0.0.0/24"
        }
      `;
      
      const tempPath = path.join(__dirname, "temp-wrong-ssh.tf");
      fs.writeFileSync(tempPath, wrongCidrConfig);
      
      const validator = new TerraformValidator(tempPath);
      expect(validator.validateCidrBlock("allowed_ssh_cidr", "203.0.113.0/24")).toBe(false);
      
      fs.unlinkSync(tempPath);
    });
  });
});