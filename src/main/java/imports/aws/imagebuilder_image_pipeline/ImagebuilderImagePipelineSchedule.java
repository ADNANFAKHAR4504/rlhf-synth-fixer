package imports.aws.imagebuilder_image_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImagePipeline.ImagebuilderImagePipelineSchedule")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImagePipelineSchedule.Jsii$Proxy.class)
public interface ImagebuilderImagePipelineSchedule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#schedule_expression ImagebuilderImagePipeline#schedule_expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#pipeline_execution_start_condition ImagebuilderImagePipeline#pipeline_execution_start_condition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPipelineExecutionStartCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#timezone ImagebuilderImagePipeline#timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimezone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImagePipelineSchedule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImagePipelineSchedule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImagePipelineSchedule> {
        java.lang.String scheduleExpression;
        java.lang.String pipelineExecutionStartCondition;
        java.lang.String timezone;

        /**
         * Sets the value of {@link ImagebuilderImagePipelineSchedule#getScheduleExpression}
         * @param scheduleExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#schedule_expression ImagebuilderImagePipeline#schedule_expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder scheduleExpression(java.lang.String scheduleExpression) {
            this.scheduleExpression = scheduleExpression;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineSchedule#getPipelineExecutionStartCondition}
         * @param pipelineExecutionStartCondition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#pipeline_execution_start_condition ImagebuilderImagePipeline#pipeline_execution_start_condition}.
         * @return {@code this}
         */
        public Builder pipelineExecutionStartCondition(java.lang.String pipelineExecutionStartCondition) {
            this.pipelineExecutionStartCondition = pipelineExecutionStartCondition;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineSchedule#getTimezone}
         * @param timezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#timezone ImagebuilderImagePipeline#timezone}.
         * @return {@code this}
         */
        public Builder timezone(java.lang.String timezone) {
            this.timezone = timezone;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImagePipelineSchedule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImagePipelineSchedule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImagePipelineSchedule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImagePipelineSchedule {
        private final java.lang.String scheduleExpression;
        private final java.lang.String pipelineExecutionStartCondition;
        private final java.lang.String timezone;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.scheduleExpression = software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pipelineExecutionStartCondition = software.amazon.jsii.Kernel.get(this, "pipelineExecutionStartCondition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timezone = software.amazon.jsii.Kernel.get(this, "timezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.scheduleExpression = java.util.Objects.requireNonNull(builder.scheduleExpression, "scheduleExpression is required");
            this.pipelineExecutionStartCondition = builder.pipelineExecutionStartCondition;
            this.timezone = builder.timezone;
        }

        @Override
        public final java.lang.String getScheduleExpression() {
            return this.scheduleExpression;
        }

        @Override
        public final java.lang.String getPipelineExecutionStartCondition() {
            return this.pipelineExecutionStartCondition;
        }

        @Override
        public final java.lang.String getTimezone() {
            return this.timezone;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("scheduleExpression", om.valueToTree(this.getScheduleExpression()));
            if (this.getPipelineExecutionStartCondition() != null) {
                data.set("pipelineExecutionStartCondition", om.valueToTree(this.getPipelineExecutionStartCondition()));
            }
            if (this.getTimezone() != null) {
                data.set("timezone", om.valueToTree(this.getTimezone()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImagePipeline.ImagebuilderImagePipelineSchedule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImagePipelineSchedule.Jsii$Proxy that = (ImagebuilderImagePipelineSchedule.Jsii$Proxy) o;

            if (!scheduleExpression.equals(that.scheduleExpression)) return false;
            if (this.pipelineExecutionStartCondition != null ? !this.pipelineExecutionStartCondition.equals(that.pipelineExecutionStartCondition) : that.pipelineExecutionStartCondition != null) return false;
            return this.timezone != null ? this.timezone.equals(that.timezone) : that.timezone == null;
        }

        @Override
        public final int hashCode() {
            int result = this.scheduleExpression.hashCode();
            result = 31 * result + (this.pipelineExecutionStartCondition != null ? this.pipelineExecutionStartCondition.hashCode() : 0);
            result = 31 * result + (this.timezone != null ? this.timezone.hashCode() : 0);
            return result;
        }
    }
}
