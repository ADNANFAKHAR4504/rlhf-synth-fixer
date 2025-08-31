package imports.aws.macie2_findings_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.855Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2FindingsFilter.Macie2FindingsFilterFindingCriteria")
@software.amazon.jsii.Jsii.Proxy(Macie2FindingsFilterFindingCriteria.Jsii$Proxy.class)
public interface Macie2FindingsFilterFindingCriteria extends software.amazon.jsii.JsiiSerializable {

    /**
     * criterion block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#criterion Macie2FindingsFilter#criterion}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCriterion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2FindingsFilterFindingCriteria}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2FindingsFilterFindingCriteria}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2FindingsFilterFindingCriteria> {
        java.lang.Object criterion;

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteria#getCriterion}
         * @param criterion criterion block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#criterion Macie2FindingsFilter#criterion}
         * @return {@code this}
         */
        public Builder criterion(com.hashicorp.cdktf.IResolvable criterion) {
            this.criterion = criterion;
            return this;
        }

        /**
         * Sets the value of {@link Macie2FindingsFilterFindingCriteria#getCriterion}
         * @param criterion criterion block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_findings_filter#criterion Macie2FindingsFilter#criterion}
         * @return {@code this}
         */
        public Builder criterion(java.util.List<? extends imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterion> criterion) {
            this.criterion = criterion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2FindingsFilterFindingCriteria}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2FindingsFilterFindingCriteria build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2FindingsFilterFindingCriteria}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2FindingsFilterFindingCriteria {
        private final java.lang.Object criterion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.criterion = software.amazon.jsii.Kernel.get(this, "criterion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.criterion = builder.criterion;
        }

        @Override
        public final java.lang.Object getCriterion() {
            return this.criterion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCriterion() != null) {
                data.set("criterion", om.valueToTree(this.getCriterion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2FindingsFilter.Macie2FindingsFilterFindingCriteria"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2FindingsFilterFindingCriteria.Jsii$Proxy that = (Macie2FindingsFilterFindingCriteria.Jsii$Proxy) o;

            return this.criterion != null ? this.criterion.equals(that.criterion) : that.criterion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.criterion != null ? this.criterion.hashCode() : 0;
            return result;
        }
    }
}
