package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleOverrideAction")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclRuleOverrideAction.Jsii$Proxy.class)
public interface Wafv2WebAclRuleOverrideAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionCount getCount() {
        return null;
    }

    /**
     * none block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#none Wafv2WebAcl#none}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionNone getNone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclRuleOverrideAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclRuleOverrideAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclRuleOverrideAction> {
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionCount count;
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionNone none;

        /**
         * Sets the value of {@link Wafv2WebAclRuleOverrideAction#getCount}
         * @param count count block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#count Wafv2WebAcl#count}
         * @return {@code this}
         */
        public Builder count(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclRuleOverrideAction#getNone}
         * @param none none block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#none Wafv2WebAcl#none}
         * @return {@code this}
         */
        public Builder none(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionNone none) {
            this.none = none;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclRuleOverrideAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclRuleOverrideAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclRuleOverrideAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclRuleOverrideAction {
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionCount count;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionNone none;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionCount.class));
            this.none = software.amazon.jsii.Kernel.get(this, "none", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionNone.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.count = builder.count;
            this.none = builder.none;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionCount getCount() {
            return this.count;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionNone getNone() {
            return this.none;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getNone() != null) {
                data.set("none", om.valueToTree(this.getNone()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclRuleOverrideAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclRuleOverrideAction.Jsii$Proxy that = (Wafv2WebAclRuleOverrideAction.Jsii$Proxy) o;

            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            return this.none != null ? this.none.equals(that.none) : that.none == null;
        }

        @Override
        public final int hashCode() {
            int result = this.count != null ? this.count.hashCode() : 0;
            result = 31 * result + (this.none != null ? this.none.hashCode() : 0);
            return result;
        }
    }
}
