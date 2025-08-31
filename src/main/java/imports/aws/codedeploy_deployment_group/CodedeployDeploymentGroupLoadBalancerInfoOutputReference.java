package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupLoadBalancerInfoOutputReference")
public class CodedeployDeploymentGroupLoadBalancerInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodedeployDeploymentGroupLoadBalancerInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodedeployDeploymentGroupLoadBalancerInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodedeployDeploymentGroupLoadBalancerInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putElbInfo(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfo>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfo> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfo>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfo __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putElbInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetGroupInfo(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfo>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfo> __cast_cd4240 = (java.util.List<imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfo>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfo __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetGroupInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetGroupPairInfo(final @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo value) {
        software.amazon.jsii.Kernel.call(this, "putTargetGroupPairInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetElbInfo() {
        software.amazon.jsii.Kernel.call(this, "resetElbInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetGroupInfo() {
        software.amazon.jsii.Kernel.call(this, "resetTargetGroupInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetGroupPairInfo() {
        software.amazon.jsii.Kernel.call(this, "resetTargetGroupPairInfo", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfoList getElbInfo() {
        return software.amazon.jsii.Kernel.get(this, "elbInfo", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoElbInfoList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfoList getTargetGroupInfo() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupInfo", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupInfoList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference getTargetGroupPairInfo() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupPairInfo", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getElbInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "elbInfoInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetGroupInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupInfoInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo getTargetGroupPairInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupPairInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfoTargetGroupPairInfo.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupLoadBalancerInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
