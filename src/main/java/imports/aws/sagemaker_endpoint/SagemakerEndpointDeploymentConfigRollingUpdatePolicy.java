package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointDeploymentConfigRollingUpdatePolicy.Jsii$Proxy.class)
public interface SagemakerEndpointDeploymentConfigRollingUpdatePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * maximum_batch_size block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#maximum_batch_size SagemakerEndpoint#maximum_batch_size}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize getMaximumBatchSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#wait_interval_in_seconds SagemakerEndpoint#wait_interval_in_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWaitIntervalInSeconds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#maximum_execution_timeout_in_seconds SagemakerEndpoint#maximum_execution_timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumExecutionTimeoutInSeconds() {
        return null;
    }

    /**
     * rollback_maximum_batch_size block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#rollback_maximum_batch_size SagemakerEndpoint#rollback_maximum_batch_size}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize getRollbackMaximumBatchSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointDeploymentConfigRollingUpdatePolicy> {
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize maximumBatchSize;
        java.lang.Number waitIntervalInSeconds;
        java.lang.Number maximumExecutionTimeoutInSeconds;
        imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize rollbackMaximumBatchSize;

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy#getMaximumBatchSize}
         * @param maximumBatchSize maximum_batch_size block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#maximum_batch_size SagemakerEndpoint#maximum_batch_size}
         * @return {@code this}
         */
        public Builder maximumBatchSize(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize maximumBatchSize) {
            this.maximumBatchSize = maximumBatchSize;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy#getWaitIntervalInSeconds}
         * @param waitIntervalInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#wait_interval_in_seconds SagemakerEndpoint#wait_interval_in_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder waitIntervalInSeconds(java.lang.Number waitIntervalInSeconds) {
            this.waitIntervalInSeconds = waitIntervalInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy#getMaximumExecutionTimeoutInSeconds}
         * @param maximumExecutionTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#maximum_execution_timeout_in_seconds SagemakerEndpoint#maximum_execution_timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumExecutionTimeoutInSeconds(java.lang.Number maximumExecutionTimeoutInSeconds) {
            this.maximumExecutionTimeoutInSeconds = maximumExecutionTimeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy#getRollbackMaximumBatchSize}
         * @param rollbackMaximumBatchSize rollback_maximum_batch_size block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#rollback_maximum_batch_size SagemakerEndpoint#rollback_maximum_batch_size}
         * @return {@code this}
         */
        public Builder rollbackMaximumBatchSize(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize rollbackMaximumBatchSize) {
            this.rollbackMaximumBatchSize = rollbackMaximumBatchSize;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointDeploymentConfigRollingUpdatePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointDeploymentConfigRollingUpdatePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointDeploymentConfigRollingUpdatePolicy {
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize maximumBatchSize;
        private final java.lang.Number waitIntervalInSeconds;
        private final java.lang.Number maximumExecutionTimeoutInSeconds;
        private final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize rollbackMaximumBatchSize;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumBatchSize = software.amazon.jsii.Kernel.get(this, "maximumBatchSize", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize.class));
            this.waitIntervalInSeconds = software.amazon.jsii.Kernel.get(this, "waitIntervalInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumExecutionTimeoutInSeconds = software.amazon.jsii.Kernel.get(this, "maximumExecutionTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.rollbackMaximumBatchSize = software.amazon.jsii.Kernel.get(this, "rollbackMaximumBatchSize", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumBatchSize = java.util.Objects.requireNonNull(builder.maximumBatchSize, "maximumBatchSize is required");
            this.waitIntervalInSeconds = java.util.Objects.requireNonNull(builder.waitIntervalInSeconds, "waitIntervalInSeconds is required");
            this.maximumExecutionTimeoutInSeconds = builder.maximumExecutionTimeoutInSeconds;
            this.rollbackMaximumBatchSize = builder.rollbackMaximumBatchSize;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyMaximumBatchSize getMaximumBatchSize() {
            return this.maximumBatchSize;
        }

        @Override
        public final java.lang.Number getWaitIntervalInSeconds() {
            return this.waitIntervalInSeconds;
        }

        @Override
        public final java.lang.Number getMaximumExecutionTimeoutInSeconds() {
            return this.maximumExecutionTimeoutInSeconds;
        }

        @Override
        public final imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicyRollbackMaximumBatchSize getRollbackMaximumBatchSize() {
            return this.rollbackMaximumBatchSize;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maximumBatchSize", om.valueToTree(this.getMaximumBatchSize()));
            data.set("waitIntervalInSeconds", om.valueToTree(this.getWaitIntervalInSeconds()));
            if (this.getMaximumExecutionTimeoutInSeconds() != null) {
                data.set("maximumExecutionTimeoutInSeconds", om.valueToTree(this.getMaximumExecutionTimeoutInSeconds()));
            }
            if (this.getRollbackMaximumBatchSize() != null) {
                data.set("rollbackMaximumBatchSize", om.valueToTree(this.getRollbackMaximumBatchSize()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigRollingUpdatePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointDeploymentConfigRollingUpdatePolicy.Jsii$Proxy that = (SagemakerEndpointDeploymentConfigRollingUpdatePolicy.Jsii$Proxy) o;

            if (!maximumBatchSize.equals(that.maximumBatchSize)) return false;
            if (!waitIntervalInSeconds.equals(that.waitIntervalInSeconds)) return false;
            if (this.maximumExecutionTimeoutInSeconds != null ? !this.maximumExecutionTimeoutInSeconds.equals(that.maximumExecutionTimeoutInSeconds) : that.maximumExecutionTimeoutInSeconds != null) return false;
            return this.rollbackMaximumBatchSize != null ? this.rollbackMaximumBatchSize.equals(that.rollbackMaximumBatchSize) : that.rollbackMaximumBatchSize == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumBatchSize.hashCode();
            result = 31 * result + (this.waitIntervalInSeconds.hashCode());
            result = 31 * result + (this.maximumExecutionTimeoutInSeconds != null ? this.maximumExecutionTimeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.rollbackMaximumBatchSize != null ? this.rollbackMaximumBatchSize.hashCode() : 0);
            return result;
        }
    }
}
