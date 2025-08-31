package imports.aws.neptunegraph_graph;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.939Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptunegraphGraph.NeptunegraphGraphVectorSearchConfiguration")
@software.amazon.jsii.Jsii.Proxy(NeptunegraphGraphVectorSearchConfiguration.Jsii$Proxy.class)
public interface NeptunegraphGraphVectorSearchConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Specifies the number of dimensions for vector embeddings.  Value must be between 1 and 65,535.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_dimension NeptunegraphGraph#vector_search_dimension}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVectorSearchDimension() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NeptunegraphGraphVectorSearchConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NeptunegraphGraphVectorSearchConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NeptunegraphGraphVectorSearchConfiguration> {
        java.lang.Number vectorSearchDimension;

        /**
         * Sets the value of {@link NeptunegraphGraphVectorSearchConfiguration#getVectorSearchDimension}
         * @param vectorSearchDimension Specifies the number of dimensions for vector embeddings.  Value must be between 1 and 65,535.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_dimension NeptunegraphGraph#vector_search_dimension}
         * @return {@code this}
         */
        public Builder vectorSearchDimension(java.lang.Number vectorSearchDimension) {
            this.vectorSearchDimension = vectorSearchDimension;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NeptunegraphGraphVectorSearchConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NeptunegraphGraphVectorSearchConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NeptunegraphGraphVectorSearchConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NeptunegraphGraphVectorSearchConfiguration {
        private final java.lang.Number vectorSearchDimension;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.vectorSearchDimension = software.amazon.jsii.Kernel.get(this, "vectorSearchDimension", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.vectorSearchDimension = builder.vectorSearchDimension;
        }

        @Override
        public final java.lang.Number getVectorSearchDimension() {
            return this.vectorSearchDimension;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getVectorSearchDimension() != null) {
                data.set("vectorSearchDimension", om.valueToTree(this.getVectorSearchDimension()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.neptunegraphGraph.NeptunegraphGraphVectorSearchConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NeptunegraphGraphVectorSearchConfiguration.Jsii$Proxy that = (NeptunegraphGraphVectorSearchConfiguration.Jsii$Proxy) o;

            return this.vectorSearchDimension != null ? this.vectorSearchDimension.equals(that.vectorSearchDimension) : that.vectorSearchDimension == null;
        }

        @Override
        public final int hashCode() {
            int result = this.vectorSearchDimension != null ? this.vectorSearchDimension.hashCode() : 0;
            return result;
        }
    }
}
