package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportDiskContainerUserBucket")
@software.amazon.jsii.Jsii.Proxy(EbsSnapshotImportDiskContainerUserBucket.Jsii$Proxy.class)
public interface EbsSnapshotImportDiskContainerUserBucket extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#s3_bucket EbsSnapshotImport#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#s3_key EbsSnapshotImport#s3_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Key();

    /**
     * @return a {@link Builder} of {@link EbsSnapshotImportDiskContainerUserBucket}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EbsSnapshotImportDiskContainerUserBucket}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EbsSnapshotImportDiskContainerUserBucket> {
        java.lang.String s3Bucket;
        java.lang.String s3Key;

        /**
         * Sets the value of {@link EbsSnapshotImportDiskContainerUserBucket#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#s3_bucket EbsSnapshotImport#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link EbsSnapshotImportDiskContainerUserBucket#getS3Key}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ebs_snapshot_import#s3_key EbsSnapshotImport#s3_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Key(java.lang.String s3Key) {
            this.s3Key = s3Key;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EbsSnapshotImportDiskContainerUserBucket}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EbsSnapshotImportDiskContainerUserBucket build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EbsSnapshotImportDiskContainerUserBucket}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EbsSnapshotImportDiskContainerUserBucket {
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Key;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Key = software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.s3Key = java.util.Objects.requireNonNull(builder.s3Key, "s3Key is required");
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
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            data.set("s3Key", om.valueToTree(this.getS3Key()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ebsSnapshotImport.EbsSnapshotImportDiskContainerUserBucket"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EbsSnapshotImportDiskContainerUserBucket.Jsii$Proxy that = (EbsSnapshotImportDiskContainerUserBucket.Jsii$Proxy) o;

            if (!s3Bucket.equals(that.s3Bucket)) return false;
            return this.s3Key.equals(that.s3Key);
        }

        @Override
        public final int hashCode() {
            int result = this.s3Bucket.hashCode();
            result = 31 * result + (this.s3Key.hashCode());
            return result;
        }
    }
}
