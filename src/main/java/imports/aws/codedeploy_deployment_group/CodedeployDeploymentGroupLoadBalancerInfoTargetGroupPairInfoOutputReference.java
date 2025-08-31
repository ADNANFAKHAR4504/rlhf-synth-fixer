package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference")
public class CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putProdTrafficRoute(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute value) {
        software.amazon.jsii.Kernel.call(this, "putProdTrafficRoute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetGroup(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroup>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroup> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroup>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroup __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetGroup", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTestTrafficRoute(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute value) {
        software.amazon.jsii.Kernel.call(this, "putTestTrafficRoute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetTestTrafficRoute() {
        software.amazon.jsii.Kernel.call(this, "resetTestTrafficRoute", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRouteOutputReference getProdTrafficRoute() {
        return software.amazon.jsii.Kernel.get(this, "prodTrafficRoute", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRouteOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroupList getTargetGroup() {
        return software.amazon.jsii.Kernel.get(this, "targetGroup", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTargetGroupList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRouteOutputReference getTestTrafficRoute() {
        return software.amazon.jsii.Kernel.get(this, "testTrafficRoute", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRouteOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute getProdTrafficRouteInput() {
        return software.amazon.jsii.Kernel.get(this, "prodTrafficRouteInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoProdTrafficRoute.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute getTestTrafficRouteInput() {
        return software.amazon.jsii.Kernel.get(this, "testTrafficRouteInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoTestTrafficRoute.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
