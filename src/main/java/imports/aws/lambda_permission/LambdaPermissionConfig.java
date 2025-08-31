package imports.aws.lambda_permission;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.512Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaPermission.LambdaPermissionConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaPermissionConfig.Jsii$Proxy.class)
public interface LambdaPermissionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#action LambdaPermission#action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_name LambdaPermission#function_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFunctionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal LambdaPermission#principal}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrincipal();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#event_source_token LambdaPermission#event_source_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventSourceToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_url_auth_type LambdaPermission#function_url_auth_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFunctionUrlAuthType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#id LambdaPermission#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal_org_id LambdaPermission#principal_org_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrincipalOrgId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#qualifier LambdaPermission#qualifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getQualifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_account LambdaPermission#source_account}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceAccount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_arn LambdaPermission#source_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id LambdaPermission#statement_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatementId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id_prefix LambdaPermission#statement_id_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatementIdPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaPermissionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaPermissionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaPermissionConfig> {
        java.lang.String action;
        java.lang.String functionName;
        java.lang.String principal;
        java.lang.String eventSourceToken;
        java.lang.String functionUrlAuthType;
        java.lang.String id;
        java.lang.String principalOrgId;
        java.lang.String qualifier;
        java.lang.String sourceAccount;
        java.lang.String sourceArn;
        java.lang.String statementId;
        java.lang.String statementIdPrefix;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LambdaPermissionConfig#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#action LambdaPermission#action}. This parameter is required.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getFunctionName}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_name LambdaPermission#function_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder functionName(java.lang.String functionName) {
            this.functionName = functionName;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getPrincipal}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal LambdaPermission#principal}. This parameter is required.
         * @return {@code this}
         */
        public Builder principal(java.lang.String principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getEventSourceToken}
         * @param eventSourceToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#event_source_token LambdaPermission#event_source_token}.
         * @return {@code this}
         */
        public Builder eventSourceToken(java.lang.String eventSourceToken) {
            this.eventSourceToken = eventSourceToken;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getFunctionUrlAuthType}
         * @param functionUrlAuthType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_url_auth_type LambdaPermission#function_url_auth_type}.
         * @return {@code this}
         */
        public Builder functionUrlAuthType(java.lang.String functionUrlAuthType) {
            this.functionUrlAuthType = functionUrlAuthType;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#id LambdaPermission#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getPrincipalOrgId}
         * @param principalOrgId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal_org_id LambdaPermission#principal_org_id}.
         * @return {@code this}
         */
        public Builder principalOrgId(java.lang.String principalOrgId) {
            this.principalOrgId = principalOrgId;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getQualifier}
         * @param qualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#qualifier LambdaPermission#qualifier}.
         * @return {@code this}
         */
        public Builder qualifier(java.lang.String qualifier) {
            this.qualifier = qualifier;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getSourceAccount}
         * @param sourceAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_account LambdaPermission#source_account}.
         * @return {@code this}
         */
        public Builder sourceAccount(java.lang.String sourceAccount) {
            this.sourceAccount = sourceAccount;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getSourceArn}
         * @param sourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_arn LambdaPermission#source_arn}.
         * @return {@code this}
         */
        public Builder sourceArn(java.lang.String sourceArn) {
            this.sourceArn = sourceArn;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getStatementId}
         * @param statementId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id LambdaPermission#statement_id}.
         * @return {@code this}
         */
        public Builder statementId(java.lang.String statementId) {
            this.statementId = statementId;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getStatementIdPrefix}
         * @param statementIdPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id_prefix LambdaPermission#statement_id_prefix}.
         * @return {@code this}
         */
        public Builder statementIdPrefix(java.lang.String statementIdPrefix) {
            this.statementIdPrefix = statementIdPrefix;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LambdaPermissionConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaPermissionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaPermissionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaPermissionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaPermissionConfig {
        private final java.lang.String action;
        private final java.lang.String functionName;
        private final java.lang.String principal;
        private final java.lang.String eventSourceToken;
        private final java.lang.String functionUrlAuthType;
        private final java.lang.String id;
        private final java.lang.String principalOrgId;
        private final java.lang.String qualifier;
        private final java.lang.String sourceAccount;
        private final java.lang.String sourceArn;
        private final java.lang.String statementId;
        private final java.lang.String statementIdPrefix;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.functionName = software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.principal = software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventSourceToken = software.amazon.jsii.Kernel.get(this, "eventSourceToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.functionUrlAuthType = software.amazon.jsii.Kernel.get(this, "functionUrlAuthType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.principalOrgId = software.amazon.jsii.Kernel.get(this, "principalOrgId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.qualifier = software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceAccount = software.amazon.jsii.Kernel.get(this, "sourceAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceArn = software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statementId = software.amazon.jsii.Kernel.get(this, "statementId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statementIdPrefix = software.amazon.jsii.Kernel.get(this, "statementIdPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.functionName = java.util.Objects.requireNonNull(builder.functionName, "functionName is required");
            this.principal = java.util.Objects.requireNonNull(builder.principal, "principal is required");
            this.eventSourceToken = builder.eventSourceToken;
            this.functionUrlAuthType = builder.functionUrlAuthType;
            this.id = builder.id;
            this.principalOrgId = builder.principalOrgId;
            this.qualifier = builder.qualifier;
            this.sourceAccount = builder.sourceAccount;
            this.sourceArn = builder.sourceArn;
            this.statementId = builder.statementId;
            this.statementIdPrefix = builder.statementIdPrefix;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getFunctionName() {
            return this.functionName;
        }

        @Override
        public final java.lang.String getPrincipal() {
            return this.principal;
        }

        @Override
        public final java.lang.String getEventSourceToken() {
            return this.eventSourceToken;
        }

        @Override
        public final java.lang.String getFunctionUrlAuthType() {
            return this.functionUrlAuthType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPrincipalOrgId() {
            return this.principalOrgId;
        }

        @Override
        public final java.lang.String getQualifier() {
            return this.qualifier;
        }

        @Override
        public final java.lang.String getSourceAccount() {
            return this.sourceAccount;
        }

        @Override
        public final java.lang.String getSourceArn() {
            return this.sourceArn;
        }

        @Override
        public final java.lang.String getStatementId() {
            return this.statementId;
        }

        @Override
        public final java.lang.String getStatementIdPrefix() {
            return this.statementIdPrefix;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("functionName", om.valueToTree(this.getFunctionName()));
            data.set("principal", om.valueToTree(this.getPrincipal()));
            if (this.getEventSourceToken() != null) {
                data.set("eventSourceToken", om.valueToTree(this.getEventSourceToken()));
            }
            if (this.getFunctionUrlAuthType() != null) {
                data.set("functionUrlAuthType", om.valueToTree(this.getFunctionUrlAuthType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPrincipalOrgId() != null) {
                data.set("principalOrgId", om.valueToTree(this.getPrincipalOrgId()));
            }
            if (this.getQualifier() != null) {
                data.set("qualifier", om.valueToTree(this.getQualifier()));
            }
            if (this.getSourceAccount() != null) {
                data.set("sourceAccount", om.valueToTree(this.getSourceAccount()));
            }
            if (this.getSourceArn() != null) {
                data.set("sourceArn", om.valueToTree(this.getSourceArn()));
            }
            if (this.getStatementId() != null) {
                data.set("statementId", om.valueToTree(this.getStatementId()));
            }
            if (this.getStatementIdPrefix() != null) {
                data.set("statementIdPrefix", om.valueToTree(this.getStatementIdPrefix()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaPermission.LambdaPermissionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaPermissionConfig.Jsii$Proxy that = (LambdaPermissionConfig.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!functionName.equals(that.functionName)) return false;
            if (!principal.equals(that.principal)) return false;
            if (this.eventSourceToken != null ? !this.eventSourceToken.equals(that.eventSourceToken) : that.eventSourceToken != null) return false;
            if (this.functionUrlAuthType != null ? !this.functionUrlAuthType.equals(that.functionUrlAuthType) : that.functionUrlAuthType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.principalOrgId != null ? !this.principalOrgId.equals(that.principalOrgId) : that.principalOrgId != null) return false;
            if (this.qualifier != null ? !this.qualifier.equals(that.qualifier) : that.qualifier != null) return false;
            if (this.sourceAccount != null ? !this.sourceAccount.equals(that.sourceAccount) : that.sourceAccount != null) return false;
            if (this.sourceArn != null ? !this.sourceArn.equals(that.sourceArn) : that.sourceArn != null) return false;
            if (this.statementId != null ? !this.statementId.equals(that.statementId) : that.statementId != null) return false;
            if (this.statementIdPrefix != null ? !this.statementIdPrefix.equals(that.statementIdPrefix) : that.statementIdPrefix != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.functionName.hashCode());
            result = 31 * result + (this.principal.hashCode());
            result = 31 * result + (this.eventSourceToken != null ? this.eventSourceToken.hashCode() : 0);
            result = 31 * result + (this.functionUrlAuthType != null ? this.functionUrlAuthType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.principalOrgId != null ? this.principalOrgId.hashCode() : 0);
            result = 31 * result + (this.qualifier != null ? this.qualifier.hashCode() : 0);
            result = 31 * result + (this.sourceAccount != null ? this.sourceAccount.hashCode() : 0);
            result = 31 * result + (this.sourceArn != null ? this.sourceArn.hashCode() : 0);
            result = 31 * result + (this.statementId != null ? this.statementId.hashCode() : 0);
            result = 31 * result + (this.statementIdPrefix != null ? this.statementIdPrefix.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
