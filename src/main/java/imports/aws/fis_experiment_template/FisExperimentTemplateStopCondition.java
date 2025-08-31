package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateStopCondition")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateStopCondition.Jsii$Proxy.class)
public interface FisExperimentTemplateStopCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#source FisExperimentTemplate#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateStopCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateStopCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateStopCondition> {
        java.lang.String source;
        java.lang.String value;

        /**
         * Sets the value of {@link FisExperimentTemplateStopCondition#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#source FisExperimentTemplate#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateStopCondition#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#value FisExperimentTemplate#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateStopCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateStopCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateStopCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateStopCondition {
        private final java.lang.String source;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("source", om.valueToTree(this.getSource()));
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateStopCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateStopCondition.Jsii$Proxy that = (FisExperimentTemplateStopCondition.Jsii$Proxy) o;

            if (!source.equals(that.source)) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.source.hashCode();
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
