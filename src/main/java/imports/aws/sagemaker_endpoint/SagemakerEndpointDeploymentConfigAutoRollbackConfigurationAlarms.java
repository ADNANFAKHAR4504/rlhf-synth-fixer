package imports.aws.sagemaker_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms.Jsii$Proxy.class)
public interface SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#alarm_name SagemakerEndpoint#alarm_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlarmName();

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms> {
        java.lang.String alarmName;

        /**
         * Sets the value of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms#getAlarmName}
         * @param alarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint#alarm_name SagemakerEndpoint#alarm_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarmName(java.lang.String alarmName) {
            this.alarmName = alarmName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms {
        private final java.lang.String alarmName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarmName = software.amazon.jsii.Kernel.get(this, "alarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarmName = java.util.Objects.requireNonNull(builder.alarmName, "alarmName is required");
        }

        @Override
        public final java.lang.String getAlarmName() {
            return this.alarmName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alarmName", om.valueToTree(this.getAlarmName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpoint.SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms.Jsii$Proxy that = (SagemakerEndpointDeploymentConfigAutoRollbackConfigurationAlarms.Jsii$Proxy) o;

            return this.alarmName.equals(that.alarmName);
        }

        @Override
        public final int hashCode() {
            int result = this.alarmName.hashCode();
            return result;
        }
    }
}
