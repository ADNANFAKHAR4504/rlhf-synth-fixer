package app.config;

import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;

public record CodeBuildConfig(String component, String buildSpec, IamRole serviceRole) { }
