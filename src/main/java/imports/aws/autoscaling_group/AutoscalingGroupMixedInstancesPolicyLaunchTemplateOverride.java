package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride.Jsii$Proxy.class)
public interface AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * instance_requirements block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_requirements AutoscalingGroup#instance_requirements}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements getInstanceRequirements() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_type AutoscalingGroup#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * launch_template_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification getLaunchTemplateSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#weighted_capacity AutoscalingGroup#weighted_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeightedCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride> {
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements instanceRequirements;
        java.lang.String instanceType;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification launchTemplateSpecification;
        java.lang.String weightedCapacity;

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride#getInstanceRequirements}
         * @param instanceRequirements instance_requirements block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_requirements AutoscalingGroup#instance_requirements}
         * @return {@code this}
         */
        public Builder instanceRequirements(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements instanceRequirements) {
            this.instanceRequirements = instanceRequirements;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_type AutoscalingGroup#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride#getLaunchTemplateSpecification}
         * @param launchTemplateSpecification launch_template_specification block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#launch_template_specification AutoscalingGroup#launch_template_specification}
         * @return {@code this}
         */
        public Builder launchTemplateSpecification(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification launchTemplateSpecification) {
            this.launchTemplateSpecification = launchTemplateSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride#getWeightedCapacity}
         * @param weightedCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#weighted_capacity AutoscalingGroup#weighted_capacity}.
         * @return {@code this}
         */
        public Builder weightedCapacity(java.lang.String weightedCapacity) {
            this.weightedCapacity = weightedCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride {
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements instanceRequirements;
        private final java.lang.String instanceType;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification launchTemplateSpecification;
        private final java.lang.String weightedCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceRequirements = software.amazon.jsii.Kernel.get(this, "instanceRequirements", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplateSpecification = software.amazon.jsii.Kernel.get(this, "launchTemplateSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification.class));
            this.weightedCapacity = software.amazon.jsii.Kernel.get(this, "weightedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceRequirements = builder.instanceRequirements;
            this.instanceType = builder.instanceType;
            this.launchTemplateSpecification = builder.launchTemplateSpecification;
            this.weightedCapacity = builder.weightedCapacity;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements getInstanceRequirements() {
            return this.instanceRequirements;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideLaunchTemplateSpecification getLaunchTemplateSpecification() {
            return this.launchTemplateSpecification;
        }

        @Override
        public final java.lang.String getWeightedCapacity() {
            return this.weightedCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceRequirements() != null) {
                data.set("instanceRequirements", om.valueToTree(this.getInstanceRequirements()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getLaunchTemplateSpecification() != null) {
                data.set("launchTemplateSpecification", om.valueToTree(this.getLaunchTemplateSpecification()));
            }
            if (this.getWeightedCapacity() != null) {
                data.set("weightedCapacity", om.valueToTree(this.getWeightedCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride.Jsii$Proxy that = (AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverride.Jsii$Proxy) o;

            if (this.instanceRequirements != null ? !this.instanceRequirements.equals(that.instanceRequirements) : that.instanceRequirements != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.launchTemplateSpecification != null ? !this.launchTemplateSpecification.equals(that.launchTemplateSpecification) : that.launchTemplateSpecification != null) return false;
            return this.weightedCapacity != null ? this.weightedCapacity.equals(that.weightedCapacity) : that.weightedCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceRequirements != null ? this.instanceRequirements.hashCode() : 0;
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.launchTemplateSpecification != null ? this.launchTemplateSpecification.hashCode() : 0);
            result = 31 * result + (this.weightedCapacity != null ? this.weightedCapacity.hashCode() : 0);
            return result;
        }
    }
}
