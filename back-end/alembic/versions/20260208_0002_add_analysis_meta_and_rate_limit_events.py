"""add analysis meta and distributed rate limit table

Revision ID: 20260208_0002
Revises: 20260206_0001
Create Date: 2026-02-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260208_0002"
down_revision = "20260206_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("analyses", sa.Column("analysis_meta", sa.JSON(), nullable=True))

    op.create_table(
        "rate_limit_events",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("ts_epoch", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_rate_limit_events_id", "rate_limit_events", ["id"])
    op.create_index("ix_rate_limit_events_key", "rate_limit_events", ["key"])
    op.create_index("ix_rate_limit_events_ts_epoch", "rate_limit_events", ["ts_epoch"])


def downgrade() -> None:
    op.drop_index("ix_rate_limit_events_ts_epoch", table_name="rate_limit_events")
    op.drop_index("ix_rate_limit_events_key", table_name="rate_limit_events")
    op.drop_index("ix_rate_limit_events_id", table_name="rate_limit_events")
    op.drop_table("rate_limit_events")

    op.drop_column("analyses", "analysis_meta")
