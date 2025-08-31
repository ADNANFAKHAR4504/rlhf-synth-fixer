package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionEphemeralStorage")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionEphemeralStorage.Jsii$Proxy.class)
public interface EcsTaskDefinitionEphemeralStorage extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#size_in_gib EcsTaskDefinition#size_in_gib}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSizeInGib();

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionEphemeralStorage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionEphemeralStorage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionEphemeralStorage> {
        java.lang.Number sizeInGib;

        /**
         * Sets the value of {@link EcsTaskDefinitionEphemeralStorage#getSizeInGib}
         * @param sizeInGib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#size_in_gib EcsTaskDefinition#size_in_gib}. This parameter is required.
         * @return {@code this}
         */
        public Builder sizeInGib(java.lang.Number sizeInGib) {
            this.sizeInGib = sizeInGib;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionEphemeralStorage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionEphemeralStorage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionEphemeralStorage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionEphemeralStorage {
        private final java.lang.Number sizeInGib;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sizeInGib = software.amazon.jsii.Kernel.get(this, "sizeInGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sizeInGib = java.util.Objects.requireNonNull(builder.sizeInGib, "sizeInGib is required");
        }

        @Override
        public final java.lang.Number getSizeInGib() {
            return this.sizeInGib;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sizeInGib", om.valueToTree(this.getSizeInGib()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionEphemeralStorage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionEphemeralStorage.Jsii$Proxy that = (EcsTaskDefinitionEphemeralStorage.Jsii$Proxy) o;

            return this.sizeInGib.equals(that.sizeInGib);
        }

        @Override
        public final int hashCode() {
            int result = this.sizeInGib.hashCode();
            return result;
        }
    }
}
