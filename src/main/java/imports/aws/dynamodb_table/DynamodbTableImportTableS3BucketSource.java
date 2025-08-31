package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.054Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableImportTableS3BucketSource")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableImportTableS3BucketSource.Jsii$Proxy.class)
public interface DynamodbTableImportTableS3BucketSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#bucket DynamodbTable#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#bucket_owner DynamodbTable#bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#key_prefix DynamodbTable#key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableImportTableS3BucketSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableImportTableS3BucketSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableImportTableS3BucketSource> {
        java.lang.String bucket;
        java.lang.String bucketOwner;
        java.lang.String keyPrefix;

        /**
         * Sets the value of {@link DynamodbTableImportTableS3BucketSource#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#bucket DynamodbTable#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableImportTableS3BucketSource#getBucketOwner}
         * @param bucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#bucket_owner DynamodbTable#bucket_owner}.
         * @return {@code this}
         */
        public Builder bucketOwner(java.lang.String bucketOwner) {
            this.bucketOwner = bucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableImportTableS3BucketSource#getKeyPrefix}
         * @param keyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#key_prefix DynamodbTable#key_prefix}.
         * @return {@code this}
         */
        public Builder keyPrefix(java.lang.String keyPrefix) {
            this.keyPrefix = keyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DynamodbTableImportTableS3BucketSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableImportTableS3BucketSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableImportTableS3BucketSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableImportTableS3BucketSource {
        private final java.lang.String bucket;
        private final java.lang.String bucketOwner;
        private final java.lang.String keyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketOwner = software.amazon.jsii.Kernel.get(this, "bucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefix = software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.bucketOwner = builder.bucketOwner;
            this.keyPrefix = builder.keyPrefix;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getBucketOwner() {
            return this.bucketOwner;
        }

        @Override
        public final java.lang.String getKeyPrefix() {
            return this.keyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            if (this.getBucketOwner() != null) {
                data.set("bucketOwner", om.valueToTree(this.getBucketOwner()));
            }
            if (this.getKeyPrefix() != null) {
                data.set("keyPrefix", om.valueToTree(this.getKeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableImportTableS3BucketSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableImportTableS3BucketSource.Jsii$Proxy that = (DynamodbTableImportTableS3BucketSource.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.bucketOwner != null ? !this.bucketOwner.equals(that.bucketOwner) : that.bucketOwner != null) return false;
            return this.keyPrefix != null ? this.keyPrefix.equals(that.keyPrefix) : that.keyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.bucketOwner != null ? this.bucketOwner.hashCode() : 0);
            result = 31 * result + (this.keyPrefix != null ? this.keyPrefix.hashCode() : 0);
            return result;
        }
    }
}
