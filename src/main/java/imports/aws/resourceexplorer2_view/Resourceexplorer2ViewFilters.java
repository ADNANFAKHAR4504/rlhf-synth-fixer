package imports.aws.resourceexplorer2_view;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resourceexplorer2View.Resourceexplorer2ViewFilters")
@software.amazon.jsii.Jsii.Proxy(Resourceexplorer2ViewFilters.Jsii$Proxy.class)
public interface Resourceexplorer2ViewFilters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourceexplorer2_view#filter_string Resourceexplorer2View#filter_string}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFilterString();

    /**
     * @return a {@link Builder} of {@link Resourceexplorer2ViewFilters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Resourceexplorer2ViewFilters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Resourceexplorer2ViewFilters> {
        java.lang.String filterString;

        /**
         * Sets the value of {@link Resourceexplorer2ViewFilters#getFilterString}
         * @param filterString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourceexplorer2_view#filter_string Resourceexplorer2View#filter_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder filterString(java.lang.String filterString) {
            this.filterString = filterString;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Resourceexplorer2ViewFilters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Resourceexplorer2ViewFilters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Resourceexplorer2ViewFilters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Resourceexplorer2ViewFilters {
        private final java.lang.String filterString;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.filterString = software.amazon.jsii.Kernel.get(this, "filterString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.filterString = java.util.Objects.requireNonNull(builder.filterString, "filterString is required");
        }

        @Override
        public final java.lang.String getFilterString() {
            return this.filterString;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("filterString", om.valueToTree(this.getFilterString()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.resourceexplorer2View.Resourceexplorer2ViewFilters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Resourceexplorer2ViewFilters.Jsii$Proxy that = (Resourceexplorer2ViewFilters.Jsii$Proxy) o;

            return this.filterString.equals(that.filterString);
        }

        @Override
        public final int hashCode() {
            int result = this.filterString.hashCode();
            return result;
        }
    }
}
