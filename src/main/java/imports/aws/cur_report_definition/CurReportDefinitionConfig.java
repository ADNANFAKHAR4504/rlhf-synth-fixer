package imports.aws.cur_report_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.399Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.curReportDefinition.CurReportDefinitionConfig")
@software.amazon.jsii.Jsii.Proxy(CurReportDefinitionConfig.Jsii$Proxy.class)
public interface CurReportDefinitionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#additional_schema_elements CurReportDefinition#additional_schema_elements}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdditionalSchemaElements();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#compression CurReportDefinition#compression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCompression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#format CurReportDefinition#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#report_name CurReportDefinition#report_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReportName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#s3_bucket CurReportDefinition#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#s3_region CurReportDefinition#s3_region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Region();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#time_unit CurReportDefinition#time_unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTimeUnit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#additional_artifacts CurReportDefinition#additional_artifacts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalArtifacts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#id CurReportDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#refresh_closed_reports CurReportDefinition#refresh_closed_reports}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRefreshClosedReports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#report_versioning CurReportDefinition#report_versioning}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReportVersioning() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#s3_prefix CurReportDefinition#s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Prefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#tags CurReportDefinition#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#tags_all CurReportDefinition#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CurReportDefinitionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CurReportDefinitionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CurReportDefinitionConfig> {
        java.util.List<java.lang.String> additionalSchemaElements;
        java.lang.String compression;
        java.lang.String format;
        java.lang.String reportName;
        java.lang.String s3Bucket;
        java.lang.String s3Region;
        java.lang.String timeUnit;
        java.util.List<java.lang.String> additionalArtifacts;
        java.lang.String id;
        java.lang.Object refreshClosedReports;
        java.lang.String reportVersioning;
        java.lang.String s3Prefix;
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
         * Sets the value of {@link CurReportDefinitionConfig#getAdditionalSchemaElements}
         * @param additionalSchemaElements Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#additional_schema_elements CurReportDefinition#additional_schema_elements}. This parameter is required.
         * @return {@code this}
         */
        public Builder additionalSchemaElements(java.util.List<java.lang.String> additionalSchemaElements) {
            this.additionalSchemaElements = additionalSchemaElements;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getCompression}
         * @param compression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#compression CurReportDefinition#compression}. This parameter is required.
         * @return {@code this}
         */
        public Builder compression(java.lang.String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#format CurReportDefinition#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getReportName}
         * @param reportName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#report_name CurReportDefinition#report_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder reportName(java.lang.String reportName) {
            this.reportName = reportName;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#s3_bucket CurReportDefinition#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getS3Region}
         * @param s3Region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#s3_region CurReportDefinition#s3_region}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Region(java.lang.String s3Region) {
            this.s3Region = s3Region;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getTimeUnit}
         * @param timeUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#time_unit CurReportDefinition#time_unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeUnit(java.lang.String timeUnit) {
            this.timeUnit = timeUnit;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getAdditionalArtifacts}
         * @param additionalArtifacts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#additional_artifacts CurReportDefinition#additional_artifacts}.
         * @return {@code this}
         */
        public Builder additionalArtifacts(java.util.List<java.lang.String> additionalArtifacts) {
            this.additionalArtifacts = additionalArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#id CurReportDefinition#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getRefreshClosedReports}
         * @param refreshClosedReports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#refresh_closed_reports CurReportDefinition#refresh_closed_reports}.
         * @return {@code this}
         */
        public Builder refreshClosedReports(java.lang.Boolean refreshClosedReports) {
            this.refreshClosedReports = refreshClosedReports;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getRefreshClosedReports}
         * @param refreshClosedReports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#refresh_closed_reports CurReportDefinition#refresh_closed_reports}.
         * @return {@code this}
         */
        public Builder refreshClosedReports(com.hashicorp.cdktf.IResolvable refreshClosedReports) {
            this.refreshClosedReports = refreshClosedReports;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getReportVersioning}
         * @param reportVersioning Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#report_versioning CurReportDefinition#report_versioning}.
         * @return {@code this}
         */
        public Builder reportVersioning(java.lang.String reportVersioning) {
            this.reportVersioning = reportVersioning;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getS3Prefix}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#s3_prefix CurReportDefinition#s3_prefix}.
         * @return {@code this}
         */
        public Builder s3Prefix(java.lang.String s3Prefix) {
            this.s3Prefix = s3Prefix;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#tags CurReportDefinition#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cur_report_definition#tags_all CurReportDefinition#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getDependsOn}
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
         * Sets the value of {@link CurReportDefinitionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CurReportDefinitionConfig#getProvisioners}
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
         * @return a new instance of {@link CurReportDefinitionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CurReportDefinitionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CurReportDefinitionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CurReportDefinitionConfig {
        private final java.util.List<java.lang.String> additionalSchemaElements;
        private final java.lang.String compression;
        private final java.lang.String format;
        private final java.lang.String reportName;
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Region;
        private final java.lang.String timeUnit;
        private final java.util.List<java.lang.String> additionalArtifacts;
        private final java.lang.String id;
        private final java.lang.Object refreshClosedReports;
        private final java.lang.String reportVersioning;
        private final java.lang.String s3Prefix;
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
            this.additionalSchemaElements = software.amazon.jsii.Kernel.get(this, "additionalSchemaElements", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.compression = software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.reportName = software.amazon.jsii.Kernel.get(this, "reportName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Region = software.amazon.jsii.Kernel.get(this, "s3Region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeUnit = software.amazon.jsii.Kernel.get(this, "timeUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalArtifacts = software.amazon.jsii.Kernel.get(this, "additionalArtifacts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.refreshClosedReports = software.amazon.jsii.Kernel.get(this, "refreshClosedReports", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.reportVersioning = software.amazon.jsii.Kernel.get(this, "reportVersioning", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Prefix = software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.additionalSchemaElements = java.util.Objects.requireNonNull(builder.additionalSchemaElements, "additionalSchemaElements is required");
            this.compression = java.util.Objects.requireNonNull(builder.compression, "compression is required");
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
            this.reportName = java.util.Objects.requireNonNull(builder.reportName, "reportName is required");
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.s3Region = java.util.Objects.requireNonNull(builder.s3Region, "s3Region is required");
            this.timeUnit = java.util.Objects.requireNonNull(builder.timeUnit, "timeUnit is required");
            this.additionalArtifacts = builder.additionalArtifacts;
            this.id = builder.id;
            this.refreshClosedReports = builder.refreshClosedReports;
            this.reportVersioning = builder.reportVersioning;
            this.s3Prefix = builder.s3Prefix;
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
        public final java.util.List<java.lang.String> getAdditionalSchemaElements() {
            return this.additionalSchemaElements;
        }

        @Override
        public final java.lang.String getCompression() {
            return this.compression;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getReportName() {
            return this.reportName;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final java.lang.String getS3Region() {
            return this.s3Region;
        }

        @Override
        public final java.lang.String getTimeUnit() {
            return this.timeUnit;
        }

        @Override
        public final java.util.List<java.lang.String> getAdditionalArtifacts() {
            return this.additionalArtifacts;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getRefreshClosedReports() {
            return this.refreshClosedReports;
        }

        @Override
        public final java.lang.String getReportVersioning() {
            return this.reportVersioning;
        }

        @Override
        public final java.lang.String getS3Prefix() {
            return this.s3Prefix;
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

            data.set("additionalSchemaElements", om.valueToTree(this.getAdditionalSchemaElements()));
            data.set("compression", om.valueToTree(this.getCompression()));
            data.set("format", om.valueToTree(this.getFormat()));
            data.set("reportName", om.valueToTree(this.getReportName()));
            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            data.set("s3Region", om.valueToTree(this.getS3Region()));
            data.set("timeUnit", om.valueToTree(this.getTimeUnit()));
            if (this.getAdditionalArtifacts() != null) {
                data.set("additionalArtifacts", om.valueToTree(this.getAdditionalArtifacts()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRefreshClosedReports() != null) {
                data.set("refreshClosedReports", om.valueToTree(this.getRefreshClosedReports()));
            }
            if (this.getReportVersioning() != null) {
                data.set("reportVersioning", om.valueToTree(this.getReportVersioning()));
            }
            if (this.getS3Prefix() != null) {
                data.set("s3Prefix", om.valueToTree(this.getS3Prefix()));
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
            struct.set("fqn", om.valueToTree("aws.curReportDefinition.CurReportDefinitionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CurReportDefinitionConfig.Jsii$Proxy that = (CurReportDefinitionConfig.Jsii$Proxy) o;

            if (!additionalSchemaElements.equals(that.additionalSchemaElements)) return false;
            if (!compression.equals(that.compression)) return false;
            if (!format.equals(that.format)) return false;
            if (!reportName.equals(that.reportName)) return false;
            if (!s3Bucket.equals(that.s3Bucket)) return false;
            if (!s3Region.equals(that.s3Region)) return false;
            if (!timeUnit.equals(that.timeUnit)) return false;
            if (this.additionalArtifacts != null ? !this.additionalArtifacts.equals(that.additionalArtifacts) : that.additionalArtifacts != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.refreshClosedReports != null ? !this.refreshClosedReports.equals(that.refreshClosedReports) : that.refreshClosedReports != null) return false;
            if (this.reportVersioning != null ? !this.reportVersioning.equals(that.reportVersioning) : that.reportVersioning != null) return false;
            if (this.s3Prefix != null ? !this.s3Prefix.equals(that.s3Prefix) : that.s3Prefix != null) return false;
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
            int result = this.additionalSchemaElements.hashCode();
            result = 31 * result + (this.compression.hashCode());
            result = 31 * result + (this.format.hashCode());
            result = 31 * result + (this.reportName.hashCode());
            result = 31 * result + (this.s3Bucket.hashCode());
            result = 31 * result + (this.s3Region.hashCode());
            result = 31 * result + (this.timeUnit.hashCode());
            result = 31 * result + (this.additionalArtifacts != null ? this.additionalArtifacts.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.refreshClosedReports != null ? this.refreshClosedReports.hashCode() : 0);
            result = 31 * result + (this.reportVersioning != null ? this.reportVersioning.hashCode() : 0);
            result = 31 * result + (this.s3Prefix != null ? this.s3Prefix.hashCode() : 0);
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
