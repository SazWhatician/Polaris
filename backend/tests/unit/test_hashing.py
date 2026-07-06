from app.services.hashing import sha256_hex


def test_stable_for_identical_bytes() -> None:
    assert sha256_hex(b"hello") == sha256_hex(b"hello")


def test_different_for_different_bytes() -> None:
    assert sha256_hex(b"a") != sha256_hex(b"b")


def test_returns_64_hex_chars() -> None:
    h = sha256_hex(b"any input")
    assert len(h) == 64
    assert all(c in "0123456789abcdef" for c in h)


def test_empty_input_known_hash() -> None:
    # Spot-check against the well-known SHA-256 of the empty string.
    assert sha256_hex(b"") == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
