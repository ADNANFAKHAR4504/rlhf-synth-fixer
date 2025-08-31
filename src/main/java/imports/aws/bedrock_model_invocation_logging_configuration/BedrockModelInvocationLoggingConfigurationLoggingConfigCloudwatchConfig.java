package imports.aws.bedrock_model_invocation_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.149Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig.Jsii$Proxy.class)
public interface BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * large_data_delivery_s3_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#large_data_delivery_s3_config BedrockModelInvocationLoggingConfiguration#large_data_delivery_s3_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config getLargeDataDeliveryS3Config() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#log_group_name BedrockModelInvocationLoggingConfiguration#log_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#role_arn BedrockModelInvocationLoggingConfiguration#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig> {
        imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config largeDataDeliveryS3Config;
        java.lang.String logGroupName;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig#getLargeDataDeliveryS3Config}
         * @param largeDataDeliveryS3Config large_data_delivery_s3_config block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#large_data_delivery_s3_config BedrockModelInvocationLoggingConfiguration#large_data_delivery_s3_config}
         * @return {@code this}
         */
        public Builder largeDataDeliveryS3Config(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config largeDataDeliveryS3Config) {
            this.largeDataDeliveryS3Config = largeDataDeliveryS3Config;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig#getLogGroupName}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#log_group_name BedrockModelInvocationLoggingConfiguration#log_group_name}.
         * @return {@code this}
         */
        public Builder logGroupName(java.lang.String logGroupName) {
            this.logGroupName = logGroupName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#role_arn BedrockModelInvocationLoggingConfiguration#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig {
        private final imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config largeDataDeliveryS3Config;
        private final java.lang.String logGroupName;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.largeDataDeliveryS3Config = software.amazon.jsii.Kernel.get(this, "largeDataDeliveryS3Config", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config.class));
            this.logGroupName = software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.largeDataDeliveryS3Config = builder.largeDataDeliveryS3Config;
            this.logGroupName = builder.logGroupName;
            this.roleArn = builder.roleArn;
        }

        @Override
        public final imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfigLargeDataDeliveryS3Config getLargeDataDeliveryS3Config() {
            return this.largeDataDeliveryS3Config;
        }

        @Override
        public final java.lang.String getLogGroupName() {
            return this.logGroupName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLargeDataDeliveryS3Config() != null) {
                data.set("largeDataDeliveryS3Config", om.valueToTree(this.getLargeDataDeliveryS3Config()));
            }
            if (this.getLogGroupName() != null) {
                data.set("logGroupName", om.valueToTree(this.getLogGroupName()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig.Jsii$Proxy that = (BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig.Jsii$Proxy) o;

            if (this.largeDataDeliveryS3Config != null ? !this.largeDataDeliveryS3Config.equals(that.largeDataDeliveryS3Config) : that.largeDataDeliveryS3Config != null) return false;
            if (this.logGroupName != null ? !this.logGroupName.equals(that.logGroupName) : that.logGroupName != null) return false;
            return this.roleArn != null ? this.roleArn.equals(that.roleArn) : that.roleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.largeDataDeliveryS3Config != null ? this.largeDataDeliveryS3Config.hashCode() : 0;
            result = 31 * result + (this.logGroupName != null ? this.logGroupName.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            return result;
        }
    }
}
