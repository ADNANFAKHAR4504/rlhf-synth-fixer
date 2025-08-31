package imports.aws.glue_ml_transform;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueMlTransform.GlueMlTransformParameters")
@software.amazon.jsii.Jsii.Proxy(GlueMlTransformParameters.Jsii$Proxy.class)
public interface GlueMlTransformParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * find_matches_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#find_matches_parameters GlueMlTransform#find_matches_parameters}
     */
    @org.jetbrains.annotations.NotNull imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters getFindMatchesParameters();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#transform_type GlueMlTransform#transform_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTransformType();

    /**
     * @return a {@link Builder} of {@link GlueMlTransformParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueMlTransformParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueMlTransformParameters> {
        imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters findMatchesParameters;
        java.lang.String transformType;

        /**
         * Sets the value of {@link GlueMlTransformParameters#getFindMatchesParameters}
         * @param findMatchesParameters find_matches_parameters block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#find_matches_parameters GlueMlTransform#find_matches_parameters}
         * @return {@code this}
         */
        public Builder findMatchesParameters(imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters findMatchesParameters) {
            this.findMatchesParameters = findMatchesParameters;
            return this;
        }

        /**
         * Sets the value of {@link GlueMlTransformParameters#getTransformType}
         * @param transformType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#transform_type GlueMlTransform#transform_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder transformType(java.lang.String transformType) {
            this.transformType = transformType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueMlTransformParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueMlTransformParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueMlTransformParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueMlTransformParameters {
        private final imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters findMatchesParameters;
        private final java.lang.String transformType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.findMatchesParameters = software.amazon.jsii.Kernel.get(this, "findMatchesParameters", software.amazon.jsii.NativeType.forClass(imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters.class));
            this.transformType = software.amazon.jsii.Kernel.get(this, "transformType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.findMatchesParameters = java.util.Objects.requireNonNull(builder.findMatchesParameters, "findMatchesParameters is required");
            this.transformType = java.util.Objects.requireNonNull(builder.transformType, "transformType is required");
        }

        @Override
        public final imports.aws.glue_ml_transform.GlueMlTransformParametersFindMatchesParameters getFindMatchesParameters() {
            return this.findMatchesParameters;
        }

        @Override
        public final java.lang.String getTransformType() {
            return this.transformType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("findMatchesParameters", om.valueToTree(this.getFindMatchesParameters()));
            data.set("transformType", om.valueToTree(this.getTransformType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueMlTransform.GlueMlTransformParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueMlTransformParameters.Jsii$Proxy that = (GlueMlTransformParameters.Jsii$Proxy) o;

            if (!findMatchesParameters.equals(that.findMatchesParameters)) return false;
            return this.transformType.equals(that.transformType);
        }

        @Override
        public final int hashCode() {
            int result = this.findMatchesParameters.hashCode();
            result = 31 * result + (this.transformType.hashCode());
            return result;
        }
    }
}
