package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.512Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#data_identifiers DataAwsCloudwatchLogDataProtectionPolicyDocument#data_identifiers}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDataIdentifiers();

    /**
     * operation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#operation DataAwsCloudwatchLogDataProtectionPolicyDocument#operation}
     */
    @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation getOperation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#sid DataAwsCloudwatchLogDataProtectionPolicyDocument#sid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSid() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement> {
        java.util.List<java.lang.String> dataIdentifiers;
        imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation operation;
        java.lang.String sid;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement#getDataIdentifiers}
         * @param dataIdentifiers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#data_identifiers DataAwsCloudwatchLogDataProtectionPolicyDocument#data_identifiers}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataIdentifiers(java.util.List<java.lang.String> dataIdentifiers) {
            this.dataIdentifiers = dataIdentifiers;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement#getOperation}
         * @param operation operation block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#operation DataAwsCloudwatchLogDataProtectionPolicyDocument#operation}
         * @return {@code this}
         */
        public Builder operation(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation operation) {
            this.operation = operation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement#getSid}
         * @param sid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#sid DataAwsCloudwatchLogDataProtectionPolicyDocument#sid}.
         * @return {@code this}
         */
        public Builder sid(java.lang.String sid) {
            this.sid = sid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement {
        private final java.util.List<java.lang.String> dataIdentifiers;
        private final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation operation;
        private final java.lang.String sid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataIdentifiers = software.amazon.jsii.Kernel.get(this, "dataIdentifiers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.operation = software.amazon.jsii.Kernel.get(this, "operation", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation.class));
            this.sid = software.amazon.jsii.Kernel.get(this, "sid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataIdentifiers = java.util.Objects.requireNonNull(builder.dataIdentifiers, "dataIdentifiers is required");
            this.operation = java.util.Objects.requireNonNull(builder.operation, "operation is required");
            this.sid = builder.sid;
        }

        @Override
        public final java.util.List<java.lang.String> getDataIdentifiers() {
            return this.dataIdentifiers;
        }

        @Override
        public final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation getOperation() {
            return this.operation;
        }

        @Override
        public final java.lang.String getSid() {
            return this.sid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataIdentifiers", om.valueToTree(this.getDataIdentifiers()));
            data.set("operation", om.valueToTree(this.getOperation()));
            if (this.getSid() != null) {
                data.set("sid", om.valueToTree(this.getSid()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentStatement.Jsii$Proxy) o;

            if (!dataIdentifiers.equals(that.dataIdentifiers)) return false;
            if (!operation.equals(that.operation)) return false;
            return this.sid != null ? this.sid.equals(that.sid) : that.sid == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataIdentifiers.hashCode();
            result = 31 * result + (this.operation.hashCode());
            result = 31 * result + (this.sid != null ? this.sid.hashCode() : 0);
            return result;
        }
    }
}
