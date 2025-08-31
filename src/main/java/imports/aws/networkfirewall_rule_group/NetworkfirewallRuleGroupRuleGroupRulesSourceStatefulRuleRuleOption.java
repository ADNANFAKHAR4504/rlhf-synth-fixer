package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#keyword NetworkfirewallRuleGroup#keyword}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#settings NetworkfirewallRuleGroup#settings}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption> {
        java.lang.String keyword;
        java.util.List<java.lang.String> settings;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption#getKeyword}
         * @param keyword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#keyword NetworkfirewallRuleGroup#keyword}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyword(java.lang.String keyword) {
            this.keyword = keyword;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption#getSettings}
         * @param settings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#settings NetworkfirewallRuleGroup#settings}.
         * @return {@code this}
         */
        public Builder settings(java.util.List<java.lang.String> settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption {
        private final java.lang.String keyword;
        private final java.util.List<java.lang.String> settings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.keyword = software.amazon.jsii.Kernel.get(this, "keyword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.settings = software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.keyword = java.util.Objects.requireNonNull(builder.keyword, "keyword is required");
            this.settings = builder.settings;
        }

        @Override
        public final java.lang.String getKeyword() {
            return this.keyword;
        }

        @Override
        public final java.util.List<java.lang.String> getSettings() {
            return this.settings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("keyword", om.valueToTree(this.getKeyword()));
            if (this.getSettings() != null) {
                data.set("settings", om.valueToTree(this.getSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption.Jsii$Proxy) o;

            if (!keyword.equals(that.keyword)) return false;
            return this.settings != null ? this.settings.equals(that.settings) : that.settings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.keyword.hashCode();
            result = 31 * result + (this.settings != null ? this.settings.hashCode() : 0);
            return result;
        }
    }
}
