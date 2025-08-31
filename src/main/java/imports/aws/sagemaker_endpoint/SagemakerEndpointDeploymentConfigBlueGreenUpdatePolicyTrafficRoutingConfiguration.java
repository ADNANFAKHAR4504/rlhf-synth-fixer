package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration.Jsii$Proxy.class)
public interface SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#type SagemakerEndpoint#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#wait_interval_in_seconds SagemakerEndpoint#wait_interval_in_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWaitIntervalInSeconds();

    /**
     * canary_size block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#canary_size SagemakerEndpoint#canary_size}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationCanarySize getCanarySize() {
        return null;
    }

    /**
     * linear_step_size block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#linear_step_size SagemakerEndpoint#linear_step_size}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationLinearStepSize getLinearStepSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration> {
        java.lang.String type;
        java.lang.Number waitIntervalInSeconds;
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationCanarySize canarySize;
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationLinearStepSize linearStepSize;

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#type SagemakerEndpoint#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration#getWaitIntervalInSeconds}
         * @param waitIntervalInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#wait_interval_in_seconds SagemakerEndpoint#wait_interval_in_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder waitIntervalInSeconds(java.lang.Number waitIntervalInSeconds) {
            this.waitIntervalInSeconds = waitIntervalInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration#getCanarySize}
         * @param canarySize canary_size block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#canary_size SagemakerEndpoint#canary_size}
         * @return {@code this}
         */
        public Builder canarySize(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationCanarySize canarySize) {
            this.canarySize = canarySize;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration#getLinearStepSize}
         * @param linearStepSize linear_step_size block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#linear_step_size SagemakerEndpoint#linear_step_size}
         * @return {@code this}
         */
        public Builder linearStepSize(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationLinearStepSize linearStepSize) {
            this.linearStepSize = linearStepSize;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration {
        private final java.lang.String type;
        private final java.lang.Number waitIntervalInSeconds;
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationCanarySize canarySize;
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationLinearStepSize linearStepSize;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.waitIntervalInSeconds = software.amazon.jsii.Kernel.get(this, "waitIntervalInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.canarySize = software.amazon.jsii.Kernel.get(this, "canarySize", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationCanarySize.class));
            this.linearStepSize = software.amazon.jsii.Kernel.get(this, "linearStepSize", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationLinearStepSize.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.waitIntervalInSeconds = java.util.Objects.requireNonNull(builder.waitIntervalInSeconds, "waitIntervalInSeconds is required");
            this.canarySize = builder.canarySize;
            this.linearStepSize = builder.linearStepSize;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Number getWaitIntervalInSeconds() {
            return this.waitIntervalInSeconds;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationCanarySize getCanarySize() {
            return this.canarySize;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfigurationLinearStepSize getLinearStepSize() {
            return this.linearStepSize;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            data.set("waitIntervalInSeconds", om.valueToTree(this.getWaitIntervalInSeconds()));
            if (this.getCanarySize() != null) {
                data.set("canarySize", om.valueToTree(this.getCanarySize()));
            }
            if (this.getLinearStepSize() != null) {
                data.set("linearStepSize", om.valueToTree(this.getLinearStepSize()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration.Jsii$Proxy that = (SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicyTrafficRoutingConfiguration.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (!waitIntervalInSeconds.equals(that.waitIntervalInSeconds)) return false;
            if (this.canarySize != null ? !this.canarySize.equals(that.canarySize) : that.canarySize != null) return false;
            return this.linearStepSize != null ? this.linearStepSize.equals(that.linearStepSize) : that.linearStepSize == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.waitIntervalInSeconds.hashCode());
            result = 31 * result + (this.canarySize != null ? this.canarySize.hashCode() : 0);
            result = 31 * result + (this.linearStepSize != null ? this.linearStepSize.hashCode() : 0);
            return result;
        }
    }
}
