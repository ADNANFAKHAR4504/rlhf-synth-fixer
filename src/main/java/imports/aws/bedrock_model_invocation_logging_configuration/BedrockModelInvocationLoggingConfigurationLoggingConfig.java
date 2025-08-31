package imports.aws.bedrock_model_invocation_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.149Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockModelInvocationLoggingConfigurationLoggingConfig.Jsii$Proxy.class)
public interface BedrockModelInvocationLoggingConfigurationLoggingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#cloudwatch_config BedrockModelInvocationLoggingConfiguration#cloudwatch_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig getCloudwatchConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#embedding_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#embedding_data_delivery_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEmbeddingDataDeliveryEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#image_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#image_data_delivery_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImageDataDeliveryEnabled() {
        return null;
    }

    /**
     * s3_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#s3_config BedrockModelInvocationLoggingConfiguration#s3_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config getS3Config() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#text_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#text_data_delivery_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTextDataDeliveryEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#video_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#video_data_delivery_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVideoDataDeliveryEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockModelInvocationLoggingConfigurationLoggingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockModelInvocationLoggingConfigurationLoggingConfig> {
        imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig cloudwatchConfig;
        java.lang.Object embeddingDataDeliveryEnabled;
        java.lang.Object imageDataDeliveryEnabled;
        imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config s3Config;
        java.lang.Object textDataDeliveryEnabled;
        java.lang.Object videoDataDeliveryEnabled;

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getCloudwatchConfig}
         * @param cloudwatchConfig cloudwatch_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#cloudwatch_config BedrockModelInvocationLoggingConfiguration#cloudwatch_config}
         * @return {@code this}
         */
        public Builder cloudwatchConfig(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig cloudwatchConfig) {
            this.cloudwatchConfig = cloudwatchConfig;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getEmbeddingDataDeliveryEnabled}
         * @param embeddingDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#embedding_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#embedding_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder embeddingDataDeliveryEnabled(java.lang.Boolean embeddingDataDeliveryEnabled) {
            this.embeddingDataDeliveryEnabled = embeddingDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getEmbeddingDataDeliveryEnabled}
         * @param embeddingDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#embedding_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#embedding_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder embeddingDataDeliveryEnabled(com.hashicorp.cdktf.IResolvable embeddingDataDeliveryEnabled) {
            this.embeddingDataDeliveryEnabled = embeddingDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getImageDataDeliveryEnabled}
         * @param imageDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#image_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#image_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder imageDataDeliveryEnabled(java.lang.Boolean imageDataDeliveryEnabled) {
            this.imageDataDeliveryEnabled = imageDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getImageDataDeliveryEnabled}
         * @param imageDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#image_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#image_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder imageDataDeliveryEnabled(com.hashicorp.cdktf.IResolvable imageDataDeliveryEnabled) {
            this.imageDataDeliveryEnabled = imageDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getS3Config}
         * @param s3Config s3_config block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#s3_config BedrockModelInvocationLoggingConfiguration#s3_config}
         * @return {@code this}
         */
        public Builder s3Config(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config s3Config) {
            this.s3Config = s3Config;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getTextDataDeliveryEnabled}
         * @param textDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#text_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#text_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder textDataDeliveryEnabled(java.lang.Boolean textDataDeliveryEnabled) {
            this.textDataDeliveryEnabled = textDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getTextDataDeliveryEnabled}
         * @param textDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#text_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#text_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder textDataDeliveryEnabled(com.hashicorp.cdktf.IResolvable textDataDeliveryEnabled) {
            this.textDataDeliveryEnabled = textDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getVideoDataDeliveryEnabled}
         * @param videoDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#video_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#video_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder videoDataDeliveryEnabled(java.lang.Boolean videoDataDeliveryEnabled) {
            this.videoDataDeliveryEnabled = videoDataDeliveryEnabled;
            return this;
        }

        /**
         * Sets the value of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig#getVideoDataDeliveryEnabled}
         * @param videoDataDeliveryEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_model_invocation_logging_configuration#video_data_delivery_enabled BedrockModelInvocationLoggingConfiguration#video_data_delivery_enabled}.
         * @return {@code this}
         */
        public Builder videoDataDeliveryEnabled(com.hashicorp.cdktf.IResolvable videoDataDeliveryEnabled) {
            this.videoDataDeliveryEnabled = videoDataDeliveryEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockModelInvocationLoggingConfigurationLoggingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockModelInvocationLoggingConfigurationLoggingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockModelInvocationLoggingConfigurationLoggingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockModelInvocationLoggingConfigurationLoggingConfig {
        private final imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig cloudwatchConfig;
        private final java.lang.Object embeddingDataDeliveryEnabled;
        private final java.lang.Object imageDataDeliveryEnabled;
        private final imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config s3Config;
        private final java.lang.Object textDataDeliveryEnabled;
        private final java.lang.Object videoDataDeliveryEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchConfig = software.amazon.jsii.Kernel.get(this, "cloudwatchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig.class));
            this.embeddingDataDeliveryEnabled = software.amazon.jsii.Kernel.get(this, "embeddingDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.imageDataDeliveryEnabled = software.amazon.jsii.Kernel.get(this, "imageDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3Config = software.amazon.jsii.Kernel.get(this, "s3Config", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config.class));
            this.textDataDeliveryEnabled = software.amazon.jsii.Kernel.get(this, "textDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.videoDataDeliveryEnabled = software.amazon.jsii.Kernel.get(this, "videoDataDeliveryEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchConfig = builder.cloudwatchConfig;
            this.embeddingDataDeliveryEnabled = builder.embeddingDataDeliveryEnabled;
            this.imageDataDeliveryEnabled = builder.imageDataDeliveryEnabled;
            this.s3Config = builder.s3Config;
            this.textDataDeliveryEnabled = builder.textDataDeliveryEnabled;
            this.videoDataDeliveryEnabled = builder.videoDataDeliveryEnabled;
        }

        @Override
        public final imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigCloudwatchConfig getCloudwatchConfig() {
            return this.cloudwatchConfig;
        }

        @Override
        public final java.lang.Object getEmbeddingDataDeliveryEnabled() {
            return this.embeddingDataDeliveryEnabled;
        }

        @Override
        public final java.lang.Object getImageDataDeliveryEnabled() {
            return this.imageDataDeliveryEnabled;
        }

        @Override
        public final imports.aws.bedrock_model_invocation_logging_configuration.BedrockModelInvocationLoggingConfigurationLoggingConfigS3Config getS3Config() {
            return this.s3Config;
        }

        @Override
        public final java.lang.Object getTextDataDeliveryEnabled() {
            return this.textDataDeliveryEnabled;
        }

        @Override
        public final java.lang.Object getVideoDataDeliveryEnabled() {
            return this.videoDataDeliveryEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchConfig() != null) {
                data.set("cloudwatchConfig", om.valueToTree(this.getCloudwatchConfig()));
            }
            if (this.getEmbeddingDataDeliveryEnabled() != null) {
                data.set("embeddingDataDeliveryEnabled", om.valueToTree(this.getEmbeddingDataDeliveryEnabled()));
            }
            if (this.getImageDataDeliveryEnabled() != null) {
                data.set("imageDataDeliveryEnabled", om.valueToTree(this.getImageDataDeliveryEnabled()));
            }
            if (this.getS3Config() != null) {
                data.set("s3Config", om.valueToTree(this.getS3Config()));
            }
            if (this.getTextDataDeliveryEnabled() != null) {
                data.set("textDataDeliveryEnabled", om.valueToTree(this.getTextDataDeliveryEnabled()));
            }
            if (this.getVideoDataDeliveryEnabled() != null) {
                data.set("videoDataDeliveryEnabled", om.valueToTree(this.getVideoDataDeliveryEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockModelInvocationLoggingConfiguration.BedrockModelInvocationLoggingConfigurationLoggingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockModelInvocationLoggingConfigurationLoggingConfig.Jsii$Proxy that = (BedrockModelInvocationLoggingConfigurationLoggingConfig.Jsii$Proxy) o;

            if (this.cloudwatchConfig != null ? !this.cloudwatchConfig.equals(that.cloudwatchConfig) : that.cloudwatchConfig != null) return false;
            if (this.embeddingDataDeliveryEnabled != null ? !this.embeddingDataDeliveryEnabled.equals(that.embeddingDataDeliveryEnabled) : that.embeddingDataDeliveryEnabled != null) return false;
            if (this.imageDataDeliveryEnabled != null ? !this.imageDataDeliveryEnabled.equals(that.imageDataDeliveryEnabled) : that.imageDataDeliveryEnabled != null) return false;
            if (this.s3Config != null ? !this.s3Config.equals(that.s3Config) : that.s3Config != null) return false;
            if (this.textDataDeliveryEnabled != null ? !this.textDataDeliveryEnabled.equals(that.textDataDeliveryEnabled) : that.textDataDeliveryEnabled != null) return false;
            return this.videoDataDeliveryEnabled != null ? this.videoDataDeliveryEnabled.equals(that.videoDataDeliveryEnabled) : that.videoDataDeliveryEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchConfig != null ? this.cloudwatchConfig.hashCode() : 0;
            result = 31 * result + (this.embeddingDataDeliveryEnabled != null ? this.embeddingDataDeliveryEnabled.hashCode() : 0);
            result = 31 * result + (this.imageDataDeliveryEnabled != null ? this.imageDataDeliveryEnabled.hashCode() : 0);
            result = 31 * result + (this.s3Config != null ? this.s3Config.hashCode() : 0);
            result = 31 * result + (this.textDataDeliveryEnabled != null ? this.textDataDeliveryEnabled.hashCode() : 0);
            result = 31 * result + (this.videoDataDeliveryEnabled != null ? this.videoDataDeliveryEnabled.hashCode() : 0);
            return result;
        }
    }
}
