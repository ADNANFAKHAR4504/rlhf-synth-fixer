package imports.aws.datasync_location_s3;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.949Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationS3.DatasyncLocationS3S3Config")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationS3S3Config.Jsii$Proxy.class)
public interface DatasyncLocationS3S3Config extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_s3#bucket_access_role_arn DatasyncLocationS3#bucket_access_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketAccessRoleArn();

    /**
     * @return a {@link Builder} of {@link DatasyncLocationS3S3Config}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationS3S3Config}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationS3S3Config> {
        java.lang.String bucketAccessRoleArn;

        /**
         * Sets the value of {@link DatasyncLocationS3S3Config#getBucketAccessRoleArn}
         * @param bucketAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_s3#bucket_access_role_arn DatasyncLocationS3#bucket_access_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketAccessRoleArn(java.lang.String bucketAccessRoleArn) {
            this.bucketAccessRoleArn = bucketAccessRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationS3S3Config}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationS3S3Config build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationS3S3Config}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationS3S3Config {
        private final java.lang.String bucketAccessRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketAccessRoleArn = software.amazon.jsii.Kernel.get(this, "bucketAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketAccessRoleArn = java.util.Objects.requireNonNull(builder.bucketAccessRoleArn, "bucketAccessRoleArn is required");
        }

        @Override
        public final java.lang.String getBucketAccessRoleArn() {
            return this.bucketAccessRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketAccessRoleArn", om.valueToTree(this.getBucketAccessRoleArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationS3.DatasyncLocationS3S3Config"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationS3S3Config.Jsii$Proxy that = (DatasyncLocationS3S3Config.Jsii$Proxy) o;

            return this.bucketAccessRoleArn.equals(that.bucketAccessRoleArn);
        }

        @Override
        public final int hashCode() {
            int result = this.bucketAccessRoleArn.hashCode();
            return result;
        }
    }
}
