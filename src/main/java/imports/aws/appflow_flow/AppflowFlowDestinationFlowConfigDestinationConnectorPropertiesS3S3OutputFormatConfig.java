package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * aggregation_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#aggregation_config AppflowFlow#aggregation_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig getAggregationConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#file_type AppflowFlow#file_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileType() {
        return null;
    }

    /**
     * prefix_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_config AppflowFlow#prefix_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig getPrefixConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#preserve_source_data_typing AppflowFlow#preserve_source_data_typing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPreserveSourceDataTyping() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig> {
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig aggregationConfig;
        java.lang.String fileType;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig prefixConfig;
        java.lang.Object preserveSourceDataTyping;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig#getAggregationConfig}
         * @param aggregationConfig aggregation_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#aggregation_config AppflowFlow#aggregation_config}
         * @return {@code this}
         */
        public Builder aggregationConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig aggregationConfig) {
            this.aggregationConfig = aggregationConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig#getFileType}
         * @param fileType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#file_type AppflowFlow#file_type}.
         * @return {@code this}
         */
        public Builder fileType(java.lang.String fileType) {
            this.fileType = fileType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig#getPrefixConfig}
         * @param prefixConfig prefix_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#prefix_config AppflowFlow#prefix_config}
         * @return {@code this}
         */
        public Builder prefixConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig prefixConfig) {
            this.prefixConfig = prefixConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig#getPreserveSourceDataTyping}
         * @param preserveSourceDataTyping Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#preserve_source_data_typing AppflowFlow#preserve_source_data_typing}.
         * @return {@code this}
         */
        public Builder preserveSourceDataTyping(java.lang.Boolean preserveSourceDataTyping) {
            this.preserveSourceDataTyping = preserveSourceDataTyping;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig#getPreserveSourceDataTyping}
         * @param preserveSourceDataTyping Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#preserve_source_data_typing AppflowFlow#preserve_source_data_typing}.
         * @return {@code this}
         */
        public Builder preserveSourceDataTyping(com.hashicorp.cdktf.IResolvable preserveSourceDataTyping) {
            this.preserveSourceDataTyping = preserveSourceDataTyping;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig {
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig aggregationConfig;
        private final java.lang.String fileType;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig prefixConfig;
        private final java.lang.Object preserveSourceDataTyping;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aggregationConfig = software.amazon.jsii.Kernel.get(this, "aggregationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig.class));
            this.fileType = software.amazon.jsii.Kernel.get(this, "fileType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefixConfig = software.amazon.jsii.Kernel.get(this, "prefixConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig.class));
            this.preserveSourceDataTyping = software.amazon.jsii.Kernel.get(this, "preserveSourceDataTyping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aggregationConfig = builder.aggregationConfig;
            this.fileType = builder.fileType;
            this.prefixConfig = builder.prefixConfig;
            this.preserveSourceDataTyping = builder.preserveSourceDataTyping;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig getAggregationConfig() {
            return this.aggregationConfig;
        }

        @Override
        public final java.lang.String getFileType() {
            return this.fileType;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig getPrefixConfig() {
            return this.prefixConfig;
        }

        @Override
        public final java.lang.Object getPreserveSourceDataTyping() {
            return this.preserveSourceDataTyping;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAggregationConfig() != null) {
                data.set("aggregationConfig", om.valueToTree(this.getAggregationConfig()));
            }
            if (this.getFileType() != null) {
                data.set("fileType", om.valueToTree(this.getFileType()));
            }
            if (this.getPrefixConfig() != null) {
                data.set("prefixConfig", om.valueToTree(this.getPrefixConfig()));
            }
            if (this.getPreserveSourceDataTyping() != null) {
                data.set("preserveSourceDataTyping", om.valueToTree(this.getPreserveSourceDataTyping()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig.Jsii$Proxy) o;

            if (this.aggregationConfig != null ? !this.aggregationConfig.equals(that.aggregationConfig) : that.aggregationConfig != null) return false;
            if (this.fileType != null ? !this.fileType.equals(that.fileType) : that.fileType != null) return false;
            if (this.prefixConfig != null ? !this.prefixConfig.equals(that.prefixConfig) : that.prefixConfig != null) return false;
            return this.preserveSourceDataTyping != null ? this.preserveSourceDataTyping.equals(that.preserveSourceDataTyping) : that.preserveSourceDataTyping == null;
        }

        @Override
        public final int hashCode() {
            int result = this.aggregationConfig != null ? this.aggregationConfig.hashCode() : 0;
            result = 31 * result + (this.fileType != null ? this.fileType.hashCode() : 0);
            result = 31 * result + (this.prefixConfig != null ? this.prefixConfig.hashCode() : 0);
            result = 31 * result + (this.preserveSourceDataTyping != null ? this.preserveSourceDataTyping.hashCode() : 0);
            return result;
        }
    }
}
