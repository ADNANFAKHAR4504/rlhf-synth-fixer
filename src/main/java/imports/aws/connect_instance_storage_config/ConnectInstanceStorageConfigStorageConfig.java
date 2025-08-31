package imports.aws.connect_instance_storage_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.385Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectInstanceStorageConfigStorageConfig.Jsii$Proxy.class)
public interface ConnectInstanceStorageConfigStorageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#storage_type ConnectInstanceStorageConfig#storage_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStorageType();

    /**
     * kinesis_firehose_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#kinesis_firehose_config ConnectInstanceStorageConfig#kinesis_firehose_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig getKinesisFirehoseConfig() {
        return null;
    }

    /**
     * kinesis_stream_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#kinesis_stream_config ConnectInstanceStorageConfig#kinesis_stream_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig getKinesisStreamConfig() {
        return null;
    }

    /**
     * kinesis_video_stream_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#kinesis_video_stream_config ConnectInstanceStorageConfig#kinesis_video_stream_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig getKinesisVideoStreamConfig() {
        return null;
    }

    /**
     * s3_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#s3_config ConnectInstanceStorageConfig#s3_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config getS3Config() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectInstanceStorageConfigStorageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectInstanceStorageConfigStorageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectInstanceStorageConfigStorageConfig> {
        java.lang.String storageType;
        imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig kinesisFirehoseConfig;
        imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig kinesisStreamConfig;
        imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig kinesisVideoStreamConfig;
        imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config s3Config;

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#storage_type ConnectInstanceStorageConfig#storage_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfig#getKinesisFirehoseConfig}
         * @param kinesisFirehoseConfig kinesis_firehose_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#kinesis_firehose_config ConnectInstanceStorageConfig#kinesis_firehose_config}
         * @return {@code this}
         */
        public Builder kinesisFirehoseConfig(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig kinesisFirehoseConfig) {
            this.kinesisFirehoseConfig = kinesisFirehoseConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfig#getKinesisStreamConfig}
         * @param kinesisStreamConfig kinesis_stream_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#kinesis_stream_config ConnectInstanceStorageConfig#kinesis_stream_config}
         * @return {@code this}
         */
        public Builder kinesisStreamConfig(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig kinesisStreamConfig) {
            this.kinesisStreamConfig = kinesisStreamConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfig#getKinesisVideoStreamConfig}
         * @param kinesisVideoStreamConfig kinesis_video_stream_config block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#kinesis_video_stream_config ConnectInstanceStorageConfig#kinesis_video_stream_config}
         * @return {@code this}
         */
        public Builder kinesisVideoStreamConfig(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig kinesisVideoStreamConfig) {
            this.kinesisVideoStreamConfig = kinesisVideoStreamConfig;
            return this;
        }

        /**
         * Sets the value of {@link ConnectInstanceStorageConfigStorageConfig#getS3Config}
         * @param s3Config s3_config block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_instance_storage_config#s3_config ConnectInstanceStorageConfig#s3_config}
         * @return {@code this}
         */
        public Builder s3Config(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config s3Config) {
            this.s3Config = s3Config;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectInstanceStorageConfigStorageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectInstanceStorageConfigStorageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectInstanceStorageConfigStorageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectInstanceStorageConfigStorageConfig {
        private final java.lang.String storageType;
        private final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig kinesisFirehoseConfig;
        private final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig kinesisStreamConfig;
        private final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig kinesisVideoStreamConfig;
        private final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config s3Config;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kinesisFirehoseConfig = software.amazon.jsii.Kernel.get(this, "kinesisFirehoseConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig.class));
            this.kinesisStreamConfig = software.amazon.jsii.Kernel.get(this, "kinesisStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig.class));
            this.kinesisVideoStreamConfig = software.amazon.jsii.Kernel.get(this, "kinesisVideoStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig.class));
            this.s3Config = software.amazon.jsii.Kernel.get(this, "s3Config", software.amazon.jsii.NativeType.forClass(imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.storageType = java.util.Objects.requireNonNull(builder.storageType, "storageType is required");
            this.kinesisFirehoseConfig = builder.kinesisFirehoseConfig;
            this.kinesisStreamConfig = builder.kinesisStreamConfig;
            this.kinesisVideoStreamConfig = builder.kinesisVideoStreamConfig;
            this.s3Config = builder.s3Config;
        }

        @Override
        public final java.lang.String getStorageType() {
            return this.storageType;
        }

        @Override
        public final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisFirehoseConfig getKinesisFirehoseConfig() {
            return this.kinesisFirehoseConfig;
        }

        @Override
        public final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisStreamConfig getKinesisStreamConfig() {
            return this.kinesisStreamConfig;
        }

        @Override
        public final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigKinesisVideoStreamConfig getKinesisVideoStreamConfig() {
            return this.kinesisVideoStreamConfig;
        }

        @Override
        public final imports.aws.connect_instance_storage_config.ConnectInstanceStorageConfigStorageConfigS3Config getS3Config() {
            return this.s3Config;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("storageType", om.valueToTree(this.getStorageType()));
            if (this.getKinesisFirehoseConfig() != null) {
                data.set("kinesisFirehoseConfig", om.valueToTree(this.getKinesisFirehoseConfig()));
            }
            if (this.getKinesisStreamConfig() != null) {
                data.set("kinesisStreamConfig", om.valueToTree(this.getKinesisStreamConfig()));
            }
            if (this.getKinesisVideoStreamConfig() != null) {
                data.set("kinesisVideoStreamConfig", om.valueToTree(this.getKinesisVideoStreamConfig()));
            }
            if (this.getS3Config() != null) {
                data.set("s3Config", om.valueToTree(this.getS3Config()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectInstanceStorageConfig.ConnectInstanceStorageConfigStorageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectInstanceStorageConfigStorageConfig.Jsii$Proxy that = (ConnectInstanceStorageConfigStorageConfig.Jsii$Proxy) o;

            if (!storageType.equals(that.storageType)) return false;
            if (this.kinesisFirehoseConfig != null ? !this.kinesisFirehoseConfig.equals(that.kinesisFirehoseConfig) : that.kinesisFirehoseConfig != null) return false;
            if (this.kinesisStreamConfig != null ? !this.kinesisStreamConfig.equals(that.kinesisStreamConfig) : that.kinesisStreamConfig != null) return false;
            if (this.kinesisVideoStreamConfig != null ? !this.kinesisVideoStreamConfig.equals(that.kinesisVideoStreamConfig) : that.kinesisVideoStreamConfig != null) return false;
            return this.s3Config != null ? this.s3Config.equals(that.s3Config) : that.s3Config == null;
        }

        @Override
        public final int hashCode() {
            int result = this.storageType.hashCode();
            result = 31 * result + (this.kinesisFirehoseConfig != null ? this.kinesisFirehoseConfig.hashCode() : 0);
            result = 31 * result + (this.kinesisStreamConfig != null ? this.kinesisStreamConfig.hashCode() : 0);
            result = 31 * result + (this.kinesisVideoStreamConfig != null ? this.kinesisVideoStreamConfig.hashCode() : 0);
            result = 31 * result + (this.s3Config != null ? this.s3Config.hashCode() : 0);
            return result;
        }
    }
}
