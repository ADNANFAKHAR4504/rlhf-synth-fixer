package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3")
@software.amazon.jsii.Jsii.Proxy(DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3.Jsii$Proxy.class)
public interface DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#bucket DataAwsCloudwatchLogDataProtectionPolicyDocument#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * @return a {@link Builder} of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3> {
        java.lang.String bucket;

        /**
         * Sets the value of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/cloudwatch_log_data_protection_policy_document#bucket DataAwsCloudwatchLogDataProtectionPolicyDocument#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3 {
        private final java.lang.String bucket;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3.Jsii$Proxy that = (DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3.Jsii$Proxy) o;

            return this.bucket.equals(that.bucket);
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            return result;
        }
    }
}
