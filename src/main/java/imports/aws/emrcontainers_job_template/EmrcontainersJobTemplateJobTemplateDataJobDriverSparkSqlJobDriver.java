package imports.aws.emrcontainers_job_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.207Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver.Jsii$Proxy.class)
public interface EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#entry_point EmrcontainersJobTemplate#entry_point}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEntryPoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_sql_parameters EmrcontainersJobTemplate#spark_sql_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSparkSqlParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver> {
        java.lang.String entryPoint;
        java.lang.String sparkSqlParameters;

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver#getEntryPoint}
         * @param entryPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#entry_point EmrcontainersJobTemplate#entry_point}.
         * @return {@code this}
         */
        public Builder entryPoint(java.lang.String entryPoint) {
            this.entryPoint = entryPoint;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver#getSparkSqlParameters}
         * @param sparkSqlParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_job_template#spark_sql_parameters EmrcontainersJobTemplate#spark_sql_parameters}.
         * @return {@code this}
         */
        public Builder sparkSqlParameters(java.lang.String sparkSqlParameters) {
            this.sparkSqlParameters = sparkSqlParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver {
        private final java.lang.String entryPoint;
        private final java.lang.String sparkSqlParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entryPoint = software.amazon.jsii.Kernel.get(this, "entryPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sparkSqlParameters = software.amazon.jsii.Kernel.get(this, "sparkSqlParameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entryPoint = builder.entryPoint;
            this.sparkSqlParameters = builder.sparkSqlParameters;
        }

        @Override
        public final java.lang.String getEntryPoint() {
            return this.entryPoint;
        }

        @Override
        public final java.lang.String getSparkSqlParameters() {
            return this.sparkSqlParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEntryPoint() != null) {
                data.set("entryPoint", om.valueToTree(this.getEntryPoint()));
            }
            if (this.getSparkSqlParameters() != null) {
                data.set("sparkSqlParameters", om.valueToTree(this.getSparkSqlParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersJobTemplate.EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver.Jsii$Proxy that = (EmrcontainersJobTemplateJobTemplateDataJobDriverSparkSqlJobDriver.Jsii$Proxy) o;

            if (this.entryPoint != null ? !this.entryPoint.equals(that.entryPoint) : that.entryPoint != null) return false;
            return this.sparkSqlParameters != null ? this.sparkSqlParameters.equals(that.sparkSqlParameters) : that.sparkSqlParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.entryPoint != null ? this.entryPoint.hashCode() : 0;
            result = 31 * result + (this.sparkSqlParameters != null ? this.sparkSqlParameters.hashCode() : 0);
            return result;
        }
    }
}
