if __package__:
    from .api import app
    from .cli import main as cli_main
else:
    from api import app
    from cli import main as cli_main

if __name__ == "__main__":
    cli_main()
