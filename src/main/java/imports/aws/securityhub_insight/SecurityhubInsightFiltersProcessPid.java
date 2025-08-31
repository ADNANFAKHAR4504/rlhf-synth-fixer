package imports.aws.securityhub_insight;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.405Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubInsight.SecurityhubInsightFiltersProcessPid")
@software.amazon.jsii.Jsii.Proxy(SecurityhubInsightFiltersProcessPid.Jsii$Proxy.class)
public interface SecurityhubInsightFiltersProcessPid extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#eq SecurityhubInsight#eq}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEq() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#gte SecurityhubInsight#gte}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGte() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#lte SecurityhubInsight#lte}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLte() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubInsightFiltersProcessPid}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubInsightFiltersProcessPid}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubInsightFiltersProcessPid> {
        java.lang.String eq;
        java.lang.String gte;
        java.lang.String lte;

        /**
         * Sets the value of {@link SecurityhubInsightFiltersProcessPid#getEq}
         * @param eq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#eq SecurityhubInsight#eq}.
         * @return {@code this}
         */
        public Builder eq(java.lang.String eq) {
            this.eq = eq;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubInsightFiltersProcessPid#getGte}
         * @param gte Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#gte SecurityhubInsight#gte}.
         * @return {@code this}
         */
        public Builder gte(java.lang.String gte) {
            this.gte = gte;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubInsightFiltersProcessPid#getLte}
         * @param lte Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#lte SecurityhubInsight#lte}.
         * @return {@code this}
         */
        public Builder lte(java.lang.String lte) {
            this.lte = lte;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubInsightFiltersProcessPid}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubInsightFiltersProcessPid build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubInsightFiltersProcessPid}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubInsightFiltersProcessPid {
        private final java.lang.String eq;
        private final java.lang.String gte;
        private final java.lang.String lte;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eq = software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gte = software.amazon.jsii.Kernel.get(this, "gte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lte = software.amazon.jsii.Kernel.get(this, "lte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eq = builder.eq;
            this.gte = builder.gte;
            this.lte = builder.lte;
        }

        @Override
        public final java.lang.String getEq() {
            return this.eq;
        }

        @Override
        public final java.lang.String getGte() {
            return this.gte;
        }

        @Override
        public final java.lang.String getLte() {
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
            if (this.getGte() != null) {
                data.set("gte", om.valueToTree(this.getGte()));
            }
            if (this.getLte() != null) {
                data.set("lte", om.valueToTree(this.getLte()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubInsight.SecurityhubInsightFiltersProcessPid"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubInsightFiltersProcessPid.Jsii$Proxy that = (SecurityhubInsightFiltersProcessPid.Jsii$Proxy) o;

            if (this.eq != null ? !this.eq.equals(that.eq) : that.eq != null) return false;
            if (this.gte != null ? !this.gte.equals(that.gte) : that.gte != null) return false;
            return this.lte != null ? this.lte.equals(that.lte) : that.lte == null;
        }

        @Override
        public final int hashCode() {
            int result = this.eq != null ? this.eq.hashCode() : 0;
            result = 31 * result + (this.gte != null ? this.gte.hashCode() : 0);
            result = 31 * result + (this.lte != null ? this.lte.hashCode() : 0);
            return result;
        }
    }
}
