package imports.aws.cloudfront_realtime_log_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontRealtimeLogConfig.CloudfrontRealtimeLogConfigEndpoint")
@software.amazon.jsii.Jsii.Proxy(CloudfrontRealtimeLogConfigEndpoint.Jsii$Proxy.class)
public interface CloudfrontRealtimeLogConfigEndpoint extends software.amazon.jsii.JsiiSerializable {

    /**
     * kinesis_stream_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_realtime_log_config#kinesis_stream_config CloudfrontRealtimeLogConfig#kinesis_stream_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_realtime_log_config.CloudfrontRealtimeLogConfigEndpointKinesisStreamConfig getKinesisStreamConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_realtime_log_config#stream_type CloudfrontRealtimeLogConfig#stream_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStreamType();

    /**
     * @return a {@link Builder} of {@link CloudfrontRealtimeLogConfigEndpoint}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontRealtimeLogConfigEndpoint}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontRealtimeLogConfigEndpoint> {
        imports.aws.cloudfront_realtime_log_config.CloudfrontRealtimeLogConfigEndpointKinesisStreamConfig kinesisStreamConfig;
        java.lang.String streamType;

        /**
         * Sets the value of {@link CloudfrontRealtimeLogConfigEndpoint#getKinesisStreamConfig}
         * @param kinesisStreamConfig kinesis_stream_config block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_realtime_log_config#kinesis_stream_config CloudfrontRealtimeLogConfig#kinesis_stream_config}
         * @return {@code this}
         */
        public Builder kinesisStreamConfig(imports.aws.cloudfront_realtime_log_config.CloudfrontRealtimeLogConfigEndpointKinesisStreamConfig kinesisStreamConfig) {
            this.kinesisStreamConfig = kinesisStreamConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontRealtimeLogConfigEndpoint#getStreamType}
         * @param streamType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_realtime_log_config#stream_type CloudfrontRealtimeLogConfig#stream_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder streamType(java.lang.String streamType) {
            this.streamType = streamType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontRealtimeLogConfigEndpoint}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontRealtimeLogConfigEndpoint build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontRealtimeLogConfigEndpoint}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontRealtimeLogConfigEndpoint {
        private final imports.aws.cloudfront_realtime_log_config.CloudfrontRealtimeLogConfigEndpointKinesisStreamConfig kinesisStreamConfig;
        private final java.lang.String streamType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kinesisStreamConfig = software.amazon.jsii.Kernel.get(this, "kinesisStreamConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_realtime_log_config.CloudfrontRealtimeLogConfigEndpointKinesisStreamConfig.class));
            this.streamType = software.amazon.jsii.Kernel.get(this, "streamType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kinesisStreamConfig = java.util.Objects.requireNonNull(builder.kinesisStreamConfig, "kinesisStreamConfig is required");
            this.streamType = java.util.Objects.requireNonNull(builder.streamType, "streamType is required");
        }

        @Override
        public final imports.aws.cloudfront_realtime_log_config.CloudfrontRealtimeLogConfigEndpointKinesisStreamConfig getKinesisStreamConfig() {
            return this.kinesisStreamConfig;
        }

        @Override
        public final java.lang.String getStreamType() {
            return this.streamType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kinesisStreamConfig", om.valueToTree(this.getKinesisStreamConfig()));
            data.set("streamType", om.valueToTree(this.getStreamType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontRealtimeLogConfig.CloudfrontRealtimeLogConfigEndpoint"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontRealtimeLogConfigEndpoint.Jsii$Proxy that = (CloudfrontRealtimeLogConfigEndpoint.Jsii$Proxy) o;

            if (!kinesisStreamConfig.equals(that.kinesisStreamConfig)) return false;
            return this.streamType.equals(that.streamType);
        }

        @Override
        public final int hashCode() {
            int result = this.kinesisStreamConfig.hashCode();
            result = 31 * result + (this.streamType.hashCode());
            return result;
        }
    }
}
