package imports.aws.api_gateway_rest_api_put;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put aws_api_gateway_rest_api_put}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.958Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayRestApiPut.ApiGatewayRestApiPut")
public class ApiGatewayRestApiPut extends com.hashicorp.cdktf.TerraformResource {

    protected ApiGatewayRestApiPut(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayRestApiPut(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put aws_api_gateway_rest_api_put} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ApiGatewayRestApiPut(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayRestApiPut resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayRestApiPut to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayRestApiPut that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ApiGatewayRestApiPut to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ApiGatewayRestApiPut resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ApiGatewayRestApiPut to import. This parameter is required.
     * @param importFromId The id of the existing ApiGatewayRestApiPut that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFailOnWarnings() {
        software.amazon.jsii.Kernel.call(this, "resetFailOnWarnings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTriggers() {
        software.amazon.jsii.Kernel.call(this, "resetTriggers", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "bodyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFailOnWarningsInput() {
        return software.amazon.jsii.Kernel.get(this, "failOnWarningsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRestApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "restApiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTriggersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "triggersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBody() {
        return software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBody(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "body", java.util.Objects.requireNonNull(value, "body is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFailOnWarnings() {
        return software.amazon.jsii.Kernel.get(this, "failOnWarnings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFailOnWarnings(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "failOnWarnings", java.util.Objects.requireNonNull(value, "failOnWarnings is required"));
    }

    public void setFailOnWarnings(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "failOnWarnings", java.util.Objects.requireNonNull(value, "failOnWarnings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "parameters", java.util.Objects.requireNonNull(value, "parameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRestApiId() {
        return software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRestApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "restApiId", java.util.Objects.requireNonNull(value, "restApiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTriggers() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "triggers", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTriggers(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "triggers", java.util.Objects.requireNonNull(value, "triggers is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut> {
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
        private final imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#body ApiGatewayRestApiPut#body}.
         * <p>
         * @return {@code this}
         * @param body Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#body ApiGatewayRestApiPut#body}. This parameter is required.
         */
        public Builder body(final java.lang.String body) {
            this.config.body(body);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#rest_api_id ApiGatewayRestApiPut#rest_api_id}.
         * <p>
         * @return {@code this}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#rest_api_id ApiGatewayRestApiPut#rest_api_id}. This parameter is required.
         */
        public Builder restApiId(final java.lang.String restApiId) {
            this.config.restApiId(restApiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#fail_on_warnings ApiGatewayRestApiPut#fail_on_warnings}.
         * <p>
         * @return {@code this}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#fail_on_warnings ApiGatewayRestApiPut#fail_on_warnings}. This parameter is required.
         */
        public Builder failOnWarnings(final java.lang.Boolean failOnWarnings) {
            this.config.failOnWarnings(failOnWarnings);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#fail_on_warnings ApiGatewayRestApiPut#fail_on_warnings}.
         * <p>
         * @return {@code this}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#fail_on_warnings ApiGatewayRestApiPut#fail_on_warnings}. This parameter is required.
         */
        public Builder failOnWarnings(final com.hashicorp.cdktf.IResolvable failOnWarnings) {
            this.config.failOnWarnings(failOnWarnings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#parameters ApiGatewayRestApiPut#parameters}.
         * <p>
         * @return {@code this}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#parameters ApiGatewayRestApiPut#parameters}. This parameter is required.
         */
        public Builder parameters(final java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#timeouts ApiGatewayRestApiPut#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPutTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#triggers ApiGatewayRestApiPut#triggers}.
         * <p>
         * @return {@code this}
         * @param triggers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_rest_api_put#triggers ApiGatewayRestApiPut#triggers}. This parameter is required.
         */
        public Builder triggers(final java.util.Map<java.lang.String, java.lang.String> triggers) {
            this.config.triggers(triggers);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut}.
         */
        @Override
        public imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut build() {
            return new imports.aws.api_gateway_rest_api_put.ApiGatewayRestApiPut(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
