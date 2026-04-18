# Agentic Folder Structure Guide

This guide explains the `.agentic` folder structure and the `agentic.json` configuration file in AI Suite.

## Overview

The `.agentic` folder is created in your user home directory when the backend first runs. It stores:

- Configuration file (`agentic.json`)
- Pipeline execution results (pipelines folder)
- Database files (if configured)

## Folder Location

```
~/.agentic/           (Windows: C:\Users\<username>\.agentic)
```

## Folder Structure

```
.agentic/
├── agentic.json          # Configuration file
├── db/                   # Database files (if configured)
│   └── agentic_db.*      # H2 database files
└── pipelines/            # Pipeline execution results
    └── {projectName}/   # Folder per project
        └── {timestamp}/ # Folder per run
            ├── step1-result.json
            ├── step2-result.json
            └── ...
```

| Folder/File | Description |
|------------|-------------|
| `agentic.json` | Main configuration file |
| `db/` | Database storage directory |
| `pipelines/` | Pipeline run results and logs |
| `{projectName}/` | Project-specific run history |
| `{timestamp}/` | Individual run folder (format: YYYYMMDD-HHMMSS) |

## agentic.json

The `agentic.json` file stores application configuration.

### Default Configuration

```json
{
  "version": "1.0.0",
  "port": 8080,
  "database": {
    "path": "db/agentic_db"
  }
}
```

### Configuration Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `version` | String | Config format version | "1.0.0" |
| `port` | Integer | Server port number | 8080 |
| `database.path` | String | Database file path | "db/agentic_db" |

### Modifying Configuration

#### Changing Server Port

```json
{
  "version": "1.0.0",
  "port": 9000,
  "database": {
    "path": "db/agentic_db"
  }
}
```

#### Changing Database Location

```json
{
  "version": "1.0.0",
  "port": 8080,
  "database": {
    "path": "data/my_database"
  }
}
```

**Note:** The database path is relative to the `.agentic` folder.

### Creating Custom Configuration

1. Navigate to your home directory
2. Open `.agentic/agentic.json` in a text editor
3. Modify the desired fields
4. Save the file
5. Restart the backend for changes to take effect

## Pipeline Run Results

### Folder Structure

Each pipeline execution creates a timestamped folder:

```
{projectName}/{timestamp}/
```

| Component | Format | Example |
|-----------|---------|---------|
| Project Name | String | "my-project" |
| Timestamp | YYYYMMDD-HHMMSS | "20260418-093031" |

### Result Files

Each step produces a result file:

| File | Description |
|------|-------------|
| `step1-result.json` | Step 1 execution result |
| `step2-result.json` | Step 2 execution result |
| ... | Additional steps |

### Result File Structure

```json
{
  "stepId": "step-1",
  "stepName": "Execute Agent",
  "status": "COMPLETED",
  "output": "Agent output text",
  "error": null,
  "startTime": "2026-04-18T09:30:31.123",
  "endTime": "2026-04-18T09:30:45.456",
  "duration": 14333
}
```

| Field | Type | Description |
|-------|------|-------------|
| `stepId` | String | Step identifier |
| `stepName` | String | Step name |
| `status` | String | COMPLETED, RUNNING, FAILED, PENDING |
| `output` | String | Step output |
| `error` | String | Error message (if any) |
| `startTime` | String | ISO timestamp |
| `endTime` | String | ISO timestamp |
| `duration` | Integer | Duration in milliseconds |

## Database

### Location

The database is stored in the `.agentic` folder by default:

```
.agentic/db/agentic_db.mv.db
.agentic/db/agentic_db.trace.db
```

### Custom Path

Change in `agentic.json`:

```json
{
  "database": {
    "path": "db/custom_db"
  }
}
```

This creates:

```
.agentic/db/custom_db.mv.db
.agentic/db/custom_db.trace.db
```

## First Run Behavior

On first backend start:

1. `.agentic` folder is created
2. Default `agentic.json` is generated
3. H2 database is initialized
4. Backend starts on port 8080

## Common Tasks

### Reset Configuration

Delete `agentic.json` and restart the backend. A new default config will be created.

### Clear Pipeline History

Delete the `pipelines` folder:

```bash
# Windows
rmdir /s ~/.agentic\pipelines

# Linux/Mac
rm -rf ~/.agentic/pipelines
```

### Move Database Location

1. Stop the backend
2. Update `agentic.json` with new path
3. Move database files to new location
4. Restart the backend

### Change Server Port

1. Edit `agentic.json`
2. Update `port` field
3. Restart the backend

## Environment Variables

You can also override some settings via system properties:

| Property | Description |
|----------|-------------|
| `-Dagentic.port` | Override server port |
| `-Dagentic.database` | Override database path |

Example:

```bash
mvn spring-boot:run -Dagentic.port=9000
```

## Notes

- The `.agentic` folder is created automatically on first run
- Configuration changes require backend restart
- Pipeline results persist until manually cleared
- Database is an H2 file-based database

## Troubleshooting

### Config Not Loading

- Check `agentic.json` is valid JSON
- Verify file is in correct location (`~/.agentic/agentic.json`)
- Check backend console for errors

### Database Errors

- Ensure write permissions on `.agentic` folder
- Check database path is valid
- Verify no other process is using the database

### Port Already in Use

- Change port in `agentic.json`
- Ensure no other application is using port 8080

## Related Documentation

- [Configuration Guide](./config-guide.md) - Managing targets
- [Project Guide](./project-guide.md) - Managing projects and pipelines
- [Pipeline Run History](./pipeline-run-history-guide.md) - Viewing execution history