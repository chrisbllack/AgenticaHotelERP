package workers

import (
	"context"
	"log"
	"sync"
	"time"
)

type WorkerPool struct {
	jobs   chan func(ctx context.Context)
	wg     sync.WaitGroup
	ctx    context.Context
	cancel context.CancelFunc
}

func NewWorkerPool(size int) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())
	pool := &WorkerPool{
		jobs:   make(chan func(context.Context), 100),
		ctx:    ctx,
		cancel: cancel,
	}

	for i := 0; i < size; i++ {
		pool.wg.Add(1)
		go pool.worker(i)
	}

	return pool
}

func (p *WorkerPool) worker(id int) {
	defer p.wg.Done()
	for {
		select {
		case <-p.ctx.Done():
			return
		case job := <-p.jobs:
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Worker %d panic: %v", id, r)
					}
				}()
				job(p.ctx)
			}()
		}
	}
}

func (p *WorkerPool) Submit(job func(ctx context.Context)) {
	select {
	case p.jobs <- job:
	default:
		log.Println("Worker pool queue full, job dropped")
	}
}

func (p *WorkerPool) Stop() {
	p.cancel()
	p.wg.Wait()
}

type Scheduler struct {
	pool *WorkerPool
}

func NewScheduler(pool *WorkerPool) *Scheduler {
	return &Scheduler{pool: pool}
}

func (s *Scheduler) Schedule(interval time.Duration, job func(ctx context.Context)) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				s.pool.Submit(job)
			}
		}
	}()
}
