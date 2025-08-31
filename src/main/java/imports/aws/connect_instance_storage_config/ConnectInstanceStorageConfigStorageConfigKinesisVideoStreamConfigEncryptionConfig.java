package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig.Jsii$Proxy.class)
public interface ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#encryption_type ConnectInstanceStorageConfig#encryption_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEncryptionType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#key_id ConnectInstanceStorageConfig#key_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyId();

    /**
     * @return a {@link Builder} of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig> {
        java.lang.String encryptionType;
        java.lang.String keyId;

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig#getEncryptionType}
         * @param encryptionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#encryption_type ConnectInstanceStorageConfig#encryption_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder encryptionType(java.lang.String encryptionType) {
            this.encryptionType = encryptionType;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig#getKeyId}
         * @param keyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#key_id ConnectInstanceStorageConfig#key_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyId(java.lang.String keyId) {
            this.keyId = keyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig {
        private final java.lang.String encryptionType;
        private final java.lang.String keyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionType = software.amazon.jsii.Kernel.get(this, "encryptionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyId = software.amazon.jsii.Kernel.get(this, "keyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionType = java.util.Objects.requireNonNull(builder.encryptionType, "encryptionType is required");
            this.keyId = java.util.Objects.requireNonNull(builder.keyId, "keyId is required");
        }

        @Override
        public final java.lang.String getEncryptionType() {
            return this.encryptionType;
        }

        @Override
        public final java.lang.String getKeyId() {
            return this.keyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("encryptionType", om.valueToTree(this.getEncryptionType()));
            data.set("keyId", om.valueToTree(this.getKeyId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig.Jsii$Proxy that = (ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig.Jsii$Proxy) o;

            if (!encryptionType.equals(that.encryptionType)) return false;
            return this.keyId.equals(that.keyId);
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionType.hashCode();
            result = 31 * result + (this.keyId.hashCode());
            return result;
        }
    }
}
