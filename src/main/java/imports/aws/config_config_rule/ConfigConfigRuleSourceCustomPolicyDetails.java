package imports.aws.config_config_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigRule.ConfigConfigRuleSourceCustomPolicyDetails")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigRuleSourceCustomPolicyDetails.Jsii$Proxy.class)
public interface ConfigConfigRuleSourceCustomPolicyDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#policy_runtime ConfigConfigRule#policy_runtime}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyRuntime();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#policy_text ConfigConfigRule#policy_text}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyText();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#enable_debug_log_delivery ConfigConfigRule#enable_debug_log_delivery}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDebugLogDelivery() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigRuleSourceCustomPolicyDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigRuleSourceCustomPolicyDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigRuleSourceCustomPolicyDetails> {
        java.lang.String policyRuntime;
        java.lang.String policyText;
        java.lang.Object enableDebugLogDelivery;

        /**
         * Sets the value of {@link ConfigConfigRuleSourceCustomPolicyDetails#getPolicyRuntime}
         * @param policyRuntime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#policy_runtime ConfigConfigRule#policy_runtime}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyRuntime(java.lang.String policyRuntime) {
            this.policyRuntime = policyRuntime;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigRuleSourceCustomPolicyDetails#getPolicyText}
         * @param policyText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#policy_text ConfigConfigRule#policy_text}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyText(java.lang.String policyText) {
            this.policyText = policyText;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigRuleSourceCustomPolicyDetails#getEnableDebugLogDelivery}
         * @param enableDebugLogDelivery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#enable_debug_log_delivery ConfigConfigRule#enable_debug_log_delivery}.
         * @return {@code this}
         */
        public Builder enableDebugLogDelivery(java.lang.Boolean enableDebugLogDelivery) {
            this.enableDebugLogDelivery = enableDebugLogDelivery;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigRuleSourceCustomPolicyDetails#getEnableDebugLogDelivery}
         * @param enableDebugLogDelivery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_config_rule#enable_debug_log_delivery ConfigConfigRule#enable_debug_log_delivery}.
         * @return {@code this}
         */
        public Builder enableDebugLogDelivery(com.hashicorp.cdktf.IResolvable enableDebugLogDelivery) {
            this.enableDebugLogDelivery = enableDebugLogDelivery;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigRuleSourceCustomPolicyDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigRuleSourceCustomPolicyDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigRuleSourceCustomPolicyDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigRuleSourceCustomPolicyDetails {
        private final java.lang.String policyRuntime;
        private final java.lang.String policyText;
        private final java.lang.Object enableDebugLogDelivery;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.policyRuntime = software.amazon.jsii.Kernel.get(this, "policyRuntime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyText = software.amazon.jsii.Kernel.get(this, "policyText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableDebugLogDelivery = software.amazon.jsii.Kernel.get(this, "enableDebugLogDelivery", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.policyRuntime = java.util.Objects.requireNonNull(builder.policyRuntime, "policyRuntime is required");
            this.policyText = java.util.Objects.requireNonNull(builder.policyText, "policyText is required");
            this.enableDebugLogDelivery = builder.enableDebugLogDelivery;
        }

        @Override
        public final java.lang.String getPolicyRuntime() {
            return this.policyRuntime;
        }

        @Override
        public final java.lang.String getPolicyText() {
            return this.policyText;
        }

        @Override
        public final java.lang.Object getEnableDebugLogDelivery() {
            return this.enableDebugLogDelivery;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("policyRuntime", om.valueToTree(this.getPolicyRuntime()));
            data.set("policyText", om.valueToTree(this.getPolicyText()));
            if (this.getEnableDebugLogDelivery() != null) {
                data.set("enableDebugLogDelivery", om.valueToTree(this.getEnableDebugLogDelivery()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigRule.ConfigConfigRuleSourceCustomPolicyDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigRuleSourceCustomPolicyDetails.Jsii$Proxy that = (ConfigConfigRuleSourceCustomPolicyDetails.Jsii$Proxy) o;

            if (!policyRuntime.equals(that.policyRuntime)) return false;
            if (!policyText.equals(that.policyText)) return false;
            return this.enableDebugLogDelivery != null ? this.enableDebugLogDelivery.equals(that.enableDebugLogDelivery) : that.enableDebugLogDelivery == null;
        }

        @Override
        public final int hashCode() {
            int result = this.policyRuntime.hashCode();
            result = 31 * result + (this.policyText.hashCode());
            result = 31 * result + (this.enableDebugLogDelivery != null ? this.enableDebugLogDelivery.hashCode() : 0);
            return result;
        }
    }
}
