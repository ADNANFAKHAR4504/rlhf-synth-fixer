package imports.aws.s3_bucket_inventory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketInventory.S3BucketInventoryDestinationBucketEncryption")
@software.amazon.jsii.Jsii.Proxy(S3BucketInventoryDestinationBucketEncryption.Jsii$Proxy.class)
public interface S3BucketInventoryDestinationBucketEncryption extends software.amazon.jsii.JsiiSerializable {

    /**
     * sse_kms block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#sse_kms S3BucketInventory#sse_kms}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseKms getSseKms() {
        return null;
    }

    /**
     * sse_s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#sse_s3 S3BucketInventory#sse_s3}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseS3 getSseS3() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketInventoryDestinationBucketEncryption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketInventoryDestinationBucketEncryption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketInventoryDestinationBucketEncryption> {
        imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseKms sseKms;
        imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseS3 sseS3;

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucketEncryption#getSseKms}
         * @param sseKms sse_kms block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#sse_kms S3BucketInventory#sse_kms}
         * @return {@code this}
         */
        public Builder sseKms(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseKms sseKms) {
            this.sseKms = sseKms;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucketEncryption#getSseS3}
         * @param sseS3 sse_s3 block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#sse_s3 S3BucketInventory#sse_s3}
         * @return {@code this}
         */
        public Builder sseS3(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseS3 sseS3) {
            this.sseS3 = sseS3;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketInventoryDestinationBucketEncryption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketInventoryDestinationBucketEncryption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketInventoryDestinationBucketEncryption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketInventoryDestinationBucketEncryption {
        private final imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseKms sseKms;
        private final imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseS3 sseS3;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sseKms = software.amazon.jsii.Kernel.get(this, "sseKms", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseKms.class));
            this.sseS3 = software.amazon.jsii.Kernel.get(this, "sseS3", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseS3.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sseKms = builder.sseKms;
            this.sseS3 = builder.sseS3;
        }

        @Override
        public final imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseKms getSseKms() {
            return this.sseKms;
        }

        @Override
        public final imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryptionSseS3 getSseS3() {
            return this.sseS3;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSseKms() != null) {
                data.set("sseKms", om.valueToTree(this.getSseKms()));
            }
            if (this.getSseS3() != null) {
                data.set("sseS3", om.valueToTree(this.getSseS3()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketInventory.S3BucketInventoryDestinationBucketEncryption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketInventoryDestinationBucketEncryption.Jsii$Proxy that = (S3BucketInventoryDestinationBucketEncryption.Jsii$Proxy) o;

            if (this.sseKms != null ? !this.sseKms.equals(that.sseKms) : that.sseKms != null) return false;
            return this.sseS3 != null ? this.sseS3.equals(that.sseS3) : that.sseS3 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sseKms != null ? this.sseKms.hashCode() : 0;
            result = 31 * result + (this.sseS3 != null ? this.sseS3.hashCode() : 0);
            return result;
        }
    }
}
