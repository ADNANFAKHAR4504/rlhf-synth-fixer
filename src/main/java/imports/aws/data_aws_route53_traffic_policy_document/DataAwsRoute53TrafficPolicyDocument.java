package imports.aws.data_aws_route53_traffic_policy_document;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document aws_route53_traffic_policy_document}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.836Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocument")
public class DataAwsRoute53TrafficPolicyDocument extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsRoute53TrafficPolicyDocument(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute53TrafficPolicyDocument(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document aws_route53_traffic_policy_document} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsRoute53TrafficPolicyDocument(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document aws_route53_traffic_policy_document} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsRoute53TrafficPolicyDocument(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRoute53TrafficPolicyDocument resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRoute53TrafficPolicyDocument to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRoute53TrafficPolicyDocument that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsRoute53TrafficPolicyDocument to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRoute53TrafficPolicyDocument resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRoute53TrafficPolicyDocument to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRoute53TrafficPolicyDocument that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEndpoint(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpoint>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpoint> __cast_cd4240 = (java.util.List<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpoint>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpoint __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEndpoint", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRule> __cast_cd4240 = (java.util.List<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordType() {
        software.amazon.jsii.Kernel.call(this, "resetRecordType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRule() {
        software.amazon.jsii.Kernel.call(this, "resetRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetStartEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartRule() {
        software.amazon.jsii.Kernel.call(this, "resetStartRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpointList getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpointList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJson() {
        return software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleList getRule() {
        return software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "recordTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "startEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "startRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordType() {
        return software.amazon.jsii.Kernel.get(this, "recordType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordType", java.util.Objects.requireNonNull(value, "recordType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "startEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startEndpoint", java.util.Objects.requireNonNull(value, "startEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartRule() {
        return software.amazon.jsii.Kernel.get(this, "startRule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartRule(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startRule", java.util.Objects.requireNonNull(value, "startRule is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * endpoint block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint DataAwsRoute53TrafficPolicyDocument#endpoint}
         * <p>
         * @return {@code this}
         * @param endpoint endpoint block. This parameter is required.
         */
        public Builder endpoint(final com.hashicorp.cdktf.IResolvable endpoint) {
            this.config().endpoint(endpoint);
            return this;
        }
        /**
         * endpoint block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint DataAwsRoute53TrafficPolicyDocument#endpoint}
         * <p>
         * @return {@code this}
         * @param endpoint endpoint block. This parameter is required.
         */
        public Builder endpoint(final java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpoint> endpoint) {
            this.config().endpoint(endpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#id DataAwsRoute53TrafficPolicyDocument#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#id DataAwsRoute53TrafficPolicyDocument#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#record_type DataAwsRoute53TrafficPolicyDocument#record_type}.
         * <p>
         * @return {@code this}
         * @param recordType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#record_type DataAwsRoute53TrafficPolicyDocument#record_type}. This parameter is required.
         */
        public Builder recordType(final java.lang.String recordType) {
            this.config().recordType(recordType);
            return this;
        }

        /**
         * rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule DataAwsRoute53TrafficPolicyDocument#rule}
         * <p>
         * @return {@code this}
         * @param rule rule block. This parameter is required.
         */
        public Builder rule(final com.hashicorp.cdktf.IResolvable rule) {
            this.config().rule(rule);
            return this;
        }
        /**
         * rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule DataAwsRoute53TrafficPolicyDocument#rule}
         * <p>
         * @return {@code this}
         * @param rule rule block. This parameter is required.
         */
        public Builder rule(final java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRule> rule) {
            this.config().rule(rule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_endpoint DataAwsRoute53TrafficPolicyDocument#start_endpoint}.
         * <p>
         * @return {@code this}
         * @param startEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_endpoint DataAwsRoute53TrafficPolicyDocument#start_endpoint}. This parameter is required.
         */
        public Builder startEndpoint(final java.lang.String startEndpoint) {
            this.config().startEndpoint(startEndpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_rule DataAwsRoute53TrafficPolicyDocument#start_rule}.
         * <p>
         * @return {@code this}
         * @param startRule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_rule DataAwsRoute53TrafficPolicyDocument#start_rule}. This parameter is required.
         */
        public Builder startRule(final java.lang.String startRule) {
            this.config().startRule(startRule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#version DataAwsRoute53TrafficPolicyDocument#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#version DataAwsRoute53TrafficPolicyDocument#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config().version(version);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument}.
         */
        @Override
        public imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument build() {
            return new imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocument(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentConfig.Builder();
            }
            return this.config;
        }
    }
}
