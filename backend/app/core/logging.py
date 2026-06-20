"""Logging setup and a dedicated audit logger.

`setup_logging` configures the root logger; `audit` records security-relevant
mutations (create/update/delete) so there is an application-level audit trail
even before a database audit table exists.
"""
import logging
import sys

audit_logger = logging.getLogger("clinic.audit")


def setup_logging(debug: bool = True) -> None:
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    # Quieten access noise; our middleware logs requests instead.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def audit(action: str, entity: str, entity_id, *, actor: str = "system") -> None:
    audit_logger.info("AUDIT actor=%s action=%s entity=%s id=%s", actor, action, entity, entity_id)
