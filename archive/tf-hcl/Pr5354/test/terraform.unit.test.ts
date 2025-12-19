import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

let terraformCode: string;
let providerCode: string;

beforeAll(() => {
  terraformCode = fs.readFileSync(STACK_PATH, "utf-8");
  providerCode = fs.readFileSync(PROVIDER_PATH, "utf-8");
});

describe("Terraform CI/CD Pipeline Infrastructure - Unit Tests", () => {

  describe("File Structure", () => {
    test("tap_stack.tf file exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf file exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("tap_stack.tf does NOT declare provider block", () => {
      expect(terraformCode).not.toMatch(/\bprovider\s+"aws"\s*\{/);
    });

    test("provider.tf contains AWS provider configuration", () => {
      expect(providerCode).toMatch(/provider\s+"aws"\s*\{/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test("declares project_name variable", () => {
      expect(terraformCode).toMatch(/variable\s+"project_name"\s*\{/);
    });

    test("declares repository_name variable", () => {
      expect(terraformCode).toMatch(/variable\s+"repository_name"\s*\{/);
    });

    test("declares environments variable", () => {
      expect(terraformCode).toMatch(/variable\s+"environments"\s*\{/);
    });

    test("declares approval_email variable", () => {
      expect(terraformCode).toMatch(/variable\s+"approval_email"\s*\{/);
    });

    test("declares notification_email variable", () => {
      expect(terraformCode).toMatch(/variable\s+"notification_email"\s*\{/);
    });

    test("declares environment_suffix variable", () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test("aws_region has validation", () => {
      expect(terraformCode).toMatch(/variable\s+"aws_region"[\s\S]*?validation\s*\{/);
    });

    test("approval_email has email validation", () => {
      expect(terraformCode).toMatch(/variable\s+"approval_email"[\s\S]*?validation[\s\S]*?regex.*@/);
    });

    test("approval_email has default value", () => {
      expect(terraformCode).toMatch(/variable\s+"approval_email"[\s\S]*?default\s*=\s*"[^"]+@[^"]+"/);
    });

    test("notification_email has default value", () => {
      expect(terraformCode).toMatch(/variable\s+"notification_email"[\s\S]*?default\s*=\s*"[^"]+@[^"]+"/);
    });

    test("environment_suffix has default empty string", () => {
      expect(terraformCode).toMatch(/variable\s+"environment_suffix"[\s\S]*?default\s*=\s*""/);
    });

    test("declares vpc_id variable as optional", () => {
      expect(terraformCode).toMatch(/variable\s+"vpc_id"[\s\S]*?default\s*=\s*null/);
    });

    test("declares private_subnet_ids variable", () => {
      expect(terraformCode).toMatch(/variable\s+"private_subnet_ids"\s*\{/);
    });

    test("declares docker_image_tag variable", () => {
      expect(terraformCode).toMatch(/variable\s+"docker_image_tag"\s*\{/);
    });

    test("declares enable_vpc_config variable", () => {
      expect(terraformCode).toMatch(/variable\s+"enable_vpc_config"\s*\{/);
    });

    test("declares codebuild_timeout variable", () => {
      expect(terraformCode).toMatch(/variable\s+"codebuild_timeout"\s*\{/);
    });

    test("declares state_retention_days variable", () => {
      expect(terraformCode).toMatch(/variable\s+"state_retention_days"\s*\{/);
    });

    test("declares artifact_retention_days variable", () => {
      expect(terraformCode).toMatch(/variable\s+"artifact_retention_days"\s*\{/);
    });

    test("declares enable_enhanced_monitoring variable", () => {
      expect(terraformCode).toMatch(/variable\s+"enable_enhanced_monitoring"\s*\{/);
    });

    test("declares enable_notifications variable", () => {
      expect(terraformCode).toMatch(/variable\s+"enable_notifications"\s*\{/);
    });

    test("declares log_retention_days variable", () => {
      expect(terraformCode).toMatch(/variable\s+"log_retention_days"\s*\{/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(terraformCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares aws_partition data source", () => {
      expect(terraformCode).toMatch(/data\s+"aws_partition"\s+"current"/);
    });

    test("declares aws_availability_zones data source", () => {
      expect(terraformCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe("Random Resources", () => {
    test("declares random_string for environment_suffix", () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
    });

    test("random_string uses conditional count", () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"[\s\S]*?count\s*=\s*var\.environment_suffix\s*==\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("random_string has length 8", () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"[\s\S]*?length\s*=\s*8/);
    });

    test("random_string has no special characters", () => {
      expect(terraformCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"[\s\S]*?special\s*=\s*false/);
    });
  });

  describe("Locals", () => {
    test("declares locals block", () => {
      expect(terraformCode).toMatch(/locals\s*\{/);
    });

    test("defines env_suffix local", () => {
      expect(terraformCode).toMatch(/env_suffix\s*=\s*var\.environment_suffix\s*!=\s*""\s*\?/);
    });

    test("defines common_tags local", () => {
      expect(terraformCode).toMatch(/common_tags\s*=\s*\{/);
    });

    test("common_tags includes Environment tag", () => {
      expect(terraformCode).toMatch(/common_tags[\s\S]*?Environment\s*=\s*"shared"/);
    });

    test("common_tags includes ManagedBy tag", () => {
      expect(terraformCode).toMatch(/common_tags[\s\S]*?ManagedBy\s*=\s*"Terraform"/);
    });

    test("defines state_bucket_name local", () => {
      expect(terraformCode).toMatch(/state_bucket_name\s*=/);
    });

    test("defines artifacts_bucket_name local", () => {
      expect(terraformCode).toMatch(/artifacts_bucket_name\s*=/);
    });
  });

  describe("CodeCommit Repository", () => {
    test("declares CodeCommit repository", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codecommit_repository"\s+"terraform_repo"/);
    });

    test("repository uses environment suffix", () => {
      expect(terraformCode).toMatch(/repository_name\s*=\s*"\$\{var\.repository_name\}-\$\{local\.env_suffix\}"/);
    });

    test("repository has default_branch main", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codecommit_repository"[\s\S]*?default_branch\s*=\s*"main"/);
    });
  });

  describe("S3 Buckets", () => {
    test("declares terraform_state S3 bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"terraform_state"/);
    });

    test("state bucket uses environment suffix", () => {
      expect(terraformCode).toMatch(/bucket\s*=\s*local\.state_bucket_name/);
    });

    test("declares versioning for state bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"terraform_state"/);
    });

    test("state bucket versioning is Enabled", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"terraform_state"[\s\S]*?status\s*=\s*"Enabled"/);
    });

    test("declares encryption for state bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"terraform_state"/);
    });

    test("state bucket uses AES256 encryption", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"terraform_state"[\s\S]*?sse_algorithm\s*=\s*"AES256"/);
    });

    test("declares public access block for state bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"terraform_state"/);
    });

    test("state bucket blocks all public access", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"terraform_state"[\s\S]*?block_public_acls\s*=\s*true/);
    });

    test("declares lifecycle configuration for state bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"terraform_state"/);
    });

    test("declares pipeline_artifacts S3 bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket"\s+"pipeline_artifacts"/);
    });

    test("artifacts bucket uses environment suffix", () => {
      expect(terraformCode).toMatch(/bucket\s*=\s*local\.artifacts_bucket_name/);
    });

    test("declares versioning for artifacts bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"pipeline_artifacts"/);
    });

    test("declares encryption for artifacts bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"pipeline_artifacts"/);
    });

    test("declares public access block for artifacts bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"pipeline_artifacts"/);
    });

    test("declares lifecycle configuration for artifacts bucket", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"pipeline_artifacts"/);
    });
  });

  describe("DynamoDB Table", () => {
    test("declares DynamoDB table for state locking", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"/);
    });

    test("table uses environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-state-lock-\$\{local\.env_suffix\}"/);
    });

    test("table uses PAY_PER_REQUEST billing", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"[\s\S]*?billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("table has LockID as hash_key", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"[\s\S]*?hash_key\s*=\s*"LockID"/);
    });

    test("table has point_in_time_recovery enabled", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"[\s\S]*?point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/);
    });

    test("table has server_side_encryption enabled", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_dynamodb_table"[\s\S]*?server_side_encryption\s*\{[\s\S]*?enabled\s*=\s*true/);
    });
  });

  describe("ECR Repository", () => {
    test("declares ECR repository", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_repository"\s+"terraform_runner"/);
    });

    test("ECR repository uses environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-runner-\$\{local\.env_suffix\}"/);
    });

    test("ECR repository has image scanning enabled", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_repository"[\s\S]*?scan_on_push\s*=\s*true/);
    });

    test("ECR repository has encryption configured", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_repository"[\s\S]*?encryption_configuration\s*\{/);
    });

    test("declares ECR lifecycle policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_ecr_lifecycle_policy"\s+"terraform_runner"/);
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("declares log group for plan projects", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_plan"/);
    });

    test("plan log groups use for_each for environments", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_plan"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("declares log group for apply projects", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_apply"/);
    });

    test("apply log groups use for_each for environments", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_apply"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("log groups have retention configured", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?retention_in_days\s*=\s*var\.log_retention_days/);
    });
  });

  describe("IAM Roles - CodePipeline", () => {
    test("declares CodePipeline IAM role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline_role"/);
    });

    test("CodePipeline role uses environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-codepipeline-role-\$\{local\.env_suffix\}"/);
    });

    test("CodePipeline role has assume_role_policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline_role"[\s\S]*?assume_role_policy\s*=/);
    });

    test("CodePipeline role trusts codepipeline service", () => {
      expect(terraformCode).toMatch(/codepipeline\.amazonaws\.com/);
    });

    test("declares CodePipeline role policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"codepipeline_policy"/);
    });
  });

  describe("IAM Roles - CodeBuild Plan", () => {
    test("declares CodeBuild plan IAM role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"codebuild_plan_role"/);
    });

    test("CodeBuild plan role uses for_each", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"codebuild_plan_role"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("CodeBuild plan role trusts codebuild service", () => {
      expect(terraformCode).toMatch(/codebuild\.amazonaws\.com/);
    });

    test("declares CodeBuild plan role policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"codebuild_plan_policy"/);
    });

    test("CodeBuild plan policy has S3 permissions", () => {
      expect(terraformCode).toMatch(/s3:GetObject/);
    });

    test("CodeBuild plan policy has DynamoDB permissions", () => {
      expect(terraformCode).toMatch(/dynamodb:GetItem/);
    });

    test("CodeBuild plan policy has ECR permissions", () => {
      expect(terraformCode).toMatch(/ecr:GetAuthorizationToken/);
    });

    test("declares VPC policy for plan role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"codebuild_plan_vpc_policy"/);
    });
  });

  describe("IAM Roles - CodeBuild Apply", () => {
    test("declares CodeBuild apply IAM role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"codebuild_apply_role"/);
    });

    test("CodeBuild apply role uses for_each", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"codebuild_apply_role"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("declares CodeBuild apply role policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"codebuild_apply_policy"/);
    });

    test("CodeBuild apply policy has full permissions", () => {
      expect(terraformCode).toMatch(/Action\s*=\s*"\*"/);
    });
  });

  describe("IAM Roles - CloudWatch Events", () => {
    test("declares CloudWatch Events IAM role", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role"\s+"cloudwatch_events_role"/);
    });

    test("CloudWatch Events role trusts events service", () => {
      expect(terraformCode).toMatch(/events\.amazonaws\.com/);
    });

    test("declares CloudWatch Events role policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudwatch_events_policy"/);
    });

    test("CloudWatch Events policy can start pipeline", () => {
      expect(terraformCode).toMatch(/codepipeline:StartPipelineExecution/);
    });
  });

  describe("Security Group", () => {
    test("declares security group for CodeBuild", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"codebuild"/);
    });

    test("security group uses conditional count", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"\s+"codebuild"[\s\S]*?count\s*=\s*var\.enable_vpc_config\s*\?\s*1\s*:\s*0/);
    });

    test("security group has egress rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_security_group"[\s\S]*?egress\s*\{/);
    });
  });

  describe("CodeBuild Projects - Plan", () => {
    test("declares CodeBuild plan projects", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_plan"/);
    });

    test("plan projects use for_each", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_plan"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("plan projects use environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-plan-\$\{each\.key\}-\$\{local\.env_suffix\}"/);
    });

    test("plan projects use CODEPIPELINE artifacts", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_plan"[\s\S]*?artifacts[\s\S]*?type\s*=\s*"CODEPIPELINE"/);
    });

    test("plan projects use custom ECR image", () => {
      expect(terraformCode).toMatch(/image\s*=\s*"\$\{aws_ecr_repository\.terraform_runner\.repository_url\}/);
    });

    test("plan projects have ENVIRONMENT variable", () => {
      expect(terraformCode).toMatch(/environment_variable[\s\S]*?name\s*=\s*"ENVIRONMENT"/);
    });

    test("plan projects have TF_STATE_BUCKET variable", () => {
      expect(terraformCode).toMatch(/environment_variable[\s\S]*?name\s*=\s*"TF_STATE_BUCKET"/);
    });

    test("plan projects have dynamic vpc_config", () => {
      expect(terraformCode).toMatch(/dynamic\s+"vpc_config"/);
    });

    test("plan projects reference buildspec file", () => {
      expect(terraformCode).toMatch(/buildspec\s*=\s*"buildspecs\/buildspec-plan\.yml"/);
    });

    test("plan projects have logs_config", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_plan"[\s\S]*?logs_config\s*\{/);
    });
  });

  describe("CodeBuild Projects - Apply", () => {
    test("declares CodeBuild apply projects", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_apply"/);
    });

    test("apply projects use for_each", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_apply"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("apply projects use environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-apply-\$\{each\.key\}-\$\{local\.env_suffix\}"/);
    });

    test("apply projects use larger instance for prod", () => {
      expect(terraformCode).toMatch(/compute_type\s*=\s*each\.key\s*==\s*"prod"\s*\?\s*"BUILD_GENERAL1_MEDIUM"/);
    });

    test("apply projects reference buildspec file", () => {
      expect(terraformCode).toMatch(/buildspec\s*=\s*"buildspecs\/buildspec-apply\.yml"/);
    });
  });

  describe("SNS Topics", () => {
    test("declares pipeline notifications topic", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_notifications"/);
    });

    test("pipeline notifications topic uses environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-pipeline-notifications-\$\{local\.env_suffix\}"/);
    });

    test("pipeline notifications topic uses KMS encryption", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_notifications"[\s\S]*?kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
    });

    test("declares approval topic", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic"\s+"approval"/);
    });

    test("declares email subscription for notifications", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"pipeline_notifications_email"/);
    });

    test("declares email subscription for approval", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"approval_email"/);
    });

    test("declares SNS topic policy", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_sns_topic_policy"\s+"pipeline_notifications"/);
    });
  });

  describe("CodePipeline", () => {
    test("declares CodePipeline resources", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codepipeline"\s+"terraform_pipeline"/);
    });

    test("pipelines use for_each", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_codepipeline"\s+"terraform_pipeline"[\s\S]*?for_each\s*=\s*toset\(var\.environments\)/);
    });

    test("pipelines use environment suffix", () => {
      expect(terraformCode).toMatch(/name\s*=\s*"terraform-pipeline-\$\{each\.key\}-\$\{local\.env_suffix\}"/);
    });

    test("pipelines have Source stage", () => {
      expect(terraformCode).toMatch(/stage[\s\S]*?name\s*=\s*"Source"/);
    });

    test("Source stage uses CodeCommit", () => {
      expect(terraformCode).toMatch(/provider\s*=\s*"CodeCommit"/);
    });

    test("pipelines have Plan stage", () => {
      expect(terraformCode).toMatch(/stage[\s\S]*?name\s*=\s*"Plan"/);
    });

    test("pipelines have dynamic Approval stage", () => {
      expect(terraformCode).toMatch(/dynamic\s+"stage"[\s\S]*?each\.key\s*==\s*"prod"/);
    });

    test("pipelines have Apply stage", () => {
      expect(terraformCode).toMatch(/stage[\s\S]*?name\s*=\s*"Apply"/);
    });
  });

  describe("CloudWatch Events", () => {
    test("declares CodeCommit trigger event rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"codecommit_trigger"/);
    });

    test("trigger rules use conditional for_each", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"codecommit_trigger"[\s\S]*?for_each\s*=\s*var\.enable_codecommit\s*\?\s*toset\(var\.environments\)\s*:\s*\[\]/);
    });

    test("declares event target for pipeline trigger", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"pipeline_trigger"/);
    });

    test("declares pipeline state change event rule", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"pipeline_state_change"/);
    });

    test("state change rules use conditional for_each", () => {
      expect(terraformCode).toMatch(/for_each\s*=\s*var\.enable_notifications\s*\?\s*toset\(var\.environments\)\s*:\s*toset\(\[\]\)/);
    });

    test("declares SNS notification event target", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"sns_notification"/);
    });
  });

  describe("CloudWatch Alarms", () => {
    test("declares pipeline failure alarms", () => {
      expect(terraformCode).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"pipeline_failures"/);
    });

    test("alarms use conditional for_each", () => {
      expect(terraformCode).toMatch(/for_each\s*=\s*var\.enable_enhanced_monitoring\s*\?\s*toset\(var\.environments\)\s*:\s*toset\(\[\]\)/);
    });

    test("alarms monitor PipelineExecutionFailure metric", () => {
      expect(terraformCode).toMatch(/metric_name\s*=\s*"PipelineExecutionFailure"/);
    });

    test("alarms use SNS for notifications", () => {
      expect(terraformCode).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.pipeline_notifications\.arn\]/);
    });
  });

  describe("Outputs", () => {
    test("declares repository_clone_url_http output", () => {
      expect(terraformCode).toMatch(/output\s+"repository_clone_url_http"/);
    });

    test("declares repository_clone_url_ssh output", () => {
      expect(terraformCode).toMatch(/output\s+"repository_clone_url_ssh"/);
    });

    test("declares state_bucket_name output", () => {
      expect(terraformCode).toMatch(/output\s+"state_bucket_name"/);
    });

    test("declares state_lock_table_name output", () => {
      expect(terraformCode).toMatch(/output\s+"state_lock_table_name"/);
    });

    test("declares ecr_repository_url output", () => {
      expect(terraformCode).toMatch(/output\s+"ecr_repository_url"/);
    });

    test("declares pipeline_names output", () => {
      expect(terraformCode).toMatch(/output\s+"pipeline_names"/);
    });

    test("declares pipeline_urls output", () => {
      expect(terraformCode).toMatch(/output\s+"pipeline_urls"/);
    });

    test("declares notification_topic_arn output", () => {
      expect(terraformCode).toMatch(/output\s+"notification_topic_arn"/);
    });

    test("declares approval_topic_arn output", () => {
      expect(terraformCode).toMatch(/output\s+"approval_topic_arn"/);
    });

    test("declares env_suffix output", () => {
      expect(terraformCode).toMatch(/output\s+"env_suffix"/);
    });
  });

  describe("Resource Naming with Environment Suffix", () => {
    test("CodeCommit repository uses env_suffix", () => {
      expect(terraformCode).toMatch(/repository_name[\s\S]*?local\.env_suffix/);
    });

    test("S3 state bucket uses env_suffix via local", () => {
      expect(terraformCode).toMatch(/state_bucket_name[\s\S]*?env_suffix/);
    });

    test("DynamoDB table uses env_suffix", () => {
      expect(terraformCode).toMatch(/terraform-state-lock-\$\{local\.env_suffix\}/);
    });

    test("ECR repository uses env_suffix", () => {
      expect(terraformCode).toMatch(/terraform-runner-\$\{local\.env_suffix\}/);
    });

    test("CodeBuild projects use env_suffix", () => {
      expect(terraformCode).toMatch(/terraform-plan-\$\{each\.key\}-\$\{local\.env_suffix\}/);
    });

    test("CodePipeline uses env_suffix", () => {
      expect(terraformCode).toMatch(/terraform-pipeline-\$\{each\.key\}-\$\{local\.env_suffix\}/);
    });
  });

  describe("Tagging Strategy", () => {
    test("common_tags includes all required tags", () => {
      const commonTagsMatch = terraformCode.match(/common_tags\s*=\s*\{[\s\S]*?\}/);
      expect(commonTagsMatch).toBeTruthy();
      if (commonTagsMatch) {
        expect(commonTagsMatch[0]).toMatch(/Environment/);
        expect(commonTagsMatch[0]).toMatch(/Application/);
        expect(commonTagsMatch[0]).toMatch(/ManagedBy/);
        expect(commonTagsMatch[0]).toMatch(/Project/);
      }
    });

    test("resources merge common_tags", () => {
      expect(terraformCode).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  describe("Multi-Environment Support", () => {
    test("uses for_each with environments variable", () => {
      const forEachCount = (terraformCode.match(/for_each\s*=\s*toset\(var\.environments\)/g) || []).length;
      expect(forEachCount).toBeGreaterThan(5);
    });

    test("branches are environment-specific", () => {
      expect(terraformCode).toMatch(/BranchName\s*=\s*each\.key\s*==\s*"prod"\s*\?\s*"main"\s*:\s*each\.key/);
    });

    test("approval stage only for prod", () => {
      expect(terraformCode).toMatch(/each\.key\s*==\s*"prod"\s*\?\s*\[1\]\s*:\s*\[\]/);
    });
  });

  describe("No Emojis", () => {
    test("tap_stack.tf contains no emojis", () => {
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(terraformCode).not.toMatch(emojiRegex);
    });
  });
});
