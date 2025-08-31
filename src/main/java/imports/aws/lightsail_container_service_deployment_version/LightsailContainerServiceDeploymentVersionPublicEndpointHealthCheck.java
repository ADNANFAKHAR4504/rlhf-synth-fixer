package imports.aws.lightsail_container_service_deployment_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.820Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck.Jsii$Proxy.class)
public interface LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#healthy_threshold LightsailContainerServiceDeploymentVersion#healthy_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHealthyThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#interval_seconds LightsailContainerServiceDeploymentVersion#interval_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIntervalSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#path LightsailContainerServiceDeploymentVersion#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#success_codes LightsailContainerServiceDeploymentVersion#success_codes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSuccessCodes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#timeout_seconds LightsailContainerServiceDeploymentVersion#timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#unhealthy_threshold LightsailContainerServiceDeploymentVersion#unhealthy_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck> {
        java.lang.Number healthyThreshold;
        java.lang.Number intervalSeconds;
        java.lang.String path;
        java.lang.String successCodes;
        java.lang.Number timeoutSeconds;
        java.lang.Number unhealthyThreshold;

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck#getHealthyThreshold}
         * @param healthyThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#healthy_threshold LightsailContainerServiceDeploymentVersion#healthy_threshold}.
         * @return {@code this}
         */
        public Builder healthyThreshold(java.lang.Number healthyThreshold) {
            this.healthyThreshold = healthyThreshold;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck#getIntervalSeconds}
         * @param intervalSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#interval_seconds LightsailContainerServiceDeploymentVersion#interval_seconds}.
         * @return {@code this}
         */
        public Builder intervalSeconds(java.lang.Number intervalSeconds) {
            this.intervalSeconds = intervalSeconds;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#path LightsailContainerServiceDeploymentVersion#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck#getSuccessCodes}
         * @param successCodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#success_codes LightsailContainerServiceDeploymentVersion#success_codes}.
         * @return {@code this}
         */
        public Builder successCodes(java.lang.String successCodes) {
            this.successCodes = successCodes;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck#getTimeoutSeconds}
         * @param timeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#timeout_seconds LightsailContainerServiceDeploymentVersion#timeout_seconds}.
         * @return {@code this}
         */
        public Builder timeoutSeconds(java.lang.Number timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck#getUnhealthyThreshold}
         * @param unhealthyThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service_deployment_version#unhealthy_threshold LightsailContainerServiceDeploymentVersion#unhealthy_threshold}.
         * @return {@code this}
         */
        public Builder unhealthyThreshold(java.lang.Number unhealthyThreshold) {
            this.unhealthyThreshold = unhealthyThreshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck {
        private final java.lang.Number healthyThreshold;
        private final java.lang.Number intervalSeconds;
        private final java.lang.String path;
        private final java.lang.String successCodes;
        private final java.lang.Number timeoutSeconds;
        private final java.lang.Number unhealthyThreshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.healthyThreshold = software.amazon.jsii.Kernel.get(this, "healthyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.intervalSeconds = software.amazon.jsii.Kernel.get(this, "intervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.successCodes = software.amazon.jsii.Kernel.get(this, "successCodes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutSeconds = software.amazon.jsii.Kernel.get(this, "timeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unhealthyThreshold = software.amazon.jsii.Kernel.get(this, "unhealthyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.healthyThreshold = builder.healthyThreshold;
            this.intervalSeconds = builder.intervalSeconds;
            this.path = builder.path;
            this.successCodes = builder.successCodes;
            this.timeoutSeconds = builder.timeoutSeconds;
            this.unhealthyThreshold = builder.unhealthyThreshold;
        }

        @Override
        public final java.lang.Number getHealthyThreshold() {
            return this.healthyThreshold;
        }

        @Override
        public final java.lang.Number getIntervalSeconds() {
            return this.intervalSeconds;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.String getSuccessCodes() {
            return this.successCodes;
        }

        @Override
        public final java.lang.Number getTimeoutSeconds() {
            return this.timeoutSeconds;
        }

        @Override
        public final java.lang.Number getUnhealthyThreshold() {
            return this.unhealthyThreshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHealthyThreshold() != null) {
                data.set("healthyThreshold", om.valueToTree(this.getHealthyThreshold()));
            }
            if (this.getIntervalSeconds() != null) {
                data.set("intervalSeconds", om.valueToTree(this.getIntervalSeconds()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getSuccessCodes() != null) {
                data.set("successCodes", om.valueToTree(this.getSuccessCodes()));
            }
            if (this.getTimeoutSeconds() != null) {
                data.set("timeoutSeconds", om.valueToTree(this.getTimeoutSeconds()));
            }
            if (this.getUnhealthyThreshold() != null) {
                data.set("unhealthyThreshold", om.valueToTree(this.getUnhealthyThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck.Jsii$Proxy that = (LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck.Jsii$Proxy) o;

            if (this.healthyThreshold != null ? !this.healthyThreshold.equals(that.healthyThreshold) : that.healthyThreshold != null) return false;
            if (this.intervalSeconds != null ? !this.intervalSeconds.equals(that.intervalSeconds) : that.intervalSeconds != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.successCodes != null ? !this.successCodes.equals(that.successCodes) : that.successCodes != null) return false;
            if (this.timeoutSeconds != null ? !this.timeoutSeconds.equals(that.timeoutSeconds) : that.timeoutSeconds != null) return false;
            return this.unhealthyThreshold != null ? this.unhealthyThreshold.equals(that.unhealthyThreshold) : that.unhealthyThreshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.healthyThreshold != null ? this.healthyThreshold.hashCode() : 0;
            result = 31 * result + (this.intervalSeconds != null ? this.intervalSeconds.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.successCodes != null ? this.successCodes.hashCode() : 0);
            result = 31 * result + (this.timeoutSeconds != null ? this.timeoutSeconds.hashCode() : 0);
            result = 31 * result + (this.unhealthyThreshold != null ? this.unhealthyThreshold.hashCode() : 0);
            return result;
        }
    }
}
