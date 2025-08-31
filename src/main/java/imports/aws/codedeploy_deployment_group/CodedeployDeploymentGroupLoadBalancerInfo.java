package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupLoadBalancerInfo")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupLoadBalancerInfo.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupLoadBalancerInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * elb_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#elb_info CodedeployDeploymentGroup#elb_info}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getElbInfo() {
        return null;
    }

    /**
     * target_group_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group_info CodedeployDeploymentGroup#target_group_info}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetGroupInfo() {
        return null;
    }

    /**
     * target_group_pair_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group_pair_info CodedeployDeploymentGroup#target_group_pair_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo getTargetGroupPairInfo() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupLoadBalancerInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupLoadBalancerInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupLoadBalancerInfo> {
        java.lang.Object elbInfo;
        java.lang.Object targetGroupInfo;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo targetGroupPairInfo;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfo#getElbInfo}
         * @param elbInfo elb_info block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#elb_info CodedeployDeploymentGroup#elb_info}
         * @return {@code this}
         */
        public Builder elbInfo(com.hashicorp.cdktf.IResolvable elbInfo) {
            this.elbInfo = elbInfo;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfo#getElbInfo}
         * @param elbInfo elb_info block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#elb_info CodedeployDeploymentGroup#elb_info}
         * @return {@code this}
         */
        public Builder elbInfo(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfo> elbInfo) {
            this.elbInfo = elbInfo;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfo#getTargetGroupInfo}
         * @param targetGroupInfo target_group_info block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group_info CodedeployDeploymentGroup#target_group_info}
         * @return {@code this}
         */
        public Builder targetGroupInfo(com.hashicorp.cdktf.IResolvable targetGroupInfo) {
            this.targetGroupInfo = targetGroupInfo;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfo#getTargetGroupInfo}
         * @param targetGroupInfo target_group_info block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group_info CodedeployDeploymentGroup#target_group_info}
         * @return {@code this}
         */
        public Builder targetGroupInfo(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfo> targetGroupInfo) {
            this.targetGroupInfo = targetGroupInfo;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfo#getTargetGroupPairInfo}
         * @param targetGroupPairInfo target_group_pair_info block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group_pair_info CodedeployDeploymentGroup#target_group_pair_info}
         * @return {@code this}
         */
        public Builder targetGroupPairInfo(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo targetGroupPairInfo) {
            this.targetGroupPairInfo = targetGroupPairInfo;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupLoadBalancerInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupLoadBalancerInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupLoadBalancerInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupLoadBalancerInfo {
        private final java.lang.Object elbInfo;
        private final java.lang.Object targetGroupInfo;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo targetGroupPairInfo;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.elbInfo = software.amazon.jsii.Kernel.get(this, "elbInfo", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetGroupInfo = software.amazon.jsii.Kernel.get(this, "targetGroupInfo", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetGroupPairInfo = software.amazon.jsii.Kernel.get(this, "targetGroupPairInfo", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.elbInfo = builder.elbInfo;
            this.targetGroupInfo = builder.targetGroupInfo;
            this.targetGroupPairInfo = builder.targetGroupPairInfo;
        }

        @Override
        public final java.lang.Object getElbInfo() {
            return this.elbInfo;
        }

        @Override
        public final java.lang.Object getTargetGroupInfo() {
            return this.targetGroupInfo;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo getTargetGroupPairInfo() {
            return this.targetGroupPairInfo;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getElbInfo() != null) {
                data.set("elbInfo", om.valueToTree(this.getElbInfo()));
            }
            if (this.getTargetGroupInfo() != null) {
                data.set("targetGroupInfo", om.valueToTree(this.getTargetGroupInfo()));
            }
            if (this.getTargetGroupPairInfo() != null) {
                data.set("targetGroupPairInfo", om.valueToTree(this.getTargetGroupPairInfo()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupLoadBalancerInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupLoadBalancerInfo.Jsii$Proxy that = (CodedeployDeploymentGroupLoadBalancerInfo.Jsii$Proxy) o;

            if (this.elbInfo != null ? !this.elbInfo.equals(that.elbInfo) : that.elbInfo != null) return false;
            if (this.targetGroupInfo != null ? !this.targetGroupInfo.equals(that.targetGroupInfo) : that.targetGroupInfo != null) return false;
            return this.targetGroupPairInfo != null ? this.targetGroupPairInfo.equals(that.targetGroupPairInfo) : that.targetGroupPairInfo == null;
        }

        @Override
        public final int hashCode() {
            int result = this.elbInfo != null ? this.elbInfo.hashCode() : 0;
            result = 31 * result + (this.targetGroupInfo != null ? this.targetGroupInfo.hashCode() : 0);
            result = 31 * result + (this.targetGroupPairInfo != null ? this.targetGroupPairInfo.hashCode() : 0);
            return result;
        }
    }
}
