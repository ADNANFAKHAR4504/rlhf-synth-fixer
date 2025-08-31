package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatch")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleMatchHttpMatchPathMatch.Jsii$Proxy.class)
public interface VpclatticeListenerRuleMatchHttpMatchPathMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch getMatch();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCaseSensitive() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleMatchHttpMatchPathMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleMatchHttpMatchPathMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleMatchHttpMatchPathMatch> {
        imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch match;
        java.lang.Object caseSensitive;

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatchPathMatch#getMatch}
         * @param match match block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
         * @return {@code this}
         */
        public Builder match(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch match) {
            this.match = match;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatchPathMatch#getCaseSensitive}
         * @param caseSensitive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.
         * @return {@code this}
         */
        public Builder caseSensitive(java.lang.Boolean caseSensitive) {
            this.caseSensitive = caseSensitive;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatchPathMatch#getCaseSensitive}
         * @param caseSensitive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.
         * @return {@code this}
         */
        public Builder caseSensitive(com.hashicorp.cdktf.IResolvable caseSensitive) {
            this.caseSensitive = caseSensitive;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleMatchHttpMatchPathMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleMatchHttpMatchPathMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleMatchHttpMatchPathMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleMatchHttpMatchPathMatch {
        private final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch match;
        private final java.lang.Object caseSensitive;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.match = software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch.class));
            this.caseSensitive = software.amazon.jsii.Kernel.get(this, "caseSensitive", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.match = java.util.Objects.requireNonNull(builder.match, "match is required");
            this.caseSensitive = builder.caseSensitive;
        }

        @Override
        public final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch getMatch() {
            return this.match;
        }

        @Override
        public final java.lang.Object getCaseSensitive() {
            return this.caseSensitive;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("match", om.valueToTree(this.getMatch()));
            if (this.getCaseSensitive() != null) {
                data.set("caseSensitive", om.valueToTree(this.getCaseSensitive()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleMatchHttpMatchPathMatch.Jsii$Proxy that = (VpclatticeListenerRuleMatchHttpMatchPathMatch.Jsii$Proxy) o;

            if (!match.equals(that.match)) return false;
            return this.caseSensitive != null ? this.caseSensitive.equals(that.caseSensitive) : that.caseSensitive == null;
        }

        @Override
        public final int hashCode() {
            int result = this.match.hashCode();
            result = 31 * result + (this.caseSensitive != null ? this.caseSensitive.hashCode() : 0);
            return result;
        }
    }
}
