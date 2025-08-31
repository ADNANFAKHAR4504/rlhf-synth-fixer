package imports.aws.quicksight_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAnalysis.QuicksightAnalysisParameters")
@software.amazon.jsii.Jsii.Proxy(QuicksightAnalysisParameters.Jsii$Proxy.class)
public interface QuicksightAnalysisParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * date_time_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#date_time_parameters QuicksightAnalysis#date_time_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDateTimeParameters() {
        return null;
    }

    /**
     * decimal_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#decimal_parameters QuicksightAnalysis#decimal_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDecimalParameters() {
        return null;
    }

    /**
     * integer_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#integer_parameters QuicksightAnalysis#integer_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIntegerParameters() {
        return null;
    }

    /**
     * string_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#string_parameters QuicksightAnalysis#string_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStringParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightAnalysisParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightAnalysisParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightAnalysisParameters> {
        java.lang.Object dateTimeParameters;
        java.lang.Object decimalParameters;
        java.lang.Object integerParameters;
        java.lang.Object stringParameters;

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getDateTimeParameters}
         * @param dateTimeParameters date_time_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#date_time_parameters QuicksightAnalysis#date_time_parameters}
         * @return {@code this}
         */
        public Builder dateTimeParameters(com.hashicorp.cdktf.IResolvable dateTimeParameters) {
            this.dateTimeParameters = dateTimeParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getDateTimeParameters}
         * @param dateTimeParameters date_time_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#date_time_parameters QuicksightAnalysis#date_time_parameters}
         * @return {@code this}
         */
        public Builder dateTimeParameters(java.util.List<? extends imports.aws.quicksight_analysis.QuicksightAnalysisParametersDateTimeParameters> dateTimeParameters) {
            this.dateTimeParameters = dateTimeParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getDecimalParameters}
         * @param decimalParameters decimal_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#decimal_parameters QuicksightAnalysis#decimal_parameters}
         * @return {@code this}
         */
        public Builder decimalParameters(com.hashicorp.cdktf.IResolvable decimalParameters) {
            this.decimalParameters = decimalParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getDecimalParameters}
         * @param decimalParameters decimal_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#decimal_parameters QuicksightAnalysis#decimal_parameters}
         * @return {@code this}
         */
        public Builder decimalParameters(java.util.List<? extends imports.aws.quicksight_analysis.QuicksightAnalysisParametersDecimalParameters> decimalParameters) {
            this.decimalParameters = decimalParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getIntegerParameters}
         * @param integerParameters integer_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#integer_parameters QuicksightAnalysis#integer_parameters}
         * @return {@code this}
         */
        public Builder integerParameters(com.hashicorp.cdktf.IResolvable integerParameters) {
            this.integerParameters = integerParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getIntegerParameters}
         * @param integerParameters integer_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#integer_parameters QuicksightAnalysis#integer_parameters}
         * @return {@code this}
         */
        public Builder integerParameters(java.util.List<? extends imports.aws.quicksight_analysis.QuicksightAnalysisParametersIntegerParameters> integerParameters) {
            this.integerParameters = integerParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getStringParameters}
         * @param stringParameters string_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#string_parameters QuicksightAnalysis#string_parameters}
         * @return {@code this}
         */
        public Builder stringParameters(com.hashicorp.cdktf.IResolvable stringParameters) {
            this.stringParameters = stringParameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAnalysisParameters#getStringParameters}
         * @param stringParameters string_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#string_parameters QuicksightAnalysis#string_parameters}
         * @return {@code this}
         */
        public Builder stringParameters(java.util.List<? extends imports.aws.quicksight_analysis.QuicksightAnalysisParametersStringParameters> stringParameters) {
            this.stringParameters = stringParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightAnalysisParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightAnalysisParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightAnalysisParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightAnalysisParameters {
        private final java.lang.Object dateTimeParameters;
        private final java.lang.Object decimalParameters;
        private final java.lang.Object integerParameters;
        private final java.lang.Object stringParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dateTimeParameters = software.amazon.jsii.Kernel.get(this, "dateTimeParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.decimalParameters = software.amazon.jsii.Kernel.get(this, "decimalParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.integerParameters = software.amazon.jsii.Kernel.get(this, "integerParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stringParameters = software.amazon.jsii.Kernel.get(this, "stringParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dateTimeParameters = builder.dateTimeParameters;
            this.decimalParameters = builder.decimalParameters;
            this.integerParameters = builder.integerParameters;
            this.stringParameters = builder.stringParameters;
        }

        @Override
        public final java.lang.Object getDateTimeParameters() {
            return this.dateTimeParameters;
        }

        @Override
        public final java.lang.Object getDecimalParameters() {
            return this.decimalParameters;
        }

        @Override
        public final java.lang.Object getIntegerParameters() {
            return this.integerParameters;
        }

        @Override
        public final java.lang.Object getStringParameters() {
            return this.stringParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDateTimeParameters() != null) {
                data.set("dateTimeParameters", om.valueToTree(this.getDateTimeParameters()));
            }
            if (this.getDecimalParameters() != null) {
                data.set("decimalParameters", om.valueToTree(this.getDecimalParameters()));
            }
            if (this.getIntegerParameters() != null) {
                data.set("integerParameters", om.valueToTree(this.getIntegerParameters()));
            }
            if (this.getStringParameters() != null) {
                data.set("stringParameters", om.valueToTree(this.getStringParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightAnalysis.QuicksightAnalysisParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightAnalysisParameters.Jsii$Proxy that = (QuicksightAnalysisParameters.Jsii$Proxy) o;

            if (this.dateTimeParameters != null ? !this.dateTimeParameters.equals(that.dateTimeParameters) : that.dateTimeParameters != null) return false;
            if (this.decimalParameters != null ? !this.decimalParameters.equals(that.decimalParameters) : that.decimalParameters != null) return false;
            if (this.integerParameters != null ? !this.integerParameters.equals(that.integerParameters) : that.integerParameters != null) return false;
            return this.stringParameters != null ? this.stringParameters.equals(that.stringParameters) : that.stringParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dateTimeParameters != null ? this.dateTimeParameters.hashCode() : 0;
            result = 31 * result + (this.decimalParameters != null ? this.decimalParameters.hashCode() : 0);
            result = 31 * result + (this.integerParameters != null ? this.integerParameters.hashCode() : 0);
            result = 31 * result + (this.stringParameters != null ? this.stringParameters.hashCode() : 0);
            return result;
        }
    }
}
