package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.512Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation extends software.amazon.jsii.JsiiSerializable {

    /**
     * audit block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#audit DataAwsCloudwatchLogDataProtectionPolicyDocument#audit}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit getAudit() {
        return null;
    }

    /**
     * deidentify block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#deidentify DataAwsCloudwatchLogDataProtectionPolicyDocument#deidentify}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify getDeidentify() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation> {
        imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit audit;
        imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify deidentify;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation#getAudit}
         * @param audit audit block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#audit DataAwsCloudwatchLogDataProtectionPolicyDocument#audit}
         * @return {@code this}
         */
        public Builder audit(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit audit) {
            this.audit = audit;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation#getDeidentify}
         * @param deidentify deidentify block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#deidentify DataAwsCloudwatchLogDataProtectionPolicyDocument#deidentify}
         * @return {@code this}
         */
        public Builder deidentify(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify deidentify) {
            this.deidentify = deidentify;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation {
        private final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit audit;
        private final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify deidentify;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audit = software.amazon.jsii.Kernel.get(this, "audit", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit.class));
            this.deidentify = software.amazon.jsii.Kernel.get(this, "deidentify", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audit = builder.audit;
            this.deidentify = builder.deidentify;
        }

        @Override
        public final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAudit getAudit() {
            return this.audit;
        }

        @Override
        public final imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationDeidentify getDeidentify() {
            return this.deidentify;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudit() != null) {
                data.set("audit", om.valueToTree(this.getAudit()));
            }
            if (this.getDeidentify() != null) {
                data.set("deidentify", om.valueToTree(this.getDeidentify()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperation.Jsii$Proxy) o;

            if (this.audit != null ? !this.audit.equals(that.audit) : that.audit != null) return false;
            return this.deidentify != null ? this.deidentify.equals(that.deidentify) : that.deidentify == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audit != null ? this.audit.hashCode() : 0;
            result = 31 * result + (this.deidentify != null ? this.deidentify.hashCode() : 0);
            return result;
        }
    }
}
