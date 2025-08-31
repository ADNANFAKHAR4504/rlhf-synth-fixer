package imports.aws.amplify_branch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.934Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyBranch.AmplifyBranchConfig")
@software.amazon.jsii.Jsii.Proxy(AmplifyBranchConfig.Jsii$Proxy.class)
public interface AmplifyBranchConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#app_id AmplifyBranch#app_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAppId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#branch_name AmplifyBranch#branch_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBranchName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#backend_environment_arn AmplifyBranch#backend_environment_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBackendEnvironmentArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#basic_auth_credentials AmplifyBranch#basic_auth_credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#description AmplifyBranch#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#display_name AmplifyBranch#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoBuild() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableBasicAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableNotification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePerformanceMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePullRequestPreview() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#environment_variables AmplifyBranch#environment_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#framework AmplifyBranch#framework}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFramework() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#id AmplifyBranch#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#pull_request_environment_name AmplifyBranch#pull_request_environment_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPullRequestEnvironmentName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#stage AmplifyBranch#stage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags AmplifyBranch#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags_all AmplifyBranch#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#ttl AmplifyBranch#ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTtl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmplifyBranchConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmplifyBranchConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmplifyBranchConfig> {
        java.lang.String appId;
        java.lang.String branchName;
        java.lang.String backendEnvironmentArn;
        java.lang.String basicAuthCredentials;
        java.lang.String description;
        java.lang.String displayName;
        java.lang.Object enableAutoBuild;
        java.lang.Object enableBasicAuth;
        java.lang.Object enableNotification;
        java.lang.Object enablePerformanceMode;
        java.lang.Object enablePullRequestPreview;
        java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        java.lang.String framework;
        java.lang.String id;
        java.lang.String pullRequestEnvironmentName;
        java.lang.String stage;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String ttl;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AmplifyBranchConfig#getAppId}
         * @param appId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#app_id AmplifyBranch#app_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder appId(java.lang.String appId) {
            this.appId = appId;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getBranchName}
         * @param branchName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#branch_name AmplifyBranch#branch_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder branchName(java.lang.String branchName) {
            this.branchName = branchName;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getBackendEnvironmentArn}
         * @param backendEnvironmentArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#backend_environment_arn AmplifyBranch#backend_environment_arn}.
         * @return {@code this}
         */
        public Builder backendEnvironmentArn(java.lang.String backendEnvironmentArn) {
            this.backendEnvironmentArn = backendEnvironmentArn;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getBasicAuthCredentials}
         * @param basicAuthCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#basic_auth_credentials AmplifyBranch#basic_auth_credentials}.
         * @return {@code this}
         */
        public Builder basicAuthCredentials(java.lang.String basicAuthCredentials) {
            this.basicAuthCredentials = basicAuthCredentials;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#description AmplifyBranch#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#display_name AmplifyBranch#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnableAutoBuild}
         * @param enableAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}.
         * @return {@code this}
         */
        public Builder enableAutoBuild(java.lang.Boolean enableAutoBuild) {
            this.enableAutoBuild = enableAutoBuild;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnableAutoBuild}
         * @param enableAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}.
         * @return {@code this}
         */
        public Builder enableAutoBuild(com.hashicorp.cdktf.IResolvable enableAutoBuild) {
            this.enableAutoBuild = enableAutoBuild;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnableBasicAuth}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}.
         * @return {@code this}
         */
        public Builder enableBasicAuth(java.lang.Boolean enableBasicAuth) {
            this.enableBasicAuth = enableBasicAuth;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnableBasicAuth}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}.
         * @return {@code this}
         */
        public Builder enableBasicAuth(com.hashicorp.cdktf.IResolvable enableBasicAuth) {
            this.enableBasicAuth = enableBasicAuth;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnableNotification}
         * @param enableNotification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}.
         * @return {@code this}
         */
        public Builder enableNotification(java.lang.Boolean enableNotification) {
            this.enableNotification = enableNotification;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnableNotification}
         * @param enableNotification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}.
         * @return {@code this}
         */
        public Builder enableNotification(com.hashicorp.cdktf.IResolvable enableNotification) {
            this.enableNotification = enableNotification;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnablePerformanceMode}
         * @param enablePerformanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}.
         * @return {@code this}
         */
        public Builder enablePerformanceMode(java.lang.Boolean enablePerformanceMode) {
            this.enablePerformanceMode = enablePerformanceMode;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnablePerformanceMode}
         * @param enablePerformanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}.
         * @return {@code this}
         */
        public Builder enablePerformanceMode(com.hashicorp.cdktf.IResolvable enablePerformanceMode) {
            this.enablePerformanceMode = enablePerformanceMode;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnablePullRequestPreview}
         * @param enablePullRequestPreview Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}.
         * @return {@code this}
         */
        public Builder enablePullRequestPreview(java.lang.Boolean enablePullRequestPreview) {
            this.enablePullRequestPreview = enablePullRequestPreview;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnablePullRequestPreview}
         * @param enablePullRequestPreview Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}.
         * @return {@code this}
         */
        public Builder enablePullRequestPreview(com.hashicorp.cdktf.IResolvable enablePullRequestPreview) {
            this.enablePullRequestPreview = enablePullRequestPreview;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getEnvironmentVariables}
         * @param environmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#environment_variables AmplifyBranch#environment_variables}.
         * @return {@code this}
         */
        public Builder environmentVariables(java.util.Map<java.lang.String, java.lang.String> environmentVariables) {
            this.environmentVariables = environmentVariables;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getFramework}
         * @param framework Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#framework AmplifyBranch#framework}.
         * @return {@code this}
         */
        public Builder framework(java.lang.String framework) {
            this.framework = framework;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#id AmplifyBranch#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getPullRequestEnvironmentName}
         * @param pullRequestEnvironmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#pull_request_environment_name AmplifyBranch#pull_request_environment_name}.
         * @return {@code this}
         */
        public Builder pullRequestEnvironmentName(java.lang.String pullRequestEnvironmentName) {
            this.pullRequestEnvironmentName = pullRequestEnvironmentName;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getStage}
         * @param stage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#stage AmplifyBranch#stage}.
         * @return {@code this}
         */
        public Builder stage(java.lang.String stage) {
            this.stage = stage;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags AmplifyBranch#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags_all AmplifyBranch#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getTtl}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#ttl AmplifyBranch#ttl}.
         * @return {@code this}
         */
        public Builder ttl(java.lang.String ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getDependsOn}
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
         * Sets the value of {@link AmplifyBranchConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyBranchConfig#getProvisioners}
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
         * @return a new instance of {@link AmplifyBranchConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmplifyBranchConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmplifyBranchConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmplifyBranchConfig {
        private final java.lang.String appId;
        private final java.lang.String branchName;
        private final java.lang.String backendEnvironmentArn;
        private final java.lang.String basicAuthCredentials;
        private final java.lang.String description;
        private final java.lang.String displayName;
        private final java.lang.Object enableAutoBuild;
        private final java.lang.Object enableBasicAuth;
        private final java.lang.Object enableNotification;
        private final java.lang.Object enablePerformanceMode;
        private final java.lang.Object enablePullRequestPreview;
        private final java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        private final java.lang.String framework;
        private final java.lang.String id;
        private final java.lang.String pullRequestEnvironmentName;
        private final java.lang.String stage;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String ttl;
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
            this.appId = software.amazon.jsii.Kernel.get(this, "appId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.branchName = software.amazon.jsii.Kernel.get(this, "branchName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.backendEnvironmentArn = software.amazon.jsii.Kernel.get(this, "backendEnvironmentArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.basicAuthCredentials = software.amazon.jsii.Kernel.get(this, "basicAuthCredentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableAutoBuild = software.amazon.jsii.Kernel.get(this, "enableAutoBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableBasicAuth = software.amazon.jsii.Kernel.get(this, "enableBasicAuth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableNotification = software.amazon.jsii.Kernel.get(this, "enableNotification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enablePerformanceMode = software.amazon.jsii.Kernel.get(this, "enablePerformanceMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enablePullRequestPreview = software.amazon.jsii.Kernel.get(this, "enablePullRequestPreview", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.environmentVariables = software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.framework = software.amazon.jsii.Kernel.get(this, "framework", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pullRequestEnvironmentName = software.amazon.jsii.Kernel.get(this, "pullRequestEnvironmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stage = software.amazon.jsii.Kernel.get(this, "stage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.appId = java.util.Objects.requireNonNull(builder.appId, "appId is required");
            this.branchName = java.util.Objects.requireNonNull(builder.branchName, "branchName is required");
            this.backendEnvironmentArn = builder.backendEnvironmentArn;
            this.basicAuthCredentials = builder.basicAuthCredentials;
            this.description = builder.description;
            this.displayName = builder.displayName;
            this.enableAutoBuild = builder.enableAutoBuild;
            this.enableBasicAuth = builder.enableBasicAuth;
            this.enableNotification = builder.enableNotification;
            this.enablePerformanceMode = builder.enablePerformanceMode;
            this.enablePullRequestPreview = builder.enablePullRequestPreview;
            this.environmentVariables = builder.environmentVariables;
            this.framework = builder.framework;
            this.id = builder.id;
            this.pullRequestEnvironmentName = builder.pullRequestEnvironmentName;
            this.stage = builder.stage;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.ttl = builder.ttl;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAppId() {
            return this.appId;
        }

        @Override
        public final java.lang.String getBranchName() {
            return this.branchName;
        }

        @Override
        public final java.lang.String getBackendEnvironmentArn() {
            return this.backendEnvironmentArn;
        }

        @Override
        public final java.lang.String getBasicAuthCredentials() {
            return this.basicAuthCredentials;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.lang.Object getEnableAutoBuild() {
            return this.enableAutoBuild;
        }

        @Override
        public final java.lang.Object getEnableBasicAuth() {
            return this.enableBasicAuth;
        }

        @Override
        public final java.lang.Object getEnableNotification() {
            return this.enableNotification;
        }

        @Override
        public final java.lang.Object getEnablePerformanceMode() {
            return this.enablePerformanceMode;
        }

        @Override
        public final java.lang.Object getEnablePullRequestPreview() {
            return this.enablePullRequestPreview;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
            return this.environmentVariables;
        }

        @Override
        public final java.lang.String getFramework() {
            return this.framework;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPullRequestEnvironmentName() {
            return this.pullRequestEnvironmentName;
        }

        @Override
        public final java.lang.String getStage() {
            return this.stage;
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
        public final java.lang.String getTtl() {
            return this.ttl;
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

            data.set("appId", om.valueToTree(this.getAppId()));
            data.set("branchName", om.valueToTree(this.getBranchName()));
            if (this.getBackendEnvironmentArn() != null) {
                data.set("backendEnvironmentArn", om.valueToTree(this.getBackendEnvironmentArn()));
            }
            if (this.getBasicAuthCredentials() != null) {
                data.set("basicAuthCredentials", om.valueToTree(this.getBasicAuthCredentials()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisplayName() != null) {
                data.set("displayName", om.valueToTree(this.getDisplayName()));
            }
            if (this.getEnableAutoBuild() != null) {
                data.set("enableAutoBuild", om.valueToTree(this.getEnableAutoBuild()));
            }
            if (this.getEnableBasicAuth() != null) {
                data.set("enableBasicAuth", om.valueToTree(this.getEnableBasicAuth()));
            }
            if (this.getEnableNotification() != null) {
                data.set("enableNotification", om.valueToTree(this.getEnableNotification()));
            }
            if (this.getEnablePerformanceMode() != null) {
                data.set("enablePerformanceMode", om.valueToTree(this.getEnablePerformanceMode()));
            }
            if (this.getEnablePullRequestPreview() != null) {
                data.set("enablePullRequestPreview", om.valueToTree(this.getEnablePullRequestPreview()));
            }
            if (this.getEnvironmentVariables() != null) {
                data.set("environmentVariables", om.valueToTree(this.getEnvironmentVariables()));
            }
            if (this.getFramework() != null) {
                data.set("framework", om.valueToTree(this.getFramework()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPullRequestEnvironmentName() != null) {
                data.set("pullRequestEnvironmentName", om.valueToTree(this.getPullRequestEnvironmentName()));
            }
            if (this.getStage() != null) {
                data.set("stage", om.valueToTree(this.getStage()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTtl() != null) {
                data.set("ttl", om.valueToTree(this.getTtl()));
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
            struct.set("fqn", om.valueToTree("aws.amplifyBranch.AmplifyBranchConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmplifyBranchConfig.Jsii$Proxy that = (AmplifyBranchConfig.Jsii$Proxy) o;

            if (!appId.equals(that.appId)) return false;
            if (!branchName.equals(that.branchName)) return false;
            if (this.backendEnvironmentArn != null ? !this.backendEnvironmentArn.equals(that.backendEnvironmentArn) : that.backendEnvironmentArn != null) return false;
            if (this.basicAuthCredentials != null ? !this.basicAuthCredentials.equals(that.basicAuthCredentials) : that.basicAuthCredentials != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.enableAutoBuild != null ? !this.enableAutoBuild.equals(that.enableAutoBuild) : that.enableAutoBuild != null) return false;
            if (this.enableBasicAuth != null ? !this.enableBasicAuth.equals(that.enableBasicAuth) : that.enableBasicAuth != null) return false;
            if (this.enableNotification != null ? !this.enableNotification.equals(that.enableNotification) : that.enableNotification != null) return false;
            if (this.enablePerformanceMode != null ? !this.enablePerformanceMode.equals(that.enablePerformanceMode) : that.enablePerformanceMode != null) return false;
            if (this.enablePullRequestPreview != null ? !this.enablePullRequestPreview.equals(that.enablePullRequestPreview) : that.enablePullRequestPreview != null) return false;
            if (this.environmentVariables != null ? !this.environmentVariables.equals(that.environmentVariables) : that.environmentVariables != null) return false;
            if (this.framework != null ? !this.framework.equals(that.framework) : that.framework != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.pullRequestEnvironmentName != null ? !this.pullRequestEnvironmentName.equals(that.pullRequestEnvironmentName) : that.pullRequestEnvironmentName != null) return false;
            if (this.stage != null ? !this.stage.equals(that.stage) : that.stage != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.ttl != null ? !this.ttl.equals(that.ttl) : that.ttl != null) return false;
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
            int result = this.appId.hashCode();
            result = 31 * result + (this.branchName.hashCode());
            result = 31 * result + (this.backendEnvironmentArn != null ? this.backendEnvironmentArn.hashCode() : 0);
            result = 31 * result + (this.basicAuthCredentials != null ? this.basicAuthCredentials.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.enableAutoBuild != null ? this.enableAutoBuild.hashCode() : 0);
            result = 31 * result + (this.enableBasicAuth != null ? this.enableBasicAuth.hashCode() : 0);
            result = 31 * result + (this.enableNotification != null ? this.enableNotification.hashCode() : 0);
            result = 31 * result + (this.enablePerformanceMode != null ? this.enablePerformanceMode.hashCode() : 0);
            result = 31 * result + (this.enablePullRequestPreview != null ? this.enablePullRequestPreview.hashCode() : 0);
            result = 31 * result + (this.environmentVariables != null ? this.environmentVariables.hashCode() : 0);
            result = 31 * result + (this.framework != null ? this.framework.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.pullRequestEnvironmentName != null ? this.pullRequestEnvironmentName.hashCode() : 0);
            result = 31 * result + (this.stage != null ? this.stage.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.ttl != null ? this.ttl.hashCode() : 0);
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
