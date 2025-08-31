package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch.Jsii$Proxy.class)
public interface VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#contains VpclatticeListenerRule#contains}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContains() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch> {
        java.lang.String contains;
        java.lang.String exact;
        java.lang.String prefix;

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch#getContains}
         * @param contains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#contains VpclatticeListenerRule#contains}.
         * @return {@code this}
         */
        public Builder contains(java.lang.String contains) {
            this.contains = contains;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch#getExact}
         * @param exact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.
         * @return {@code this}
         */
        public Builder exact(java.lang.String exact) {
            this.exact = exact;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch {
        private final java.lang.String contains;
        private final java.lang.String exact;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contains = software.amazon.jsii.Kernel.get(this, "contains", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exact = software.amazon.jsii.Kernel.get(this, "exact", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contains = builder.contains;
            this.exact = builder.exact;
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.String getContains() {
            return this.contains;
        }

        @Override
        public final java.lang.String getExact() {
            return this.exact;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContains() != null) {
                data.set("contains", om.valueToTree(this.getContains()));
            }
            if (this.getExact() != null) {
                data.set("exact", om.valueToTree(this.getExact()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch.Jsii$Proxy that = (VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch.Jsii$Proxy) o;

            if (this.contains != null ? !this.contains.equals(that.contains) : that.contains != null) return false;
            if (this.exact != null ? !this.exact.equals(that.exact) : that.exact != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.contains != null ? this.contains.hashCode() : 0;
            result = 31 * result + (this.exact != null ? this.exact.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
