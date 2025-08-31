package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.316Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointDeploymentConfig.Jsii$Proxy.class)
public interface SagemakerEndpointDeploymentConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * auto_rollback_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#auto_rollback_configuration SagemakerEndpoint#auto_rollback_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration getAutoRollbackConfiguration() {
        return null;
    }

    /**
     * blue_green_update_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#blue_green_update_policy SagemakerEndpoint#blue_green_update_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy getBlueGreenUpdatePolicy() {
        return null;
    }

    /**
     * rolling_update_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#rolling_update_policy SagemakerEndpoint#rolling_update_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy getRollingUpdatePolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointDeploymentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointDeploymentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointDeploymentConfig> {
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration autoRollbackConfiguration;
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy blueGreenUpdatePolicy;
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy rollingUpdatePolicy;

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfig#getAutoRollbackConfiguration}
         * @param autoRollbackConfiguration auto_rollback_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#auto_rollback_configuration SagemakerEndpoint#auto_rollback_configuration}
         * @return {@code this}
         */
        public Builder autoRollbackConfiguration(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration autoRollbackConfiguration) {
            this.autoRollbackConfiguration = autoRollbackConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfig#getBlueGreenUpdatePolicy}
         * @param blueGreenUpdatePolicy blue_green_update_policy block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#blue_green_update_policy SagemakerEndpoint#blue_green_update_policy}
         * @return {@code this}
         */
        public Builder blueGreenUpdatePolicy(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy blueGreenUpdatePolicy) {
            this.blueGreenUpdatePolicy = blueGreenUpdatePolicy;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfig#getRollingUpdatePolicy}
         * @param rollingUpdatePolicy rolling_update_policy block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#rolling_update_policy SagemakerEndpoint#rolling_update_policy}
         * @return {@code this}
         */
        public Builder rollingUpdatePolicy(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy rollingUpdatePolicy) {
            this.rollingUpdatePolicy = rollingUpdatePolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointDeploymentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointDeploymentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointDeploymentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointDeploymentConfig {
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration autoRollbackConfiguration;
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy blueGreenUpdatePolicy;
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy rollingUpdatePolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoRollbackConfiguration = software.amazon.jsii.Kernel.get(this, "autoRollbackConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration.class));
            this.blueGreenUpdatePolicy = software.amazon.jsii.Kernel.get(this, "blueGreenUpdatePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy.class));
            this.rollingUpdatePolicy = software.amazon.jsii.Kernel.get(this, "rollingUpdatePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoRollbackConfiguration = builder.autoRollbackConfiguration;
            this.blueGreenUpdatePolicy = builder.blueGreenUpdatePolicy;
            this.rollingUpdatePolicy = builder.rollingUpdatePolicy;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration getAutoRollbackConfiguration() {
            return this.autoRollbackConfiguration;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigBlueGreenUpdatePolicy getBlueGreenUpdatePolicy() {
            return this.blueGreenUpdatePolicy;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy getRollingUpdatePolicy() {
            return this.rollingUpdatePolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAutoRollbackConfiguration() != null) {
                data.set("autoRollbackConfiguration", om.valueToTree(this.getAutoRollbackConfiguration()));
            }
            if (this.getBlueGreenUpdatePolicy() != null) {
                data.set("blueGreenUpdatePolicy", om.valueToTree(this.getBlueGreenUpdatePolicy()));
            }
            if (this.getRollingUpdatePolicy() != null) {
                data.set("rollingUpdatePolicy", om.valueToTree(this.getRollingUpdatePolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointDeploymentConfig.Jsii$Proxy that = (SagemakerEndpointDeploymentConfig.Jsii$Proxy) o;

            if (this.autoRollbackConfiguration != null ? !this.autoRollbackConfiguration.equals(that.autoRollbackConfiguration) : that.autoRollbackConfiguration != null) return false;
            if (this.blueGreenUpdatePolicy != null ? !this.blueGreenUpdatePolicy.equals(that.blueGreenUpdatePolicy) : that.blueGreenUpdatePolicy != null) return false;
            return this.rollingUpdatePolicy != null ? this.rollingUpdatePolicy.equals(that.rollingUpdatePolicy) : that.rollingUpdatePolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.autoRollbackConfiguration != null ? this.autoRollbackConfiguration.hashCode() : 0;
            result = 31 * result + (this.blueGreenUpdatePolicy != null ? this.blueGreenUpdatePolicy.hashCode() : 0);
            result = 31 * result + (this.rollingUpdatePolicy != null ? this.rollingUpdatePolicy.hashCode() : 0);
            return result;
        }
    }
}
