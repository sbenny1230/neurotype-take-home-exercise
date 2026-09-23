from datetime import date, datetime, timezone

from models import Assessment, Client, Domain, Item
from scoring import Band, age_at, band_for_percentage, domain_percentage, review_flag

CLIENT = Client(
    date_of_birth=date(2014, 3, 2),
    nhs_number="999 476 5919",
    guardian_contact="j.okafor@example.com",
)


def make_assessment(domains: list[Domain], summary: str = "x" * 200) -> Assessment:
    return Assessment(
        assessment_id="a-00001",
        client=CLIENT,
        assessed_at=datetime(2026, 3, 2, 9, 30, tzinfo=timezone.utc),
        clinician_id="c-005",
        domains=domains,
        summary=summary,
    )


def test_domain_percentage_is_mean_of_raw_over_max():
    domain = Domain(
        "social_communication",
        [
            Item("SC1", raw=10, max=20, completed=True),
            Item("SC2", raw=15, max=20, completed=True),
        ],
    )
    assert domain_percentage(domain) == 62.5


def test_domain_percentage_excludes_uncompleted_items():
    domain = Domain(
        "social_communication",
        [
            Item("SC1", raw=10, max=20, completed=True),
            Item("SC2", raw=None, max=20, completed=False),
        ],
    )
    assert domain_percentage(domain) == 50.0


def test_domain_percentage_is_none_when_no_completed_items():
    domain = Domain(
        "social_communication",
        [Item("SC1", raw=None, max=20, completed=False)],
    )
    assert domain_percentage(domain) is None


def test_band_boundaries():
    assert band_for_percentage(0) == Band.MINIMAL
    assert band_for_percentage(39) == Band.MINIMAL
    assert band_for_percentage(40) == Band.MILD
    assert band_for_percentage(54) == Band.MILD
    assert band_for_percentage(55) == Band.MODERATE
    assert band_for_percentage(84) == Band.MODERATE
    assert band_for_percentage(85) == Band.SUBSTANTIAL
    assert band_for_percentage(100) == Band.SUBSTANTIAL


def test_review_flag_off_when_nothing_notable():
    domain = Domain("social_communication", [Item("SC1", raw=10, max=20, completed=True)])
    assessment = make_assessment([domain])
    assert review_flag(assessment) is False


def test_review_flag_on_when_domain_bands_substantial():
    domain = Domain("social_communication", [Item("SC1", raw=19, max=20, completed=True)])
    assessment = make_assessment([domain])
    assert review_flag(assessment) is True


def test_review_flag_on_when_item_uncompleted():
    domain = Domain(
        "social_communication",
        [
            Item("SC1", raw=10, max=20, completed=True),
            Item("SC2", raw=None, max=20, completed=False),
        ],
    )
    assessment = make_assessment([domain])
    assert review_flag(assessment) is True


def test_review_flag_on_when_summary_too_short():
    domain = Domain("social_communication", [Item("SC1", raw=10, max=20, completed=True)])
    assessment = make_assessment([domain], summary="too short")
    assert review_flag(assessment) is True


def test_age_at_before_birthday_this_year():
    assert age_at(date(2014, 3, 2), date(2026, 2, 1)) == (11, 10)


def test_age_at_on_birthday():
    assert age_at(date(2014, 3, 2), date(2026, 3, 2)) == (12, 0)


def test_age_at_after_birthday():
    assert age_at(date(2014, 3, 2), date(2026, 9, 23)) == (12, 6)
