package imports.aws.imagebuilder_image_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImagePipeline.ImagebuilderImagePipelineWorkflow")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImagePipelineWorkflow.Jsii$Proxy.class)
public interface ImagebuilderImagePipelineWorkflow extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#workflow_arn ImagebuilderImagePipeline#workflow_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkflowArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#on_failure ImagebuilderImagePipeline#on_failure}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnFailure() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#parallel_group ImagebuilderImagePipeline#parallel_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParallelGroup() {
        return null;
    }

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#parameter ImagebuilderImagePipeline#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImagePipelineWorkflow}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImagePipelineWorkflow}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImagePipelineWorkflow> {
        java.lang.String workflowArn;
        java.lang.String onFailure;
        java.lang.String parallelGroup;
        java.lang.Object parameter;

        /**
         * Sets the value of {@link ImagebuilderImagePipelineWorkflow#getWorkflowArn}
         * @param workflowArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#workflow_arn ImagebuilderImagePipeline#workflow_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder workflowArn(java.lang.String workflowArn) {
            this.workflowArn = workflowArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineWorkflow#getOnFailure}
         * @param onFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#on_failure ImagebuilderImagePipeline#on_failure}.
         * @return {@code this}
         */
        public Builder onFailure(java.lang.String onFailure) {
            this.onFailure = onFailure;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineWorkflow#getParallelGroup}
         * @param parallelGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#parallel_group ImagebuilderImagePipeline#parallel_group}.
         * @return {@code this}
         */
        public Builder parallelGroup(java.lang.String parallelGroup) {
            this.parallelGroup = parallelGroup;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineWorkflow#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#parameter ImagebuilderImagePipeline#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImagePipelineWorkflow#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_pipeline#parameter ImagebuilderImagePipeline#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineWorkflowParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImagePipelineWorkflow}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImagePipelineWorkflow build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImagePipelineWorkflow}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImagePipelineWorkflow {
        private final java.lang.String workflowArn;
        private final java.lang.String onFailure;
        private final java.lang.String parallelGroup;
        private final java.lang.Object parameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.workflowArn = software.amazon.jsii.Kernel.get(this, "workflowArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onFailure = software.amazon.jsii.Kernel.get(this, "onFailure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parallelGroup = software.amazon.jsii.Kernel.get(this, "parallelGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.workflowArn = java.util.Objects.requireNonNull(builder.workflowArn, "workflowArn is required");
            this.onFailure = builder.onFailure;
            this.parallelGroup = builder.parallelGroup;
            this.parameter = builder.parameter;
        }

        @Override
        public final java.lang.String getWorkflowArn() {
            return this.workflowArn;
        }

        @Override
        public final java.lang.String getOnFailure() {
            return this.onFailure;
        }

        @Override
        public final java.lang.String getParallelGroup() {
            return this.parallelGroup;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("workflowArn", om.valueToTree(this.getWorkflowArn()));
            if (this.getOnFailure() != null) {
                data.set("onFailure", om.valueToTree(this.getOnFailure()));
            }
            if (this.getParallelGroup() != null) {
                data.set("parallelGroup", om.valueToTree(this.getParallelGroup()));
            }
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImagePipeline.ImagebuilderImagePipelineWorkflow"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImagePipelineWorkflow.Jsii$Proxy that = (ImagebuilderImagePipelineWorkflow.Jsii$Proxy) o;

            if (!workflowArn.equals(that.workflowArn)) return false;
            if (this.onFailure != null ? !this.onFailure.equals(that.onFailure) : that.onFailure != null) return false;
            if (this.parallelGroup != null ? !this.parallelGroup.equals(that.parallelGroup) : that.parallelGroup != null) return false;
            return this.parameter != null ? this.parameter.equals(that.parameter) : that.parameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.workflowArn.hashCode();
            result = 31 * result + (this.onFailure != null ? this.onFailure.hashCode() : 0);
            result = 31 * result + (this.parallelGroup != null ? this.parallelGroup.hashCode() : 0);
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            return result;
        }
    }
}
