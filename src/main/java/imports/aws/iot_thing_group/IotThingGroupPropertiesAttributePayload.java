package imports.aws.iot_thing_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.406Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotThingGroup.IotThingGroupPropertiesAttributePayload")
@software.amazon.jsii.Jsii.Proxy(IotThingGroupPropertiesAttributePayload.Jsii$Proxy.class)
public interface IotThingGroupPropertiesAttributePayload extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_thing_group#attributes IotThingGroup#attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotThingGroupPropertiesAttributePayload}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotThingGroupPropertiesAttributePayload}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotThingGroupPropertiesAttributePayload> {
        java.util.Map<java.lang.String, java.lang.String> attributes;

        /**
         * Sets the value of {@link IotThingGroupPropertiesAttributePayload#getAttributes}
         * @param attributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_thing_group#attributes IotThingGroup#attributes}.
         * @return {@code this}
         */
        public Builder attributes(java.util.Map<java.lang.String, java.lang.String> attributes) {
            this.attributes = attributes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotThingGroupPropertiesAttributePayload}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotThingGroupPropertiesAttributePayload build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotThingGroupPropertiesAttributePayload}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotThingGroupPropertiesAttributePayload {
        private final java.util.Map<java.lang.String, java.lang.String> attributes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributes = software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributes = builder.attributes;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAttributes() {
            return this.attributes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAttributes() != null) {
                data.set("attributes", om.valueToTree(this.getAttributes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotThingGroup.IotThingGroupPropertiesAttributePayload"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotThingGroupPropertiesAttributePayload.Jsii$Proxy that = (IotThingGroupPropertiesAttributePayload.Jsii$Proxy) o;

            return this.attributes != null ? this.attributes.equals(that.attributes) : that.attributes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attributes != null ? this.attributes.hashCode() : 0;
            return result;
        }
    }
}
