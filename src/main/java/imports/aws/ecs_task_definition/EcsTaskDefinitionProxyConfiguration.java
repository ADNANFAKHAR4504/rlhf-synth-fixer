package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionProxyConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionProxyConfiguration.Jsii$Proxy.class)
public interface EcsTaskDefinitionProxyConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#container_name EcsTaskDefinition#container_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#properties EcsTaskDefinition#properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#type EcsTaskDefinition#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionProxyConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionProxyConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionProxyConfiguration> {
        java.lang.String containerName;
        java.util.Map<java.lang.String, java.lang.String> properties;
        java.lang.String type;

        /**
         * Sets the value of {@link EcsTaskDefinitionProxyConfiguration#getContainerName}
         * @param containerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#container_name EcsTaskDefinition#container_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerName(java.lang.String containerName) {
            this.containerName = containerName;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionProxyConfiguration#getProperties}
         * @param properties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#properties EcsTaskDefinition#properties}.
         * @return {@code this}
         */
        public Builder properties(java.util.Map<java.lang.String, java.lang.String> properties) {
            this.properties = properties;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionProxyConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#type EcsTaskDefinition#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionProxyConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionProxyConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionProxyConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionProxyConfiguration {
        private final java.lang.String containerName;
        private final java.util.Map<java.lang.String, java.lang.String> properties;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerName = software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.properties = software.amazon.jsii.Kernel.get(this, "properties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerName = java.util.Objects.requireNonNull(builder.containerName, "containerName is required");
            this.properties = builder.properties;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getContainerName() {
            return this.containerName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getProperties() {
            return this.properties;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("containerName", om.valueToTree(this.getContainerName()));
            if (this.getProperties() != null) {
                data.set("properties", om.valueToTree(this.getProperties()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionProxyConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionProxyConfiguration.Jsii$Proxy that = (EcsTaskDefinitionProxyConfiguration.Jsii$Proxy) o;

            if (!containerName.equals(that.containerName)) return false;
            if (this.properties != null ? !this.properties.equals(that.properties) : that.properties != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerName.hashCode();
            result = 31 * result + (this.properties != null ? this.properties.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
