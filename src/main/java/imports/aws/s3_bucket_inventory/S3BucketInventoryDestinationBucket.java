package imports.aws.s3_bucket_inventory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketInventory.S3BucketInventoryDestinationBucket")
@software.amazon.jsii.Jsii.Proxy(S3BucketInventoryDestinationBucket.Jsii$Proxy.class)
public interface S3BucketInventoryDestinationBucket extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#bucket_arn S3BucketInventory#bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#format S3BucketInventory#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#account_id S3BucketInventory#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#encryption S3BucketInventory#encryption}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryption getEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#prefix S3BucketInventory#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketInventoryDestinationBucket}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketInventoryDestinationBucket}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketInventoryDestinationBucket> {
        java.lang.String bucketArn;
        java.lang.String format;
        java.lang.String accountId;
        imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryption encryption;
        java.lang.String prefix;

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucket#getBucketArn}
         * @param bucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#bucket_arn S3BucketInventory#bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketArn(java.lang.String bucketArn) {
            this.bucketArn = bucketArn;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucket#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#format S3BucketInventory#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucket#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#account_id S3BucketInventory#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucket#getEncryption}
         * @param encryption encryption block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#encryption S3BucketInventory#encryption}
         * @return {@code this}
         */
        public Builder encryption(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryption encryption) {
            this.encryption = encryption;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketInventoryDestinationBucket#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_inventory#prefix S3BucketInventory#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketInventoryDestinationBucket}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketInventoryDestinationBucket build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketInventoryDestinationBucket}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketInventoryDestinationBucket {
        private final java.lang.String bucketArn;
        private final java.lang.String format;
        private final java.lang.String accountId;
        private final imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryption encryption;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketArn = software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryption = software.amazon.jsii.Kernel.get(this, "encryption", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryption.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketArn = java.util.Objects.requireNonNull(builder.bucketArn, "bucketArn is required");
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
            this.accountId = builder.accountId;
            this.encryption = builder.encryption;
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.String getBucketArn() {
            return this.bucketArn;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final imports.aws.s3_bucket_inventory.S3BucketInventoryDestinationBucketEncryption getEncryption() {
            return this.encryption;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketArn", om.valueToTree(this.getBucketArn()));
            data.set("format", om.valueToTree(this.getFormat()));
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getEncryption() != null) {
                data.set("encryption", om.valueToTree(this.getEncryption()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketInventory.S3BucketInventoryDestinationBucket"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketInventoryDestinationBucket.Jsii$Proxy that = (S3BucketInventoryDestinationBucket.Jsii$Proxy) o;

            if (!bucketArn.equals(that.bucketArn)) return false;
            if (!format.equals(that.format)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.encryption != null ? !this.encryption.equals(that.encryption) : that.encryption != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketArn.hashCode();
            result = 31 * result + (this.format.hashCode());
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.encryption != null ? this.encryption.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
