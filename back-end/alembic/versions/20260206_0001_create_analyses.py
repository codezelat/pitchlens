"""create analyses table

Revision ID: 20260206_0001
Revises: 
Create Date: 2026-02-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260206_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analyses",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("tone", sa.String(length=32), nullable=False),
        sa.Column("persona", sa.String(length=32), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("clarity", sa.Integer(), nullable=False),
        sa.Column("emotion", sa.Integer(), nullable=False),
        sa.Column("credibility", sa.Integer(), nullable=False),
        sa.Column("market_effectiveness", sa.Integer(), nullable=False),
        sa.Column("suggestion", sa.Text(), nullable=False),
        sa.Column("insights", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_analyses_id", "analyses", ["id"])
    op.create_index("ix_analyses_owner_id", "analyses", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_analyses_owner_id", table_name="analyses")
    op.drop_index("ix_analyses_id", table_name="analyses")
    op.drop_table("analyses")
