package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointDeploymentConfigAutoRollbackConfiguration.Jsii$Proxy.class)
public interface SagemakerEndpointDeploymentConfigAutoRollbackConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * alarms block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#alarms SagemakerEndpoint#alarms}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAlarms() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointDeploymentConfigAutoRollbackConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointDeploymentConfigAutoRollbackConfiguration> {
        java.lang.Object alarms;

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfiguration#getAlarms}
         * @param alarms alarms block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#alarms SagemakerEndpoint#alarms}
         * @return {@code this}
         */
        public Builder alarms(com.hashicorp.cdktf.IResolvable alarms) {
            this.alarms = alarms;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfiguration#getAlarms}
         * @param alarms alarms block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#alarms SagemakerEndpoint#alarms}
         * @return {@code this}
         */
        public Builder alarms(java.util.List<? extends imports.aws.sagemaker_endpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms> alarms) {
            this.alarms = alarms;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointDeploymentConfigAutoRollbackConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointDeploymentConfigAutoRollbackConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointDeploymentConfigAutoRollbackConfiguration {
        private final java.lang.Object alarms;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarms = software.amazon.jsii.Kernel.get(this, "alarms", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarms = builder.alarms;
        }

        @Override
        public final java.lang.Object getAlarms() {
            return this.alarms;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAlarms() != null) {
                data.set("alarms", om.valueToTree(this.getAlarms()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointDeploymentConfigAutoRollbackConfiguration.Jsii$Proxy that = (SagemakerEndpointDeploymentConfigAutoRollbackConfiguration.Jsii$Proxy) o;

            return this.alarms != null ? this.alarms.equals(that.alarms) : that.alarms == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alarms != null ? this.alarms.hashCode() : 0;
            return result;
        }
    }
}
