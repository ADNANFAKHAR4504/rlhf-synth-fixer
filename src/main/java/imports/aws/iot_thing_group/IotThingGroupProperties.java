package imports.aws.iot_thing_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.406Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotThingGroup.IotThingGroupProperties")
@software.amazon.jsii.Jsii.Proxy(IotThingGroupProperties.Jsii$Proxy.class)
public interface IotThingGroupProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * attribute_payload block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_thing_group#attribute_payload IotThingGroup#attribute_payload}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload getAttributePayload() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_thing_group#description IotThingGroup#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotThingGroupProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotThingGroupProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotThingGroupProperties> {
        imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload attributePayload;
        java.lang.String description;

        /**
         * Sets the value of {@link IotThingGroupProperties#getAttributePayload}
         * @param attributePayload attribute_payload block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_thing_group#attribute_payload IotThingGroup#attribute_payload}
         * @return {@code this}
         */
        public Builder attributePayload(imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload attributePayload) {
            this.attributePayload = attributePayload;
            return this;
        }

        /**
         * Sets the value of {@link IotThingGroupProperties#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_thing_group#description IotThingGroup#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotThingGroupProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotThingGroupProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotThingGroupProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotThingGroupProperties {
        private final imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload attributePayload;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributePayload = software.amazon.jsii.Kernel.get(this, "attributePayload", software.amazon.jsii.NativeType.forClass(imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributePayload = builder.attributePayload;
            this.description = builder.description;
        }

        @Override
        public final imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload getAttributePayload() {
            return this.attributePayload;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAttributePayload() != null) {
                data.set("attributePayload", om.valueToTree(this.getAttributePayload()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotThingGroup.IotThingGroupProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotThingGroupProperties.Jsii$Proxy that = (IotThingGroupProperties.Jsii$Proxy) o;

            if (this.attributePayload != null ? !this.attributePayload.equals(that.attributePayload) : that.attributePayload != null) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attributePayload != null ? this.attributePayload.hashCode() : 0;
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
