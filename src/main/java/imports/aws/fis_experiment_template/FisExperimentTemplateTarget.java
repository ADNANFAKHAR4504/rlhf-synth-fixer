package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.233Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateTarget")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateTarget.Jsii$Proxy.class)
public interface FisExperimentTemplateTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_type FisExperimentTemplate#resource_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#selection_mode FisExperimentTemplate#selection_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSelectionMode();

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#filter FisExperimentTemplate#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameters FisExperimentTemplate#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_arns FisExperimentTemplate#resource_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceArns() {
        return null;
    }

    /**
     * resource_tag block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_tag FisExperimentTemplate#resource_tag}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResourceTag() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateTarget> {
        java.lang.String name;
        java.lang.String resourceType;
        java.lang.String selectionMode;
        java.lang.Object filter;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.util.List<java.lang.String> resourceArns;
        java.lang.Object resourceTag;

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#name FisExperimentTemplate#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_type FisExperimentTemplate#resource_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getSelectionMode}
         * @param selectionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#selection_mode FisExperimentTemplate#selection_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder selectionMode(java.lang.String selectionMode) {
            this.selectionMode = selectionMode;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#filter FisExperimentTemplate#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#filter FisExperimentTemplate#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateTargetFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#parameters FisExperimentTemplate#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getResourceArns}
         * @param resourceArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_arns FisExperimentTemplate#resource_arns}.
         * @return {@code this}
         */
        public Builder resourceArns(java.util.List<java.lang.String> resourceArns) {
            this.resourceArns = resourceArns;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getResourceTag}
         * @param resourceTag resource_tag block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_tag FisExperimentTemplate#resource_tag}
         * @return {@code this}
         */
        public Builder resourceTag(com.hashicorp.cdktf.IResolvable resourceTag) {
            this.resourceTag = resourceTag;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateTarget#getResourceTag}
         * @param resourceTag resource_tag block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#resource_tag FisExperimentTemplate#resource_tag}
         * @return {@code this}
         */
        public Builder resourceTag(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateTargetResourceTag> resourceTag) {
            this.resourceTag = resourceTag;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FisExperimentTemplateTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateTarget {
        private final java.lang.String name;
        private final java.lang.String resourceType;
        private final java.lang.String selectionMode;
        private final java.lang.Object filter;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.util.List<java.lang.String> resourceArns;
        private final java.lang.Object resourceTag;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.selectionMode = software.amazon.jsii.Kernel.get(this, "selectionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceArns = software.amazon.jsii.Kernel.get(this, "resourceArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceTag = software.amazon.jsii.Kernel.get(this, "resourceTag", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.resourceType = java.util.Objects.requireNonNull(builder.resourceType, "resourceType is required");
            this.selectionMode = java.util.Objects.requireNonNull(builder.selectionMode, "selectionMode is required");
            this.filter = builder.filter;
            this.parameters = builder.parameters;
            this.resourceArns = builder.resourceArns;
            this.resourceTag = builder.resourceTag;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        public final java.lang.String getSelectionMode() {
            return this.selectionMode;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceArns() {
            return this.resourceArns;
        }

        @Override
        public final java.lang.Object getResourceTag() {
            return this.resourceTag;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("resourceType", om.valueToTree(this.getResourceType()));
            data.set("selectionMode", om.valueToTree(this.getSelectionMode()));
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getResourceArns() != null) {
                data.set("resourceArns", om.valueToTree(this.getResourceArns()));
            }
            if (this.getResourceTag() != null) {
                data.set("resourceTag", om.valueToTree(this.getResourceTag()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateTarget.Jsii$Proxy that = (FisExperimentTemplateTarget.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!resourceType.equals(that.resourceType)) return false;
            if (!selectionMode.equals(that.selectionMode)) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.resourceArns != null ? !this.resourceArns.equals(that.resourceArns) : that.resourceArns != null) return false;
            return this.resourceTag != null ? this.resourceTag.equals(that.resourceTag) : that.resourceTag == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.resourceType.hashCode());
            result = 31 * result + (this.selectionMode.hashCode());
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.resourceArns != null ? this.resourceArns.hashCode() : 0);
            result = 31 * result + (this.resourceTag != null ? this.resourceTag.hashCode() : 0);
            return result;
        }
    }
}
