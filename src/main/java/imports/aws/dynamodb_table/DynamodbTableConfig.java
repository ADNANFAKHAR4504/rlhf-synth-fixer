package imports.aws.dynamodb_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.053Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTable.DynamodbTableConfig")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableConfig.Jsii$Proxy.class)
public interface DynamodbTableConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#name DynamodbTable#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * attribute block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#attribute DynamodbTable#attribute}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAttribute() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#billing_mode DynamodbTable#billing_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBillingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#deletion_protection_enabled DynamodbTable#deletion_protection_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionEnabled() {
        return null;
    }

    /**
     * global_secondary_index block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#global_secondary_index DynamodbTable#global_secondary_index}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGlobalSecondaryIndex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#hash_key DynamodbTable#hash_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHashKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#id DynamodbTable#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * import_table block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#import_table DynamodbTable#import_table}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableImportTable getImportTable() {
        return null;
    }

    /**
     * local_secondary_index block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#local_secondary_index DynamodbTable#local_secondary_index}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLocalSecondaryIndex() {
        return null;
    }

    /**
     * on_demand_throughput block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#on_demand_throughput DynamodbTable#on_demand_throughput}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableOnDemandThroughput getOnDemandThroughput() {
        return null;
    }

    /**
     * point_in_time_recovery block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#point_in_time_recovery DynamodbTable#point_in_time_recovery}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTablePointInTimeRecovery getPointInTimeRecovery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#range_key DynamodbTable#range_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRangeKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#read_capacity DynamodbTable#read_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReadCapacity() {
        return null;
    }

    /**
     * replica block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#replica DynamodbTable#replica}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReplica() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_date_time DynamodbTable#restore_date_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRestoreDateTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_source_name DynamodbTable#restore_source_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRestoreSourceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_source_table_arn DynamodbTable#restore_source_table_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRestoreSourceTableArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_to_latest_time DynamodbTable#restore_to_latest_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRestoreToLatestTime() {
        return null;
    }

    /**
     * server_side_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#server_side_encryption DynamodbTable#server_side_encryption}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableServerSideEncryption getServerSideEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#stream_enabled DynamodbTable#stream_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStreamEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#stream_view_type DynamodbTable#stream_view_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamViewType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#table_class DynamodbTable#table_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTableClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#tags DynamodbTable#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#tags_all DynamodbTable#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#timeouts DynamodbTable#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableTimeouts getTimeouts() {
        return null;
    }

    /**
     * ttl block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#ttl DynamodbTable#ttl}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table.DynamodbTableTtl getTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#write_capacity DynamodbTable#write_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWriteCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableConfig> {
        java.lang.String name;
        java.lang.Object attribute;
        java.lang.String billingMode;
        java.lang.Object deletionProtectionEnabled;
        java.lang.Object globalSecondaryIndex;
        java.lang.String hashKey;
        java.lang.String id;
        imports.aws.dynamodb_table.DynamodbTableImportTable importTable;
        java.lang.Object localSecondaryIndex;
        imports.aws.dynamodb_table.DynamodbTableOnDemandThroughput onDemandThroughput;
        imports.aws.dynamodb_table.DynamodbTablePointInTimeRecovery pointInTimeRecovery;
        java.lang.String rangeKey;
        java.lang.Number readCapacity;
        java.lang.Object replica;
        java.lang.String restoreDateTime;
        java.lang.String restoreSourceName;
        java.lang.String restoreSourceTableArn;
        java.lang.Object restoreToLatestTime;
        imports.aws.dynamodb_table.DynamodbTableServerSideEncryption serverSideEncryption;
        java.lang.Object streamEnabled;
        java.lang.String streamViewType;
        java.lang.String tableClass;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.dynamodb_table.DynamodbTableTimeouts timeouts;
        imports.aws.dynamodb_table.DynamodbTableTtl ttl;
        java.lang.Number writeCapacity;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DynamodbTableConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#name DynamodbTable#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getAttribute}
         * @param attribute attribute block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#attribute DynamodbTable#attribute}
         * @return {@code this}
         */
        public Builder attribute(com.hashicorp.cdktf.IResolvable attribute) {
            this.attribute = attribute;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getAttribute}
         * @param attribute attribute block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#attribute DynamodbTable#attribute}
         * @return {@code this}
         */
        public Builder attribute(java.util.List<? extends imports.aws.dynamodb_table.DynamodbTableAttribute> attribute) {
            this.attribute = attribute;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getBillingMode}
         * @param billingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#billing_mode DynamodbTable#billing_mode}.
         * @return {@code this}
         */
        public Builder billingMode(java.lang.String billingMode) {
            this.billingMode = billingMode;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getDeletionProtectionEnabled}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#deletion_protection_enabled DynamodbTable#deletion_protection_enabled}.
         * @return {@code this}
         */
        public Builder deletionProtectionEnabled(java.lang.Boolean deletionProtectionEnabled) {
            this.deletionProtectionEnabled = deletionProtectionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getDeletionProtectionEnabled}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#deletion_protection_enabled DynamodbTable#deletion_protection_enabled}.
         * @return {@code this}
         */
        public Builder deletionProtectionEnabled(com.hashicorp.cdktf.IResolvable deletionProtectionEnabled) {
            this.deletionProtectionEnabled = deletionProtectionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getGlobalSecondaryIndex}
         * @param globalSecondaryIndex global_secondary_index block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#global_secondary_index DynamodbTable#global_secondary_index}
         * @return {@code this}
         */
        public Builder globalSecondaryIndex(com.hashicorp.cdktf.IResolvable globalSecondaryIndex) {
            this.globalSecondaryIndex = globalSecondaryIndex;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getGlobalSecondaryIndex}
         * @param globalSecondaryIndex global_secondary_index block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#global_secondary_index DynamodbTable#global_secondary_index}
         * @return {@code this}
         */
        public Builder globalSecondaryIndex(java.util.List<? extends imports.aws.dynamodb_table.DynamodbTableGlobalSecondaryIndex> globalSecondaryIndex) {
            this.globalSecondaryIndex = globalSecondaryIndex;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getHashKey}
         * @param hashKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#hash_key DynamodbTable#hash_key}.
         * @return {@code this}
         */
        public Builder hashKey(java.lang.String hashKey) {
            this.hashKey = hashKey;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#id DynamodbTable#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getImportTable}
         * @param importTable import_table block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#import_table DynamodbTable#import_table}
         * @return {@code this}
         */
        public Builder importTable(imports.aws.dynamodb_table.DynamodbTableImportTable importTable) {
            this.importTable = importTable;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getLocalSecondaryIndex}
         * @param localSecondaryIndex local_secondary_index block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#local_secondary_index DynamodbTable#local_secondary_index}
         * @return {@code this}
         */
        public Builder localSecondaryIndex(com.hashicorp.cdktf.IResolvable localSecondaryIndex) {
            this.localSecondaryIndex = localSecondaryIndex;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getLocalSecondaryIndex}
         * @param localSecondaryIndex local_secondary_index block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#local_secondary_index DynamodbTable#local_secondary_index}
         * @return {@code this}
         */
        public Builder localSecondaryIndex(java.util.List<? extends imports.aws.dynamodb_table.DynamodbTableLocalSecondaryIndex> localSecondaryIndex) {
            this.localSecondaryIndex = localSecondaryIndex;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getOnDemandThroughput}
         * @param onDemandThroughput on_demand_throughput block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#on_demand_throughput DynamodbTable#on_demand_throughput}
         * @return {@code this}
         */
        public Builder onDemandThroughput(imports.aws.dynamodb_table.DynamodbTableOnDemandThroughput onDemandThroughput) {
            this.onDemandThroughput = onDemandThroughput;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getPointInTimeRecovery}
         * @param pointInTimeRecovery point_in_time_recovery block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#point_in_time_recovery DynamodbTable#point_in_time_recovery}
         * @return {@code this}
         */
        public Builder pointInTimeRecovery(imports.aws.dynamodb_table.DynamodbTablePointInTimeRecovery pointInTimeRecovery) {
            this.pointInTimeRecovery = pointInTimeRecovery;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getRangeKey}
         * @param rangeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#range_key DynamodbTable#range_key}.
         * @return {@code this}
         */
        public Builder rangeKey(java.lang.String rangeKey) {
            this.rangeKey = rangeKey;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getReadCapacity}
         * @param readCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#read_capacity DynamodbTable#read_capacity}.
         * @return {@code this}
         */
        public Builder readCapacity(java.lang.Number readCapacity) {
            this.readCapacity = readCapacity;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getReplica}
         * @param replica replica block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#replica DynamodbTable#replica}
         * @return {@code this}
         */
        public Builder replica(com.hashicorp.cdktf.IResolvable replica) {
            this.replica = replica;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getReplica}
         * @param replica replica block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#replica DynamodbTable#replica}
         * @return {@code this}
         */
        public Builder replica(java.util.List<? extends imports.aws.dynamodb_table.DynamodbTableReplica> replica) {
            this.replica = replica;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getRestoreDateTime}
         * @param restoreDateTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_date_time DynamodbTable#restore_date_time}.
         * @return {@code this}
         */
        public Builder restoreDateTime(java.lang.String restoreDateTime) {
            this.restoreDateTime = restoreDateTime;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getRestoreSourceName}
         * @param restoreSourceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_source_name DynamodbTable#restore_source_name}.
         * @return {@code this}
         */
        public Builder restoreSourceName(java.lang.String restoreSourceName) {
            this.restoreSourceName = restoreSourceName;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getRestoreSourceTableArn}
         * @param restoreSourceTableArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_source_table_arn DynamodbTable#restore_source_table_arn}.
         * @return {@code this}
         */
        public Builder restoreSourceTableArn(java.lang.String restoreSourceTableArn) {
            this.restoreSourceTableArn = restoreSourceTableArn;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getRestoreToLatestTime}
         * @param restoreToLatestTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_to_latest_time DynamodbTable#restore_to_latest_time}.
         * @return {@code this}
         */
        public Builder restoreToLatestTime(java.lang.Boolean restoreToLatestTime) {
            this.restoreToLatestTime = restoreToLatestTime;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getRestoreToLatestTime}
         * @param restoreToLatestTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#restore_to_latest_time DynamodbTable#restore_to_latest_time}.
         * @return {@code this}
         */
        public Builder restoreToLatestTime(com.hashicorp.cdktf.IResolvable restoreToLatestTime) {
            this.restoreToLatestTime = restoreToLatestTime;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getServerSideEncryption}
         * @param serverSideEncryption server_side_encryption block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#server_side_encryption DynamodbTable#server_side_encryption}
         * @return {@code this}
         */
        public Builder serverSideEncryption(imports.aws.dynamodb_table.DynamodbTableServerSideEncryption serverSideEncryption) {
            this.serverSideEncryption = serverSideEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getStreamEnabled}
         * @param streamEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#stream_enabled DynamodbTable#stream_enabled}.
         * @return {@code this}
         */
        public Builder streamEnabled(java.lang.Boolean streamEnabled) {
            this.streamEnabled = streamEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getStreamEnabled}
         * @param streamEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#stream_enabled DynamodbTable#stream_enabled}.
         * @return {@code this}
         */
        public Builder streamEnabled(com.hashicorp.cdktf.IResolvable streamEnabled) {
            this.streamEnabled = streamEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getStreamViewType}
         * @param streamViewType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#stream_view_type DynamodbTable#stream_view_type}.
         * @return {@code this}
         */
        public Builder streamViewType(java.lang.String streamViewType) {
            this.streamViewType = streamViewType;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getTableClass}
         * @param tableClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#table_class DynamodbTable#table_class}.
         * @return {@code this}
         */
        public Builder tableClass(java.lang.String tableClass) {
            this.tableClass = tableClass;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#tags DynamodbTable#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#tags_all DynamodbTable#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#timeouts DynamodbTable#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dynamodb_table.DynamodbTableTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getTtl}
         * @param ttl ttl block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#ttl DynamodbTable#ttl}
         * @return {@code this}
         */
        public Builder ttl(imports.aws.dynamodb_table.DynamodbTableTtl ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getWriteCapacity}
         * @param writeCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table#write_capacity DynamodbTable#write_capacity}.
         * @return {@code this}
         */
        public Builder writeCapacity(java.lang.Number writeCapacity) {
            this.writeCapacity = writeCapacity;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getDependsOn}
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
         * Sets the value of {@link DynamodbTableConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableConfig#getProvisioners}
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
         * @return a new instance of {@link DynamodbTableConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableConfig {
        private final java.lang.String name;
        private final java.lang.Object attribute;
        private final java.lang.String billingMode;
        private final java.lang.Object deletionProtectionEnabled;
        private final java.lang.Object globalSecondaryIndex;
        private final java.lang.String hashKey;
        private final java.lang.String id;
        private final imports.aws.dynamodb_table.DynamodbTableImportTable importTable;
        private final java.lang.Object localSecondaryIndex;
        private final imports.aws.dynamodb_table.DynamodbTableOnDemandThroughput onDemandThroughput;
        private final imports.aws.dynamodb_table.DynamodbTablePointInTimeRecovery pointInTimeRecovery;
        private final java.lang.String rangeKey;
        private final java.lang.Number readCapacity;
        private final java.lang.Object replica;
        private final java.lang.String restoreDateTime;
        private final java.lang.String restoreSourceName;
        private final java.lang.String restoreSourceTableArn;
        private final java.lang.Object restoreToLatestTime;
        private final imports.aws.dynamodb_table.DynamodbTableServerSideEncryption serverSideEncryption;
        private final java.lang.Object streamEnabled;
        private final java.lang.String streamViewType;
        private final java.lang.String tableClass;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.dynamodb_table.DynamodbTableTimeouts timeouts;
        private final imports.aws.dynamodb_table.DynamodbTableTtl ttl;
        private final java.lang.Number writeCapacity;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attribute = software.amazon.jsii.Kernel.get(this, "attribute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.billingMode = software.amazon.jsii.Kernel.get(this, "billingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deletionProtectionEnabled = software.amazon.jsii.Kernel.get(this, "deletionProtectionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.globalSecondaryIndex = software.amazon.jsii.Kernel.get(this, "globalSecondaryIndex", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hashKey = software.amazon.jsii.Kernel.get(this, "hashKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.importTable = software.amazon.jsii.Kernel.get(this, "importTable", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableImportTable.class));
            this.localSecondaryIndex = software.amazon.jsii.Kernel.get(this, "localSecondaryIndex", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.onDemandThroughput = software.amazon.jsii.Kernel.get(this, "onDemandThroughput", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableOnDemandThroughput.class));
            this.pointInTimeRecovery = software.amazon.jsii.Kernel.get(this, "pointInTimeRecovery", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTablePointInTimeRecovery.class));
            this.rangeKey = software.amazon.jsii.Kernel.get(this, "rangeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readCapacity = software.amazon.jsii.Kernel.get(this, "readCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.replica = software.amazon.jsii.Kernel.get(this, "replica", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.restoreDateTime = software.amazon.jsii.Kernel.get(this, "restoreDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restoreSourceName = software.amazon.jsii.Kernel.get(this, "restoreSourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restoreSourceTableArn = software.amazon.jsii.Kernel.get(this, "restoreSourceTableArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restoreToLatestTime = software.amazon.jsii.Kernel.get(this, "restoreToLatestTime", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serverSideEncryption = software.amazon.jsii.Kernel.get(this, "serverSideEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableServerSideEncryption.class));
            this.streamEnabled = software.amazon.jsii.Kernel.get(this, "streamEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.streamViewType = software.amazon.jsii.Kernel.get(this, "streamViewType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableClass = software.amazon.jsii.Kernel.get(this, "tableClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableTimeouts.class));
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table.DynamodbTableTtl.class));
            this.writeCapacity = software.amazon.jsii.Kernel.get(this, "writeCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.attribute = builder.attribute;
            this.billingMode = builder.billingMode;
            this.deletionProtectionEnabled = builder.deletionProtectionEnabled;
            this.globalSecondaryIndex = builder.globalSecondaryIndex;
            this.hashKey = builder.hashKey;
            this.id = builder.id;
            this.importTable = builder.importTable;
            this.localSecondaryIndex = builder.localSecondaryIndex;
            this.onDemandThroughput = builder.onDemandThroughput;
            this.pointInTimeRecovery = builder.pointInTimeRecovery;
            this.rangeKey = builder.rangeKey;
            this.readCapacity = builder.readCapacity;
            this.replica = builder.replica;
            this.restoreDateTime = builder.restoreDateTime;
            this.restoreSourceName = builder.restoreSourceName;
            this.restoreSourceTableArn = builder.restoreSourceTableArn;
            this.restoreToLatestTime = builder.restoreToLatestTime;
            this.serverSideEncryption = builder.serverSideEncryption;
            this.streamEnabled = builder.streamEnabled;
            this.streamViewType = builder.streamViewType;
            this.tableClass = builder.tableClass;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.ttl = builder.ttl;
            this.writeCapacity = builder.writeCapacity;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getAttribute() {
            return this.attribute;
        }

        @Override
        public final java.lang.String getBillingMode() {
            return this.billingMode;
        }

        @Override
        public final java.lang.Object getDeletionProtectionEnabled() {
            return this.deletionProtectionEnabled;
        }

        @Override
        public final java.lang.Object getGlobalSecondaryIndex() {
            return this.globalSecondaryIndex;
        }

        @Override
        public final java.lang.String getHashKey() {
            return this.hashKey;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableImportTable getImportTable() {
            return this.importTable;
        }

        @Override
        public final java.lang.Object getLocalSecondaryIndex() {
            return this.localSecondaryIndex;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableOnDemandThroughput getOnDemandThroughput() {
            return this.onDemandThroughput;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTablePointInTimeRecovery getPointInTimeRecovery() {
            return this.pointInTimeRecovery;
        }

        @Override
        public final java.lang.String getRangeKey() {
            return this.rangeKey;
        }

        @Override
        public final java.lang.Number getReadCapacity() {
            return this.readCapacity;
        }

        @Override
        public final java.lang.Object getReplica() {
            return this.replica;
        }

        @Override
        public final java.lang.String getRestoreDateTime() {
            return this.restoreDateTime;
        }

        @Override
        public final java.lang.String getRestoreSourceName() {
            return this.restoreSourceName;
        }

        @Override
        public final java.lang.String getRestoreSourceTableArn() {
            return this.restoreSourceTableArn;
        }

        @Override
        public final java.lang.Object getRestoreToLatestTime() {
            return this.restoreToLatestTime;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableServerSideEncryption getServerSideEncryption() {
            return this.serverSideEncryption;
        }

        @Override
        public final java.lang.Object getStreamEnabled() {
            return this.streamEnabled;
        }

        @Override
        public final java.lang.String getStreamViewType() {
            return this.streamViewType;
        }

        @Override
        public final java.lang.String getTableClass() {
            return this.tableClass;
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
        public final imports.aws.dynamodb_table.DynamodbTableTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.dynamodb_table.DynamodbTableTtl getTtl() {
            return this.ttl;
        }

        @Override
        public final java.lang.Number getWriteCapacity() {
            return this.writeCapacity;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAttribute() != null) {
                data.set("attribute", om.valueToTree(this.getAttribute()));
            }
            if (this.getBillingMode() != null) {
                data.set("billingMode", om.valueToTree(this.getBillingMode()));
            }
            if (this.getDeletionProtectionEnabled() != null) {
                data.set("deletionProtectionEnabled", om.valueToTree(this.getDeletionProtectionEnabled()));
            }
            if (this.getGlobalSecondaryIndex() != null) {
                data.set("globalSecondaryIndex", om.valueToTree(this.getGlobalSecondaryIndex()));
            }
            if (this.getHashKey() != null) {
                data.set("hashKey", om.valueToTree(this.getHashKey()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImportTable() != null) {
                data.set("importTable", om.valueToTree(this.getImportTable()));
            }
            if (this.getLocalSecondaryIndex() != null) {
                data.set("localSecondaryIndex", om.valueToTree(this.getLocalSecondaryIndex()));
            }
            if (this.getOnDemandThroughput() != null) {
                data.set("onDemandThroughput", om.valueToTree(this.getOnDemandThroughput()));
            }
            if (this.getPointInTimeRecovery() != null) {
                data.set("pointInTimeRecovery", om.valueToTree(this.getPointInTimeRecovery()));
            }
            if (this.getRangeKey() != null) {
                data.set("rangeKey", om.valueToTree(this.getRangeKey()));
            }
            if (this.getReadCapacity() != null) {
                data.set("readCapacity", om.valueToTree(this.getReadCapacity()));
            }
            if (this.getReplica() != null) {
                data.set("replica", om.valueToTree(this.getReplica()));
            }
            if (this.getRestoreDateTime() != null) {
                data.set("restoreDateTime", om.valueToTree(this.getRestoreDateTime()));
            }
            if (this.getRestoreSourceName() != null) {
                data.set("restoreSourceName", om.valueToTree(this.getRestoreSourceName()));
            }
            if (this.getRestoreSourceTableArn() != null) {
                data.set("restoreSourceTableArn", om.valueToTree(this.getRestoreSourceTableArn()));
            }
            if (this.getRestoreToLatestTime() != null) {
                data.set("restoreToLatestTime", om.valueToTree(this.getRestoreToLatestTime()));
            }
            if (this.getServerSideEncryption() != null) {
                data.set("serverSideEncryption", om.valueToTree(this.getServerSideEncryption()));
            }
            if (this.getStreamEnabled() != null) {
                data.set("streamEnabled", om.valueToTree(this.getStreamEnabled()));
            }
            if (this.getStreamViewType() != null) {
                data.set("streamViewType", om.valueToTree(this.getStreamViewType()));
            }
            if (this.getTableClass() != null) {
                data.set("tableClass", om.valueToTree(this.getTableClass()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTtl() != null) {
                data.set("ttl", om.valueToTree(this.getTtl()));
            }
            if (this.getWriteCapacity() != null) {
                data.set("writeCapacity", om.valueToTree(this.getWriteCapacity()));
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
            struct.set("fqn", om.valueToTree("aws.dynamodbTable.DynamodbTableConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableConfig.Jsii$Proxy that = (DynamodbTableConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.attribute != null ? !this.attribute.equals(that.attribute) : that.attribute != null) return false;
            if (this.billingMode != null ? !this.billingMode.equals(that.billingMode) : that.billingMode != null) return false;
            if (this.deletionProtectionEnabled != null ? !this.deletionProtectionEnabled.equals(that.deletionProtectionEnabled) : that.deletionProtectionEnabled != null) return false;
            if (this.globalSecondaryIndex != null ? !this.globalSecondaryIndex.equals(that.globalSecondaryIndex) : that.globalSecondaryIndex != null) return false;
            if (this.hashKey != null ? !this.hashKey.equals(that.hashKey) : that.hashKey != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.importTable != null ? !this.importTable.equals(that.importTable) : that.importTable != null) return false;
            if (this.localSecondaryIndex != null ? !this.localSecondaryIndex.equals(that.localSecondaryIndex) : that.localSecondaryIndex != null) return false;
            if (this.onDemandThroughput != null ? !this.onDemandThroughput.equals(that.onDemandThroughput) : that.onDemandThroughput != null) return false;
            if (this.pointInTimeRecovery != null ? !this.pointInTimeRecovery.equals(that.pointInTimeRecovery) : that.pointInTimeRecovery != null) return false;
            if (this.rangeKey != null ? !this.rangeKey.equals(that.rangeKey) : that.rangeKey != null) return false;
            if (this.readCapacity != null ? !this.readCapacity.equals(that.readCapacity) : that.readCapacity != null) return false;
            if (this.replica != null ? !this.replica.equals(that.replica) : that.replica != null) return false;
            if (this.restoreDateTime != null ? !this.restoreDateTime.equals(that.restoreDateTime) : that.restoreDateTime != null) return false;
            if (this.restoreSourceName != null ? !this.restoreSourceName.equals(that.restoreSourceName) : that.restoreSourceName != null) return false;
            if (this.restoreSourceTableArn != null ? !this.restoreSourceTableArn.equals(that.restoreSourceTableArn) : that.restoreSourceTableArn != null) return false;
            if (this.restoreToLatestTime != null ? !this.restoreToLatestTime.equals(that.restoreToLatestTime) : that.restoreToLatestTime != null) return false;
            if (this.serverSideEncryption != null ? !this.serverSideEncryption.equals(that.serverSideEncryption) : that.serverSideEncryption != null) return false;
            if (this.streamEnabled != null ? !this.streamEnabled.equals(that.streamEnabled) : that.streamEnabled != null) return false;
            if (this.streamViewType != null ? !this.streamViewType.equals(that.streamViewType) : that.streamViewType != null) return false;
            if (this.tableClass != null ? !this.tableClass.equals(that.tableClass) : that.tableClass != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.ttl != null ? !this.ttl.equals(that.ttl) : that.ttl != null) return false;
            if (this.writeCapacity != null ? !this.writeCapacity.equals(that.writeCapacity) : that.writeCapacity != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.attribute != null ? this.attribute.hashCode() : 0);
            result = 31 * result + (this.billingMode != null ? this.billingMode.hashCode() : 0);
            result = 31 * result + (this.deletionProtectionEnabled != null ? this.deletionProtectionEnabled.hashCode() : 0);
            result = 31 * result + (this.globalSecondaryIndex != null ? this.globalSecondaryIndex.hashCode() : 0);
            result = 31 * result + (this.hashKey != null ? this.hashKey.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.importTable != null ? this.importTable.hashCode() : 0);
            result = 31 * result + (this.localSecondaryIndex != null ? this.localSecondaryIndex.hashCode() : 0);
            result = 31 * result + (this.onDemandThroughput != null ? this.onDemandThroughput.hashCode() : 0);
            result = 31 * result + (this.pointInTimeRecovery != null ? this.pointInTimeRecovery.hashCode() : 0);
            result = 31 * result + (this.rangeKey != null ? this.rangeKey.hashCode() : 0);
            result = 31 * result + (this.readCapacity != null ? this.readCapacity.hashCode() : 0);
            result = 31 * result + (this.replica != null ? this.replica.hashCode() : 0);
            result = 31 * result + (this.restoreDateTime != null ? this.restoreDateTime.hashCode() : 0);
            result = 31 * result + (this.restoreSourceName != null ? this.restoreSourceName.hashCode() : 0);
            result = 31 * result + (this.restoreSourceTableArn != null ? this.restoreSourceTableArn.hashCode() : 0);
            result = 31 * result + (this.restoreToLatestTime != null ? this.restoreToLatestTime.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryption != null ? this.serverSideEncryption.hashCode() : 0);
            result = 31 * result + (this.streamEnabled != null ? this.streamEnabled.hashCode() : 0);
            result = 31 * result + (this.streamViewType != null ? this.streamViewType.hashCode() : 0);
            result = 31 * result + (this.tableClass != null ? this.tableClass.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.ttl != null ? this.ttl.hashCode() : 0);
            result = 31 * result + (this.writeCapacity != null ? this.writeCapacity.hashCode() : 0);
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
