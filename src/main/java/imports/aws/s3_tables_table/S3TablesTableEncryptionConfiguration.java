package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableEncryptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableEncryptionConfiguration.Jsii$Proxy.class)
public interface S3TablesTableEncryptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#kms_key_arn S3TablesTable#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#sse_algorithm S3TablesTable#sse_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSseAlgorithm() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableEncryptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableEncryptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableEncryptionConfiguration> {
        java.lang.String kmsKeyArn;
        java.lang.String sseAlgorithm;

        /**
         * Sets the value of {@link S3TablesTableEncryptionConfiguration#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#kms_key_arn S3TablesTable#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link S3TablesTableEncryptionConfiguration#getSseAlgorithm}
         * @param sseAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#sse_algorithm S3TablesTable#sse_algorithm}.
         * @return {@code this}
         */
        public Builder sseAlgorithm(java.lang.String sseAlgorithm) {
            this.sseAlgorithm = sseAlgorithm;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableEncryptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableEncryptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableEncryptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableEncryptionConfiguration {
        private final java.lang.String kmsKeyArn;
        private final java.lang.String sseAlgorithm;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sseAlgorithm = software.amazon.jsii.Kernel.get(this, "sseAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyArn = builder.kmsKeyArn;
            this.sseAlgorithm = builder.sseAlgorithm;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getSseAlgorithm() {
            return this.sseAlgorithm;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getSseAlgorithm() != null) {
                data.set("sseAlgorithm", om.valueToTree(this.getSseAlgorithm()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTable.S3TablesTableEncryptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableEncryptionConfiguration.Jsii$Proxy that = (S3TablesTableEncryptionConfiguration.Jsii$Proxy) o;

            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            return this.sseAlgorithm != null ? this.sseAlgorithm.equals(that.sseAlgorithm) : that.sseAlgorithm == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0;
            result = 31 * result + (this.sseAlgorithm != null ? this.sseAlgorithm.hashCode() : 0);
            return result;
        }
    }
}
