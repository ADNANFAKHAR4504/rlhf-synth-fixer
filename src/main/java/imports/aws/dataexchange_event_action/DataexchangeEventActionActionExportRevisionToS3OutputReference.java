package imports.aws.dataexchange_event_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.936Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3OutputReference")
public class DataexchangeEventActionActionExportRevisionToS3OutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataexchangeEventActionActionExportRevisionToS3OutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataexchangeEventActionActionExportRevisionToS3OutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataexchangeEventActionActionExportRevisionToS3OutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putEncryption(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3Encryption>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3Encryption> __cast_cd4240 = (java.util.List<imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3Encryption>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3Encryption __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEncryption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRevisionDestination(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestination>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestination> __cast_cd4240 = (java.util.List<imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestination>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestination __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRevisionDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRevisionDestination() {
        software.amazon.jsii.Kernel.call(this, "resetRevisionDestination", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3EncryptionList getEncryption() {
        return software.amazon.jsii.Kernel.get(this, "encryption", software.amazon.jsii.NativeType.forClass(imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3EncryptionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestinationList getRevisionDestination() {
        return software.amazon.jsii.Kernel.get(this, "revisionDestination", software.amazon.jsii.NativeType.forClass(imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestinationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRevisionDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "revisionDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3 value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
