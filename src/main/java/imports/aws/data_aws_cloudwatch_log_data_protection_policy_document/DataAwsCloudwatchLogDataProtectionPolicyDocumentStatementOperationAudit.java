package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit extends software.amazon.jsii.JsiiSerializable {

    /**
     * findings_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#findings_destination DataAwsCloudwatchLogDataProtectionPolicyDocument#findings_destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination getFindingsDestination();

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit> {
        imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination findingsDestination;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit#getFindingsDestination}
         * @param findingsDestination findings_destination block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#findings_destination DataAwsCloudwatchLogDataProtectionPolicyDocument#findings_destination}
         * @return {@code this}
         */
        public Builder findingsDestination(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination findingsDestination) {
            this.findingsDestination = findingsDestination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit {
        private final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination findingsDestination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.findingsDestination = software.amazon.jsii.Kernel.get(this, "findingsDestination", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.findingsDestination = java.util.Objects.requireNonNull(builder.findingsDestination, "findingsDestination is required");
        }

        @Override
        public final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination getFindingsDestination() {
            return this.findingsDestination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("findingsDestination", om.valueToTree(this.getFindingsDestination()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit.Jsii$Proxy) o;

            return this.findingsDestination.equals(that.findingsDestination);
        }

        @Override
        public final int hashCode() {
            int result = this.findingsDestination.hashCode();
            return result;
        }
    }
}
