package imports.aws.data_aws_bedrockagent_agent_versions;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.483Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsBedrockagentAgentVersions.DataAwsBedrockagentAgentVersionsAgentVersionSummaries")
@software.amazon.jsii.Jsii.Proxy(DataAwsBedrockagentAgentVersionsAgentVersionSummaries.Jsii$Proxy.class)
public interface DataAwsBedrockagentAgentVersionsAgentVersionSummaries extends software.amazon.jsii.JsiiSerializable {

    /**
     * guardrail_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrockagent_agent_versions#guardrail_configuration DataAwsBedrockagentAgentVersions#guardrail_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGuardrailConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsBedrockagentAgentVersionsAgentVersionSummaries}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsBedrockagentAgentVersionsAgentVersionSummaries}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsBedrockagentAgentVersionsAgentVersionSummaries> {
        java.lang.Object guardrailConfiguration;

        /**
         * Sets the value of {@link DataAwsBedrockagentAgentVersionsAgentVersionSummaries#getGuardrailConfiguration}
         * @param guardrailConfiguration guardrail_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrockagent_agent_versions#guardrail_configuration DataAwsBedrockagentAgentVersions#guardrail_configuration}
         * @return {@code this}
         */
        public Builder guardrailConfiguration(com.hashicorp.cdktf.IResolvable guardrailConfiguration) {
            this.guardrailConfiguration = guardrailConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsBedrockagentAgentVersionsAgentVersionSummaries#getGuardrailConfiguration}
         * @param guardrailConfiguration guardrail_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/bedrockagent_agent_versions#guardrail_configuration DataAwsBedrockagentAgentVersions#guardrail_configuration}
         * @return {@code this}
         */
        public Builder guardrailConfiguration(java.util.List<? extends imports.aws.data_aws_bedrockagent_agent_versions.DataAwsBedrockagentAgentVersionsAgentVersionSummariesGuardrailConfiguration> guardrailConfiguration) {
            this.guardrailConfiguration = guardrailConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsBedrockagentAgentVersionsAgentVersionSummaries}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsBedrockagentAgentVersionsAgentVersionSummaries build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsBedrockagentAgentVersionsAgentVersionSummaries}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsBedrockagentAgentVersionsAgentVersionSummaries {
        private final java.lang.Object guardrailConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.guardrailConfiguration = software.amazon.jsii.Kernel.get(this, "guardrailConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.guardrailConfiguration = builder.guardrailConfiguration;
        }

        @Override
        public final java.lang.Object getGuardrailConfiguration() {
            return this.guardrailConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGuardrailConfiguration() != null) {
                data.set("guardrailConfiguration", om.valueToTree(this.getGuardrailConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsBedrockagentAgentVersions.DataAwsBedrockagentAgentVersionsAgentVersionSummaries"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsBedrockagentAgentVersionsAgentVersionSummaries.Jsii$Proxy that = (DataAwsBedrockagentAgentVersionsAgentVersionSummaries.Jsii$Proxy) o;

            return this.guardrailConfiguration != null ? this.guardrailConfiguration.equals(that.guardrailConfiguration) : that.guardrailConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.guardrailConfiguration != null ? this.guardrailConfiguration.hashCode() : 0;
            return result;
        }
    }
}
