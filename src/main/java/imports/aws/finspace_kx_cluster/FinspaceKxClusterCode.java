package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterCode")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterCode.Jsii$Proxy.class)
public interface FinspaceKxClusterCode extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_bucket FinspaceKxCluster#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_key FinspaceKxCluster#s3_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Key();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_object_version FinspaceKxCluster#s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterCode}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterCode}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterCode> {
        java.lang.String s3Bucket;
        java.lang.String s3Key;
        java.lang.String s3ObjectVersion;

        /**
         * Sets the value of {@link FinspaceKxClusterCode#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_bucket FinspaceKxCluster#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterCode#getS3Key}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_key FinspaceKxCluster#s3_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Key(java.lang.String s3Key) {
            this.s3Key = s3Key;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterCode#getS3ObjectVersion}
         * @param s3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_object_version FinspaceKxCluster#s3_object_version}.
         * @return {@code this}
         */
        public Builder s3ObjectVersion(java.lang.String s3ObjectVersion) {
            this.s3ObjectVersion = s3ObjectVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterCode}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterCode build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterCode}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterCode {
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Key;
        private final java.lang.String s3ObjectVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Key = software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ObjectVersion = software.amazon.jsii.Kernel.get(this, "s3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.s3Key = java.util.Objects.requireNonNull(builder.s3Key, "s3Key is required");
            this.s3ObjectVersion = builder.s3ObjectVersion;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final java.lang.String getS3Key() {
            return this.s3Key;
        }

        @Override
        public final java.lang.String getS3ObjectVersion() {
            return this.s3ObjectVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            data.set("s3Key", om.valueToTree(this.getS3Key()));
            if (this.getS3ObjectVersion() != null) {
                data.set("s3ObjectVersion", om.valueToTree(this.getS3ObjectVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterCode"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterCode.Jsii$Proxy that = (FinspaceKxClusterCode.Jsii$Proxy) o;

            if (!s3Bucket.equals(that.s3Bucket)) return false;
            if (!s3Key.equals(that.s3Key)) return false;
            return this.s3ObjectVersion != null ? this.s3ObjectVersion.equals(that.s3ObjectVersion) : that.s3ObjectVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Bucket.hashCode();
            result = 31 * result + (this.s3Key.hashCode());
            result = 31 * result + (this.s3ObjectVersion != null ? this.s3ObjectVersion.hashCode() : 0);
            return result;
        }
    }
}
