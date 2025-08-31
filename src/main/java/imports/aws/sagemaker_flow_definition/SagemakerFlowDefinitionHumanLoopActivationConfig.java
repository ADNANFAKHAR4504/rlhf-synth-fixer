package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.325Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopActivationConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFlowDefinitionHumanLoopActivationConfig.Jsii$Proxy.class)
public interface SagemakerFlowDefinitionHumanLoopActivationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * human_loop_activation_conditions_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_activation_conditions_config SagemakerFlowDefinition#human_loop_activation_conditions_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig getHumanLoopActivationConditionsConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFlowDefinitionHumanLoopActivationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFlowDefinitionHumanLoopActivationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFlowDefinitionHumanLoopActivationConfig> {
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig humanLoopActivationConditionsConfig;

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopActivationConfig#getHumanLoopActivationConditionsConfig}
         * @param humanLoopActivationConditionsConfig human_loop_activation_conditions_config block.
         *                                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_activation_conditions_config SagemakerFlowDefinition#human_loop_activation_conditions_config}
         * @return {@code this}
         */
        public Builder humanLoopActivationConditionsConfig(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig humanLoopActivationConditionsConfig) {
            this.humanLoopActivationConditionsConfig = humanLoopActivationConditionsConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFlowDefinitionHumanLoopActivationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFlowDefinitionHumanLoopActivationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFlowDefinitionHumanLoopActivationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFlowDefinitionHumanLoopActivationConfig {
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig humanLoopActivationConditionsConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.humanLoopActivationConditionsConfig = software.amazon.jsii.Kernel.get(this, "humanLoopActivationConditionsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.humanLoopActivationConditionsConfig = builder.humanLoopActivationConditionsConfig;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig getHumanLoopActivationConditionsConfig() {
            return this.humanLoopActivationConditionsConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHumanLoopActivationConditionsConfig() != null) {
                data.set("humanLoopActivationConditionsConfig", om.valueToTree(this.getHumanLoopActivationConditionsConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopActivationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFlowDefinitionHumanLoopActivationConfig.Jsii$Proxy that = (SagemakerFlowDefinitionHumanLoopActivationConfig.Jsii$Proxy) o;

            return this.humanLoopActivationConditionsConfig != null ? this.humanLoopActivationConditionsConfig.equals(that.humanLoopActivationConditionsConfig) : that.humanLoopActivationConditionsConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.humanLoopActivationConditionsConfig != null ? this.humanLoopActivationConditionsConfig.hashCode() : 0;
            return result;
        }
    }
}
