package imports.aws.devicefarm_device_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.991Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devicefarmDevicePool.DevicefarmDevicePoolRule")
@software.amazon.jsii.Jsii.Proxy(DevicefarmDevicePoolRule.Jsii$Proxy.class)
public interface DevicefarmDevicePoolRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_device_pool#attribute DevicefarmDevicePool#attribute}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAttribute() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_device_pool#operator DevicefarmDevicePool#operator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOperator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_device_pool#value DevicefarmDevicePool#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevicefarmDevicePoolRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevicefarmDevicePoolRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevicefarmDevicePoolRule> {
        java.lang.String attribute;
        java.lang.String operator;
        java.lang.String value;

        /**
         * Sets the value of {@link DevicefarmDevicePoolRule#getAttribute}
         * @param attribute Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_device_pool#attribute DevicefarmDevicePool#attribute}.
         * @return {@code this}
         */
        public Builder attribute(java.lang.String attribute) {
            this.attribute = attribute;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmDevicePoolRule#getOperator}
         * @param operator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_device_pool#operator DevicefarmDevicePool#operator}.
         * @return {@code this}
         */
        public Builder operator(java.lang.String operator) {
            this.operator = operator;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmDevicePoolRule#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_device_pool#value DevicefarmDevicePool#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevicefarmDevicePoolRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevicefarmDevicePoolRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevicefarmDevicePoolRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevicefarmDevicePoolRule {
        private final java.lang.String attribute;
        private final java.lang.String operator;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attribute = software.amazon.jsii.Kernel.get(this, "attribute", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operator = software.amazon.jsii.Kernel.get(this, "operator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attribute = builder.attribute;
            this.operator = builder.operator;
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getAttribute() {
            return this.attribute;
        }

        @Override
        public final java.lang.String getOperator() {
            return this.operator;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAttribute() != null) {
                data.set("attribute", om.valueToTree(this.getAttribute()));
            }
            if (this.getOperator() != null) {
                data.set("operator", om.valueToTree(this.getOperator()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devicefarmDevicePool.DevicefarmDevicePoolRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevicefarmDevicePoolRule.Jsii$Proxy that = (DevicefarmDevicePoolRule.Jsii$Proxy) o;

            if (this.attribute != null ? !this.attribute.equals(that.attribute) : that.attribute != null) return false;
            if (this.operator != null ? !this.operator.equals(that.operator) : that.operator != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attribute != null ? this.attribute.hashCode() : 0;
            result = 31 * result + (this.operator != null ? this.operator.hashCode() : 0);
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
