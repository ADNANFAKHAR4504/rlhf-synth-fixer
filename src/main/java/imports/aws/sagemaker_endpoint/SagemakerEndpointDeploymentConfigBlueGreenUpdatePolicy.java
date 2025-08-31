package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy.Jsii$Proxy.class)
public interface SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * traffic_routing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#traffic_routing_configuration SagemakerEndpoint#traffic_routing_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration getTrafficRoutingConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#maximum_execution_timeout_in_seconds SagemakerEndpoint#maximum_execution_timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumExecutionTimeoutInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#termination_wait_in_seconds SagemakerEndpoint#termination_wait_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTerminationWaitInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy> {
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration trafficRoutingConfiguration;
        java.lang.Number maximumExecutionTimeoutInSeconds;
        java.lang.Number terminationWaitInSeconds;

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy#getTrafficRoutingConfiguration}
         * @param trafficRoutingConfiguration traffic_routing_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#traffic_routing_configuration SagemakerEndpoint#traffic_routing_configuration}
         * @return {@code this}
         */
        public Builder trafficRoutingConfiguration(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration trafficRoutingConfiguration) {
            this.trafficRoutingConfiguration = trafficRoutingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy#getMaximumExecutionTimeoutInSeconds}
         * @param maximumExecutionTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#maximum_execution_timeout_in_seconds SagemakerEndpoint#maximum_execution_timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumExecutionTimeoutInSeconds(java.lang.Number maximumExecutionTimeoutInSeconds) {
            this.maximumExecutionTimeoutInSeconds = maximumExecutionTimeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy#getTerminationWaitInSeconds}
         * @param terminationWaitInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#termination_wait_in_seconds SagemakerEndpoint#termination_wait_in_seconds}.
         * @return {@code this}
         */
        public Builder terminationWaitInSeconds(java.lang.Number terminationWaitInSeconds) {
            this.terminationWaitInSeconds = terminationWaitInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy {
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration trafficRoutingConfiguration;
        private final java.lang.Number maximumExecutionTimeoutInSeconds;
        private final java.lang.Number terminationWaitInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.trafficRoutingConfiguration = software.amazon.jsii.Kernel.get(this, "trafficRoutingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration.class));
            this.maximumExecutionTimeoutInSeconds = software.amazon.jsii.Kernel.get(this, "maximumExecutionTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.terminationWaitInSeconds = software.amazon.jsii.Kernel.get(this, "terminationWaitInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.trafficRoutingConfiguration = java.util.Objects.requireNonNull(builder.trafficRoutingConfiguration, "trafficRoutingConfiguration is required");
            this.maximumExecutionTimeoutInSeconds = builder.maximumExecutionTimeoutInSeconds;
            this.terminationWaitInSeconds = builder.terminationWaitInSeconds;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration getTrafficRoutingConfiguration() {
            return this.trafficRoutingConfiguration;
        }

        @Override
        public final java.lang.Number getMaximumExecutionTimeoutInSeconds() {
            return this.maximumExecutionTimeoutInSeconds;
        }

        @Override
        public final java.lang.Number getTerminationWaitInSeconds() {
            return this.terminationWaitInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("trafficRoutingConfiguration", om.valueToTree(this.getTrafficRoutingConfiguration()));
            if (this.getMaximumExecutionTimeoutInSeconds() != null) {
                data.set("maximumExecutionTimeoutInSeconds", om.valueToTree(this.getMaximumExecutionTimeoutInSeconds()));
            }
            if (this.getTerminationWaitInSeconds() != null) {
                data.set("terminationWaitInSeconds", om.valueToTree(this.getTerminationWaitInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy.Jsii$Proxy that = (SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy.Jsii$Proxy) o;

            if (!trafficRoutingConfiguration.equals(that.trafficRoutingConfiguration)) return false;
            if (this.maximumExecutionTimeoutInSeconds != null ? !this.maximumExecutionTimeoutInSeconds.equals(that.maximumExecutionTimeoutInSeconds) : that.maximumExecutionTimeoutInSeconds != null) return false;
            return this.terminationWaitInSeconds != null ? this.terminationWaitInSeconds.equals(that.terminationWaitInSeconds) : that.terminationWaitInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.trafficRoutingConfiguration.hashCode();
            result = 31 * result + (this.maximumExecutionTimeoutInSeconds != null ? this.maximumExecutionTimeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.terminationWaitInSeconds != null ? this.terminationWaitInSeconds.hashCode() : 0);
            return result;
        }
    }
}
