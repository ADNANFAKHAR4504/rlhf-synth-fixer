package imports.aws.s3_bucket_versioning;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.272Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketVersioning.S3BucketVersioningVersioningConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3BucketVersioningVersioningConfiguration.Jsii$Proxy.class)
public interface S3BucketVersioningVersioningConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_versioning#status S3BucketVersioningA#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_versioning#mfa_delete S3BucketVersioningA#mfa_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMfaDelete() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketVersioningVersioningConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketVersioningVersioningConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketVersioningVersioningConfiguration> {
        java.lang.String status;
        java.lang.String mfaDelete;

        /**
         * Sets the value of {@link S3BucketVersioningVersioningConfiguration#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_versioning#status S3BucketVersioningA#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketVersioningVersioningConfiguration#getMfaDelete}
         * @param mfaDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_versioning#mfa_delete S3BucketVersioningA#mfa_delete}.
         * @return {@code this}
         */
        public Builder mfaDelete(java.lang.String mfaDelete) {
            this.mfaDelete = mfaDelete;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketVersioningVersioningConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketVersioningVersioningConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketVersioningVersioningConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketVersioningVersioningConfiguration {
        private final java.lang.String status;
        private final java.lang.String mfaDelete;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mfaDelete = software.amazon.jsii.Kernel.get(this, "mfaDelete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.mfaDelete = builder.mfaDelete;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.String getMfaDelete() {
            return this.mfaDelete;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("status", om.valueToTree(this.getStatus()));
            if (this.getMfaDelete() != null) {
                data.set("mfaDelete", om.valueToTree(this.getMfaDelete()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketVersioning.S3BucketVersioningVersioningConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketVersioningVersioningConfiguration.Jsii$Proxy that = (S3BucketVersioningVersioningConfiguration.Jsii$Proxy) o;

            if (!status.equals(that.status)) return false;
            return this.mfaDelete != null ? this.mfaDelete.equals(that.mfaDelete) : that.mfaDelete == null;
        }

        @Override
        public final int hashCode() {
            int result = this.status.hashCode();
            result = 31 * result + (this.mfaDelete != null ? this.mfaDelete.hashCode() : 0);
            return result;
        }
    }
}
