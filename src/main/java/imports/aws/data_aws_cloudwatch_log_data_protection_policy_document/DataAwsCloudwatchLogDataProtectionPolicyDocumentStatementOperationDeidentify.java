package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify extends software.amazon.jsii.JsiiSerializable {

    /**
     * mask_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#mask_config DataAwsCloudwatchLogDataProtectionPolicyDocument#mask_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentifyMaskConfig getMaskConfig();

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify> {
        imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentifyMaskConfig maskConfig;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify#getMaskConfig}
         * @param maskConfig mask_config block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#mask_config DataAwsCloudwatchLogDataProtectionPolicyDocument#mask_config}
         * @return {@code this}
         */
        public Builder maskConfig(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentifyMaskConfig maskConfig) {
            this.maskConfig = maskConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify {
        private final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentifyMaskConfig maskConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maskConfig = software.amazon.jsii.Kernel.get(this, "maskConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentifyMaskConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maskConfig = java.util.Objects.requireNonNull(builder.maskConfig, "maskConfig is required");
        }

        @Override
        public final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentifyMaskConfig getMaskConfig() {
            return this.maskConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maskConfig", om.valueToTree(this.getMaskConfig()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify.Jsii$Proxy) o;

            return this.maskConfig.equals(that.maskConfig);
        }

        @Override
        public final int hashCode() {
            int result = this.maskConfig.hashCode();
            return result;
        }
    }
}
