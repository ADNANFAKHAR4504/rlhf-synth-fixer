package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupActionGroupExecutor")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupActionGroupExecutor.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupActionGroupExecutor extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#custom_control BedrockagentAgentActionGroup#custom_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#lambda BedrockagentAgentActionGroup#lambda}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLambda() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupActionGroupExecutor}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupActionGroupExecutor}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupActionGroupExecutor> {
        java.lang.String customControl;
        java.lang.String lambda;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupActionGroupExecutor#getCustomControl}
         * @param customControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#custom_control BedrockagentAgentActionGroup#custom_control}.
         * @return {@code this}
         */
        public Builder customControl(java.lang.String customControl) {
            this.customControl = customControl;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupActionGroupExecutor#getLambda}
         * @param lambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#lambda BedrockagentAgentActionGroup#lambda}.
         * @return {@code this}
         */
        public Builder lambda(java.lang.String lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentActionGroupActionGroupExecutor}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupActionGroupExecutor build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupActionGroupExecutor}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupActionGroupExecutor {
        private final java.lang.String customControl;
        private final java.lang.String lambda;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customControl = software.amazon.jsii.Kernel.get(this, "customControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambda = software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customControl = builder.customControl;
            this.lambda = builder.lambda;
        }

        @Override
        public final java.lang.String getCustomControl() {
            return this.customControl;
        }

        @Override
        public final java.lang.String getLambda() {
            return this.lambda;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomControl() != null) {
                data.set("customControl", om.valueToTree(this.getCustomControl()));
            }
            if (this.getLambda() != null) {
                data.set("lambda", om.valueToTree(this.getLambda()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupActionGroupExecutor"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupActionGroupExecutor.Jsii$Proxy that = (BedrockagentAgentActionGroupActionGroupExecutor.Jsii$Proxy) o;

            if (this.customControl != null ? !this.customControl.equals(that.customControl) : that.customControl != null) return false;
            return this.lambda != null ? this.lambda.equals(that.lambda) : that.lambda == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customControl != null ? this.customControl.hashCode() : 0;
            result = 31 * result + (this.lambda != null ? this.lambda.hashCode() : 0);
            return result;
        }
    }
}
