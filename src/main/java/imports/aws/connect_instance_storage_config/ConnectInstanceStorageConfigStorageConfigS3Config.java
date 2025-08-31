package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.386Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigS3Config")
@software.amazon.jsii.Jsii.Proxy(ConnectInstanceStorageConfigStorageConfigS3Config.Jsii$Proxy.class)
public interface ConnectInstanceStorageConfigStorageConfigS3Config extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#bucket_name ConnectInstanceStorageConfig#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#bucket_prefix ConnectInstanceStorageConfig#bucket_prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketPrefix();

    /**
     * encryption_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#encryption_config ConnectInstanceStorageConfig#encryption_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig getEncryptionConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectInstanceStorageConfigStorageConfigS3Config}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectInstanceStorageConfigStorageConfigS3Config}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectInstanceStorageConfigStorageConfigS3Config> {
        java.lang.String bucketName;
        java.lang.String bucketPrefix;
        imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig encryptionConfig;

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigS3Config#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#bucket_name ConnectInstanceStorageConfig#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigS3Config#getBucketPrefix}
         * @param bucketPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#bucket_prefix ConnectInstanceStorageConfig#bucket_prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketPrefix(java.lang.String bucketPrefix) {
            this.bucketPrefix = bucketPrefix;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigS3Config#getEncryptionConfig}
         * @param encryptionConfig encryption_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#encryption_config ConnectInstanceStorageConfig#encryption_config}
         * @return {@code this}
         */
        public Builder encryptionConfig(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig encryptionConfig) {
            this.encryptionConfig = encryptionConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectInstanceStorageConfigStorageConfigS3Config}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectInstanceStorageConfigStorageConfigS3Config build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectInstanceStorageConfigStorageConfigS3Config}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectInstanceStorageConfigStorageConfigS3Config {
        private final java.lang.String bucketName;
        private final java.lang.String bucketPrefix;
        private final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig encryptionConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketPrefix = software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionConfig = software.amazon.jsii.Kernel.get(this, "encryptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.bucketPrefix = java.util.Objects.requireNonNull(builder.bucketPrefix, "bucketPrefix is required");
            this.encryptionConfig = builder.encryptionConfig;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getBucketPrefix() {
            return this.bucketPrefix;
        }

        @Override
        public final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3ConfigEncryptionConfig getEncryptionConfig() {
            return this.encryptionConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("bucketPrefix", om.valueToTree(this.getBucketPrefix()));
            if (this.getEncryptionConfig() != null) {
                data.set("encryptionConfig", om.valueToTree(this.getEncryptionConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigS3Config"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectInstanceStorageConfigStorageConfigS3Config.Jsii$Proxy that = (ConnectInstanceStorageConfigStorageConfigS3Config.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!bucketPrefix.equals(that.bucketPrefix)) return false;
            return this.encryptionConfig != null ? this.encryptionConfig.equals(that.encryptionConfig) : that.encryptionConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.bucketPrefix.hashCode());
            result = 31 * result + (this.encryptionConfig != null ? this.encryptionConfig.hashCode() : 0);
            return result;
        }
    }
}
