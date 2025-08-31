package imports.aws.accessanalyzer_archive_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerArchiveRule.AccessanalyzerArchiveRuleFilter")
@software.amazon.jsii.Jsii.Proxy(AccessanalyzerArchiveRuleFilter.Jsii$Proxy.class)
public interface AccessanalyzerArchiveRuleFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#criteria AccessanalyzerArchiveRule#criteria}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCriteria();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#contains AccessanalyzerArchiveRule#contains}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContains() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#eq AccessanalyzerArchiveRule#eq}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEq() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#exists AccessanalyzerArchiveRule#exists}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExists() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#neq AccessanalyzerArchiveRule#neq}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNeq() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccessanalyzerArchiveRuleFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccessanalyzerArchiveRuleFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccessanalyzerArchiveRuleFilter> {
        java.lang.String criteria;
        java.util.List<java.lang.String> contains;
        java.util.List<java.lang.String> eq;
        java.lang.String exists;
        java.util.List<java.lang.String> neq;

        /**
         * Sets the value of {@link AccessanalyzerArchiveRuleFilter#getCriteria}
         * @param criteria Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#criteria AccessanalyzerArchiveRule#criteria}. This parameter is required.
         * @return {@code this}
         */
        public Builder criteria(java.lang.String criteria) {
            this.criteria = criteria;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerArchiveRuleFilter#getContains}
         * @param contains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#contains AccessanalyzerArchiveRule#contains}.
         * @return {@code this}
         */
        public Builder contains(java.util.List<java.lang.String> contains) {
            this.contains = contains;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerArchiveRuleFilter#getEq}
         * @param eq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#eq AccessanalyzerArchiveRule#eq}.
         * @return {@code this}
         */
        public Builder eq(java.util.List<java.lang.String> eq) {
            this.eq = eq;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerArchiveRuleFilter#getExists}
         * @param exists Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#exists AccessanalyzerArchiveRule#exists}.
         * @return {@code this}
         */
        public Builder exists(java.lang.String exists) {
            this.exists = exists;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerArchiveRuleFilter#getNeq}
         * @param neq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_archive_rule#neq AccessanalyzerArchiveRule#neq}.
         * @return {@code this}
         */
        public Builder neq(java.util.List<java.lang.String> neq) {
            this.neq = neq;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AccessanalyzerArchiveRuleFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccessanalyzerArchiveRuleFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccessanalyzerArchiveRuleFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccessanalyzerArchiveRuleFilter {
        private final java.lang.String criteria;
        private final java.util.List<java.lang.String> contains;
        private final java.util.List<java.lang.String> eq;
        private final java.lang.String exists;
        private final java.util.List<java.lang.String> neq;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.criteria = software.amazon.jsii.Kernel.get(this, "criteria", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contains = software.amazon.jsii.Kernel.get(this, "contains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.eq = software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.exists = software.amazon.jsii.Kernel.get(this, "exists", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.neq = software.amazon.jsii.Kernel.get(this, "neq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.criteria = java.util.Objects.requireNonNull(builder.criteria, "criteria is required");
            this.contains = builder.contains;
            this.eq = builder.eq;
            this.exists = builder.exists;
            this.neq = builder.neq;
        }

        @Override
        public final java.lang.String getCriteria() {
            return this.criteria;
        }

        @Override
        public final java.util.List<java.lang.String> getContains() {
            return this.contains;
        }

        @Override
        public final java.util.List<java.lang.String> getEq() {
            return this.eq;
        }

        @Override
        public final java.lang.String getExists() {
            return this.exists;
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

            data.set("criteria", om.valueToTree(this.getCriteria()));
            if (this.getContains() != null) {
                data.set("contains", om.valueToTree(this.getContains()));
            }
            if (this.getEq() != null) {
                data.set("eq", om.valueToTree(this.getEq()));
            }
            if (this.getExists() != null) {
                data.set("exists", om.valueToTree(this.getExists()));
            }
            if (this.getNeq() != null) {
                data.set("neq", om.valueToTree(this.getNeq()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.accessanalyzerArchiveRule.AccessanalyzerArchiveRuleFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccessanalyzerArchiveRuleFilter.Jsii$Proxy that = (AccessanalyzerArchiveRuleFilter.Jsii$Proxy) o;

            if (!criteria.equals(that.criteria)) return false;
            if (this.contains != null ? !this.contains.equals(that.contains) : that.contains != null) return false;
            if (this.eq != null ? !this.eq.equals(that.eq) : that.eq != null) return false;
            if (this.exists != null ? !this.exists.equals(that.exists) : that.exists != null) return false;
            return this.neq != null ? this.neq.equals(that.neq) : that.neq == null;
        }

        @Override
        public final int hashCode() {
            int result = this.criteria.hashCode();
            result = 31 * result + (this.contains != null ? this.contains.hashCode() : 0);
            result = 31 * result + (this.eq != null ? this.eq.hashCode() : 0);
            result = 31 * result + (this.exists != null ? this.exists.hashCode() : 0);
            result = 31 * result + (this.neq != null ? this.neq.hashCode() : 0);
            return result;
        }
    }
}
