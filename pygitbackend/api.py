if __package__:
    from .server import app
else:
    from server import app

__all__ = ["app"]
