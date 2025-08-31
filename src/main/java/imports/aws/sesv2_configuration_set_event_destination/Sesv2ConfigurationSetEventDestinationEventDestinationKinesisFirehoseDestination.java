package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#delivery_stream_arn Sesv2ConfigurationSetEventDestination#delivery_stream_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStreamArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#iam_role_arn Sesv2ConfigurationSetEventDestination#iam_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn();

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination> {
        java.lang.String deliveryStreamArn;
        java.lang.String iamRoleArn;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination#getDeliveryStreamArn}
         * @param deliveryStreamArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#delivery_stream_arn Sesv2ConfigurationSetEventDestination#delivery_stream_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder deliveryStreamArn(java.lang.String deliveryStreamArn) {
            this.deliveryStreamArn = deliveryStreamArn;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#iam_role_arn Sesv2ConfigurationSetEventDestination#iam_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination {
        private final java.lang.String deliveryStreamArn;
        private final java.lang.String iamRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deliveryStreamArn = software.amazon.jsii.Kernel.get(this, "deliveryStreamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deliveryStreamArn = java.util.Objects.requireNonNull(builder.deliveryStreamArn, "deliveryStreamArn is required");
            this.iamRoleArn = java.util.Objects.requireNonNull(builder.iamRoleArn, "iamRoleArn is required");
        }

        @Override
        public final java.lang.String getDeliveryStreamArn() {
            return this.deliveryStreamArn;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deliveryStreamArn", om.valueToTree(this.getDeliveryStreamArn()));
            data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination.Jsii$Proxy that = (Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination.Jsii$Proxy) o;

            if (!deliveryStreamArn.equals(that.deliveryStreamArn)) return false;
            return this.iamRoleArn.equals(that.iamRoleArn);
        }

        @Override
        public final int hashCode() {
            int result = this.deliveryStreamArn.hashCode();
            result = 31 * result + (this.iamRoleArn.hashCode());
            return result;
        }
    }
}
