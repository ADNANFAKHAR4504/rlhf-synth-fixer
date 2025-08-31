package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.512Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * custom_data_identifier block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#custom_data_identifier DataAwsCloudwatchLogDataProtectionPolicyDocument#custom_data_identifier}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomDataIdentifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration> {
        java.lang.Object customDataIdentifier;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration#getCustomDataIdentifier}
         * @param customDataIdentifier custom_data_identifier block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#custom_data_identifier DataAwsCloudwatchLogDataProtectionPolicyDocument#custom_data_identifier}
         * @return {@code this}
         */
        public Builder customDataIdentifier(com.hashicorp.cdktf.IResolvable customDataIdentifier) {
            this.customDataIdentifier = customDataIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration#getCustomDataIdentifier}
         * @param customDataIdentifier custom_data_identifier block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#custom_data_identifier DataAwsCloudwatchLogDataProtectionPolicyDocument#custom_data_identifier}
         * @return {@code this}
         */
        public Builder customDataIdentifier(java.util.List<? extends imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentConfigurationCustomDataIdentifier> customDataIdentifier) {
            this.customDataIdentifier = customDataIdentifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration {
        private final java.lang.Object customDataIdentifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customDataIdentifier = software.amazon.jsii.Kernel.get(this, "customDataIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customDataIdentifier = builder.customDataIdentifier;
        }

        @Override
        public final java.lang.Object getCustomDataIdentifier() {
            return this.customDataIdentifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomDataIdentifier() != null) {
                data.set("customDataIdentifier", om.valueToTree(this.getCustomDataIdentifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentConfiguration.Jsii$Proxy) o;

            return this.customDataIdentifier != null ? this.customDataIdentifier.equals(that.customDataIdentifier) : that.customDataIdentifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customDataIdentifier != null ? this.customDataIdentifier.hashCode() : 0;
            return result;
        }
    }
}
