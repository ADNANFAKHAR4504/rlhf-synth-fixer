data "external" "pipeline_env" {
  program = [
    "python3",
    "-c",
    "import os, json; print(json.dumps({\"environment_suffix\": os.getenv(\"ENVIRONMENT_SUFFIX\", \"\")}))"
  ]
}

locals {
  # Prefer explicitly provided variable if set; otherwise use pipeline ENVIRONMENT_SUFFIX
  environment_suffix = (
    length(trimspace(var.environment_suffix)) > 0
  ) ? trimspace(var.environment_suffix) : trimspace(try(data.external.pipeline_env.result.environment_suffix, ""))
}
