package imports.aws.guardduty_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.317Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyFilter.GuarddutyFilterFindingCriteriaCriterion")
@software.amazon.jsii.Jsii.Proxy(GuarddutyFilterFindingCriteriaCriterion.Jsii$Proxy.class)
public interface GuarddutyFilterFindingCriteriaCriterion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#field GuarddutyFilter#field}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getField();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#equals GuarddutyFilter#equals}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqualTo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#greater_than GuarddutyFilter#greater_than}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGreaterThan() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#greater_than_or_equal GuarddutyFilter#greater_than_or_equal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGreaterThanOrEqual() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#less_than GuarddutyFilter#less_than}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLessThan() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#less_than_or_equal GuarddutyFilter#less_than_or_equal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLessThanOrEqual() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#not_equals GuarddutyFilter#not_equals}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotEquals() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GuarddutyFilterFindingCriteriaCriterion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyFilterFindingCriteriaCriterion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyFilterFindingCriteriaCriterion> {
        java.lang.String field;
        java.util.List<java.lang.String> equalTo;
        java.lang.String greaterThan;
        java.lang.String greaterThanOrEqual;
        java.lang.String lessThan;
        java.lang.String lessThanOrEqual;
        java.util.List<java.lang.String> notEquals;

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getField}
         * @param field Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#field GuarddutyFilter#field}. This parameter is required.
         * @return {@code this}
         */
        public Builder field(java.lang.String field) {
            this.field = field;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getEqualTo}
         * @param equalTo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#equals GuarddutyFilter#equals}.
         * @return {@code this}
         */
        public Builder equalTo(java.util.List<java.lang.String> equalTo) {
            this.equalTo = equalTo;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getGreaterThan}
         * @param greaterThan Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#greater_than GuarddutyFilter#greater_than}.
         * @return {@code this}
         */
        public Builder greaterThan(java.lang.String greaterThan) {
            this.greaterThan = greaterThan;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getGreaterThanOrEqual}
         * @param greaterThanOrEqual Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#greater_than_or_equal GuarddutyFilter#greater_than_or_equal}.
         * @return {@code this}
         */
        public Builder greaterThanOrEqual(java.lang.String greaterThanOrEqual) {
            this.greaterThanOrEqual = greaterThanOrEqual;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getLessThan}
         * @param lessThan Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#less_than GuarddutyFilter#less_than}.
         * @return {@code this}
         */
        public Builder lessThan(java.lang.String lessThan) {
            this.lessThan = lessThan;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getLessThanOrEqual}
         * @param lessThanOrEqual Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#less_than_or_equal GuarddutyFilter#less_than_or_equal}.
         * @return {@code this}
         */
        public Builder lessThanOrEqual(java.lang.String lessThanOrEqual) {
            this.lessThanOrEqual = lessThanOrEqual;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteriaCriterion#getNotEquals}
         * @param notEquals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#not_equals GuarddutyFilter#not_equals}.
         * @return {@code this}
         */
        public Builder notEquals(java.util.List<java.lang.String> notEquals) {
            this.notEquals = notEquals;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyFilterFindingCriteriaCriterion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyFilterFindingCriteriaCriterion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyFilterFindingCriteriaCriterion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyFilterFindingCriteriaCriterion {
        private final java.lang.String field;
        private final java.util.List<java.lang.String> equalTo;
        private final java.lang.String greaterThan;
        private final java.lang.String greaterThanOrEqual;
        private final java.lang.String lessThan;
        private final java.lang.String lessThanOrEqual;
        private final java.util.List<java.lang.String> notEquals;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.field = software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.equalTo = software.amazon.jsii.Kernel.get(this, "equalTo", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.greaterThan = software.amazon.jsii.Kernel.get(this, "greaterThan", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.greaterThanOrEqual = software.amazon.jsii.Kernel.get(this, "greaterThanOrEqual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lessThan = software.amazon.jsii.Kernel.get(this, "lessThan", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lessThanOrEqual = software.amazon.jsii.Kernel.get(this, "lessThanOrEqual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notEquals = software.amazon.jsii.Kernel.get(this, "notEquals", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.field = java.util.Objects.requireNonNull(builder.field, "field is required");
            this.equalTo = builder.equalTo;
            this.greaterThan = builder.greaterThan;
            this.greaterThanOrEqual = builder.greaterThanOrEqual;
            this.lessThan = builder.lessThan;
            this.lessThanOrEqual = builder.lessThanOrEqual;
            this.notEquals = builder.notEquals;
        }

        @Override
        public final java.lang.String getField() {
            return this.field;
        }

        @Override
        public final java.util.List<java.lang.String> getEqualTo() {
            return this.equalTo;
        }

        @Override
        public final java.lang.String getGreaterThan() {
            return this.greaterThan;
        }

        @Override
        public final java.lang.String getGreaterThanOrEqual() {
            return this.greaterThanOrEqual;
        }

        @Override
        public final java.lang.String getLessThan() {
            return this.lessThan;
        }

        @Override
        public final java.lang.String getLessThanOrEqual() {
            return this.lessThanOrEqual;
        }

        @Override
        public final java.util.List<java.lang.String> getNotEquals() {
            return this.notEquals;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("field", om.valueToTree(this.getField()));
            if (this.getEqualTo() != null) {
                data.set("equalTo", om.valueToTree(this.getEqualTo()));
            }
            if (this.getGreaterThan() != null) {
                data.set("greaterThan", om.valueToTree(this.getGreaterThan()));
            }
            if (this.getGreaterThanOrEqual() != null) {
                data.set("greaterThanOrEqual", om.valueToTree(this.getGreaterThanOrEqual()));
            }
            if (this.getLessThan() != null) {
                data.set("lessThan", om.valueToTree(this.getLessThan()));
            }
            if (this.getLessThanOrEqual() != null) {
                data.set("lessThanOrEqual", om.valueToTree(this.getLessThanOrEqual()));
            }
            if (this.getNotEquals() != null) {
                data.set("notEquals", om.valueToTree(this.getNotEquals()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyFilter.GuarddutyFilterFindingCriteriaCriterion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyFilterFindingCriteriaCriterion.Jsii$Proxy that = (GuarddutyFilterFindingCriteriaCriterion.Jsii$Proxy) o;

            if (!field.equals(that.field)) return false;
            if (this.equalTo != null ? !this.equalTo.equals(that.equalTo) : that.equalTo != null) return false;
            if (this.greaterThan != null ? !this.greaterThan.equals(that.greaterThan) : that.greaterThan != null) return false;
            if (this.greaterThanOrEqual != null ? !this.greaterThanOrEqual.equals(that.greaterThanOrEqual) : that.greaterThanOrEqual != null) return false;
            if (this.lessThan != null ? !this.lessThan.equals(that.lessThan) : that.lessThan != null) return false;
            if (this.lessThanOrEqual != null ? !this.lessThanOrEqual.equals(that.lessThanOrEqual) : that.lessThanOrEqual != null) return false;
            return this.notEquals != null ? this.notEquals.equals(that.notEquals) : that.notEquals == null;
        }

        @Override
        public final int hashCode() {
            int result = this.field.hashCode();
            result = 31 * result + (this.equalTo != null ? this.equalTo.hashCode() : 0);
            result = 31 * result + (this.greaterThan != null ? this.greaterThan.hashCode() : 0);
            result = 31 * result + (this.greaterThanOrEqual != null ? this.greaterThanOrEqual.hashCode() : 0);
            result = 31 * result + (this.lessThan != null ? this.lessThan.hashCode() : 0);
            result = 31 * result + (this.lessThanOrEqual != null ? this.lessThanOrEqual.hashCode() : 0);
            result = 31 * result + (this.notEquals != null ? this.notEquals.hashCode() : 0);
            return result;
        }
    }
}
