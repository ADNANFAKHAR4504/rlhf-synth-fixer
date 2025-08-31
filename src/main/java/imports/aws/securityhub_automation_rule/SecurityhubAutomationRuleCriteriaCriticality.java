package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.378Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCriticality")
@software.amazon.jsii.Jsii.Proxy(SecurityhubAutomationRuleCriteriaCriticality.Jsii$Proxy.class)
public interface SecurityhubAutomationRuleCriteriaCriticality extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#eq SecurityhubAutomationRule#eq}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getEq() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gt SecurityhubAutomationRule#gt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getGt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gte SecurityhubAutomationRule#gte}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getGte() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lt SecurityhubAutomationRule#lt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lte SecurityhubAutomationRule#lte}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLte() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubAutomationRuleCriteriaCriticality}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubAutomationRuleCriteriaCriticality}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubAutomationRuleCriteriaCriticality> {
        java.lang.Number eq;
        java.lang.Number gt;
        java.lang.Number gte;
        java.lang.Number lt;
        java.lang.Number lte;

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaCriticality#getEq}
         * @param eq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#eq SecurityhubAutomationRule#eq}.
         * @return {@code this}
         */
        public Builder eq(java.lang.Number eq) {
            this.eq = eq;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaCriticality#getGt}
         * @param gt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gt SecurityhubAutomationRule#gt}.
         * @return {@code this}
         */
        public Builder gt(java.lang.Number gt) {
            this.gt = gt;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaCriticality#getGte}
         * @param gte Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gte SecurityhubAutomationRule#gte}.
         * @return {@code this}
         */
        public Builder gte(java.lang.Number gte) {
            this.gte = gte;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaCriticality#getLt}
         * @param lt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lt SecurityhubAutomationRule#lt}.
         * @return {@code this}
         */
        public Builder lt(java.lang.Number lt) {
            this.lt = lt;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaCriticality#getLte}
         * @param lte Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lte SecurityhubAutomationRule#lte}.
         * @return {@code this}
         */
        public Builder lte(java.lang.Number lte) {
            this.lte = lte;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubAutomationRuleCriteriaCriticality}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubAutomationRuleCriteriaCriticality build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubAutomationRuleCriteriaCriticality}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubAutomationRuleCriteriaCriticality {
        private final java.lang.Number eq;
        private final java.lang.Number gt;
        private final java.lang.Number gte;
        private final java.lang.Number lt;
        private final java.lang.Number lte;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eq = software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.gt = software.amazon.jsii.Kernel.get(this, "gt", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.gte = software.amazon.jsii.Kernel.get(this, "gte", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.lt = software.amazon.jsii.Kernel.get(this, "lt", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.lte = software.amazon.jsii.Kernel.get(this, "lte", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eq = builder.eq;
            this.gt = builder.gt;
            this.gte = builder.gte;
            this.lt = builder.lt;
            this.lte = builder.lte;
        }

        @Override
        public final java.lang.Number getEq() {
            return this.eq;
        }

        @Override
        public final java.lang.Number getGt() {
            return this.gt;
        }

        @Override
        public final java.lang.Number getGte() {
            return this.gte;
        }

        @Override
        public final java.lang.Number getLt() {
            return this.lt;
        }

        @Override
        public final java.lang.Number getLte() {
            return this.lte;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEq() != null) {
                data.set("eq", om.valueToTree(this.getEq()));
            }
            if (this.getGt() != null) {
                data.set("gt", om.valueToTree(this.getGt()));
            }
            if (this.getGte() != null) {
                data.set("gte", om.valueToTree(this.getGte()));
            }
            if (this.getLt() != null) {
                data.set("lt", om.valueToTree(this.getLt()));
            }
            if (this.getLte() != null) {
                data.set("lte", om.valueToTree(this.getLte()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCriticality"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubAutomationRuleCriteriaCriticality.Jsii$Proxy that = (SecurityhubAutomationRuleCriteriaCriticality.Jsii$Proxy) o;

            if (this.eq != null ? !this.eq.equals(that.eq) : that.eq != null) return false;
            if (this.gt != null ? !this.gt.equals(that.gt) : that.gt != null) return false;
            if (this.gte != null ? !this.gte.equals(that.gte) : that.gte != null) return false;
            if (this.lt != null ? !this.lt.equals(that.lt) : that.lt != null) return false;
            return this.lte != null ? this.lte.equals(that.lte) : that.lte == null;
        }

        @Override
        public final int hashCode() {
            int result = this.eq != null ? this.eq.hashCode() : 0;
            result = 31 * result + (this.gt != null ? this.gt.hashCode() : 0);
            result = 31 * result + (this.gte != null ? this.gte.hashCode() : 0);
            result = 31 * result + (this.lt != null ? this.lt.hashCode() : 0);
            result = 31 * result + (this.lte != null ? this.lte.hashCode() : 0);
            return result;
        }
    }
}
