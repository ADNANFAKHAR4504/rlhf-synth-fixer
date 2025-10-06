package app.config;

public record DatabaseConfig(String engine, String engineVersion, String instanceClass, int allocatedStorage,
                             String databaseName, String masterUsername, boolean multiAz, int backupRetentionPeriod,
                             String backupWindow, String maintenanceWindow) {
    public static DatabaseConfig defaultConfig() {
        return new DatabaseConfig(
                "mysql",
                "8.0",
                "db.t3.medium",
                20,
                "webappdb",
                "admin",
                true,
                7,
                "03:00-04:00",
                "sun:04:00-sun:05:00"
        );
    }
}
