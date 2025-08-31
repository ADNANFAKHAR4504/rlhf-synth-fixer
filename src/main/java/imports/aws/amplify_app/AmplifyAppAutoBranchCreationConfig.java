package imports.aws.amplify_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.932Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyApp.AmplifyAppAutoBranchCreationConfig")
@software.amazon.jsii.Jsii.Proxy(AmplifyAppAutoBranchCreationConfig.Jsii$Proxy.class)
public interface AmplifyAppAutoBranchCreationConfig extends software.amazon.jsii.JsiiSerializable {

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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_build AmplifyApp#enable_auto_build}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoBuild() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableBasicAuth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_performance_mode AmplifyApp#enable_performance_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePerformanceMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_pull_request_preview AmplifyApp#enable_pull_request_preview}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePullRequestPreview() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#environment_variables AmplifyApp#environment_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#framework AmplifyApp#framework}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFramework() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#pull_request_environment_name AmplifyApp#pull_request_environment_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPullRequestEnvironmentName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#stage AmplifyApp#stage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmplifyAppAutoBranchCreationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmplifyAppAutoBranchCreationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmplifyAppAutoBranchCreationConfig> {
        java.lang.String basicAuthCredentials;
        java.lang.String buildSpec;
        java.lang.Object enableAutoBuild;
        java.lang.Object enableBasicAuth;
        java.lang.Object enablePerformanceMode;
        java.lang.Object enablePullRequestPreview;
        java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        java.lang.String framework;
        java.lang.String pullRequestEnvironmentName;
        java.lang.String stage;

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getBasicAuthCredentials}
         * @param basicAuthCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#basic_auth_credentials AmplifyApp#basic_auth_credentials}.
         * @return {@code this}
         */
        public Builder basicAuthCredentials(java.lang.String basicAuthCredentials) {
            this.basicAuthCredentials = basicAuthCredentials;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getBuildSpec}
         * @param buildSpec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#build_spec AmplifyApp#build_spec}.
         * @return {@code this}
         */
        public Builder buildSpec(java.lang.String buildSpec) {
            this.buildSpec = buildSpec;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnableAutoBuild}
         * @param enableAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_build AmplifyApp#enable_auto_build}.
         * @return {@code this}
         */
        public Builder enableAutoBuild(java.lang.Boolean enableAutoBuild) {
            this.enableAutoBuild = enableAutoBuild;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnableAutoBuild}
         * @param enableAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_build AmplifyApp#enable_auto_build}.
         * @return {@code this}
         */
        public Builder enableAutoBuild(com.hashicorp.cdktf.IResolvable enableAutoBuild) {
            this.enableAutoBuild = enableAutoBuild;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnableBasicAuth}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
         * @return {@code this}
         */
        public Builder enableBasicAuth(java.lang.Boolean enableBasicAuth) {
            this.enableBasicAuth = enableBasicAuth;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnableBasicAuth}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
         * @return {@code this}
         */
        public Builder enableBasicAuth(com.hashicorp.cdktf.IResolvable enableBasicAuth) {
            this.enableBasicAuth = enableBasicAuth;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnablePerformanceMode}
         * @param enablePerformanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_performance_mode AmplifyApp#enable_performance_mode}.
         * @return {@code this}
         */
        public Builder enablePerformanceMode(java.lang.Boolean enablePerformanceMode) {
            this.enablePerformanceMode = enablePerformanceMode;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnablePerformanceMode}
         * @param enablePerformanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_performance_mode AmplifyApp#enable_performance_mode}.
         * @return {@code this}
         */
        public Builder enablePerformanceMode(com.hashicorp.cdktf.IResolvable enablePerformanceMode) {
            this.enablePerformanceMode = enablePerformanceMode;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnablePullRequestPreview}
         * @param enablePullRequestPreview Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_pull_request_preview AmplifyApp#enable_pull_request_preview}.
         * @return {@code this}
         */
        public Builder enablePullRequestPreview(java.lang.Boolean enablePullRequestPreview) {
            this.enablePullRequestPreview = enablePullRequestPreview;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnablePullRequestPreview}
         * @param enablePullRequestPreview Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_pull_request_preview AmplifyApp#enable_pull_request_preview}.
         * @return {@code this}
         */
        public Builder enablePullRequestPreview(com.hashicorp.cdktf.IResolvable enablePullRequestPreview) {
            this.enablePullRequestPreview = enablePullRequestPreview;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getEnvironmentVariables}
         * @param environmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#environment_variables AmplifyApp#environment_variables}.
         * @return {@code this}
         */
        public Builder environmentVariables(java.util.Map<java.lang.String, java.lang.String> environmentVariables) {
            this.environmentVariables = environmentVariables;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getFramework}
         * @param framework Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#framework AmplifyApp#framework}.
         * @return {@code this}
         */
        public Builder framework(java.lang.String framework) {
            this.framework = framework;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getPullRequestEnvironmentName}
         * @param pullRequestEnvironmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#pull_request_environment_name AmplifyApp#pull_request_environment_name}.
         * @return {@code this}
         */
        public Builder pullRequestEnvironmentName(java.lang.String pullRequestEnvironmentName) {
            this.pullRequestEnvironmentName = pullRequestEnvironmentName;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyAppAutoBranchCreationConfig#getStage}
         * @param stage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#stage AmplifyApp#stage}.
         * @return {@code this}
         */
        public Builder stage(java.lang.String stage) {
            this.stage = stage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AmplifyAppAutoBranchCreationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmplifyAppAutoBranchCreationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmplifyAppAutoBranchCreationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmplifyAppAutoBranchCreationConfig {
        private final java.lang.String basicAuthCredentials;
        private final java.lang.String buildSpec;
        private final java.lang.Object enableAutoBuild;
        private final java.lang.Object enableBasicAuth;
        private final java.lang.Object enablePerformanceMode;
        private final java.lang.Object enablePullRequestPreview;
        private final java.util.Map<java.lang.String, java.lang.String> environmentVariables;
        private final java.lang.String framework;
        private final java.lang.String pullRequestEnvironmentName;
        private final java.lang.String stage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.basicAuthCredentials = software.amazon.jsii.Kernel.get(this, "basicAuthCredentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.buildSpec = software.amazon.jsii.Kernel.get(this, "buildSpec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableAutoBuild = software.amazon.jsii.Kernel.get(this, "enableAutoBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableBasicAuth = software.amazon.jsii.Kernel.get(this, "enableBasicAuth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enablePerformanceMode = software.amazon.jsii.Kernel.get(this, "enablePerformanceMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enablePullRequestPreview = software.amazon.jsii.Kernel.get(this, "enablePullRequestPreview", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.environmentVariables = software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.framework = software.amazon.jsii.Kernel.get(this, "framework", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pullRequestEnvironmentName = software.amazon.jsii.Kernel.get(this, "pullRequestEnvironmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stage = software.amazon.jsii.Kernel.get(this, "stage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.basicAuthCredentials = builder.basicAuthCredentials;
            this.buildSpec = builder.buildSpec;
            this.enableAutoBuild = builder.enableAutoBuild;
            this.enableBasicAuth = builder.enableBasicAuth;
            this.enablePerformanceMode = builder.enablePerformanceMode;
            this.enablePullRequestPreview = builder.enablePullRequestPreview;
            this.environmentVariables = builder.environmentVariables;
            this.framework = builder.framework;
            this.pullRequestEnvironmentName = builder.pullRequestEnvironmentName;
            this.stage = builder.stage;
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
        public final java.lang.Object getEnableAutoBuild() {
            return this.enableAutoBuild;
        }

        @Override
        public final java.lang.Object getEnableBasicAuth() {
            return this.enableBasicAuth;
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
        public final java.lang.String getPullRequestEnvironmentName() {
            return this.pullRequestEnvironmentName;
        }

        @Override
        public final java.lang.String getStage() {
            return this.stage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBasicAuthCredentials() != null) {
                data.set("basicAuthCredentials", om.valueToTree(this.getBasicAuthCredentials()));
            }
            if (this.getBuildSpec() != null) {
                data.set("buildSpec", om.valueToTree(this.getBuildSpec()));
            }
            if (this.getEnableAutoBuild() != null) {
                data.set("enableAutoBuild", om.valueToTree(this.getEnableAutoBuild()));
            }
            if (this.getEnableBasicAuth() != null) {
                data.set("enableBasicAuth", om.valueToTree(this.getEnableBasicAuth()));
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
            if (this.getPullRequestEnvironmentName() != null) {
                data.set("pullRequestEnvironmentName", om.valueToTree(this.getPullRequestEnvironmentName()));
            }
            if (this.getStage() != null) {
                data.set("stage", om.valueToTree(this.getStage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.amplifyApp.AmplifyAppAutoBranchCreationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmplifyAppAutoBranchCreationConfig.Jsii$Proxy that = (AmplifyAppAutoBranchCreationConfig.Jsii$Proxy) o;

            if (this.basicAuthCredentials != null ? !this.basicAuthCredentials.equals(that.basicAuthCredentials) : that.basicAuthCredentials != null) return false;
            if (this.buildSpec != null ? !this.buildSpec.equals(that.buildSpec) : that.buildSpec != null) return false;
            if (this.enableAutoBuild != null ? !this.enableAutoBuild.equals(that.enableAutoBuild) : that.enableAutoBuild != null) return false;
            if (this.enableBasicAuth != null ? !this.enableBasicAuth.equals(that.enableBasicAuth) : that.enableBasicAuth != null) return false;
            if (this.enablePerformanceMode != null ? !this.enablePerformanceMode.equals(that.enablePerformanceMode) : that.enablePerformanceMode != null) return false;
            if (this.enablePullRequestPreview != null ? !this.enablePullRequestPreview.equals(that.enablePullRequestPreview) : that.enablePullRequestPreview != null) return false;
            if (this.environmentVariables != null ? !this.environmentVariables.equals(that.environmentVariables) : that.environmentVariables != null) return false;
            if (this.framework != null ? !this.framework.equals(that.framework) : that.framework != null) return false;
            if (this.pullRequestEnvironmentName != null ? !this.pullRequestEnvironmentName.equals(that.pullRequestEnvironmentName) : that.pullRequestEnvironmentName != null) return false;
            return this.stage != null ? this.stage.equals(that.stage) : that.stage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.basicAuthCredentials != null ? this.basicAuthCredentials.hashCode() : 0;
            result = 31 * result + (this.buildSpec != null ? this.buildSpec.hashCode() : 0);
            result = 31 * result + (this.enableAutoBuild != null ? this.enableAutoBuild.hashCode() : 0);
            result = 31 * result + (this.enableBasicAuth != null ? this.enableBasicAuth.hashCode() : 0);
            result = 31 * result + (this.enablePerformanceMode != null ? this.enablePerformanceMode.hashCode() : 0);
            result = 31 * result + (this.enablePullRequestPreview != null ? this.enablePullRequestPreview.hashCode() : 0);
            result = 31 * result + (this.environmentVariables != null ? this.environmentVariables.hashCode() : 0);
            result = 31 * result + (this.framework != null ? this.framework.hashCode() : 0);
            result = 31 * result + (this.pullRequestEnvironmentName != null ? this.pullRequestEnvironmentName.hashCode() : 0);
            result = 31 * result + (this.stage != null ? this.stage.hashCode() : 0);
            return result;
        }
    }
}
