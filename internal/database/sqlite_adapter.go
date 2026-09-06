package database

import (
	"context"
	"database/sql"
	"regexp"
	"strings"
)

var pgxPlaceholder = regexp.MustCompile(`\$(\d+)`)

// SQLitePool wraps *sql.DB to implement the Pool interface.
// It automatically converts PostgreSQL-style $1,$2 placeholders to SQLite ? placeholders.
type SQLitePool struct {
	db *sql.DB
}

// NewSQLitePool creates a new SQLite adapter.
func NewSQLitePool(db *sql.DB) *SQLitePool {
	return &SQLitePool{db: db}
}

// convertQuery converts PostgreSQL syntax to SQLite-compatible syntax.
func convertQuery(query string) string {
	q := pgxPlaceholder.ReplaceAllString(query, "?")
	// PostgreSQL NOW() → SQLite CURRENT_TIMESTAMP
	q = strings.ReplaceAll(q, "NOW()", "CURRENT_TIMESTAMP")
	q = strings.ReplaceAll(q, "now()", "CURRENT_TIMESTAMP")
	// PostgreSQL ILIKE → SQLite LIKE (SQLite LIKE is case-insensitive by default for ASCII)
	q = strings.ReplaceAll(q, " ILIKE ", " LIKE ")
	// PostgreSQL type casts ::text, ::integer, ::uuid → remove them (SQLite is dynamically typed)
	q = regexp.MustCompile(`::\w+`).ReplaceAllString(q, "")
	// PostgreSQL json_build_object → json_object (SQLite compat)
	q = strings.ReplaceAll(q, "json_build_object", "json_object")
	// PostgreSQL json_agg → group_concat
	q = strings.ReplaceAll(q, "json_agg", "json_group_array")
	// PostgreSQL array_agg → group_concat
	q = strings.ReplaceAll(q, "array_agg", "group_concat")
	return q
}

func (s *SQLitePool) Exec(ctx context.Context, sql string, args ...any) (CommandTag, error) {
	result, err := s.db.ExecContext(ctx, convertQuery(sql), args...)
	if err != nil {
		return nil, err
	}
	affected, _ := result.RowsAffected()
	return &sqlCommandTag{affected: affected}, nil
}

func (s *SQLitePool) Query(ctx context.Context, sql string, args ...any) (Rows, error) {
	rows, err := s.db.QueryContext(ctx, convertQuery(sql), args...)
	if err != nil {
		return nil, err
	}
	return &sqlRows{rows: rows}, nil
}

func (s *SQLitePool) QueryRow(ctx context.Context, sql string, args ...any) Row {
	return &sqlRow{row: s.db.QueryRowContext(ctx, convertQuery(sql), args...)}
}

func (s *SQLitePool) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

func (s *SQLitePool) Begin(ctx context.Context) (Tx, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	return &sqlTx{tx: tx}, nil
}

// RawDB returns the underlying *sql.DB for subsystems that need direct access.
func (s *SQLitePool) RawDB() *sql.DB {
	return s.db
}

// sqlCommandTag wraps sql.Result.
type sqlCommandTag struct {
	affected int64
}

func (t *sqlCommandTag) RowsAffected() int64 {
	return t.affected
}

// sqlRows wraps sql.Rows.
type sqlRows struct {
	rows *sql.Rows
}

func (r *sqlRows) Next() bool            { return r.rows.Next() }
func (r *sqlRows) Scan(dest ...any) error { return r.rows.Scan(dest...) }
func (r *sqlRows) Close()                { _ = r.rows.Close() }
func (r *sqlRows) Err() error            { return r.rows.Err() }

// sqlRow wraps sql.Row.
type sqlRow struct {
	row *sql.Row
}

func (r *sqlRow) Scan(dest ...any) error { return r.row.Scan(dest...) }

// sqlTx wraps sql.Tx.
type sqlTx struct {
	tx *sql.Tx
}

func (t *sqlTx) Exec(ctx context.Context, sql string, args ...any) (CommandTag, error) {
	result, err := t.tx.ExecContext(ctx, convertQuery(sql), args...)
	if err != nil {
		return nil, err
	}
	affected, _ := result.RowsAffected()
	return &sqlCommandTag{affected: affected}, nil
}

func (t *sqlTx) Query(ctx context.Context, sql string, args ...any) (Rows, error) {
	rows, err := t.tx.QueryContext(ctx, convertQuery(sql), args...)
	if err != nil {
		return nil, err
	}
	return &sqlRows{rows: rows}, nil
}

func (t *sqlTx) QueryRow(ctx context.Context, sql string, args ...any) Row {
	return &sqlRow{row: t.tx.QueryRowContext(ctx, convertQuery(sql), args...)}
}

func (t *sqlTx) Commit(ctx context.Context) error   { return t.tx.Commit() }
func (t *sqlTx) Rollback(ctx context.Context) error { return t.tx.Rollback() }
