package imports.aws.kinesis_firehose_delivery_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions")
@software.amazon.jsii.Jsii.Proxy(KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions.Jsii$Proxy.class)
public interface KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enabled KinesisFirehoseDeliveryStream#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#log_group_name KinesisFirehoseDeliveryStream#log_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#log_stream_name KinesisFirehoseDeliveryStream#log_stream_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogStreamName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions> {
        java.lang.Object enabled;
        java.lang.String logGroupName;
        java.lang.String logStreamName;

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enabled KinesisFirehoseDeliveryStream#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#enabled KinesisFirehoseDeliveryStream#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions#getLogGroupName}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#log_group_name KinesisFirehoseDeliveryStream#log_group_name}.
         * @return {@code this}
         */
        public Builder logGroupName(java.lang.String logGroupName) {
            this.logGroupName = logGroupName;
            return this;
        }

        /**
         * Sets the value of {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions#getLogStreamName}
         * @param logStreamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_firehose_delivery_stream#log_stream_name KinesisFirehoseDeliveryStream#log_stream_name}.
         * @return {@code this}
         */
        public Builder logStreamName(java.lang.String logStreamName) {
            this.logStreamName = logStreamName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions {
        private final java.lang.Object enabled;
        private final java.lang.String logGroupName;
        private final java.lang.String logStreamName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logGroupName = software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logStreamName = software.amazon.jsii.Kernel.get(this, "logStreamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.logGroupName = builder.logGroupName;
            this.logStreamName = builder.logStreamName;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getLogGroupName() {
            return this.logGroupName;
        }

        @Override
        public final java.lang.String getLogStreamName() {
            return this.logStreamName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getLogGroupName() != null) {
                data.set("logGroupName", om.valueToTree(this.getLogGroupName()));
            }
            if (this.getLogStreamName() != null) {
                data.set("logStreamName", om.valueToTree(this.getLogStreamName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisFirehoseDeliveryStream.KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions.Jsii$Proxy that = (KinesisFirehoseDeliveryStreamSnowflakeConfigurationS3ConfigurationCloudwatchLoggingOptions.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.logGroupName != null ? !this.logGroupName.equals(that.logGroupName) : that.logGroupName != null) return false;
            return this.logStreamName != null ? this.logStreamName.equals(that.logStreamName) : that.logStreamName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.logGroupName != null ? this.logGroupName.hashCode() : 0);
            result = 31 * result + (this.logStreamName != null ? this.logStreamName.hashCode() : 0);
            return result;
        }
    }
}
