package imports.aws.lightsail_container_service_deployment_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.820Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionPublicEndpoint")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServiceDeploymentVersionPublicEndpoint.Jsii$Proxy.class)
public interface LightsailContainerServiceDeploymentVersionPublicEndpoint extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#container_name LightsailContainerServiceDeploymentVersion#container_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#container_port LightsailContainerServiceDeploymentVersion#container_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getContainerPort();

    /**
     * health_check block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#health_check LightsailContainerServiceDeploymentVersion#health_check}
     */
    @org.jetbrains.annotations.NotNull imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck getHealthCheck();

    /**
     * @return a {@link Builder} of {@link LightsailContainerServiceDeploymentVersionPublicEndpoint}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServiceDeploymentVersionPublicEndpoint}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServiceDeploymentVersionPublicEndpoint> {
        java.lang.String containerName;
        java.lang.Number containerPort;
        imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck healthCheck;

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpoint#getContainerName}
         * @param containerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#container_name LightsailContainerServiceDeploymentVersion#container_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerName(java.lang.String containerName) {
            this.containerName = containerName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpoint#getContainerPort}
         * @param containerPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#container_port LightsailContainerServiceDeploymentVersion#container_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerPort(java.lang.Number containerPort) {
            this.containerPort = containerPort;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpoint#getHealthCheck}
         * @param healthCheck health_check block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#health_check LightsailContainerServiceDeploymentVersion#health_check}
         * @return {@code this}
         */
        public Builder healthCheck(imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServiceDeploymentVersionPublicEndpoint}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServiceDeploymentVersionPublicEndpoint build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServiceDeploymentVersionPublicEndpoint}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServiceDeploymentVersionPublicEndpoint {
        private final java.lang.String containerName;
        private final java.lang.Number containerPort;
        private final imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck healthCheck;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerName = software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerPort = software.amazon.jsii.Kernel.get(this, "containerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerName = java.util.Objects.requireNonNull(builder.containerName, "containerName is required");
            this.containerPort = java.util.Objects.requireNonNull(builder.containerPort, "containerPort is required");
            this.healthCheck = java.util.Objects.requireNonNull(builder.healthCheck, "healthCheck is required");
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
        public final imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("containerName", om.valueToTree(this.getContainerName()));
            data.set("containerPort", om.valueToTree(this.getContainerPort()));
            data.set("healthCheck", om.valueToTree(this.getHealthCheck()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionPublicEndpoint"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServiceDeploymentVersionPublicEndpoint.Jsii$Proxy that = (LightsailContainerServiceDeploymentVersionPublicEndpoint.Jsii$Proxy) o;

            if (!containerName.equals(that.containerName)) return false;
            if (!containerPort.equals(that.containerPort)) return false;
            return this.healthCheck.equals(that.healthCheck);
        }

        @Override
        public final int hashCode() {
            int result = this.containerName.hashCode();
            result = 31 * result + (this.containerPort.hashCode());
            result = 31 * result + (this.healthCheck.hashCode());
            return result;
        }
    }
}
