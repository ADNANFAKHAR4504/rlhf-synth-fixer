package imports.aws.datazone_glossary_term;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.959Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneGlossaryTerm.DatazoneGlossaryTermTimeouts")
@software.amazon.jsii.Jsii.Proxy(DatazoneGlossaryTermTimeouts.Jsii$Proxy.class)
public interface DatazoneGlossaryTermTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * A string that can be <a href="https://pkg.go.dev/time#ParseDuration">parsed as a duration</a> consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#create DatazoneGlossaryTerm#create}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCreate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneGlossaryTermTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneGlossaryTermTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneGlossaryTermTimeouts> {
        java.lang.String create;

        /**
         * Sets the value of {@link DatazoneGlossaryTermTimeouts#getCreate}
         * @param create A string that can be <a href="https://pkg.go.dev/time#ParseDuration">parsed as a duration</a> consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#create DatazoneGlossaryTerm#create}
         * @return {@code this}
         */
        public Builder create(java.lang.String create) {
            this.create = create;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatazoneGlossaryTermTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneGlossaryTermTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneGlossaryTermTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneGlossaryTermTimeouts {
        private final java.lang.String create;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.create = software.amazon.jsii.Kernel.get(this, "create", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.create = builder.create;
        }

        @Override
        public final java.lang.String getCreate() {
            return this.create;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCreate() != null) {
                data.set("create", om.valueToTree(this.getCreate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datazoneGlossaryTerm.DatazoneGlossaryTermTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneGlossaryTermTimeouts.Jsii$Proxy that = (DatazoneGlossaryTermTimeouts.Jsii$Proxy) o;

            return this.create != null ? this.create.equals(that.create) : that.create == null;
        }

        @Override
        public final int hashCode() {
            int result = this.create != null ? this.create.hashCode() : 0;
            return result;
        }
    }
}
