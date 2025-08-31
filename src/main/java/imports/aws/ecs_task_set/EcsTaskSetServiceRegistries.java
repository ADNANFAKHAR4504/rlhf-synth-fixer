package imports.aws.ecs_task_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskSet.EcsTaskSetServiceRegistries")
@software.amazon.jsii.Jsii.Proxy(EcsTaskSetServiceRegistries.Jsii$Proxy.class)
public interface EcsTaskSetServiceRegistries extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#registry_arn EcsTaskSet#registry_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegistryArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_name EcsTaskSet#container_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContainerName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_port EcsTaskSet#container_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getContainerPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#port EcsTaskSet#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskSetServiceRegistries}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskSetServiceRegistries}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskSetServiceRegistries> {
        java.lang.String registryArn;
        java.lang.String containerName;
        java.lang.Number containerPort;
        java.lang.Number port;

        /**
         * Sets the value of {@link EcsTaskSetServiceRegistries#getRegistryArn}
         * @param registryArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#registry_arn EcsTaskSet#registry_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder registryArn(java.lang.String registryArn) {
            this.registryArn = registryArn;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetServiceRegistries#getContainerName}
         * @param containerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_name EcsTaskSet#container_name}.
         * @return {@code this}
         */
        public Builder containerName(java.lang.String containerName) {
            this.containerName = containerName;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetServiceRegistries#getContainerPort}
         * @param containerPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_port EcsTaskSet#container_port}.
         * @return {@code this}
         */
        public Builder containerPort(java.lang.Number containerPort) {
            this.containerPort = containerPort;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetServiceRegistries#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#port EcsTaskSet#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskSetServiceRegistries}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskSetServiceRegistries build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskSetServiceRegistries}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskSetServiceRegistries {
        private final java.lang.String registryArn;
        private final java.lang.String containerName;
        private final java.lang.Number containerPort;
        private final java.lang.Number port;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.registryArn = software.amazon.jsii.Kernel.get(this, "registryArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerName = software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerPort = software.amazon.jsii.Kernel.get(this, "containerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.registryArn = java.util.Objects.requireNonNull(builder.registryArn, "registryArn is required");
            this.containerName = builder.containerName;
            this.containerPort = builder.containerPort;
            this.port = builder.port;
        }

        @Override
        public final java.lang.String getRegistryArn() {
            return this.registryArn;
        }

        @Override
        public final java.lang.String getContainerName() {
            return this.containerName;
        }

        @Override
        public final java.lang.Number getContainerPort() {
            return this.containerPort;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("registryArn", om.valueToTree(this.getRegistryArn()));
            if (this.getContainerName() != null) {
                data.set("containerName", om.valueToTree(this.getContainerName()));
            }
            if (this.getContainerPort() != null) {
                data.set("containerPort", om.valueToTree(this.getContainerPort()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskSet.EcsTaskSetServiceRegistries"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskSetServiceRegistries.Jsii$Proxy that = (EcsTaskSetServiceRegistries.Jsii$Proxy) o;

            if (!registryArn.equals(that.registryArn)) return false;
            if (this.containerName != null ? !this.containerName.equals(that.containerName) : that.containerName != null) return false;
            if (this.containerPort != null ? !this.containerPort.equals(that.containerPort) : that.containerPort != null) return false;
            return this.port != null ? this.port.equals(that.port) : that.port == null;
        }

        @Override
        public final int hashCode() {
            int result = this.registryArn.hashCode();
            result = 31 * result + (this.containerName != null ? this.containerName.hashCode() : 0);
            result = 31 * result + (this.containerPort != null ? this.containerPort.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            return result;
        }
    }
}
