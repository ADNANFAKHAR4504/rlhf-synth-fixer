package imports.aws.resourceexplorer2_view;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resourceexplorer2View.Resourceexplorer2ViewIncludedProperty")
@software.amazon.jsii.Jsii.Proxy(Resourceexplorer2ViewIncludedProperty.Jsii$Proxy.class)
public interface Resourceexplorer2ViewIncludedProperty extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourceexplorer2_view#name Resourceexplorer2View#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link Resourceexplorer2ViewIncludedProperty}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Resourceexplorer2ViewIncludedProperty}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Resourceexplorer2ViewIncludedProperty> {
        java.lang.String name;

        /**
         * Sets the value of {@link Resourceexplorer2ViewIncludedProperty#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourceexplorer2_view#name Resourceexplorer2View#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Resourceexplorer2ViewIncludedProperty}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Resourceexplorer2ViewIncludedProperty build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Resourceexplorer2ViewIncludedProperty}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Resourceexplorer2ViewIncludedProperty {
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.resourceexplorer2View.Resourceexplorer2ViewIncludedProperty"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Resourceexplorer2ViewIncludedProperty.Jsii$Proxy that = (Resourceexplorer2ViewIncludedProperty.Jsii$Proxy) o;

            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            return result;
        }
    }
}
