from collections.abc import Callable
from datetime import date, datetime, timezone

import pytest

from src.assessments.model import Assessment, Band, Client, Domain, Item
from src.assessments.service import age_at, band_for_percentage, domain_percentage, review_flag

DATE_OF_BIRTH = date(2014, 3, 2)


@pytest.fixture
def make_assessment() -> Callable[..., Assessment]:
    def _make(domains: list[Domain], summary: str = "x" * 200) -> Assessment:
        return Assessment(
            assessment_id="a-00001",
            client=Client(
                date_of_birth=DATE_OF_BIRTH,
                nhs_number="999 476 5919",
                guardian_contact="j.okafor@example.com",
            ),
            assessed_at=datetime(2026, 3, 2, 9, 30, tzinfo=timezone.utc),
            clinician_id="c-005",
            domains=domains,
            summary=summary,
        )

    return _make


@pytest.fixture
def fully_completed_domain() -> Domain:
    return Domain(
        "social_communication",
        [
            Item("SC1", raw=10, max=20, completed=True),
            Item("SC2", raw=15, max=20, completed=True),
        ],
    )


@pytest.fixture
def partly_completed_domain() -> Domain:
    return Domain(
        "social_communication",
        [
            Item("SC1", raw=10, max=20, completed=True),
            Item("SC2", raw=None, max=20, completed=False),
        ],
    )


@pytest.fixture
def uncompleted_domain() -> Domain:
    return Domain("social_communication", [Item("SC1", raw=None, max=20, completed=False)])


@pytest.fixture
def mild_domain() -> Domain:
    return Domain("social_communication", [Item("SC1", raw=10, max=20, completed=True)])


@pytest.fixture
def substantial_domain() -> Domain:
    return Domain("social_communication", [Item("SC1", raw=19, max=20, completed=True)])


def test_domain_percentage_is_mean_of_raw_over_max(fully_completed_domain):
    assert domain_percentage(fully_completed_domain) == 62.5


def test_domain_percentage_excludes_uncompleted_items(partly_completed_domain):
    assert domain_percentage(partly_completed_domain) == 50.0


def test_domain_percentage_is_none_when_no_completed_items(uncompleted_domain):
    assert domain_percentage(uncompleted_domain) is None


@pytest.mark.parametrize(
    ("percentage", "band"),
    [
        (0, Band.MINIMAL),
        (39, Band.MINIMAL),
        (40, Band.MILD),
        (54, Band.MILD),
        (55, Band.MODERATE),
        (84, Band.MODERATE),
        (85, Band.SUBSTANTIAL),
        (100, Band.SUBSTANTIAL),
    ],
)
def test_band_boundaries(percentage, band):
    assert band_for_percentage(percentage) == band


def test_review_flag_off_when_nothing_notable(make_assessment, mild_domain):
    assessment = make_assessment([mild_domain])
    assert review_flag(assessment) is False


def test_review_flag_on_when_domain_bands_substantial(make_assessment, substantial_domain):
    assessment = make_assessment([substantial_domain])
    assert review_flag(assessment) is True


def test_review_flag_on_when_item_uncompleted(make_assessment, partly_completed_domain):
    assessment = make_assessment([partly_completed_domain])
    assert review_flag(assessment) is True


def test_review_flag_on_when_summary_too_short(make_assessment, mild_domain):
    assessment = make_assessment([mild_domain], summary="too short")
    assert review_flag(assessment) is True


@pytest.mark.parametrize(
    ("assessed_on", "expected_age"),
    [
        pytest.param(date(2026, 2, 1), (11, 10), id="before_birthday_this_year"),
        pytest.param(date(2026, 3, 2), (12, 0), id="on_birthday"),
        pytest.param(date(2026, 9, 23), (12, 6), id="after_birthday"),
    ],
)
def test_age_at(assessed_on, expected_age):
    assert age_at(DATE_OF_BIRTH, assessed_on) == expected_age
