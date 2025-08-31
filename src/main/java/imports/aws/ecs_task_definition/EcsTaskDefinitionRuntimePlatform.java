package imports.aws.ecs_task_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.139Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskDefinition.EcsTaskDefinitionRuntimePlatform")
@software.amazon.jsii.Jsii.Proxy(EcsTaskDefinitionRuntimePlatform.Jsii$Proxy.class)
public interface EcsTaskDefinitionRuntimePlatform extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#cpu_architecture EcsTaskDefinition#cpu_architecture}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCpuArchitecture() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#operating_system_family EcsTaskDefinition#operating_system_family}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOperatingSystemFamily() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskDefinitionRuntimePlatform}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskDefinitionRuntimePlatform}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskDefinitionRuntimePlatform> {
        java.lang.String cpuArchitecture;
        java.lang.String operatingSystemFamily;

        /**
         * Sets the value of {@link EcsTaskDefinitionRuntimePlatform#getCpuArchitecture}
         * @param cpuArchitecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#cpu_architecture EcsTaskDefinition#cpu_architecture}.
         * @return {@code this}
         */
        public Builder cpuArchitecture(java.lang.String cpuArchitecture) {
            this.cpuArchitecture = cpuArchitecture;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskDefinitionRuntimePlatform#getOperatingSystemFamily}
         * @param operatingSystemFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_definition#operating_system_family EcsTaskDefinition#operating_system_family}.
         * @return {@code this}
         */
        public Builder operatingSystemFamily(java.lang.String operatingSystemFamily) {
            this.operatingSystemFamily = operatingSystemFamily;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskDefinitionRuntimePlatform}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskDefinitionRuntimePlatform build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskDefinitionRuntimePlatform}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskDefinitionRuntimePlatform {
        private final java.lang.String cpuArchitecture;
        private final java.lang.String operatingSystemFamily;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cpuArchitecture = software.amazon.jsii.Kernel.get(this, "cpuArchitecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operatingSystemFamily = software.amazon.jsii.Kernel.get(this, "operatingSystemFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cpuArchitecture = builder.cpuArchitecture;
            this.operatingSystemFamily = builder.operatingSystemFamily;
        }

        @Override
        public final java.lang.String getCpuArchitecture() {
            return this.cpuArchitecture;
        }

        @Override
        public final java.lang.String getOperatingSystemFamily() {
            return this.operatingSystemFamily;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCpuArchitecture() != null) {
                data.set("cpuArchitecture", om.valueToTree(this.getCpuArchitecture()));
            }
            if (this.getOperatingSystemFamily() != null) {
                data.set("operatingSystemFamily", om.valueToTree(this.getOperatingSystemFamily()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskDefinition.EcsTaskDefinitionRuntimePlatform"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskDefinitionRuntimePlatform.Jsii$Proxy that = (EcsTaskDefinitionRuntimePlatform.Jsii$Proxy) o;

            if (this.cpuArchitecture != null ? !this.cpuArchitecture.equals(that.cpuArchitecture) : that.cpuArchitecture != null) return false;
            return this.operatingSystemFamily != null ? this.operatingSystemFamily.equals(that.operatingSystemFamily) : that.operatingSystemFamily == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cpuArchitecture != null ? this.cpuArchitecture.hashCode() : 0;
            result = 31 * result + (this.operatingSystemFamily != null ? this.operatingSystemFamily.hashCode() : 0);
            return result;
        }
    }
}
