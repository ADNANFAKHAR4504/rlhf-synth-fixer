package imports.aws.s3_control_multi_region_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlMultiRegionAccessPoint.S3ControlMultiRegionAccessPointDetailsRegion")
@software.amazon.jsii.Jsii.Proxy(S3ControlMultiRegionAccessPointDetailsRegion.Jsii$Proxy.class)
public interface S3ControlMultiRegionAccessPointDetailsRegion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#bucket S3ControlMultiRegionAccessPoint#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#bucket_account_id S3ControlMultiRegionAccessPoint#bucket_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketAccountId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlMultiRegionAccessPointDetailsRegion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlMultiRegionAccessPointDetailsRegion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlMultiRegionAccessPointDetailsRegion> {
        java.lang.String bucket;
        java.lang.String bucketAccountId;

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointDetailsRegion#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#bucket S3ControlMultiRegionAccessPoint#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointDetailsRegion#getBucketAccountId}
         * @param bucketAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#bucket_account_id S3ControlMultiRegionAccessPoint#bucket_account_id}.
         * @return {@code this}
         */
        public Builder bucketAccountId(java.lang.String bucketAccountId) {
            this.bucketAccountId = bucketAccountId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlMultiRegionAccessPointDetailsRegion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlMultiRegionAccessPointDetailsRegion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlMultiRegionAccessPointDetailsRegion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlMultiRegionAccessPointDetailsRegion {
        private final java.lang.String bucket;
        private final java.lang.String bucketAccountId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketAccountId = software.amazon.jsii.Kernel.get(this, "bucketAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.bucketAccountId = builder.bucketAccountId;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getBucketAccountId() {
            return this.bucketAccountId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            if (this.getBucketAccountId() != null) {
                data.set("bucketAccountId", om.valueToTree(this.getBucketAccountId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlMultiRegionAccessPoint.S3ControlMultiRegionAccessPointDetailsRegion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlMultiRegionAccessPointDetailsRegion.Jsii$Proxy that = (S3ControlMultiRegionAccessPointDetailsRegion.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            return this.bucketAccountId != null ? this.bucketAccountId.equals(that.bucketAccountId) : that.bucketAccountId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.bucketAccountId != null ? this.bucketAccountId.hashCode() : 0);
            return result;
        }
    }
}
