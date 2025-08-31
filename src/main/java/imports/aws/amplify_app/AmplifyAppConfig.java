package imports.aws.amplify_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.933Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyApp.AmplifyAppConfig")
@software.amazon.jsii.Jsii.Proxy(AmplifyAppConfig.Jsii$Proxy.class)
public interface AmplifyAppConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#name AmplifyApp#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#access_token AmplifyApp#access_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessToken() {
        return null;
    }

    /**
     * auto_branch_creation_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_config AmplifyApp#auto_branch_creation_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig getAutoBranchCreationConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_patterns AmplifyApp#auto_branch_creation_patterns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAutoBranchCreationPatterns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#basic_auth_credentials AmplifyApp#basic_auth_credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#build_spec AmplifyApp#build_spec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBuildSpec() {
        return null;
    }

    /**
     * cache_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#cache_config AmplifyApp#cache_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.amplify_app.AmplifyAppCacheConfig getCacheConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#compute_role_arn AmplifyApp#compute_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComputeRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_headers AmplifyApp#custom_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomHeaders() {
        return null;
    }

    /**
     * custom_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_rule AmplifyApp#custom_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#description AmplifyApp#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoBranchCreation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableBasicAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableBranchAutoBuild() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableBranchAutoDeletion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#environment_variables AmplifyApp#environment_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#iam_service_role_arn AmplifyApp#iam_service_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamServiceRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#id AmplifyApp#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#oauth_token AmplifyApp#oauth_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOauthToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#platform AmplifyApp#platform}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatform() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#repository AmplifyApp#repository}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRepository() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags AmplifyApp#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags_all AmplifyApp#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmplifyAppConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmplifyAppConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmplifyAppConfig> {
        java.lang.String name;
        java.lang.String accessToken;
        imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig autoBranchCreationConfig;
        java.util.List<java.lang.String> autoBranchCreationPatterns;
        java.lang.String basicAuthCredentials;
        java.lang.String buildSpec;
        imports.aws.amplify_app.AmplifyAppCacheConfig cacheConfig;
        java.lang.String computeRoleArn;
        java.lang.String customHeaders;
        java.lang.Object customRule;
        java.lang.String description;
        java.lang.Object enableAutoBranchCreation;
        java.lang.Object enableBasicAuth;
        java.lang.Object enableBranchAutoBuild;
        java.lang.Object enableBranchAutoDeletion;
        java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        java.lang.String iamServiceRoleArn;
        java.lang.String id;
        java.lang.String oauthToken;
        java.lang.String platform;
        java.lang.String repository;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AmplifyAppConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#name AmplifyApp#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getAccessToken}
         * @param accessToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#access_token AmplifyApp#access_token}.
         * @return {@code this}
         */
        public Builder accessToken(java.lang.String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getAutoBranchCreationConfig}
         * @param autoBranchCreationConfig auto_branch_creation_config block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_config AmplifyApp#auto_branch_creation_config}
         * @return {@code this}
         */
        public Builder autoBranchCreationConfig(imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig autoBranchCreationConfig) {
            this.autoBranchCreationConfig = autoBranchCreationConfig;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getAutoBranchCreationPatterns}
         * @param autoBranchCreationPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_patterns AmplifyApp#auto_branch_creation_patterns}.
         * @return {@code this}
         */
        public Builder autoBranchCreationPatterns(java.util.List<java.lang.String> autoBranchCreationPatterns) {
            this.autoBranchCreationPatterns = autoBranchCreationPatterns;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getBasicAuthCredentials}
         * @param basicAuthCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#basic_auth_credentials AmplifyApp#basic_auth_credentials}.
         * @return {@code this}
         */
        public Builder basicAuthCredentials(java.lang.String basicAuthCredentials) {
            this.basicAuthCredentials = basicAuthCredentials;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getBuildSpec}
         * @param buildSpec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#build_spec AmplifyApp#build_spec}.
         * @return {@code this}
         */
        public Builder buildSpec(java.lang.String buildSpec) {
            this.buildSpec = buildSpec;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getCacheConfig}
         * @param cacheConfig cache_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#cache_config AmplifyApp#cache_config}
         * @return {@code this}
         */
        public Builder cacheConfig(imports.aws.amplify_app.AmplifyAppCacheConfig cacheConfig) {
            this.cacheConfig = cacheConfig;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getComputeRoleArn}
         * @param computeRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#compute_role_arn AmplifyApp#compute_role_arn}.
         * @return {@code this}
         */
        public Builder computeRoleArn(java.lang.String computeRoleArn) {
            this.computeRoleArn = computeRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getCustomHeaders}
         * @param customHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_headers AmplifyApp#custom_headers}.
         * @return {@code this}
         */
        public Builder customHeaders(java.lang.String customHeaders) {
            this.customHeaders = customHeaders;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getCustomRule}
         * @param customRule custom_rule block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_rule AmplifyApp#custom_rule}
         * @return {@code this}
         */
        public Builder customRule(com.hashicorp.cdktf.IResolvable customRule) {
            this.customRule = customRule;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getCustomRule}
         * @param customRule custom_rule block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_rule AmplifyApp#custom_rule}
         * @return {@code this}
         */
        public Builder customRule(java.util.List<? extends imports.aws.amplify_app.AmplifyAppCustomRule> customRule) {
            this.customRule = customRule;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#description AmplifyApp#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableAutoBranchCreation}
         * @param enableAutoBranchCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}.
         * @return {@code this}
         */
        public Builder enableAutoBranchCreation(java.lang.Boolean enableAutoBranchCreation) {
            this.enableAutoBranchCreation = enableAutoBranchCreation;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableAutoBranchCreation}
         * @param enableAutoBranchCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}.
         * @return {@code this}
         */
        public Builder enableAutoBranchCreation(com.hashicorp.cdktf.IResolvable enableAutoBranchCreation) {
            this.enableAutoBranchCreation = enableAutoBranchCreation;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableBasicAuth}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
         * @return {@code this}
         */
        public Builder enableBasicAuth(java.lang.Boolean enableBasicAuth) {
            this.enableBasicAuth = enableBasicAuth;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableBasicAuth}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
         * @return {@code this}
         */
        public Builder enableBasicAuth(com.hashicorp.cdktf.IResolvable enableBasicAuth) {
            this.enableBasicAuth = enableBasicAuth;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableBranchAutoBuild}
         * @param enableBranchAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}.
         * @return {@code this}
         */
        public Builder enableBranchAutoBuild(java.lang.Boolean enableBranchAutoBuild) {
            this.enableBranchAutoBuild = enableBranchAutoBuild;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableBranchAutoBuild}
         * @param enableBranchAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}.
         * @return {@code this}
         */
        public Builder enableBranchAutoBuild(com.hashicorp.cdktf.IResolvable enableBranchAutoBuild) {
            this.enableBranchAutoBuild = enableBranchAutoBuild;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableBranchAutoDeletion}
         * @param enableBranchAutoDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}.
         * @return {@code this}
         */
        public Builder enableBranchAutoDeletion(java.lang.Boolean enableBranchAutoDeletion) {
            this.enableBranchAutoDeletion = enableBranchAutoDeletion;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnableBranchAutoDeletion}
         * @param enableBranchAutoDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}.
         * @return {@code this}
         */
        public Builder enableBranchAutoDeletion(com.hashicorp.cdktf.IResolvable enableBranchAutoDeletion) {
            this.enableBranchAutoDeletion = enableBranchAutoDeletion;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getEnvironmentVariables}
         * @param environmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#environment_variables AmplifyApp#environment_variables}.
         * @return {@code this}
         */
        public Builder environmentVariables(java.util.Map<java.lang.String, java.lang.String> environmentVariables) {
            this.environmentVariables = environmentVariables;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getIamServiceRoleArn}
         * @param iamServiceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#iam_service_role_arn AmplifyApp#iam_service_role_arn}.
         * @return {@code this}
         */
        public Builder iamServiceRoleArn(java.lang.String iamServiceRoleArn) {
            this.iamServiceRoleArn = iamServiceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#id AmplifyApp#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getOauthToken}
         * @param oauthToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#oauth_token AmplifyApp#oauth_token}.
         * @return {@code this}
         */
        public Builder oauthToken(java.lang.String oauthToken) {
            this.oauthToken = oauthToken;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getPlatform}
         * @param platform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#platform AmplifyApp#platform}.
         * @return {@code this}
         */
        public Builder platform(java.lang.String platform) {
            this.platform = platform;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getRepository}
         * @param repository Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#repository AmplifyApp#repository}.
         * @return {@code this}
         */
        public Builder repository(java.lang.String repository) {
            this.repository = repository;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags AmplifyApp#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags_all AmplifyApp#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AmplifyAppConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmplifyAppConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmplifyAppConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmplifyAppConfig {
        private final java.lang.String name;
        private final java.lang.String accessToken;
        private final imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig autoBranchCreationConfig;
        private final java.util.List<java.lang.String> autoBranchCreationPatterns;
        private final java.lang.String basicAuthCredentials;
        private final java.lang.String buildSpec;
        private final imports.aws.amplify_app.AmplifyAppCacheConfig cacheConfig;
        private final java.lang.String computeRoleArn;
        private final java.lang.String customHeaders;
        private final java.lang.Object customRule;
        private final java.lang.String description;
        private final java.lang.Object enableAutoBranchCreation;
        private final java.lang.Object enableBasicAuth;
        private final java.lang.Object enableBranchAutoBuild;
        private final java.lang.Object enableBranchAutoDeletion;
        private final java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        private final java.lang.String iamServiceRoleArn;
        private final java.lang.String id;
        private final java.lang.String oauthToken;
        private final java.lang.String platform;
        private final java.lang.String repository;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessToken = software.amazon.jsii.Kernel.get(this, "accessToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoBranchCreationConfig = software.amazon.jsii.Kernel.get(this, "autoBranchCreationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig.class));
            this.autoBranchCreationPatterns = software.amazon.jsii.Kernel.get(this, "autoBranchCreationPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.basicAuthCredentials = software.amazon.jsii.Kernel.get(this, "basicAuthCredentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.buildSpec = software.amazon.jsii.Kernel.get(this, "buildSpec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheConfig = software.amazon.jsii.Kernel.get(this, "cacheConfig", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppCacheConfig.class));
            this.computeRoleArn = software.amazon.jsii.Kernel.get(this, "computeRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customHeaders = software.amazon.jsii.Kernel.get(this, "customHeaders", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customRule = software.amazon.jsii.Kernel.get(this, "customRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableAutoBranchCreation = software.amazon.jsii.Kernel.get(this, "enableAutoBranchCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableBasicAuth = software.amazon.jsii.Kernel.get(this, "enableBasicAuth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableBranchAutoBuild = software.amazon.jsii.Kernel.get(this, "enableBranchAutoBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableBranchAutoDeletion = software.amazon.jsii.Kernel.get(this, "enableBranchAutoDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.environmentVariables = software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.iamServiceRoleArn = software.amazon.jsii.Kernel.get(this, "iamServiceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oauthToken = software.amazon.jsii.Kernel.get(this, "oauthToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platform = software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repository = software.amazon.jsii.Kernel.get(this, "repository", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.accessToken = builder.accessToken;
            this.autoBranchCreationConfig = builder.autoBranchCreationConfig;
            this.autoBranchCreationPatterns = builder.autoBranchCreationPatterns;
            this.basicAuthCredentials = builder.basicAuthCredentials;
            this.buildSpec = builder.buildSpec;
            this.cacheConfig = builder.cacheConfig;
            this.computeRoleArn = builder.computeRoleArn;
            this.customHeaders = builder.customHeaders;
            this.customRule = builder.customRule;
            this.description = builder.description;
            this.enableAutoBranchCreation = builder.enableAutoBranchCreation;
            this.enableBasicAuth = builder.enableBasicAuth;
            this.enableBranchAutoBuild = builder.enableBranchAutoBuild;
            this.enableBranchAutoDeletion = builder.enableBranchAutoDeletion;
            this.environmentVariables = builder.environmentVariables;
            this.iamServiceRoleArn = builder.iamServiceRoleArn;
            this.id = builder.id;
            this.oauthToken = builder.oauthToken;
            this.platform = builder.platform;
            this.repository = builder.repository;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAccessToken() {
            return this.accessToken;
        }

        @Override
        public final imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig getAutoBranchCreationConfig() {
            return this.autoBranchCreationConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getAutoBranchCreationPatterns() {
            return this.autoBranchCreationPatterns;
        }

        @Override
        public final java.lang.String getBasicAuthCredentials() {
            return this.basicAuthCredentials;
        }

        @Override
        public final java.lang.String getBuildSpec() {
            return this.buildSpec;
        }

        @Override
        public final imports.aws.amplify_app.AmplifyAppCacheConfig getCacheConfig() {
            return this.cacheConfig;
        }

        @Override
        public final java.lang.String getComputeRoleArn() {
            return this.computeRoleArn;
        }

        @Override
        public final java.lang.String getCustomHeaders() {
            return this.customHeaders;
        }

        @Override
        public final java.lang.Object getCustomRule() {
            return this.customRule;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEnableAutoBranchCreation() {
            return this.enableAutoBranchCreation;
        }

        @Override
        public final java.lang.Object getEnableBasicAuth() {
            return this.enableBasicAuth;
        }

        @Override
        public final java.lang.Object getEnableBranchAutoBuild() {
            return this.enableBranchAutoBuild;
        }

        @Override
        public final java.lang.Object getEnableBranchAutoDeletion() {
            return this.enableBranchAutoDeletion;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
            return this.environmentVariables;
        }

        @Override
        public final java.lang.String getIamServiceRoleArn() {
            return this.iamServiceRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getOauthToken() {
            return this.oauthToken;
        }

        @Override
        public final java.lang.String getPlatform() {
            return this.platform;
        }

        @Override
        public final java.lang.String getRepository() {
            return this.repository;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAccessToken() != null) {
                data.set("accessToken", om.valueToTree(this.getAccessToken()));
            }
            if (this.getAutoBranchCreationConfig() != null) {
                data.set("autoBranchCreationConfig", om.valueToTree(this.getAutoBranchCreationConfig()));
            }
            if (this.getAutoBranchCreationPatterns() != null) {
                data.set("autoBranchCreationPatterns", om.valueToTree(this.getAutoBranchCreationPatterns()));
            }
            if (this.getBasicAuthCredentials() != null) {
                data.set("basicAuthCredentials", om.valueToTree(this.getBasicAuthCredentials()));
            }
            if (this.getBuildSpec() != null) {
                data.set("buildSpec", om.valueToTree(this.getBuildSpec()));
            }
            if (this.getCacheConfig() != null) {
                data.set("cacheConfig", om.valueToTree(this.getCacheConfig()));
            }
            if (this.getComputeRoleArn() != null) {
                data.set("computeRoleArn", om.valueToTree(this.getComputeRoleArn()));
            }
            if (this.getCustomHeaders() != null) {
                data.set("customHeaders", om.valueToTree(this.getCustomHeaders()));
            }
            if (this.getCustomRule() != null) {
                data.set("customRule", om.valueToTree(this.getCustomRule()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEnableAutoBranchCreation() != null) {
                data.set("enableAutoBranchCreation", om.valueToTree(this.getEnableAutoBranchCreation()));
            }
            if (this.getEnableBasicAuth() != null) {
                data.set("enableBasicAuth", om.valueToTree(this.getEnableBasicAuth()));
            }
            if (this.getEnableBranchAutoBuild() != null) {
                data.set("enableBranchAutoBuild", om.valueToTree(this.getEnableBranchAutoBuild()));
            }
            if (this.getEnableBranchAutoDeletion() != null) {
                data.set("enableBranchAutoDeletion", om.valueToTree(this.getEnableBranchAutoDeletion()));
            }
            if (this.getEnvironmentVariables() != null) {
                data.set("environmentVariables", om.valueToTree(this.getEnvironmentVariables()));
            }
            if (this.getIamServiceRoleArn() != null) {
                data.set("iamServiceRoleArn", om.valueToTree(this.getIamServiceRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOauthToken() != null) {
                data.set("oauthToken", om.valueToTree(this.getOauthToken()));
            }
            if (this.getPlatform() != null) {
                data.set("platform", om.valueToTree(this.getPlatform()));
            }
            if (this.getRepository() != null) {
                data.set("repository", om.valueToTree(this.getRepository()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.amplifyApp.AmplifyAppConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmplifyAppConfig.Jsii$Proxy that = (AmplifyAppConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.accessToken != null ? !this.accessToken.equals(that.accessToken) : that.accessToken != null) return false;
            if (this.autoBranchCreationConfig != null ? !this.autoBranchCreationConfig.equals(that.autoBranchCreationConfig) : that.autoBranchCreationConfig != null) return false;
            if (this.autoBranchCreationPatterns != null ? !this.autoBranchCreationPatterns.equals(that.autoBranchCreationPatterns) : that.autoBranchCreationPatterns != null) return false;
            if (this.basicAuthCredentials != null ? !this.basicAuthCredentials.equals(that.basicAuthCredentials) : that.basicAuthCredentials != null) return false;
            if (this.buildSpec != null ? !this.buildSpec.equals(that.buildSpec) : that.buildSpec != null) return false;
            if (this.cacheConfig != null ? !this.cacheConfig.equals(that.cacheConfig) : that.cacheConfig != null) return false;
            if (this.computeRoleArn != null ? !this.computeRoleArn.equals(that.computeRoleArn) : that.computeRoleArn != null) return false;
            if (this.customHeaders != null ? !this.customHeaders.equals(that.customHeaders) : that.customHeaders != null) return false;
            if (this.customRule != null ? !this.customRule.equals(that.customRule) : that.customRule != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.enableAutoBranchCreation != null ? !this.enableAutoBranchCreation.equals(that.enableAutoBranchCreation) : that.enableAutoBranchCreation != null) return false;
            if (this.enableBasicAuth != null ? !this.enableBasicAuth.equals(that.enableBasicAuth) : that.enableBasicAuth != null) return false;
            if (this.enableBranchAutoBuild != null ? !this.enableBranchAutoBuild.equals(that.enableBranchAutoBuild) : that.enableBranchAutoBuild != null) return false;
            if (this.enableBranchAutoDeletion != null ? !this.enableBranchAutoDeletion.equals(that.enableBranchAutoDeletion) : that.enableBranchAutoDeletion != null) return false;
            if (this.environmentVariables != null ? !this.environmentVariables.equals(that.environmentVariables) : that.environmentVariables != null) return false;
            if (this.iamServiceRoleArn != null ? !this.iamServiceRoleArn.equals(that.iamServiceRoleArn) : that.iamServiceRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.oauthToken != null ? !this.oauthToken.equals(that.oauthToken) : that.oauthToken != null) return false;
            if (this.platform != null ? !this.platform.equals(that.platform) : that.platform != null) return false;
            if (this.repository != null ? !this.repository.equals(that.repository) : that.repository != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.accessToken != null ? this.accessToken.hashCode() : 0);
            result = 31 * result + (this.autoBranchCreationConfig != null ? this.autoBranchCreationConfig.hashCode() : 0);
            result = 31 * result + (this.autoBranchCreationPatterns != null ? this.autoBranchCreationPatterns.hashCode() : 0);
            result = 31 * result + (this.basicAuthCredentials != null ? this.basicAuthCredentials.hashCode() : 0);
            result = 31 * result + (this.buildSpec != null ? this.buildSpec.hashCode() : 0);
            result = 31 * result + (this.cacheConfig != null ? this.cacheConfig.hashCode() : 0);
            result = 31 * result + (this.computeRoleArn != null ? this.computeRoleArn.hashCode() : 0);
            result = 31 * result + (this.customHeaders != null ? this.customHeaders.hashCode() : 0);
            result = 31 * result + (this.customRule != null ? this.customRule.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.enableAutoBranchCreation != null ? this.enableAutoBranchCreation.hashCode() : 0);
            result = 31 * result + (this.enableBasicAuth != null ? this.enableBasicAuth.hashCode() : 0);
            result = 31 * result + (this.enableBranchAutoBuild != null ? this.enableBranchAutoBuild.hashCode() : 0);
            result = 31 * result + (this.enableBranchAutoDeletion != null ? this.enableBranchAutoDeletion.hashCode() : 0);
            result = 31 * result + (this.environmentVariables != null ? this.environmentVariables.hashCode() : 0);
            result = 31 * result + (this.iamServiceRoleArn != null ? this.iamServiceRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.oauthToken != null ? this.oauthToken.hashCode() : 0);
            result = 31 * result + (this.platform != null ? this.platform.hashCode() : 0);
            result = 31 * result + (this.repository != null ? this.repository.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
