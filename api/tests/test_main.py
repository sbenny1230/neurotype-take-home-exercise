from src.main import app


def test_routes_are_tagged_by_feature_in_openapi():
    paths = app.openapi()["paths"]
    assert paths["/health"]["get"]["tags"] == ["health"]
    assert paths["/assessments"]["get"]["tags"] == ["assessments"]
