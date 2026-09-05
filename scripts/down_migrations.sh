#!/bin/bash
# INFINEON Down Migration Generator
# This script creates .down.sql files that mirror the .up.sql files

set -e

echo "Generating down migrations..."

for up_file in migrations/*.up.sql; do
    down_file="${up_file%.up.sql}.down.sql"
    if [ ! -f "$down_file" ]; then
        echo "Creating $down_file"
        basename=$(basename "$up_file" .up.sql)
        
        cat > "$down_file" <<EOF
-- Down migration: ${basename}
-- WARNING: This will DROP tables and data!
-- Run only when you need to rollback this migration

-- This migration is reversible. Drop tables in reverse order.
-- For safety, each DROP includes IF EXISTS.

EOF
        
        # Extract CREATE TABLE statements and generate DROP
        grep -i "CREATE TABLE" "$up_file" | while read -r line; do
            table=$(echo "$line" | grep -oP '(?<=TABLE IF NOT EXISTS |TABLE )\w+' | head -1)
            if [ -n "$table" ]; then
                echo "DROP TABLE IF EXISTS ${table} CASCADE;" >> "$down_file"
            fi
        done
        
        # Extract ALTER TABLE ADD COLUMN and generate ALTER TABLE DROP COLUMN
        grep -i "ALTER TABLE.*ADD COLUMN IF NOT EXISTS" "$up_file" | while read -r line; do
            table=$(echo "$line" | grep -oP '(?<=ALTER TABLE )\w+')
            column=$(echo "$line" | grep -oP '(?<=ADD COLUMN IF NOT EXISTS )\w+')
            if [ -n "$table" ] && [ -n "$column" ]; then
                echo "ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column};" >> "$down_file"
            fi
        done
        
        # Extract CREATE INDEX and generate DROP INDEX
        grep -i "CREATE INDEX" "$up_file" | while read -r line; do
            index=$(echo "$line" | grep -oP '(?<=INDEX IF NOT EXISTS |INDEX )\w+')
            if [ -n "$index" ]; then
                echo "DROP INDEX IF EXISTS ${index};" >> "$down_file"
            fi
        done
    fi
done

echo "Done! Down migrations created."
