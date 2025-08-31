package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.378Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaOutputReference")
public class Inspector2FilterFilterCriteriaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Inspector2FilterFilterCriteriaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Inspector2FilterFilterCriteriaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Inspector2FilterFilterCriteriaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaAwsAccountId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaAwsAccountId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaAwsAccountId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaAwsAccountId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAwsAccountId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodeVulnerabilityDetectorName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCodeVulnerabilityDetectorName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodeVulnerabilityDetectorTags(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCodeVulnerabilityDetectorTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodeVulnerabilityFilePath(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCodeVulnerabilityFilePath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putComponentId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putComponentId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putComponentType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentType> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putComponentType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2InstanceImageId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceImageId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceImageId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceImageId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceImageId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2InstanceImageId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2InstanceSubnetId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2InstanceSubnetId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEc2InstanceVpcId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceVpcId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceVpcId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceVpcId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceVpcId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEc2InstanceVpcId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcrImageArchitecture(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageArchitecture>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageArchitecture> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageArchitecture>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageArchitecture __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEcrImageArchitecture", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcrImageHash(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageHash>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageHash> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageHash>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageHash __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEcrImageHash", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcrImagePushedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImagePushedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImagePushedAt> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImagePushedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImagePushedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEcrImagePushedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcrImageRegistry(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRegistry>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRegistry> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRegistry>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRegistry __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEcrImageRegistry", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcrImageRepositoryName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRepositoryName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRepositoryName> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRepositoryName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRepositoryName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEcrImageRepositoryName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEcrImageTags(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageTags>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageTags> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageTags>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageTags __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEcrImageTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEpssScore(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEpssScore>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEpssScore> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEpssScore>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEpssScore __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEpssScore", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExploitAvailable(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaExploitAvailable>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaExploitAvailable> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaExploitAvailable>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaExploitAvailable __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExploitAvailable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingArn> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingStatus(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingStatus> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingStatus", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingType> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirstObservedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAt> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFirstObservedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFixAvailable(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFixAvailable>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFixAvailable> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFixAvailable>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFixAvailable __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFixAvailable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInspectorScore(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaInspectorScore>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaInspectorScore> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaInspectorScore>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaInspectorScore __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInspectorScore", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionExecutionRoleArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionLastModifiedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionLastModifiedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionLayers(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLayers>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLayers> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLayers>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLayers __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionLayers", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionName> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaFunctionRuntime(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntime>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntime> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntime>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntime __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLambdaFunctionRuntime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLastObservedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLastObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLastObservedAt> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLastObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLastObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLastObservedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkProtocol(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaNetworkProtocol>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaNetworkProtocol> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaNetworkProtocol>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaNetworkProtocol __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkProtocol", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPortRange(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaPortRange>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaPortRange> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaPortRange>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaPortRange __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPortRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelatedVulnerabilities(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaRelatedVulnerabilities>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaRelatedVulnerabilities> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaRelatedVulnerabilities>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaRelatedVulnerabilities __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRelatedVulnerabilities", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceTags(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTags>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTags> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTags>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTags __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceType> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSeverity(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaSeverity>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaSeverity> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaSeverity>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaSeverity __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSeverity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTitle(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaTitle>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaTitle> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaTitle>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaTitle __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTitle", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpdatedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaUpdatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaUpdatedAt> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaUpdatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaUpdatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUpdatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVendorSeverity(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVendorSeverity>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVendorSeverity> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVendorSeverity>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVendorSeverity __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVendorSeverity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVulnerabilityId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilityId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilityId> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilityId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilityId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVulnerabilityId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVulnerabilitySource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilitySource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilitySource> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilitySource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilitySource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVulnerabilitySource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVulnerablePackages(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackages>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackages> __cast_cd4240 = (java.util.List<imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackages>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackages __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVulnerablePackages", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeVulnerabilityDetectorName() {
        software.amazon.jsii.Kernel.call(this, "resetCodeVulnerabilityDetectorName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeVulnerabilityDetectorTags() {
        software.amazon.jsii.Kernel.call(this, "resetCodeVulnerabilityDetectorTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeVulnerabilityFilePath() {
        software.amazon.jsii.Kernel.call(this, "resetCodeVulnerabilityFilePath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComponentId() {
        software.amazon.jsii.Kernel.call(this, "resetComponentId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComponentType() {
        software.amazon.jsii.Kernel.call(this, "resetComponentType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2InstanceImageId() {
        software.amazon.jsii.Kernel.call(this, "resetEc2InstanceImageId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2InstanceSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetEc2InstanceSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEc2InstanceVpcId() {
        software.amazon.jsii.Kernel.call(this, "resetEc2InstanceVpcId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcrImageArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImageArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcrImageHash() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImageHash", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcrImagePushedAt() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImagePushedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcrImageRegistry() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImageRegistry", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcrImageRepositoryName() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImageRepositoryName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcrImageTags() {
        software.amazon.jsii.Kernel.call(this, "resetEcrImageTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEpssScore() {
        software.amazon.jsii.Kernel.call(this, "resetEpssScore", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExploitAvailable() {
        software.amazon.jsii.Kernel.call(this, "resetExploitAvailable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingArn() {
        software.amazon.jsii.Kernel.call(this, "resetFindingArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingStatus() {
        software.amazon.jsii.Kernel.call(this, "resetFindingStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingType() {
        software.amazon.jsii.Kernel.call(this, "resetFindingType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstObservedAt() {
        software.amazon.jsii.Kernel.call(this, "resetFirstObservedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFixAvailable() {
        software.amazon.jsii.Kernel.call(this, "resetFixAvailable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInspectorScore() {
        software.amazon.jsii.Kernel.call(this, "resetInspectorScore", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionExecutionRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionExecutionRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionLastModifiedAt() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionLastModifiedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionLayers() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionLayers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionName() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionRuntime() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionRuntime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastObservedAt() {
        software.amazon.jsii.Kernel.call(this, "resetLastObservedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPortRange() {
        software.amazon.jsii.Kernel.call(this, "resetPortRange", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelatedVulnerabilities() {
        software.amazon.jsii.Kernel.call(this, "resetRelatedVulnerabilities", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTags() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceType() {
        software.amazon.jsii.Kernel.call(this, "resetResourceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSeverity() {
        software.amazon.jsii.Kernel.call(this, "resetSeverity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTitle() {
        software.amazon.jsii.Kernel.call(this, "resetTitle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetUpdatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVendorSeverity() {
        software.amazon.jsii.Kernel.call(this, "resetVendorSeverity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVulnerabilityId() {
        software.amazon.jsii.Kernel.call(this, "resetVulnerabilityId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVulnerabilitySource() {
        software.amazon.jsii.Kernel.call(this, "resetVulnerabilitySource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVulnerablePackages() {
        software.amazon.jsii.Kernel.call(this, "resetVulnerablePackages", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaAwsAccountIdList getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaAwsAccountIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList getCodeVulnerabilityDetectorName() {
        return software.amazon.jsii.Kernel.get(this, "codeVulnerabilityDetectorName", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList getCodeVulnerabilityDetectorTags() {
        return software.amazon.jsii.Kernel.get(this, "codeVulnerabilityDetectorTags", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList getCodeVulnerabilityFilePath() {
        return software.amazon.jsii.Kernel.get(this, "codeVulnerabilityFilePath", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentIdList getComponentId() {
        return software.amazon.jsii.Kernel.get(this, "componentId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentTypeList getComponentType() {
        return software.amazon.jsii.Kernel.get(this, "componentType", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaComponentTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceImageIdList getEc2InstanceImageId() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceImageId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceImageIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList getEc2InstanceSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceSubnetId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceVpcIdList getEc2InstanceVpcId() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceVpcId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEc2InstanceVpcIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageArchitectureList getEcrImageArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageArchitecture", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageArchitectureList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageHashList getEcrImageHash() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageHash", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageHashList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImagePushedAtList getEcrImagePushedAt() {
        return software.amazon.jsii.Kernel.get(this, "ecrImagePushedAt", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImagePushedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRegistryList getEcrImageRegistry() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageRegistry", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRegistryList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRepositoryNameList getEcrImageRepositoryName() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageRepositoryName", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageRepositoryNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageTagsList getEcrImageTags() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageTags", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEcrImageTagsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEpssScoreList getEpssScore() {
        return software.amazon.jsii.Kernel.get(this, "epssScore", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaEpssScoreList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaExploitAvailableList getExploitAvailable() {
        return software.amazon.jsii.Kernel.get(this, "exploitAvailable", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaExploitAvailableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingArnList getFindingArn() {
        return software.amazon.jsii.Kernel.get(this, "findingArn", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingStatusList getFindingStatus() {
        return software.amazon.jsii.Kernel.get(this, "findingStatus", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingStatusList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingTypeList getFindingType() {
        return software.amazon.jsii.Kernel.get(this, "findingType", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFindingTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAtList getFirstObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "firstObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFixAvailableList getFixAvailable() {
        return software.amazon.jsii.Kernel.get(this, "fixAvailable", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFixAvailableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaInspectorScoreList getInspectorScore() {
        return software.amazon.jsii.Kernel.get(this, "inspectorScore", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaInspectorScoreList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList getLambdaFunctionExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionExecutionRoleArn", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList getLambdaFunctionLastModifiedAt() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionLastModifiedAt", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLayersList getLambdaFunctionLayers() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionLayers", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionLayersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionNameList getLambdaFunctionName() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionName", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList getLambdaFunctionRuntime() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionRuntime", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLastObservedAtList getLastObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "lastObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaLastObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaNetworkProtocolList getNetworkProtocol() {
        return software.amazon.jsii.Kernel.get(this, "networkProtocol", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaNetworkProtocolList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaPortRangeList getPortRange() {
        return software.amazon.jsii.Kernel.get(this, "portRange", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaPortRangeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList getRelatedVulnerabilities() {
        return software.amazon.jsii.Kernel.get(this, "relatedVulnerabilities", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceIdList getResourceId() {
        return software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTagsList getResourceTags() {
        return software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTagsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTypeList getResourceType() {
        return software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaResourceTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaSeverityList getSeverity() {
        return software.amazon.jsii.Kernel.get(this, "severity", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaSeverityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaTitleList getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaTitleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaUpdatedAtList getUpdatedAt() {
        return software.amazon.jsii.Kernel.get(this, "updatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaUpdatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVendorSeverityList getVendorSeverity() {
        return software.amazon.jsii.Kernel.get(this, "vendorSeverity", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVendorSeverityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilityIdList getVulnerabilityId() {
        return software.amazon.jsii.Kernel.get(this, "vulnerabilityId", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilityIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilitySourceList getVulnerabilitySource() {
        return software.amazon.jsii.Kernel.get(this, "vulnerabilitySource", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerabilitySourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesList getVulnerablePackages() {
        return software.amazon.jsii.Kernel.get(this, "vulnerablePackages", software.amazon.jsii.NativeType.forClass(imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCodeVulnerabilityDetectorNameInput() {
        return software.amazon.jsii.Kernel.get(this, "codeVulnerabilityDetectorNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCodeVulnerabilityDetectorTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "codeVulnerabilityDetectorTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCodeVulnerabilityFilePathInput() {
        return software.amazon.jsii.Kernel.get(this, "codeVulnerabilityFilePathInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getComponentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "componentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getComponentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "componentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2InstanceImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceImageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2InstanceSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceSubnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEc2InstanceVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceVpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrImageArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageArchitectureInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrImageHashInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageHashInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrImagePushedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImagePushedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrImageRegistryInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageRegistryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrImageRepositoryNameInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageRepositoryNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEcrImageTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrImageTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEpssScoreInput() {
        return software.amazon.jsii.Kernel.get(this, "epssScoreInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExploitAvailableInput() {
        return software.amazon.jsii.Kernel.get(this, "exploitAvailableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingArnInput() {
        return software.amazon.jsii.Kernel.get(this, "findingArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "findingStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "findingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFirstObservedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "firstObservedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFixAvailableInput() {
        return software.amazon.jsii.Kernel.get(this, "fixAvailableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInspectorScoreInput() {
        return software.amazon.jsii.Kernel.get(this, "inspectorScoreInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunctionExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionExecutionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunctionLastModifiedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionLastModifiedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunctionLayersInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionLayersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunctionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLambdaFunctionRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionRuntimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLastObservedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "lastObservedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "networkProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPortRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "portRangeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRelatedVulnerabilitiesInput() {
        return software.amazon.jsii.Kernel.get(this, "relatedVulnerabilitiesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSeverityInput() {
        return software.amazon.jsii.Kernel.get(this, "severityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTitleInput() {
        return software.amazon.jsii.Kernel.get(this, "titleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUpdatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "updatedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVendorSeverityInput() {
        return software.amazon.jsii.Kernel.get(this, "vendorSeverityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVulnerabilityIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vulnerabilityIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVulnerabilitySourceInput() {
        return software.amazon.jsii.Kernel.get(this, "vulnerabilitySourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVulnerablePackagesInput() {
        return software.amazon.jsii.Kernel.get(this, "vulnerablePackagesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.inspector2_filter.Inspector2FilterFilterCriteria value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
