package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiLogConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncGraphqlApiLogConfig.Jsii$Proxy.class)
public interface AppsyncGraphqlApiLogConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#cloudwatch_logs_role_arn AppsyncGraphqlApi#cloudwatch_logs_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchLogsRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#field_log_level AppsyncGraphqlApi#field_log_level}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFieldLogLevel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#exclude_verbose_content AppsyncGraphqlApi#exclude_verbose_content}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeVerboseContent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncGraphqlApiLogConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncGraphqlApiLogConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncGraphqlApiLogConfig> {
        java.lang.String cloudwatchLogsRoleArn;
        java.lang.String fieldLogLevel;
        java.lang.Object excludeVerboseContent;

        /**
         * Sets the value of {@link AppsyncGraphqlApiLogConfig#getCloudwatchLogsRoleArn}
         * @param cloudwatchLogsRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#cloudwatch_logs_role_arn AppsyncGraphqlApi#cloudwatch_logs_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder cloudwatchLogsRoleArn(java.lang.String cloudwatchLogsRoleArn) {
            this.cloudwatchLogsRoleArn = cloudwatchLogsRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiLogConfig#getFieldLogLevel}
         * @param fieldLogLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#field_log_level AppsyncGraphqlApi#field_log_level}. This parameter is required.
         * @return {@code this}
         */
        public Builder fieldLogLevel(java.lang.String fieldLogLevel) {
            this.fieldLogLevel = fieldLogLevel;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiLogConfig#getExcludeVerboseContent}
         * @param excludeVerboseContent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#exclude_verbose_content AppsyncGraphqlApi#exclude_verbose_content}.
         * @return {@code this}
         */
        public Builder excludeVerboseContent(java.lang.Boolean excludeVerboseContent) {
            this.excludeVerboseContent = excludeVerboseContent;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiLogConfig#getExcludeVerboseContent}
         * @param excludeVerboseContent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#exclude_verbose_content AppsyncGraphqlApi#exclude_verbose_content}.
         * @return {@code this}
         */
        public Builder excludeVerboseContent(com.hashicorp.cdktf.IResolvable excludeVerboseContent) {
            this.excludeVerboseContent = excludeVerboseContent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncGraphqlApiLogConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncGraphqlApiLogConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncGraphqlApiLogConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncGraphqlApiLogConfig {
        private final java.lang.String cloudwatchLogsRoleArn;
        private final java.lang.String fieldLogLevel;
        private final java.lang.Object excludeVerboseContent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogsRoleArn = software.amazon.jsii.Kernel.get(this, "cloudwatchLogsRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldLogLevel = software.amazon.jsii.Kernel.get(this, "fieldLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludeVerboseContent = software.amazon.jsii.Kernel.get(this, "excludeVerboseContent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogsRoleArn = java.util.Objects.requireNonNull(builder.cloudwatchLogsRoleArn, "cloudwatchLogsRoleArn is required");
            this.fieldLogLevel = java.util.Objects.requireNonNull(builder.fieldLogLevel, "fieldLogLevel is required");
            this.excludeVerboseContent = builder.excludeVerboseContent;
        }

        @Override
        public final java.lang.String getCloudwatchLogsRoleArn() {
            return this.cloudwatchLogsRoleArn;
        }

        @Override
        public final java.lang.String getFieldLogLevel() {
            return this.fieldLogLevel;
        }

        @Override
        public final java.lang.Object getExcludeVerboseContent() {
            return this.excludeVerboseContent;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cloudwatchLogsRoleArn", om.valueToTree(this.getCloudwatchLogsRoleArn()));
            data.set("fieldLogLevel", om.valueToTree(this.getFieldLogLevel()));
            if (this.getExcludeVerboseContent() != null) {
                data.set("excludeVerboseContent", om.valueToTree(this.getExcludeVerboseContent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncGraphqlApi.AppsyncGraphqlApiLogConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncGraphqlApiLogConfig.Jsii$Proxy that = (AppsyncGraphqlApiLogConfig.Jsii$Proxy) o;

            if (!cloudwatchLogsRoleArn.equals(that.cloudwatchLogsRoleArn)) return false;
            if (!fieldLogLevel.equals(that.fieldLogLevel)) return false;
            return this.excludeVerboseContent != null ? this.excludeVerboseContent.equals(that.excludeVerboseContent) : that.excludeVerboseContent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogsRoleArn.hashCode();
            result = 31 * result + (this.fieldLogLevel.hashCode());
            result = 31 * result + (this.excludeVerboseContent != null ? this.excludeVerboseContent.hashCode() : 0);
            return result;
        }
    }
}
