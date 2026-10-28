def parse_bool(value):
    """
    Safely converts a request flag to bool.
    bool("false") is True in Python, so strings like "false", "0" or "" must be parsed explicitly.
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in ('true', '1', 'yes', 'on')
    return False
