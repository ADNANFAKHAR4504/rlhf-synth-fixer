package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#delivery_stream DataAwsCloudwatchLogDataProtectionPolicyDocument#delivery_stream}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStream();

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose> {
        java.lang.String deliveryStream;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose#getDeliveryStream}
         * @param deliveryStream Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#delivery_stream DataAwsCloudwatchLogDataProtectionPolicyDocument#delivery_stream}. This parameter is required.
         * @return {@code this}
         */
        public Builder deliveryStream(java.lang.String deliveryStream) {
            this.deliveryStream = deliveryStream;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose {
        private final java.lang.String deliveryStream;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deliveryStream = software.amazon.jsii.Kernel.get(this, "deliveryStream", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deliveryStream = java.util.Objects.requireNonNull(builder.deliveryStream, "deliveryStream is required");
        }

        @Override
        public final java.lang.String getDeliveryStream() {
            return this.deliveryStream;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deliveryStream", om.valueToTree(this.getDeliveryStream()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose.Jsii$Proxy) o;

            return this.deliveryStream.equals(that.deliveryStream);
        }

        @Override
        public final int hashCode() {
            int result = this.deliveryStream.hashCode();
            return result;
        }
    }
}
