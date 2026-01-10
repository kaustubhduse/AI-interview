import logging
from livekit.rtc import room as rtc_room

logger = logging.getLogger("voice-agent")

def patch_livekit_room_keyerror() -> None:
    if getattr(rtc_room.Room, "_keyerror_patched", False):
        return

    original = rtc_room.Room._on_room_event

    def _safe_on_room_event(self, room_event):
        try:
            return original(self, room_event)
        except KeyError as e:
            logger.warning(f"LiveKit KeyError suppressed: {e}", exc_info=True)
            return None

    rtc_room.Room._on_room_event = _safe_on_room_event
    rtc_room.Room._keyerror_patched = True
