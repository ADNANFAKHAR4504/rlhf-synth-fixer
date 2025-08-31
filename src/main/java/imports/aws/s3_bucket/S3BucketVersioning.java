package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.248Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketVersioning")
@software.amazon.jsii.Jsii.Proxy(S3BucketVersioning.Jsii$Proxy.class)
public interface S3BucketVersioning extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#mfa_delete S3Bucket#mfa_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMfaDelete() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketVersioning}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketVersioning}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketVersioning> {
        java.lang.Object enabled;
        java.lang.Object mfaDelete;

        /**
         * Sets the value of {@link S3BucketVersioning#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketVersioning#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#enabled S3Bucket#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketVersioning#getMfaDelete}
         * @param mfaDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#mfa_delete S3Bucket#mfa_delete}.
         * @return {@code this}
         */
        public Builder mfaDelete(java.lang.Boolean mfaDelete) {
            this.mfaDelete = mfaDelete;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketVersioning#getMfaDelete}
         * @param mfaDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#mfa_delete S3Bucket#mfa_delete}.
         * @return {@code this}
         */
        public Builder mfaDelete(com.hashicorp.cdktf.IResolvable mfaDelete) {
            this.mfaDelete = mfaDelete;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketVersioning}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketVersioning build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketVersioning}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketVersioning {
        private final java.lang.Object enabled;
        private final java.lang.Object mfaDelete;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mfaDelete = software.amazon.jsii.Kernel.get(this, "mfaDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.mfaDelete = builder.mfaDelete;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getMfaDelete() {
            return this.mfaDelete;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getMfaDelete() != null) {
                data.set("mfaDelete", om.valueToTree(this.getMfaDelete()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketVersioning"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketVersioning.Jsii$Proxy that = (S3BucketVersioning.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            return this.mfaDelete != null ? this.mfaDelete.equals(that.mfaDelete) : that.mfaDelete == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.mfaDelete != null ? this.mfaDelete.hashCode() : 0);
            return result;
        }
    }
}
