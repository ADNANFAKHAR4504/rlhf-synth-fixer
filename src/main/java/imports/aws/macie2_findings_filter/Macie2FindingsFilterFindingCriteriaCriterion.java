package imports.aws.macie2_findings_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.855Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2FindingsFilter.Macie2FindingsFilterFindingCriteriaCriterion")
@software.amazon.jsii.Jsii.Proxy(Macie2FindingsFilterFindingCriteriaCriterion.Jsii$Proxy.class)
public interface Macie2FindingsFilterFindingCriteriaCriterion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#field Macie2FindingsFilter#field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#eq Macie2FindingsFilter#eq}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEq() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#eq_exact_match Macie2FindingsFilter#eq_exact_match}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqExactMatch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#gt Macie2FindingsFilter#gt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#gte Macie2FindingsFilter#gte}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGte() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#lt Macie2FindingsFilter#lt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#lte Macie2FindingsFilter#lte}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLte() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#neq Macie2FindingsFilter#neq}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNeq() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2FindingsFilterFindingCriteriaCriterion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2FindingsFilterFindingCriteriaCriterion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2FindingsFilterFindingCriteriaCriterion> {
        java.lang.String field;
        java.util.List<java.lang.String> eq;
        java.util.List<java.lang.String> eqExactMatch;
        java.lang.String gt;
        java.lang.String gte;
        java.lang.String lt;
        java.lang.String lte;
        java.util.List<java.lang.String> neq;

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getField}
         * @param field Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#field Macie2FindingsFilter#field}. This parameter is required.
         * @return {@code this}
         */
        public Builder field(java.lang.String field) {
            this.field = field;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getEq}
         * @param eq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#eq Macie2FindingsFilter#eq}.
         * @return {@code this}
         */
        public Builder eq(java.util.List<java.lang.String> eq) {
            this.eq = eq;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getEqExactMatch}
         * @param eqExactMatch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#eq_exact_match Macie2FindingsFilter#eq_exact_match}.
         * @return {@code this}
         */
        public Builder eqExactMatch(java.util.List<java.lang.String> eqExactMatch) {
            this.eqExactMatch = eqExactMatch;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getGt}
         * @param gt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#gt Macie2FindingsFilter#gt}.
         * @return {@code this}
         */
        public Builder gt(java.lang.String gt) {
            this.gt = gt;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getGte}
         * @param gte Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#gte Macie2FindingsFilter#gte}.
         * @return {@code this}
         */
        public Builder gte(java.lang.String gte) {
            this.gte = gte;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getLt}
         * @param lt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#lt Macie2FindingsFilter#lt}.
         * @return {@code this}
         */
        public Builder lt(java.lang.String lt) {
            this.lt = lt;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getLte}
         * @param lte Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#lte Macie2FindingsFilter#lte}.
         * @return {@code this}
         */
        public Builder lte(java.lang.String lte) {
            this.lte = lte;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteriaCriterion#getNeq}
         * @param neq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#neq Macie2FindingsFilter#neq}.
         * @return {@code this}
         */
        public Builder neq(java.util.List<java.lang.String> neq) {
            this.neq = neq;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2FindingsFilterFindingCriteriaCriterion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2FindingsFilterFindingCriteriaCriterion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2FindingsFilterFindingCriteriaCriterion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2FindingsFilterFindingCriteriaCriterion {
        private final java.lang.String field;
        private final java.util.List<java.lang.String> eq;
        private final java.util.List<java.lang.String> eqExactMatch;
        private final java.lang.String gt;
        private final java.lang.String gte;
        private final java.lang.String lt;
        private final java.lang.String lte;
        private final java.util.List<java.lang.String> neq;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.field = software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eq = software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.eqExactMatch = software.amazon.jsii.Kernel.get(this, "eqExactMatch", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.gt = software.amazon.jsii.Kernel.get(this, "gt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gte = software.amazon.jsii.Kernel.get(this, "gte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lt = software.amazon.jsii.Kernel.get(this, "lt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lte = software.amazon.jsii.Kernel.get(this, "lte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.neq = software.amazon.jsii.Kernel.get(this, "neq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.field = java.util.Objects.requireNonNull(builder.field, "field is required");
            this.eq = builder.eq;
            this.eqExactMatch = builder.eqExactMatch;
            this.gt = builder.gt;
            this.gte = builder.gte;
            this.lt = builder.lt;
            this.lte = builder.lte;
            this.neq = builder.neq;
        }

        @Override
        public final java.lang.String getField() {
            return this.field;
        }

        @Override
        public final java.util.List<java.lang.String> getEq() {
            return this.eq;
        }

        @Override
        public final java.util.List<java.lang.String> getEqExactMatch() {
            return this.eqExactMatch;
        }

        @Override
        public final java.lang.String getGt() {
            return this.gt;
        }

        @Override
        public final java.lang.String getGte() {
            return this.gte;
        }

        @Override
        public final java.lang.String getLt() {
            return this.lt;
        }

        @Override
        public final java.lang.String getLte() {
            return this.lte;
        }

        @Override
        public final java.util.List<java.lang.String> getNeq() {
            return this.neq;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("field", om.valueToTree(this.getField()));
            if (this.getEq() != null) {
                data.set("eq", om.valueToTree(this.getEq()));
            }
            if (this.getEqExactMatch() != null) {
                data.set("eqExactMatch", om.valueToTree(this.getEqExactMatch()));
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
            if (this.getNeq() != null) {
                data.set("neq", om.valueToTree(this.getNeq()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2FindingsFilter.Macie2FindingsFilterFindingCriteriaCriterion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2FindingsFilterFindingCriteriaCriterion.Jsii$Proxy that = (Macie2FindingsFilterFindingCriteriaCriterion.Jsii$Proxy) o;

            if (!field.equals(that.field)) return false;
            if (this.eq != null ? !this.eq.equals(that.eq) : that.eq != null) return false;
            if (this.eqExactMatch != null ? !this.eqExactMatch.equals(that.eqExactMatch) : that.eqExactMatch != null) return false;
            if (this.gt != null ? !this.gt.equals(that.gt) : that.gt != null) return false;
            if (this.gte != null ? !this.gte.equals(that.gte) : that.gte != null) return false;
            if (this.lt != null ? !this.lt.equals(that.lt) : that.lt != null) return false;
            if (this.lte != null ? !this.lte.equals(that.lte) : that.lte != null) return false;
            return this.neq != null ? this.neq.equals(that.neq) : that.neq == null;
        }

        @Override
        public final int hashCode() {
            int result = this.field.hashCode();
            result = 31 * result + (this.eq != null ? this.eq.hashCode() : 0);
            result = 31 * result + (this.eqExactMatch != null ? this.eqExactMatch.hashCode() : 0);
            result = 31 * result + (this.gt != null ? this.gt.hashCode() : 0);
            result = 31 * result + (this.gte != null ? this.gte.hashCode() : 0);
            result = 31 * result + (this.lt != null ? this.lt.hashCode() : 0);
            result = 31 * result + (this.lte != null ? this.lte.hashCode() : 0);
            result = 31 * result + (this.neq != null ? this.neq.hashCode() : 0);
            return result;
        }
    }
}
