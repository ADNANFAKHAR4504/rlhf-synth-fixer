package imports.aws.cloudwatch_log_delivery_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogDeliveryDestination.CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration")
@software.amazon.jsii.Jsii.Proxy(CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration.Jsii$Proxy.class)
public interface CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery_destination#destination_resource_arn CloudwatchLogDeliveryDestination#destination_resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationResourceArn();

    /**
     * @return a {@link Builder} of {@link CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration> {
        java.lang.String destinationResourceArn;

        /**
         * Sets the value of {@link CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration#getDestinationResourceArn}
         * @param destinationResourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_delivery_destination#destination_resource_arn CloudwatchLogDeliveryDestination#destination_resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationResourceArn(java.lang.String destinationResourceArn) {
            this.destinationResourceArn = destinationResourceArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration {
        private final java.lang.String destinationResourceArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationResourceArn = software.amazon.jsii.Kernel.get(this, "destinationResourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationResourceArn = java.util.Objects.requireNonNull(builder.destinationResourceArn, "destinationResourceArn is required");
        }

        @Override
        public final java.lang.String getDestinationResourceArn() {
            return this.destinationResourceArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationResourceArn", om.valueToTree(this.getDestinationResourceArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchLogDeliveryDestination.CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration.Jsii$Proxy that = (CloudwatchLogDeliveryDestinationDeliveryDestinationConfiguration.Jsii$Proxy) o;

            return this.destinationResourceArn.equals(that.destinationResourceArn);
        }

        @Override
        public final int hashCode() {
            int result = this.destinationResourceArn.hashCode();
            return result;
        }
    }
}
