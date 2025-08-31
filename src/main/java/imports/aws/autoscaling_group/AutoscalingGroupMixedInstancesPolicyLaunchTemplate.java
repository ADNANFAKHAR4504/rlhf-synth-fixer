package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplate")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupMixedInstancesPolicyLaunchTemplate.Jsii$Proxy.class)
public interface AutoscalingGroupMixedInstancesPolicyLaunchTemplate extends software.amazon.jsii.JsiiSerializable {

    /**
     * launch_template_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
     */
    @org.jetbrains.annotations.NotNull imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification getLaunchTemplateSpecification();

    /**
     * override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#override AutoscalingGroup#override}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOverride() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupMixedInstancesPolicyLaunchTemplate> {
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification launchTemplateSpecification;
        java.lang.Object override;

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate#getLaunchTemplateSpecification}
         * @param launchTemplateSpecification launch_template_specification block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
         * @return {@code this}
         */
        public Builder launchTemplateSpecification(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification launchTemplateSpecification) {
            this.launchTemplateSpecification = launchTemplateSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate#getOverride}
         * @param override override block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#override AutoscalingGroup#override}
         * @return {@code this}
         */
        public Builder override(com.hashicorp.cdktf.IResolvable override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate#getOverride}
         * @param override override block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#override AutoscalingGroup#override}
         * @return {@code this}
         */
        public Builder override(java.util.List<? extends imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride> override) {
            this.override = override;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupMixedInstancesPolicyLaunchTemplate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupMixedInstancesPolicyLaunchTemplate {
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification launchTemplateSpecification;
        private final java.lang.Object override;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.launchTemplateSpecification = software.amazon.jsii.Kernel.get(this, "launchTemplateSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification.class));
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.launchTemplateSpecification = java.util.Objects.requireNonNull(builder.launchTemplateSpecification, "launchTemplateSpecification is required");
            this.override = builder.override;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateLaunchTemplateSpecification getLaunchTemplateSpecification() {
            return this.launchTemplateSpecification;
        }

        @Override
        public final java.lang.Object getOverride() {
            return this.override;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("launchTemplateSpecification", om.valueToTree(this.getLaunchTemplateSpecification()));
            if (this.getOverride() != null) {
                data.set("override", om.valueToTree(this.getOverride()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupMixedInstancesPolicyLaunchTemplate.Jsii$Proxy that = (AutoscalingGroupMixedInstancesPolicyLaunchTemplate.Jsii$Proxy) o;

            if (!launchTemplateSpecification.equals(that.launchTemplateSpecification)) return false;
            return this.override != null ? this.override.equals(that.override) : that.override == null;
        }

        @Override
        public final int hashCode() {
            int result = this.launchTemplateSpecification.hashCode();
            result = 31 * result + (this.override != null ? this.override.hashCode() : 0);
            return result;
        }
    }
}
