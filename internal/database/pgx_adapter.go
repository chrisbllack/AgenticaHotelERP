package database

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PGXPool wraps *pgxpool.Pool to implement the Pool interface.
type PGXPool struct {
	pool *pgxpool.Pool
}

// NewPGXPool creates a new PGX adapter.
func NewPGXPool(pool *pgxpool.Pool) *PGXPool {
	return &PGXPool{pool: pool}
}

func (p *PGXPool) Exec(ctx context.Context, sql string, args ...any) (CommandTag, error) {
	tag, err := p.pool.Exec(ctx, sql, args...)
	return &pgxCommandTag{tag: tag}, err
}

func (p *PGXPool) Query(ctx context.Context, sql string, args ...any) (Rows, error) {
	rows, err := p.pool.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	return &pgxRows{rows: rows}, nil
}

func (p *PGXPool) QueryRow(ctx context.Context, sql string, args ...any) Row {
	return &pgxRow{row: p.pool.QueryRow(ctx, sql, args...)}
}

func (p *PGXPool) Ping(ctx context.Context) error {
	return p.pool.Ping(ctx)
}

func (p *PGXPool) Begin(ctx context.Context) (Tx, error) {
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	return &pgxTx{tx: tx}, nil
}

// pgxCommandTag wraps pgconn.CommandTag.
type pgxCommandTag struct {
	tag pgconn.CommandTag
}

func (t *pgxCommandTag) RowsAffected() int64 {
	return t.tag.RowsAffected()
}

// pgxRows wraps pgx.Rows.
type pgxRows struct {
	rows pgx.Rows
}

func (r *pgxRows) Next() bool            { return r.rows.Next() }
func (r *pgxRows) Scan(dest ...any) error { return r.rows.Scan(dest...) }
func (r *pgxRows) Close()                { r.rows.Close() }
func (r *pgxRows) Err() error            { return r.rows.Err() }

// pgxRow wraps pgx.Row.
type pgxRow struct {
	row pgx.Row
}

func (r *pgxRow) Scan(dest ...any) error { return r.row.Scan(dest...) }

// pgxTx wraps pgx.Tx.
type pgxTx struct {
	tx pgx.Tx
}

func (t *pgxTx) Exec(ctx context.Context, sql string, args ...any) (CommandTag, error) {
	tag, err := t.tx.Exec(ctx, sql, args...)
	return &pgxCommandTag{tag: tag}, err
}

func (t *pgxTx) Query(ctx context.Context, sql string, args ...any) (Rows, error) {
	rows, err := t.tx.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	return &pgxRows{rows: rows}, nil
}

func (t *pgxTx) QueryRow(ctx context.Context, sql string, args ...any) Row {
	return &pgxRow{row: t.tx.QueryRow(ctx, sql, args...)}
}

func (t *pgxTx) Commit(ctx context.Context) error   { return t.tx.Commit(ctx) }
func (t *pgxTx) Rollback(ctx context.Context) error { return t.tx.Rollback(ctx) }
