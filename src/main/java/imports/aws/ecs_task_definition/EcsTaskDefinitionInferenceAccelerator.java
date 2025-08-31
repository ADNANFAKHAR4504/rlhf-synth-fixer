package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionInferenceAccelerator")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionInferenceAccelerator.Jsii$Proxy.class)
public interface EcsTaskDefinitionInferenceAccelerator extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#device_name EcsTaskDefinition#device_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeviceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#device_type EcsTaskDefinition#device_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeviceType();

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionInferenceAccelerator}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionInferenceAccelerator}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionInferenceAccelerator> {
        java.lang.String deviceName;
        java.lang.String deviceType;

        /**
         * Sets the value of {@link EcsTaskDefinitionInferenceAccelerator#getDeviceName}
         * @param deviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#device_name EcsTaskDefinition#device_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceName(java.lang.String deviceName) {
            this.deviceName = deviceName;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionInferenceAccelerator#getDeviceType}
         * @param deviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#device_type EcsTaskDefinition#device_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder deviceType(java.lang.String deviceType) {
            this.deviceType = deviceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionInferenceAccelerator}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionInferenceAccelerator build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionInferenceAccelerator}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionInferenceAccelerator {
        private final java.lang.String deviceName;
        private final java.lang.String deviceType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceName = software.amazon.jsii.Kernel.get(this, "deviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceType = software.amazon.jsii.Kernel.get(this, "deviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceName = java.util.Objects.requireNonNull(builder.deviceName, "deviceName is required");
            this.deviceType = java.util.Objects.requireNonNull(builder.deviceType, "deviceType is required");
        }

        @Override
        public final java.lang.String getDeviceName() {
            return this.deviceName;
        }

        @Override
        public final java.lang.String getDeviceType() {
            return this.deviceType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deviceName", om.valueToTree(this.getDeviceName()));
            data.set("deviceType", om.valueToTree(this.getDeviceType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionInferenceAccelerator"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionInferenceAccelerator.Jsii$Proxy that = (EcsTaskDefinitionInferenceAccelerator.Jsii$Proxy) o;

            if (!deviceName.equals(that.deviceName)) return false;
            return this.deviceType.equals(that.deviceType);
        }

        @Override
        public final int hashCode() {
            int result = this.deviceName.hashCode();
            result = 31 * result + (this.deviceType.hashCode());
            return result;
        }
    }
}
