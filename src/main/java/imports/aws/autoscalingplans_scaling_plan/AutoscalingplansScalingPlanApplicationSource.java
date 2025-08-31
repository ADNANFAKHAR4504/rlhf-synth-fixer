package imports.aws.autoscalingplans_scaling_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanApplicationSource")
@software.amazon.jsii.Jsii.Proxy(AutoscalingplansScalingPlanApplicationSource.Jsii$Proxy.class)
public interface AutoscalingplansScalingPlanApplicationSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#cloudformation_stack_arn AutoscalingplansScalingPlan#cloudformation_stack_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudformationStackArn() {
        return null;
    }

    /**
     * tag_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#tag_filter AutoscalingplansScalingPlan#tag_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTagFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingplansScalingPlanApplicationSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingplansScalingPlanApplicationSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingplansScalingPlanApplicationSource> {
        java.lang.String cloudformationStackArn;
        java.lang.Object tagFilter;

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanApplicationSource#getCloudformationStackArn}
         * @param cloudformationStackArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#cloudformation_stack_arn AutoscalingplansScalingPlan#cloudformation_stack_arn}.
         * @return {@code this}
         */
        public Builder cloudformationStackArn(java.lang.String cloudformationStackArn) {
            this.cloudformationStackArn = cloudformationStackArn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanApplicationSource#getTagFilter}
         * @param tagFilter tag_filter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#tag_filter AutoscalingplansScalingPlan#tag_filter}
         * @return {@code this}
         */
        public Builder tagFilter(com.hashicorp.cdktf.IResolvable tagFilter) {
            this.tagFilter = tagFilter;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingplansScalingPlanApplicationSource#getTagFilter}
         * @param tagFilter tag_filter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscalingplans_scaling_plan#tag_filter AutoscalingplansScalingPlan#tag_filter}
         * @return {@code this}
         */
        public Builder tagFilter(java.util.List<? extends imports.aws.autoscalingplans_scaling_plan.AutoscalingplansScalingPlanApplicationSourceTagFilter> tagFilter) {
            this.tagFilter = tagFilter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingplansScalingPlanApplicationSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingplansScalingPlanApplicationSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingplansScalingPlanApplicationSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingplansScalingPlanApplicationSource {
        private final java.lang.String cloudformationStackArn;
        private final java.lang.Object tagFilter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudformationStackArn = software.amazon.jsii.Kernel.get(this, "cloudformationStackArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagFilter = software.amazon.jsii.Kernel.get(this, "tagFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudformationStackArn = builder.cloudformationStackArn;
            this.tagFilter = builder.tagFilter;
        }

        @Override
        public final java.lang.String getCloudformationStackArn() {
            return this.cloudformationStackArn;
        }

        @Override
        public final java.lang.Object getTagFilter() {
            return this.tagFilter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudformationStackArn() != null) {
                data.set("cloudformationStackArn", om.valueToTree(this.getCloudformationStackArn()));
            }
            if (this.getTagFilter() != null) {
                data.set("tagFilter", om.valueToTree(this.getTagFilter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingplansScalingPlan.AutoscalingplansScalingPlanApplicationSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingplansScalingPlanApplicationSource.Jsii$Proxy that = (AutoscalingplansScalingPlanApplicationSource.Jsii$Proxy) o;

            if (this.cloudformationStackArn != null ? !this.cloudformationStackArn.equals(that.cloudformationStackArn) : that.cloudformationStackArn != null) return false;
            return this.tagFilter != null ? this.tagFilter.equals(that.tagFilter) : that.tagFilter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudformationStackArn != null ? this.cloudformationStackArn.hashCode() : 0;
            result = 31 * result + (this.tagFilter != null ? this.tagFilter.hashCode() : 0);
            return result;
        }
    }
}
