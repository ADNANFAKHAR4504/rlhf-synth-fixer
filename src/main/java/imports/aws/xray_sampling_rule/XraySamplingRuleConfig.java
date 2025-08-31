package imports.aws.xray_sampling_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.697Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.xraySamplingRule.XraySamplingRuleConfig")
@software.amazon.jsii.Jsii.Proxy(XraySamplingRuleConfig.Jsii$Proxy.class)
public interface XraySamplingRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#fixed_rate XraySamplingRule#fixed_rate}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFixedRate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#host XraySamplingRule#host}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHost();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#http_method XraySamplingRule#http_method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#priority XraySamplingRule#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#reservoir_size XraySamplingRule#reservoir_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getReservoirSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#resource_arn XraySamplingRule#resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#service_name XraySamplingRule#service_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#service_type XraySamplingRule#service_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#url_path XraySamplingRule#url_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUrlPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#version XraySamplingRule#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#attributes XraySamplingRule#attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#id XraySamplingRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#rule_name XraySamplingRule#rule_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#tags XraySamplingRule#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#tags_all XraySamplingRule#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link XraySamplingRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link XraySamplingRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<XraySamplingRuleConfig> {
        java.lang.Number fixedRate;
        java.lang.String host;
        java.lang.String httpMethod;
        java.lang.Number priority;
        java.lang.Number reservoirSize;
        java.lang.String resourceArn;
        java.lang.String serviceName;
        java.lang.String serviceType;
        java.lang.String urlPath;
        java.lang.Number version;
        java.util.Map<java.lang.String, java.lang.String> attributes;
        java.lang.String id;
        java.lang.String ruleName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getFixedRate}
         * @param fixedRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#fixed_rate XraySamplingRule#fixed_rate}. This parameter is required.
         * @return {@code this}
         */
        public Builder fixedRate(java.lang.Number fixedRate) {
            this.fixedRate = fixedRate;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#host XraySamplingRule#host}. This parameter is required.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getHttpMethod}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#http_method XraySamplingRule#http_method}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpMethod(java.lang.String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#priority XraySamplingRule#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getReservoirSize}
         * @param reservoirSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#reservoir_size XraySamplingRule#reservoir_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder reservoirSize(java.lang.Number reservoirSize) {
            this.reservoirSize = reservoirSize;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#resource_arn XraySamplingRule#resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#service_name XraySamplingRule#service_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getServiceType}
         * @param serviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#service_type XraySamplingRule#service_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceType(java.lang.String serviceType) {
            this.serviceType = serviceType;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getUrlPath}
         * @param urlPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#url_path XraySamplingRule#url_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder urlPath(java.lang.String urlPath) {
            this.urlPath = urlPath;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#version XraySamplingRule#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.Number version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getAttributes}
         * @param attributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#attributes XraySamplingRule#attributes}.
         * @return {@code this}
         */
        public Builder attributes(java.util.Map<java.lang.String, java.lang.String> attributes) {
            this.attributes = attributes;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#id XraySamplingRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getRuleName}
         * @param ruleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#rule_name XraySamplingRule#rule_name}.
         * @return {@code this}
         */
        public Builder ruleName(java.lang.String ruleName) {
            this.ruleName = ruleName;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#tags XraySamplingRule#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_sampling_rule#tags_all XraySamplingRule#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getDependsOn}
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
         * Sets the value of {@link XraySamplingRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link XraySamplingRuleConfig#getProvisioners}
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
         * @return a new instance of {@link XraySamplingRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public XraySamplingRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link XraySamplingRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements XraySamplingRuleConfig {
        private final java.lang.Number fixedRate;
        private final java.lang.String host;
        private final java.lang.String httpMethod;
        private final java.lang.Number priority;
        private final java.lang.Number reservoirSize;
        private final java.lang.String resourceArn;
        private final java.lang.String serviceName;
        private final java.lang.String serviceType;
        private final java.lang.String urlPath;
        private final java.lang.Number version;
        private final java.util.Map<java.lang.String, java.lang.String> attributes;
        private final java.lang.String id;
        private final java.lang.String ruleName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.fixedRate = software.amazon.jsii.Kernel.get(this, "fixedRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpMethod = software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.reservoirSize = software.amazon.jsii.Kernel.get(this, "reservoirSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceType = software.amazon.jsii.Kernel.get(this, "serviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.urlPath = software.amazon.jsii.Kernel.get(this, "urlPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.attributes = software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleName = software.amazon.jsii.Kernel.get(this, "ruleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.fixedRate = java.util.Objects.requireNonNull(builder.fixedRate, "fixedRate is required");
            this.host = java.util.Objects.requireNonNull(builder.host, "host is required");
            this.httpMethod = java.util.Objects.requireNonNull(builder.httpMethod, "httpMethod is required");
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.reservoirSize = java.util.Objects.requireNonNull(builder.reservoirSize, "reservoirSize is required");
            this.resourceArn = java.util.Objects.requireNonNull(builder.resourceArn, "resourceArn is required");
            this.serviceName = java.util.Objects.requireNonNull(builder.serviceName, "serviceName is required");
            this.serviceType = java.util.Objects.requireNonNull(builder.serviceType, "serviceType is required");
            this.urlPath = java.util.Objects.requireNonNull(builder.urlPath, "urlPath is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.attributes = builder.attributes;
            this.id = builder.id;
            this.ruleName = builder.ruleName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getFixedRate() {
            return this.fixedRate;
        }

        @Override
        public final java.lang.String getHost() {
            return this.host;
        }

        @Override
        public final java.lang.String getHttpMethod() {
            return this.httpMethod;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.Number getReservoirSize() {
            return this.reservoirSize;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        public final java.lang.String getServiceType() {
            return this.serviceType;
        }

        @Override
        public final java.lang.String getUrlPath() {
            return this.urlPath;
        }

        @Override
        public final java.lang.Number getVersion() {
            return this.version;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAttributes() {
            return this.attributes;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getRuleName() {
            return this.ruleName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("fixedRate", om.valueToTree(this.getFixedRate()));
            data.set("host", om.valueToTree(this.getHost()));
            data.set("httpMethod", om.valueToTree(this.getHttpMethod()));
            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("reservoirSize", om.valueToTree(this.getReservoirSize()));
            data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            data.set("serviceName", om.valueToTree(this.getServiceName()));
            data.set("serviceType", om.valueToTree(this.getServiceType()));
            data.set("urlPath", om.valueToTree(this.getUrlPath()));
            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getAttributes() != null) {
                data.set("attributes", om.valueToTree(this.getAttributes()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRuleName() != null) {
                data.set("ruleName", om.valueToTree(this.getRuleName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.xraySamplingRule.XraySamplingRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            XraySamplingRuleConfig.Jsii$Proxy that = (XraySamplingRuleConfig.Jsii$Proxy) o;

            if (!fixedRate.equals(that.fixedRate)) return false;
            if (!host.equals(that.host)) return false;
            if (!httpMethod.equals(that.httpMethod)) return false;
            if (!priority.equals(that.priority)) return false;
            if (!reservoirSize.equals(that.reservoirSize)) return false;
            if (!resourceArn.equals(that.resourceArn)) return false;
            if (!serviceName.equals(that.serviceName)) return false;
            if (!serviceType.equals(that.serviceType)) return false;
            if (!urlPath.equals(that.urlPath)) return false;
            if (!version.equals(that.version)) return false;
            if (this.attributes != null ? !this.attributes.equals(that.attributes) : that.attributes != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ruleName != null ? !this.ruleName.equals(that.ruleName) : that.ruleName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.fixedRate.hashCode();
            result = 31 * result + (this.host.hashCode());
            result = 31 * result + (this.httpMethod.hashCode());
            result = 31 * result + (this.priority.hashCode());
            result = 31 * result + (this.reservoirSize.hashCode());
            result = 31 * result + (this.resourceArn.hashCode());
            result = 31 * result + (this.serviceName.hashCode());
            result = 31 * result + (this.serviceType.hashCode());
            result = 31 * result + (this.urlPath.hashCode());
            result = 31 * result + (this.version.hashCode());
            result = 31 * result + (this.attributes != null ? this.attributes.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ruleName != null ? this.ruleName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
