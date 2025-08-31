package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#application_arn Sesv2ConfigurationSetEventDestination#application_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplicationArn();

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination> {
        java.lang.String applicationArn;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination#getApplicationArn}
         * @param applicationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#application_arn Sesv2ConfigurationSetEventDestination#application_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationArn(java.lang.String applicationArn) {
            this.applicationArn = applicationArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination {
        private final java.lang.String applicationArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applicationArn = software.amazon.jsii.Kernel.get(this, "applicationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applicationArn = java.util.Objects.requireNonNull(builder.applicationArn, "applicationArn is required");
        }

        @Override
        public final java.lang.String getApplicationArn() {
            return this.applicationArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("applicationArn", om.valueToTree(this.getApplicationArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination.Jsii$Proxy that = (Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination.Jsii$Proxy) o;

            return this.applicationArn.equals(that.applicationArn);
        }

        @Override
        public final int hashCode() {
            int result = this.applicationArn.hashCode();
            return result;
        }
    }
}
