import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Configuration Unit Tests", () => {
  let terraformContent: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    terraformContent = fs.readFileSync(stackPath, "utf8");
  });

  describe("File Structure and Configuration", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(terraformContent.length).toBeGreaterThan(0);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(terraformContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("does NOT declare terraform block in tap_stack.tf (provider.tf owns terraform config)", () => {
      expect(terraformContent).not.toMatch(/\bterraform\s*{/);
    });

    test("declares aws_region variable", () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"\s*{/);
    });
  });

  describe("Variable Declarations", () => {
    test("aws_region variable has proper structure", () => {
      const variableMatch = terraformContent.match(/variable\s+"aws_region"\s*{[^}]*}/s);
      expect(variableMatch).toBeTruthy();
      
      if (variableMatch) {
        const variableBlock = variableMatch[0];
        expect(variableBlock).toMatch(/description\s*=/);
        expect(variableBlock).toMatch(/type\s*=\s*string/);
        expect(variableBlock).toMatch(/default\s*=/);
      }
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("uses consistent naming pattern with suffix", () => {
      expect(terraformContent).toMatch(/local\.suffix/);
      expect(terraformContent).toMatch(/random_id.*suffix/);
    });

    test("resources have consistent tagging", () => {
      expect(terraformContent).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(terraformContent).toMatch(/common_tags\s*=\s*{/);
    });

    test("common_tags includes required fields", () => {
      const commonTagsMatch = terraformContent.match(/common_tags\s*=\s*{[^}]*}/s);
      expect(commonTagsMatch).toBeTruthy();
      
      if (commonTagsMatch) {
        const tagsBlock = commonTagsMatch[0];
        expect(tagsBlock).toMatch(/Environment\s*=/);
        expect(tagsBlock).toMatch(/Project\s*=/);
        expect(tagsBlock).toMatch(/ManagedBy\s*=/);
      }
    });
  });

  describe("S3 Configuration", () => {
    test("S3 bucket is properly configured", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"website"/);
      expect(terraformContent).toMatch(/bucket\s*=\s*"[^"]*\${local\.suffix}[^"]*"/);
    });

    test("S3 website configuration exists", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_website_configuration"/);
      expect(terraformContent).toMatch(/index_document\s*{/);
      expect(terraformContent).toMatch(/suffix\s*=\s*"index\.html"/);
    });

    test("S3 bucket has public access configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_policy"/);
    });

    test("S3 objects for website content exist", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_object"\s+"index_html"/);
      expect(terraformContent).toMatch(/key\s*=\s*"index\.html"/);
      expect(terraformContent).toMatch(/content_type\s*=\s*"text\/html"/);
    });
  });

  describe("Lambda Configuration", () => {
    test("Lambda function is properly configured", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lambda_function"/);
      expect(terraformContent).toMatch(/runtime\s*=\s*"python3\.(11|12)"/);
      expect(terraformContent).toMatch(/handler\s*=\s*"lambda_function\.lambda_handler"/);
    });

    test("Lambda has proper IAM role", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
      expect(terraformContent).toMatch(/assume_role_policy\s*=/);
      expect(terraformContent).toMatch(/aws_iam_role_policy_attachment/);
    });

    test("Lambda function code is inline", () => {
      expect(terraformContent).toMatch(/data\s+"archive_file"/);
      expect(terraformContent).toMatch(/source\s*{/);
      expect(terraformContent).toMatch(/def lambda_handler/);
    });

    test("Lambda has CloudWatch logs configuration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(terraformContent).toMatch(/retention_in_days\s*=/);
    });
  });

  describe("API Gateway Configuration", () => {
    test("API Gateway REST API exists", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_api_gateway_rest_api"/);
      expect(terraformContent).toMatch(/endpoint_configuration\s*{/);
    });

    test("API Gateway has proper resource and methods", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_api_gateway_resource"/);
      expect(terraformContent).toMatch(/resource\s+"aws_api_gateway_method"/);
      expect(terraformContent).toMatch(/http_method\s*=\s*"GET"/);
      expect(terraformContent).toMatch(/http_method\s*=\s*"OPTIONS"/);
    });

    test("API Gateway has proper integration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_api_gateway_integration"/);
      expect(terraformContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(terraformContent).toMatch(/integration_http_method\s*=\s*"POST"/);
    });

    test("API Gateway has deployment and stage", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_api_gateway_deployment"/);
      expect(terraformContent).toMatch(/resource\s+"aws_api_gateway_stage"/);
      expect(terraformContent).toMatch(/stage_name\s*=\s*"prod"/);
    });

    test("API Gateway uses stage for invoke_url outputs", () => {
      expect(terraformContent).toMatch(/aws_api_gateway_stage\.main\.invoke_url/);
      expect(terraformContent).not.toMatch(/aws_api_gateway_deployment\.main\.invoke_url/);
    });

    test("CORS is properly configured", () => {
      expect(terraformContent).toMatch(/Access-Control-Allow-Origin/);
      expect(terraformContent).toMatch(/Access-Control-Allow-Headers/);
      expect(terraformContent).toMatch(/Access-Control-Allow-Methods/);
    });
  });

  describe("Lambda Permissions", () => {
    test("Lambda has API Gateway invoke permission", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_lambda_permission"/);
      expect(terraformContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(terraformContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  describe("Outputs", () => {
    test("has required outputs", () => {
      expect(terraformContent).toMatch(/output\s+"website_url"/);
      expect(terraformContent).toMatch(/output\s+"api_gateway_url"/);
      expect(terraformContent).toMatch(/output\s+"lambda_function_name"/);
      expect(terraformContent).toMatch(/output\s+"s3_bucket_name"/);
      expect(terraformContent).toMatch(/output\s+"api_endpoint"/);
    });

    test("outputs reference correct resources", () => {
      expect(terraformContent).toMatch(/aws_s3_bucket_website_configuration\.website\.website_endpoint/);
      expect(terraformContent).toMatch(/aws_api_gateway_stage\.main\.invoke_url/);
      expect(terraformContent).toMatch(/aws_lambda_function\.main\.function_name/);
      expect(terraformContent).toMatch(/aws_s3_bucket\.website\.id/);
    });
  });

  describe("Security Best Practices", () => {
    test("IAM follows least privilege principle", () => {
      expect(terraformContent).toMatch(/AWSLambdaBasicExecutionRole/);
      expect(terraformContent).not.toMatch(/AdministratorAccess/);
      expect(terraformContent).not.toMatch(/PowerUserAccess/);
    });

    test("no hardcoded secrets or credentials", () => {
      expect(terraformContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(terraformContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
      expect(terraformContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
    });

    test("S3 bucket policy restricts to GetObject only", () => {
      const bucketPolicyMatch = terraformContent.match(/aws_s3_bucket_policy.*?policy\s*=\s*jsonencode\([^}]+\}\s*\]\s*\}\s*\)/s);
      if (bucketPolicyMatch) {
        expect(bucketPolicyMatch[0]).toMatch(/"Action"\s*=\s*"s3:GetObject"/);
        expect(bucketPolicyMatch[0]).not.toMatch(/"s3:\*"/);
      }
    });
  });
});