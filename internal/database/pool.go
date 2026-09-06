package database

import "context"

// Pool is a database abstraction that both pgxpool.Pool and SQLite can implement.
// This allows the entire handler layer to work with either PostgreSQL or SQLite.
type Pool interface {
	Exec(ctx context.Context, sql string, args ...any) (CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) Row
	Ping(ctx context.Context) error
	Begin(ctx context.Context) (Tx, error)
}

// Tx represents a database transaction.
type Tx interface {
	Exec(ctx context.Context, sql string, args ...any) (CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) Row
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}

// Row represents a single row from a query.
type Row interface {
	Scan(dest ...any) error
}

// Rows represents a result set from a query.
type Rows interface {
	Next() bool
	Scan(dest ...any) error
	Close()
	Err() error
}

// CommandTag represents the result of an Exec command.
type CommandTag interface {
	RowsAffected() int64
}
