package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.458Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#topic_arn Sesv2ConfigurationSetEventDestination#topic_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicArn();

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination> {
        java.lang.String topicArn;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#topic_arn Sesv2ConfigurationSetEventDestination#topic_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination {
        private final java.lang.String topicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.topicArn = java.util.Objects.requireNonNull(builder.topicArn, "topicArn is required");
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("topicArn", om.valueToTree(this.getTopicArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination.Jsii$Proxy that = (Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination.Jsii$Proxy) o;

            return this.topicArn.equals(that.topicArn);
        }

        @Override
        public final int hashCode() {
            int result = this.topicArn.hashCode();
            return result;
        }
    }
}
