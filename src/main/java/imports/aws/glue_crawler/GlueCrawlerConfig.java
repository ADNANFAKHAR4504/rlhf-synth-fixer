package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerConfig")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerConfig.Jsii$Proxy.class)
public interface GlueCrawlerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#database_name GlueCrawler#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#name GlueCrawler#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#role GlueCrawler#role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRole();

    /**
     * catalog_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#catalog_target GlueCrawler#catalog_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCatalogTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#classifiers GlueCrawler#classifiers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClassifiers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#configuration GlueCrawler#configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfiguration() {
        return null;
    }

    /**
     * delta_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delta_target GlueCrawler#delta_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeltaTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#description GlueCrawler#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * dynamodb_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dynamodb_target GlueCrawler#dynamodb_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDynamodbTarget() {
        return null;
    }

    /**
     * hudi_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#hudi_target GlueCrawler#hudi_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHudiTarget() {
        return null;
    }

    /**
     * iceberg_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#iceberg_target GlueCrawler#iceberg_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIcebergTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#id GlueCrawler#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * jdbc_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#jdbc_target GlueCrawler#jdbc_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getJdbcTarget() {
        return null;
    }

    /**
     * lake_formation_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#lake_formation_configuration GlueCrawler#lake_formation_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration getLakeFormationConfiguration() {
        return null;
    }

    /**
     * lineage_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#lineage_configuration GlueCrawler#lineage_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerLineageConfiguration getLineageConfiguration() {
        return null;
    }

    /**
     * mongodb_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#mongodb_target GlueCrawler#mongodb_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMongodbTarget() {
        return null;
    }

    /**
     * recrawl_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#recrawl_policy GlueCrawler#recrawl_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy getRecrawlPolicy() {
        return null;
    }

    /**
     * s3_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#s3_target GlueCrawler#s3_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Target() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#schedule GlueCrawler#schedule}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchedule() {
        return null;
    }

    /**
     * schema_change_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#schema_change_policy GlueCrawler#schema_change_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy getSchemaChangePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#security_configuration GlueCrawler#security_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#table_prefix GlueCrawler#table_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTablePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#tags GlueCrawler#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#tags_all GlueCrawler#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerConfig> {
        java.lang.String databaseName;
        java.lang.String name;
        java.lang.String role;
        java.lang.Object catalogTarget;
        java.util.List<java.lang.String> classifiers;
        java.lang.String configuration;
        java.lang.Object deltaTarget;
        java.lang.String description;
        java.lang.Object dynamodbTarget;
        java.lang.Object hudiTarget;
        java.lang.Object icebergTarget;
        java.lang.String id;
        java.lang.Object jdbcTarget;
        imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration lakeFormationConfiguration;
        imports.aws.glue_crawler.GlueCrawlerLineageConfiguration lineageConfiguration;
        java.lang.Object mongodbTarget;
        imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy recrawlPolicy;
        java.lang.Object s3Target;
        java.lang.String schedule;
        imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy schemaChangePolicy;
        java.lang.String securityConfiguration;
        java.lang.String tablePrefix;
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
         * Sets the value of {@link GlueCrawlerConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#database_name GlueCrawler#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#name GlueCrawler#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getRole}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#role GlueCrawler#role}. This parameter is required.
         * @return {@code this}
         */
        public Builder role(java.lang.String role) {
            this.role = role;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getCatalogTarget}
         * @param catalogTarget catalog_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#catalog_target GlueCrawler#catalog_target}
         * @return {@code this}
         */
        public Builder catalogTarget(com.hashicorp.cdktf.IResolvable catalogTarget) {
            this.catalogTarget = catalogTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getCatalogTarget}
         * @param catalogTarget catalog_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#catalog_target GlueCrawler#catalog_target}
         * @return {@code this}
         */
        public Builder catalogTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerCatalogTarget> catalogTarget) {
            this.catalogTarget = catalogTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getClassifiers}
         * @param classifiers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#classifiers GlueCrawler#classifiers}.
         * @return {@code this}
         */
        public Builder classifiers(java.util.List<java.lang.String> classifiers) {
            this.classifiers = classifiers;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getConfiguration}
         * @param configuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#configuration GlueCrawler#configuration}.
         * @return {@code this}
         */
        public Builder configuration(java.lang.String configuration) {
            this.configuration = configuration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getDeltaTarget}
         * @param deltaTarget delta_target block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delta_target GlueCrawler#delta_target}
         * @return {@code this}
         */
        public Builder deltaTarget(com.hashicorp.cdktf.IResolvable deltaTarget) {
            this.deltaTarget = deltaTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getDeltaTarget}
         * @param deltaTarget delta_target block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#delta_target GlueCrawler#delta_target}
         * @return {@code this}
         */
        public Builder deltaTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerDeltaTarget> deltaTarget) {
            this.deltaTarget = deltaTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#description GlueCrawler#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getDynamodbTarget}
         * @param dynamodbTarget dynamodb_target block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dynamodb_target GlueCrawler#dynamodb_target}
         * @return {@code this}
         */
        public Builder dynamodbTarget(com.hashicorp.cdktf.IResolvable dynamodbTarget) {
            this.dynamodbTarget = dynamodbTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getDynamodbTarget}
         * @param dynamodbTarget dynamodb_target block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dynamodb_target GlueCrawler#dynamodb_target}
         * @return {@code this}
         */
        public Builder dynamodbTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerDynamodbTarget> dynamodbTarget) {
            this.dynamodbTarget = dynamodbTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getHudiTarget}
         * @param hudiTarget hudi_target block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#hudi_target GlueCrawler#hudi_target}
         * @return {@code this}
         */
        public Builder hudiTarget(com.hashicorp.cdktf.IResolvable hudiTarget) {
            this.hudiTarget = hudiTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getHudiTarget}
         * @param hudiTarget hudi_target block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#hudi_target GlueCrawler#hudi_target}
         * @return {@code this}
         */
        public Builder hudiTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerHudiTarget> hudiTarget) {
            this.hudiTarget = hudiTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getIcebergTarget}
         * @param icebergTarget iceberg_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#iceberg_target GlueCrawler#iceberg_target}
         * @return {@code this}
         */
        public Builder icebergTarget(com.hashicorp.cdktf.IResolvable icebergTarget) {
            this.icebergTarget = icebergTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getIcebergTarget}
         * @param icebergTarget iceberg_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#iceberg_target GlueCrawler#iceberg_target}
         * @return {@code this}
         */
        public Builder icebergTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerIcebergTarget> icebergTarget) {
            this.icebergTarget = icebergTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#id GlueCrawler#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getJdbcTarget}
         * @param jdbcTarget jdbc_target block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#jdbc_target GlueCrawler#jdbc_target}
         * @return {@code this}
         */
        public Builder jdbcTarget(com.hashicorp.cdktf.IResolvable jdbcTarget) {
            this.jdbcTarget = jdbcTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getJdbcTarget}
         * @param jdbcTarget jdbc_target block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#jdbc_target GlueCrawler#jdbc_target}
         * @return {@code this}
         */
        public Builder jdbcTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerJdbcTarget> jdbcTarget) {
            this.jdbcTarget = jdbcTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getLakeFormationConfiguration}
         * @param lakeFormationConfiguration lake_formation_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#lake_formation_configuration GlueCrawler#lake_formation_configuration}
         * @return {@code this}
         */
        public Builder lakeFormationConfiguration(imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration lakeFormationConfiguration) {
            this.lakeFormationConfiguration = lakeFormationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getLineageConfiguration}
         * @param lineageConfiguration lineage_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#lineage_configuration GlueCrawler#lineage_configuration}
         * @return {@code this}
         */
        public Builder lineageConfiguration(imports.aws.glue_crawler.GlueCrawlerLineageConfiguration lineageConfiguration) {
            this.lineageConfiguration = lineageConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getMongodbTarget}
         * @param mongodbTarget mongodb_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#mongodb_target GlueCrawler#mongodb_target}
         * @return {@code this}
         */
        public Builder mongodbTarget(com.hashicorp.cdktf.IResolvable mongodbTarget) {
            this.mongodbTarget = mongodbTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getMongodbTarget}
         * @param mongodbTarget mongodb_target block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#mongodb_target GlueCrawler#mongodb_target}
         * @return {@code this}
         */
        public Builder mongodbTarget(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerMongodbTarget> mongodbTarget) {
            this.mongodbTarget = mongodbTarget;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getRecrawlPolicy}
         * @param recrawlPolicy recrawl_policy block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#recrawl_policy GlueCrawler#recrawl_policy}
         * @return {@code this}
         */
        public Builder recrawlPolicy(imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy recrawlPolicy) {
            this.recrawlPolicy = recrawlPolicy;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getS3Target}
         * @param s3Target s3_target block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#s3_target GlueCrawler#s3_target}
         * @return {@code this}
         */
        public Builder s3Target(com.hashicorp.cdktf.IResolvable s3Target) {
            this.s3Target = s3Target;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getS3Target}
         * @param s3Target s3_target block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#s3_target GlueCrawler#s3_target}
         * @return {@code this}
         */
        public Builder s3Target(java.util.List<? extends imports.aws.glue_crawler.GlueCrawlerS3Target> s3Target) {
            this.s3Target = s3Target;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getSchedule}
         * @param schedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#schedule GlueCrawler#schedule}.
         * @return {@code this}
         */
        public Builder schedule(java.lang.String schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getSchemaChangePolicy}
         * @param schemaChangePolicy schema_change_policy block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#schema_change_policy GlueCrawler#schema_change_policy}
         * @return {@code this}
         */
        public Builder schemaChangePolicy(imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy schemaChangePolicy) {
            this.schemaChangePolicy = schemaChangePolicy;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getSecurityConfiguration}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#security_configuration GlueCrawler#security_configuration}.
         * @return {@code this}
         */
        public Builder securityConfiguration(java.lang.String securityConfiguration) {
            this.securityConfiguration = securityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getTablePrefix}
         * @param tablePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#table_prefix GlueCrawler#table_prefix}.
         * @return {@code this}
         */
        public Builder tablePrefix(java.lang.String tablePrefix) {
            this.tablePrefix = tablePrefix;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#tags GlueCrawler#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#tags_all GlueCrawler#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getDependsOn}
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
         * Sets the value of {@link GlueCrawlerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerConfig#getProvisioners}
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
         * @return a new instance of {@link GlueCrawlerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerConfig {
        private final java.lang.String databaseName;
        private final java.lang.String name;
        private final java.lang.String role;
        private final java.lang.Object catalogTarget;
        private final java.util.List<java.lang.String> classifiers;
        private final java.lang.String configuration;
        private final java.lang.Object deltaTarget;
        private final java.lang.String description;
        private final java.lang.Object dynamodbTarget;
        private final java.lang.Object hudiTarget;
        private final java.lang.Object icebergTarget;
        private final java.lang.String id;
        private final java.lang.Object jdbcTarget;
        private final imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration lakeFormationConfiguration;
        private final imports.aws.glue_crawler.GlueCrawlerLineageConfiguration lineageConfiguration;
        private final java.lang.Object mongodbTarget;
        private final imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy recrawlPolicy;
        private final java.lang.Object s3Target;
        private final java.lang.String schedule;
        private final imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy schemaChangePolicy;
        private final java.lang.String securityConfiguration;
        private final java.lang.String tablePrefix;
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
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.role = software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogTarget = software.amazon.jsii.Kernel.get(this, "catalogTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.classifiers = software.amazon.jsii.Kernel.get(this, "classifiers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.configuration = software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deltaTarget = software.amazon.jsii.Kernel.get(this, "deltaTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dynamodbTarget = software.amazon.jsii.Kernel.get(this, "dynamodbTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hudiTarget = software.amazon.jsii.Kernel.get(this, "hudiTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.icebergTarget = software.amazon.jsii.Kernel.get(this, "icebergTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jdbcTarget = software.amazon.jsii.Kernel.get(this, "jdbcTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lakeFormationConfiguration = software.amazon.jsii.Kernel.get(this, "lakeFormationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration.class));
            this.lineageConfiguration = software.amazon.jsii.Kernel.get(this, "lineageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerLineageConfiguration.class));
            this.mongodbTarget = software.amazon.jsii.Kernel.get(this, "mongodbTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recrawlPolicy = software.amazon.jsii.Kernel.get(this, "recrawlPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy.class));
            this.s3Target = software.amazon.jsii.Kernel.get(this, "s3Target", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schemaChangePolicy = software.amazon.jsii.Kernel.get(this, "schemaChangePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy.class));
            this.securityConfiguration = software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tablePrefix = software.amazon.jsii.Kernel.get(this, "tablePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.role = java.util.Objects.requireNonNull(builder.role, "role is required");
            this.catalogTarget = builder.catalogTarget;
            this.classifiers = builder.classifiers;
            this.configuration = builder.configuration;
            this.deltaTarget = builder.deltaTarget;
            this.description = builder.description;
            this.dynamodbTarget = builder.dynamodbTarget;
            this.hudiTarget = builder.hudiTarget;
            this.icebergTarget = builder.icebergTarget;
            this.id = builder.id;
            this.jdbcTarget = builder.jdbcTarget;
            this.lakeFormationConfiguration = builder.lakeFormationConfiguration;
            this.lineageConfiguration = builder.lineageConfiguration;
            this.mongodbTarget = builder.mongodbTarget;
            this.recrawlPolicy = builder.recrawlPolicy;
            this.s3Target = builder.s3Target;
            this.schedule = builder.schedule;
            this.schemaChangePolicy = builder.schemaChangePolicy;
            this.securityConfiguration = builder.securityConfiguration;
            this.tablePrefix = builder.tablePrefix;
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
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRole() {
            return this.role;
        }

        @Override
        public final java.lang.Object getCatalogTarget() {
            return this.catalogTarget;
        }

        @Override
        public final java.util.List<java.lang.String> getClassifiers() {
            return this.classifiers;
        }

        @Override
        public final java.lang.String getConfiguration() {
            return this.configuration;
        }

        @Override
        public final java.lang.Object getDeltaTarget() {
            return this.deltaTarget;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDynamodbTarget() {
            return this.dynamodbTarget;
        }

        @Override
        public final java.lang.Object getHudiTarget() {
            return this.hudiTarget;
        }

        @Override
        public final java.lang.Object getIcebergTarget() {
            return this.icebergTarget;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getJdbcTarget() {
            return this.jdbcTarget;
        }

        @Override
        public final imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration getLakeFormationConfiguration() {
            return this.lakeFormationConfiguration;
        }

        @Override
        public final imports.aws.glue_crawler.GlueCrawlerLineageConfiguration getLineageConfiguration() {
            return this.lineageConfiguration;
        }

        @Override
        public final java.lang.Object getMongodbTarget() {
            return this.mongodbTarget;
        }

        @Override
        public final imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy getRecrawlPolicy() {
            return this.recrawlPolicy;
        }

        @Override
        public final java.lang.Object getS3Target() {
            return this.s3Target;
        }

        @Override
        public final java.lang.String getSchedule() {
            return this.schedule;
        }

        @Override
        public final imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy getSchemaChangePolicy() {
            return this.schemaChangePolicy;
        }

        @Override
        public final java.lang.String getSecurityConfiguration() {
            return this.securityConfiguration;
        }

        @Override
        public final java.lang.String getTablePrefix() {
            return this.tablePrefix;
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

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("role", om.valueToTree(this.getRole()));
            if (this.getCatalogTarget() != null) {
                data.set("catalogTarget", om.valueToTree(this.getCatalogTarget()));
            }
            if (this.getClassifiers() != null) {
                data.set("classifiers", om.valueToTree(this.getClassifiers()));
            }
            if (this.getConfiguration() != null) {
                data.set("configuration", om.valueToTree(this.getConfiguration()));
            }
            if (this.getDeltaTarget() != null) {
                data.set("deltaTarget", om.valueToTree(this.getDeltaTarget()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDynamodbTarget() != null) {
                data.set("dynamodbTarget", om.valueToTree(this.getDynamodbTarget()));
            }
            if (this.getHudiTarget() != null) {
                data.set("hudiTarget", om.valueToTree(this.getHudiTarget()));
            }
            if (this.getIcebergTarget() != null) {
                data.set("icebergTarget", om.valueToTree(this.getIcebergTarget()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getJdbcTarget() != null) {
                data.set("jdbcTarget", om.valueToTree(this.getJdbcTarget()));
            }
            if (this.getLakeFormationConfiguration() != null) {
                data.set("lakeFormationConfiguration", om.valueToTree(this.getLakeFormationConfiguration()));
            }
            if (this.getLineageConfiguration() != null) {
                data.set("lineageConfiguration", om.valueToTree(this.getLineageConfiguration()));
            }
            if (this.getMongodbTarget() != null) {
                data.set("mongodbTarget", om.valueToTree(this.getMongodbTarget()));
            }
            if (this.getRecrawlPolicy() != null) {
                data.set("recrawlPolicy", om.valueToTree(this.getRecrawlPolicy()));
            }
            if (this.getS3Target() != null) {
                data.set("s3Target", om.valueToTree(this.getS3Target()));
            }
            if (this.getSchedule() != null) {
                data.set("schedule", om.valueToTree(this.getSchedule()));
            }
            if (this.getSchemaChangePolicy() != null) {
                data.set("schemaChangePolicy", om.valueToTree(this.getSchemaChangePolicy()));
            }
            if (this.getSecurityConfiguration() != null) {
                data.set("securityConfiguration", om.valueToTree(this.getSecurityConfiguration()));
            }
            if (this.getTablePrefix() != null) {
                data.set("tablePrefix", om.valueToTree(this.getTablePrefix()));
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
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerConfig.Jsii$Proxy that = (GlueCrawlerConfig.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!name.equals(that.name)) return false;
            if (!role.equals(that.role)) return false;
            if (this.catalogTarget != null ? !this.catalogTarget.equals(that.catalogTarget) : that.catalogTarget != null) return false;
            if (this.classifiers != null ? !this.classifiers.equals(that.classifiers) : that.classifiers != null) return false;
            if (this.configuration != null ? !this.configuration.equals(that.configuration) : that.configuration != null) return false;
            if (this.deltaTarget != null ? !this.deltaTarget.equals(that.deltaTarget) : that.deltaTarget != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dynamodbTarget != null ? !this.dynamodbTarget.equals(that.dynamodbTarget) : that.dynamodbTarget != null) return false;
            if (this.hudiTarget != null ? !this.hudiTarget.equals(that.hudiTarget) : that.hudiTarget != null) return false;
            if (this.icebergTarget != null ? !this.icebergTarget.equals(that.icebergTarget) : that.icebergTarget != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.jdbcTarget != null ? !this.jdbcTarget.equals(that.jdbcTarget) : that.jdbcTarget != null) return false;
            if (this.lakeFormationConfiguration != null ? !this.lakeFormationConfiguration.equals(that.lakeFormationConfiguration) : that.lakeFormationConfiguration != null) return false;
            if (this.lineageConfiguration != null ? !this.lineageConfiguration.equals(that.lineageConfiguration) : that.lineageConfiguration != null) return false;
            if (this.mongodbTarget != null ? !this.mongodbTarget.equals(that.mongodbTarget) : that.mongodbTarget != null) return false;
            if (this.recrawlPolicy != null ? !this.recrawlPolicy.equals(that.recrawlPolicy) : that.recrawlPolicy != null) return false;
            if (this.s3Target != null ? !this.s3Target.equals(that.s3Target) : that.s3Target != null) return false;
            if (this.schedule != null ? !this.schedule.equals(that.schedule) : that.schedule != null) return false;
            if (this.schemaChangePolicy != null ? !this.schemaChangePolicy.equals(that.schemaChangePolicy) : that.schemaChangePolicy != null) return false;
            if (this.securityConfiguration != null ? !this.securityConfiguration.equals(that.securityConfiguration) : that.securityConfiguration != null) return false;
            if (this.tablePrefix != null ? !this.tablePrefix.equals(that.tablePrefix) : that.tablePrefix != null) return false;
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
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.role.hashCode());
            result = 31 * result + (this.catalogTarget != null ? this.catalogTarget.hashCode() : 0);
            result = 31 * result + (this.classifiers != null ? this.classifiers.hashCode() : 0);
            result = 31 * result + (this.configuration != null ? this.configuration.hashCode() : 0);
            result = 31 * result + (this.deltaTarget != null ? this.deltaTarget.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dynamodbTarget != null ? this.dynamodbTarget.hashCode() : 0);
            result = 31 * result + (this.hudiTarget != null ? this.hudiTarget.hashCode() : 0);
            result = 31 * result + (this.icebergTarget != null ? this.icebergTarget.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.jdbcTarget != null ? this.jdbcTarget.hashCode() : 0);
            result = 31 * result + (this.lakeFormationConfiguration != null ? this.lakeFormationConfiguration.hashCode() : 0);
            result = 31 * result + (this.lineageConfiguration != null ? this.lineageConfiguration.hashCode() : 0);
            result = 31 * result + (this.mongodbTarget != null ? this.mongodbTarget.hashCode() : 0);
            result = 31 * result + (this.recrawlPolicy != null ? this.recrawlPolicy.hashCode() : 0);
            result = 31 * result + (this.s3Target != null ? this.s3Target.hashCode() : 0);
            result = 31 * result + (this.schedule != null ? this.schedule.hashCode() : 0);
            result = 31 * result + (this.schemaChangePolicy != null ? this.schemaChangePolicy.hashCode() : 0);
            result = 31 * result + (this.securityConfiguration != null ? this.securityConfiguration.hashCode() : 0);
            result = 31 * result + (this.tablePrefix != null ? this.tablePrefix.hashCode() : 0);
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
