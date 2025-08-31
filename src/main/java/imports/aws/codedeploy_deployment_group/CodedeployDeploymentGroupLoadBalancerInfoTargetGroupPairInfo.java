package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * prod_traffic_route block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#prod_traffic_route CodedeployDeploymentGroup#prod_traffic_route}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute getProdTrafficRoute();

    /**
     * target_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group CodedeployDeploymentGroup#target_group}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTargetGroup();

    /**
     * test_traffic_route block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#test_traffic_route CodedeployDeploymentGroup#test_traffic_route}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute getTestTrafficRoute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo> {
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute prodTrafficRoute;
        java.lang.Object targetGroup;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute testTrafficRoute;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo#getProdTrafficRoute}
         * @param prodTrafficRoute prod_traffic_route block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#prod_traffic_route CodedeployDeploymentGroup#prod_traffic_route}
         * @return {@code this}
         */
        public Builder prodTrafficRoute(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute prodTrafficRoute) {
            this.prodTrafficRoute = prodTrafficRoute;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo#getTargetGroup}
         * @param targetGroup target_group block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group CodedeployDeploymentGroup#target_group}
         * @return {@code this}
         */
        public Builder targetGroup(com.hashicorp.cdktf.IResolvable targetGroup) {
            this.targetGroup = targetGroup;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo#getTargetGroup}
         * @param targetGroup target_group block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#target_group CodedeployDeploymentGroup#target_group}
         * @return {@code this}
         */
        public Builder targetGroup(java.util.List<? extends imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroup> targetGroup) {
            this.targetGroup = targetGroup;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo#getTestTrafficRoute}
         * @param testTrafficRoute test_traffic_route block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#test_traffic_route CodedeployDeploymentGroup#test_traffic_route}
         * @return {@code this}
         */
        public Builder testTrafficRoute(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute testTrafficRoute) {
            this.testTrafficRoute = testTrafficRoute;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo {
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute prodTrafficRoute;
        private final java.lang.Object targetGroup;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute testTrafficRoute;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.prodTrafficRoute = software.amazon.jsii.Kernel.get(this, "prodTrafficRoute", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute.class));
            this.targetGroup = software.amazon.jsii.Kernel.get(this, "targetGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.testTrafficRoute = software.amazon.jsii.Kernel.get(this, "testTrafficRoute", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.prodTrafficRoute = java.util.Objects.requireNonNull(builder.prodTrafficRoute, "prodTrafficRoute is required");
            this.targetGroup = java.util.Objects.requireNonNull(builder.targetGroup, "targetGroup is required");
            this.testTrafficRoute = builder.testTrafficRoute;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute getProdTrafficRoute() {
            return this.prodTrafficRoute;
        }

        @Override
        public final java.lang.Object getTargetGroup() {
            return this.targetGroup;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute getTestTrafficRoute() {
            return this.testTrafficRoute;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("prodTrafficRoute", om.valueToTree(this.getProdTrafficRoute()));
            data.set("targetGroup", om.valueToTree(this.getTargetGroup()));
            if (this.getTestTrafficRoute() != null) {
                data.set("testTrafficRoute", om.valueToTree(this.getTestTrafficRoute()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo.Jsii$Proxy that = (CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo.Jsii$Proxy) o;

            if (!prodTrafficRoute.equals(that.prodTrafficRoute)) return false;
            if (!targetGroup.equals(that.targetGroup)) return false;
            return this.testTrafficRoute != null ? this.testTrafficRoute.equals(that.testTrafficRoute) : that.testTrafficRoute == null;
        }

        @Override
        public final int hashCode() {
            int result = this.prodTrafficRoute.hashCode();
            result = 31 * result + (this.targetGroup.hashCode());
            result = 31 * result + (this.testTrafficRoute != null ? this.testTrafficRoute.hashCode() : 0);
            return result;
        }
    }
}
