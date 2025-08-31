package imports.aws.ivschat_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.425Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivschatLoggingConfiguration.IvschatLoggingConfigurationDestinationConfigurationFirehose")
@software.amazon.jsii.Jsii.Proxy(IvschatLoggingConfigurationDestinationConfigurationFirehose.Jsii$Proxy.class)
public interface IvschatLoggingConfigurationDestinationConfigurationFirehose extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_logging_configuration#delivery_stream_name IvschatLoggingConfiguration#delivery_stream_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStreamName();

    /**
     * @return a {@link Builder} of {@link IvschatLoggingConfigurationDestinationConfigurationFirehose}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IvschatLoggingConfigurationDestinationConfigurationFirehose}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IvschatLoggingConfigurationDestinationConfigurationFirehose> {
        java.lang.String deliveryStreamName;

        /**
         * Sets the value of {@link IvschatLoggingConfigurationDestinationConfigurationFirehose#getDeliveryStreamName}
         * @param deliveryStreamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivschat_logging_configuration#delivery_stream_name IvschatLoggingConfiguration#delivery_stream_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deliveryStreamName(java.lang.String deliveryStreamName) {
            this.deliveryStreamName = deliveryStreamName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IvschatLoggingConfigurationDestinationConfigurationFirehose}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IvschatLoggingConfigurationDestinationConfigurationFirehose build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IvschatLoggingConfigurationDestinationConfigurationFirehose}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IvschatLoggingConfigurationDestinationConfigurationFirehose {
        private final java.lang.String deliveryStreamName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deliveryStreamName = software.amazon.jsii.Kernel.get(this, "deliveryStreamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deliveryStreamName = java.util.Objects.requireNonNull(builder.deliveryStreamName, "deliveryStreamName is required");
        }

        @Override
        public final java.lang.String getDeliveryStreamName() {
            return this.deliveryStreamName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deliveryStreamName", om.valueToTree(this.getDeliveryStreamName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ivschatLoggingConfiguration.IvschatLoggingConfigurationDestinationConfigurationFirehose"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IvschatLoggingConfigurationDestinationConfigurationFirehose.Jsii$Proxy that = (IvschatLoggingConfigurationDestinationConfigurationFirehose.Jsii$Proxy) o;

            return this.deliveryStreamName.equals(that.deliveryStreamName);
        }

        @Override
        public final int hashCode() {
            int result = this.deliveryStreamName.hashCode();
            return result;
        }
    }
}
