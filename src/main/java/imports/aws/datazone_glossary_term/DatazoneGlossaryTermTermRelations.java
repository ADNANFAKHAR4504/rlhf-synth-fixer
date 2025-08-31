package imports.aws.datazone_glossary_term;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.959Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneGlossaryTerm.DatazoneGlossaryTermTermRelations")
@software.amazon.jsii.Jsii.Proxy(DatazoneGlossaryTermTermRelations.Jsii$Proxy.class)
public interface DatazoneGlossaryTermTermRelations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#classifies DatazoneGlossaryTerm#classifies}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClassifies() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#is_a DatazoneGlossaryTerm#is_a}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIsA() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneGlossaryTermTermRelations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneGlossaryTermTermRelations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneGlossaryTermTermRelations> {
        java.util.List<java.lang.String> classifies;
        java.util.List<java.lang.String> isA;

        /**
         * Sets the value of {@link DatazoneGlossaryTermTermRelations#getClassifies}
         * @param classifies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#classifies DatazoneGlossaryTerm#classifies}.
         * @return {@code this}
         */
        public Builder classifies(java.util.List<java.lang.String> classifies) {
            this.classifies = classifies;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneGlossaryTermTermRelations#getIsA}
         * @param isA Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_glossary_term#is_a DatazoneGlossaryTerm#is_a}.
         * @return {@code this}
         */
        public Builder isA(java.util.List<java.lang.String> isA) {
            this.isA = isA;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatazoneGlossaryTermTermRelations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneGlossaryTermTermRelations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneGlossaryTermTermRelations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneGlossaryTermTermRelations {
        private final java.util.List<java.lang.String> classifies;
        private final java.util.List<java.lang.String> isA;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.classifies = software.amazon.jsii.Kernel.get(this, "classifies", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.isA = software.amazon.jsii.Kernel.get(this, "isA", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.classifies = builder.classifies;
            this.isA = builder.isA;
        }

        @Override
        public final java.util.List<java.lang.String> getClassifies() {
            return this.classifies;
        }

        @Override
        public final java.util.List<java.lang.String> getIsA() {
            return this.isA;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClassifies() != null) {
                data.set("classifies", om.valueToTree(this.getClassifies()));
            }
            if (this.getIsA() != null) {
                data.set("isA", om.valueToTree(this.getIsA()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datazoneGlossaryTerm.DatazoneGlossaryTermTermRelations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneGlossaryTermTermRelations.Jsii$Proxy that = (DatazoneGlossaryTermTermRelations.Jsii$Proxy) o;

            if (this.classifies != null ? !this.classifies.equals(that.classifies) : that.classifies != null) return false;
            return this.isA != null ? this.isA.equals(that.isA) : that.isA == null;
        }

        @Override
        public final int hashCode() {
            int result = this.classifies != null ? this.classifies.hashCode() : 0;
            result = 31 * result + (this.isA != null ? this.isA.hashCode() : 0);
            return result;
        }
    }
}
