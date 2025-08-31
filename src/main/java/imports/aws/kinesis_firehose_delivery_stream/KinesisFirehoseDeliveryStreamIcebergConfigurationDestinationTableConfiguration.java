package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#database_name KinesisFirehoseDeliveryStream#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#table_name KinesisFirehoseDeliveryStream#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_error_output_prefix KinesisFirehoseDeliveryStream#s3_error_output_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ErrorOutputPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#unique_keys KinesisFirehoseDeliveryStream#unique_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUniqueKeys() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration> {
        java.lang.String databaseName;
        java.lang.String tableName;
        java.lang.String s3ErrorOutputPrefix;
        java.util.List<java.lang.String> uniqueKeys;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#database_name KinesisFirehoseDeliveryStream#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#table_name KinesisFirehoseDeliveryStream#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration#getS3ErrorOutputPrefix}
         * @param s3ErrorOutputPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#s3_error_output_prefix KinesisFirehoseDeliveryStream#s3_error_output_prefix}.
         * @return {@code this}
         */
        public Builder s3ErrorOutputPrefix(java.lang.String s3ErrorOutputPrefix) {
            this.s3ErrorOutputPrefix = s3ErrorOutputPrefix;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration#getUniqueKeys}
         * @param uniqueKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#unique_keys KinesisFirehoseDeliveryStream#unique_keys}.
         * @return {@code this}
         */
        public Builder uniqueKeys(java.util.List<java.lang.String> uniqueKeys) {
            this.uniqueKeys = uniqueKeys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration {
        private final java.lang.String databaseName;
        private final java.lang.String tableName;
        private final java.lang.String s3ErrorOutputPrefix;
        private final java.util.List<java.lang.String> uniqueKeys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ErrorOutputPrefix = software.amazon.jsii.Kernel.get(this, "s3ErrorOutputPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uniqueKeys = software.amazon.jsii.Kernel.get(this, "uniqueKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.s3ErrorOutputPrefix = builder.s3ErrorOutputPrefix;
            this.uniqueKeys = builder.uniqueKeys;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final java.lang.String getS3ErrorOutputPrefix() {
            return this.s3ErrorOutputPrefix;
        }

        @Override
        public final java.util.List<java.lang.String> getUniqueKeys() {
            return this.uniqueKeys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getS3ErrorOutputPrefix() != null) {
                data.set("s3ErrorOutputPrefix", om.valueToTree(this.getS3ErrorOutputPrefix()));
            }
            if (this.getUniqueKeys() != null) {
                data.set("uniqueKeys", om.valueToTree(this.getUniqueKeys()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamIcebergConfigurationDestinationTableConfiguration.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!tableName.equals(that.tableName)) return false;
            if (this.s3ErrorOutputPrefix != null ? !this.s3ErrorOutputPrefix.equals(that.s3ErrorOutputPrefix) : that.s3ErrorOutputPrefix != null) return false;
            return this.uniqueKeys != null ? this.uniqueKeys.equals(that.uniqueKeys) : that.uniqueKeys == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.s3ErrorOutputPrefix != null ? this.s3ErrorOutputPrefix.hashCode() : 0);
            result = 31 * result + (this.uniqueKeys != null ? this.uniqueKeys.hashCode() : 0);
            return result;
        }
    }
}
