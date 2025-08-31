package imports.aws.lightsail_container_service_deployment_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.820Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionContainer")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServiceDeploymentVersionContainer.Jsii$Proxy.class)
public interface LightsailContainerServiceDeploymentVersionContainer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#container_name LightsailContainerServiceDeploymentVersion#container_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#image LightsailContainerServiceDeploymentVersion#image}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#command LightsailContainerServiceDeploymentVersion#command}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommand() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#environment LightsailContainerServiceDeploymentVersion#environment}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#ports LightsailContainerServiceDeploymentVersion#ports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getPorts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailContainerServiceDeploymentVersionContainer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServiceDeploymentVersionContainer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServiceDeploymentVersionContainer> {
        java.lang.String containerName;
        java.lang.String image;
        java.util.List<java.lang.String> command;
        java.util.Map<java.lang.String, java.lang.String> environment;
        java.util.Map<java.lang.String, java.lang.String> ports;

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionContainer#getContainerName}
         * @param containerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#container_name LightsailContainerServiceDeploymentVersion#container_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerName(java.lang.String containerName) {
            this.containerName = containerName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionContainer#getImage}
         * @param image Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#image LightsailContainerServiceDeploymentVersion#image}. This parameter is required.
         * @return {@code this}
         */
        public Builder image(java.lang.String image) {
            this.image = image;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionContainer#getCommand}
         * @param command Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#command LightsailContainerServiceDeploymentVersion#command}.
         * @return {@code this}
         */
        public Builder command(java.util.List<java.lang.String> command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionContainer#getEnvironment}
         * @param environment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#environment LightsailContainerServiceDeploymentVersion#environment}.
         * @return {@code this}
         */
        public Builder environment(java.util.Map<java.lang.String, java.lang.String> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionContainer#getPorts}
         * @param ports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#ports LightsailContainerServiceDeploymentVersion#ports}.
         * @return {@code this}
         */
        public Builder ports(java.util.Map<java.lang.String, java.lang.String> ports) {
            this.ports = ports;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServiceDeploymentVersionContainer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServiceDeploymentVersionContainer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServiceDeploymentVersionContainer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServiceDeploymentVersionContainer {
        private final java.lang.String containerName;
        private final java.lang.String image;
        private final java.util.List<java.lang.String> command;
        private final java.util.Map<java.lang.String, java.lang.String> environment;
        private final java.util.Map<java.lang.String, java.lang.String> ports;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerName = software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.image = software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ports = software.amazon.jsii.Kernel.get(this, "ports", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerName = java.util.Objects.requireNonNull(builder.containerName, "containerName is required");
            this.image = java.util.Objects.requireNonNull(builder.image, "image is required");
            this.command = builder.command;
            this.environment = builder.environment;
            this.ports = builder.ports;
        }

        @Override
        public final java.lang.String getContainerName() {
            return this.containerName;
        }

        @Override
        public final java.lang.String getImage() {
            return this.image;
        }

        @Override
        public final java.util.List<java.lang.String> getCommand() {
            return this.command;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getPorts() {
            return this.ports;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("containerName", om.valueToTree(this.getContainerName()));
            data.set("image", om.valueToTree(this.getImage()));
            if (this.getCommand() != null) {
                data.set("command", om.valueToTree(this.getCommand()));
            }
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getPorts() != null) {
                data.set("ports", om.valueToTree(this.getPorts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionContainer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServiceDeploymentVersionContainer.Jsii$Proxy that = (LightsailContainerServiceDeploymentVersionContainer.Jsii$Proxy) o;

            if (!containerName.equals(that.containerName)) return false;
            if (!image.equals(that.image)) return false;
            if (this.command != null ? !this.command.equals(that.command) : that.command != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            return this.ports != null ? this.ports.equals(that.ports) : that.ports == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerName.hashCode();
            result = 31 * result + (this.image.hashCode());
            result = 31 * result + (this.command != null ? this.command.hashCode() : 0);
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.ports != null ? this.ports.hashCode() : 0);
            return result;
        }
    }
}
