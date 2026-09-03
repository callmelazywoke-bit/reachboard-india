-- Add unique constraint on creator_id for upsert support
ALTER TABLE reach_scores ADD CONSTRAINT reach_scores_creator_id_unique UNIQUE (creator_id);