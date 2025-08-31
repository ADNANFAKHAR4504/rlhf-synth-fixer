package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionOutputConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFlowDefinitionOutputConfig.Jsii$Proxy.class)
public interface SagemakerFlowDefinitionOutputConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#s3_output_path SagemakerFlowDefinition#s3_output_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3OutputPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#kms_key_id SagemakerFlowDefinition#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFlowDefinitionOutputConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFlowDefinitionOutputConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFlowDefinitionOutputConfig> {
        java.lang.String s3OutputPath;
        java.lang.String kmsKeyId;

        /**
         * Sets the value of {@link SagemakerFlowDefinitionOutputConfig#getS3OutputPath}
         * @param s3OutputPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#s3_output_path SagemakerFlowDefinition#s3_output_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3OutputPath(java.lang.String s3OutputPath) {
            this.s3OutputPath = s3OutputPath;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionOutputConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#kms_key_id SagemakerFlowDefinition#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFlowDefinitionOutputConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFlowDefinitionOutputConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFlowDefinitionOutputConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFlowDefinitionOutputConfig {
        private final java.lang.String s3OutputPath;
        private final java.lang.String kmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3OutputPath = software.amazon.jsii.Kernel.get(this, "s3OutputPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3OutputPath = java.util.Objects.requireNonNull(builder.s3OutputPath, "s3OutputPath is required");
            this.kmsKeyId = builder.kmsKeyId;
        }

        @Override
        public final java.lang.String getS3OutputPath() {
            return this.s3OutputPath;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3OutputPath", om.valueToTree(this.getS3OutputPath()));
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFlowDefinition.SagemakerFlowDefinitionOutputConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFlowDefinitionOutputConfig.Jsii$Proxy that = (SagemakerFlowDefinitionOutputConfig.Jsii$Proxy) o;

            if (!s3OutputPath.equals(that.s3OutputPath)) return false;
            return this.kmsKeyId != null ? this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3OutputPath.hashCode();
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
