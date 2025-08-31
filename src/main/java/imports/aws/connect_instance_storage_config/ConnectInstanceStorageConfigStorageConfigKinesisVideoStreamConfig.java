package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig.Jsii$Proxy.class)
public interface ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * encryption_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#encryption_config ConnectInstanceStorageConfig#encryption_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig getEncryptionConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#prefix ConnectInstanceStorageConfig#prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrefix();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#retention_period_hours ConnectInstanceStorageConfig#retention_period_hours}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriodHours();

    /**
     * @return a {@link Builder} of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig> {
        imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig encryptionConfig;
        java.lang.String prefix;
        java.lang.Number retentionPeriodHours;

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig#getEncryptionConfig}
         * @param encryptionConfig encryption_config block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#encryption_config ConnectInstanceStorageConfig#encryption_config}
         * @return {@code this}
         */
        public Builder encryptionConfig(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig encryptionConfig) {
            this.encryptionConfig = encryptionConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#prefix ConnectInstanceStorageConfig#prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig#getRetentionPeriodHours}
         * @param retentionPeriodHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#retention_period_hours ConnectInstanceStorageConfig#retention_period_hours}. This parameter is required.
         * @return {@code this}
         */
        public Builder retentionPeriodHours(java.lang.Number retentionPeriodHours) {
            this.retentionPeriodHours = retentionPeriodHours;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig {
        private final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig encryptionConfig;
        private final java.lang.String prefix;
        private final java.lang.Number retentionPeriodHours;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionConfig = software.amazon.jsii.Kernel.get(this, "encryptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retentionPeriodHours = software.amazon.jsii.Kernel.get(this, "retentionPeriodHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionConfig = java.util.Objects.requireNonNull(builder.encryptionConfig, "encryptionConfig is required");
            this.prefix = java.util.Objects.requireNonNull(builder.prefix, "prefix is required");
            this.retentionPeriodHours = java.util.Objects.requireNonNull(builder.retentionPeriodHours, "retentionPeriodHours is required");
        }

        @Override
        public final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfigEncryptionConfig getEncryptionConfig() {
            return this.encryptionConfig;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.Number getRetentionPeriodHours() {
            return this.retentionPeriodHours;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("encryptionConfig", om.valueToTree(this.getEncryptionConfig()));
            data.set("prefix", om.valueToTree(this.getPrefix()));
            data.set("retentionPeriodHours", om.valueToTree(this.getRetentionPeriodHours()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig.Jsii$Proxy that = (ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig.Jsii$Proxy) o;

            if (!encryptionConfig.equals(that.encryptionConfig)) return false;
            if (!prefix.equals(that.prefix)) return false;
            return this.retentionPeriodHours.equals(that.retentionPeriodHours);
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionConfig.hashCode();
            result = 31 * result + (this.prefix.hashCode());
            result = 31 * result + (this.retentionPeriodHours.hashCode());
            return result;
        }
    }
}
