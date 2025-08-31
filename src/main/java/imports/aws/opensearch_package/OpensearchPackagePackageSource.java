package imports.aws.opensearch_package;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.993Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchPackage.OpensearchPackagePackageSource")
@software.amazon.jsii.Jsii.Proxy(OpensearchPackagePackageSource.Jsii$Proxy.class)
public interface OpensearchPackagePackageSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_package#s3_bucket_name OpensearchPackage#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_package#s3_key OpensearchPackage#s3_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Key();

    /**
     * @return a {@link Builder} of {@link OpensearchPackagePackageSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchPackagePackageSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchPackagePackageSource> {
        java.lang.String s3BucketName;
        java.lang.String s3Key;

        /**
         * Sets the value of {@link OpensearchPackagePackageSource#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_package#s3_bucket_name OpensearchPackage#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchPackagePackageSource#getS3Key}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_package#s3_key OpensearchPackage#s3_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Key(java.lang.String s3Key) {
            this.s3Key = s3Key;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchPackagePackageSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchPackagePackageSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchPackagePackageSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchPackagePackageSource {
        private final java.lang.String s3BucketName;
        private final java.lang.String s3Key;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Key = software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.s3Key = java.util.Objects.requireNonNull(builder.s3Key, "s3Key is required");
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.String getS3Key() {
            return this.s3Key;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            data.set("s3Key", om.valueToTree(this.getS3Key()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchPackage.OpensearchPackagePackageSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchPackagePackageSource.Jsii$Proxy that = (OpensearchPackagePackageSource.Jsii$Proxy) o;

            if (!s3BucketName.equals(that.s3BucketName)) return false;
            return this.s3Key.equals(that.s3Key);
        }

        @Override
        public final int hashCode() {
            int result = this.s3BucketName.hashCode();
            result = 31 * result + (this.s3Key.hashCode());
            return result;
        }
    }
}
