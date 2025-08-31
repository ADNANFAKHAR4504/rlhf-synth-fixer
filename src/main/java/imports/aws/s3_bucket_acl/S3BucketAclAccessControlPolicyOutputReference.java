package imports.aws.s3_bucket_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAcl.S3BucketAclAccessControlPolicyOutputReference")
public class S3BucketAclAccessControlPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketAclAccessControlPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketAclAccessControlPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketAclAccessControlPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putGrant(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrant>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrant> __cast_cd4240 = (java.util.List<imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrant>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrant __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGrant", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOwner(final @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner value) {
        software.amazon.jsii.Kernel.call(this, "putOwner", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetGrant() {
        software.amazon.jsii.Kernel.call(this, "resetGrant", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrantList getGrant() {
        return software.amazon.jsii.Kernel.get(this, "grant", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyGrantList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwnerOutputReference getOwner() {
        return software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwnerOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGrantInput() {
        return software.amazon.jsii.Kernel.get(this, "grantInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner getOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicyOwner.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_acl.S3BucketAclAccessControlPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
