from __future__ import annotations
from typing import Any
from .base import Element
from .inputs import PushButton, HandSwitch, LimitSwitch, NposLever
from .contacts import RelayContact, ThermalContact, OnDelayContact, OffDelayContact, NposContact
from .coils import RelayCoil, ThermalOverload, SolenoidValveCoil
from .timers import OnDelayTimer, OffDelayTimer, PulseRelay
from .outputs import Lamp, Siren, Motor3Ph, MeasurementInstrument
from .passive import Rail, Fuse, Terminal, Wire
from .compound import YDStarter

# Maps element type strings (from JSON) → constructor
REGISTRY: dict[str, type[Element]] = {
    # inputs
    "push_button_no": lambda id, a, b, p: PushButton(id, a, b, {**p, "normally_open": True}),
    "push_button_nc": lambda id, a, b, p: PushButton(id, a, b, {**p, "normally_open": False}),
    "hand_switch": HandSwitch,
    "limit_switch_no": lambda id, a, b, p: LimitSwitch(id, a, b, {**p, "normally_open": True}),
    "limit_switch_nc": lambda id, a, b, p: LimitSwitch(id, a, b, {**p, "normally_open": False}),
    # relay contacts
    "relay_contact_no": lambda id, a, b, p: RelayContact(id, a, b, {**p, "normally_open": True}),
    "relay_contact_nc": lambda id, a, b, p: RelayContact(id, a, b, {**p, "normally_open": False}),
    "thermal_contact_no": lambda id, a, b, p: ThermalContact(id, a, b, {**p, "normally_open": True}),
    "thermal_contact_nc": lambda id, a, b, p: ThermalContact(id, a, b, {**p, "normally_open": False}),
    "on_delay_contact_no": lambda id, a, b, p: OnDelayContact(id, a, b, {**p, "normally_open": True}),
    "on_delay_contact_nc": lambda id, a, b, p: OnDelayContact(id, a, b, {**p, "normally_open": False}),
    "off_delay_contact_no": lambda id, a, b, p: OffDelayContact(id, a, b, {**p, "normally_open": True}),
    "off_delay_contact_nc": lambda id, a, b, p: OffDelayContact(id, a, b, {**p, "normally_open": False}),
    # coils
    "relay_coil": RelayCoil,
    "thermal_overload": ThermalOverload,
    "solenoid_valve": SolenoidValveCoil,
    # timers
    "on_delay_timer": OnDelayTimer,
    "off_delay_timer": OffDelayTimer,
    "pulse_relay": PulseRelay,
    # outputs
    "lamp": Lamp,
    "siren": Siren,
    "motor_3ph": Motor3Ph,
    "instrument": MeasurementInstrument,
    # passive
    "fuse": Fuse,
    "terminal": Terminal,
    "wire": Wire,
    "rail_r": Rail,
    "rail_n": Rail,
    # compound
    "yd_starter": YDStarter,
    # Sensors — maintained switches; state driven by playground via button_event
    "proximity_no":   lambda id, a, b, p: HandSwitch(id, a, b, {**p, "normally_open": True}),
    "proximity_nc":   lambda id, a, b, p: HandSwitch(id, a, b, {**p, "normally_open": False}),
    "temp_sensor_no": lambda id, a, b, p: HandSwitch(id, a, b, {**p, "normally_open": True}),
    "temp_sensor_nc": lambda id, a, b, p: HandSwitch(id, a, b, {**p, "normally_open": False}),
    # N-position rotary selector (lever/dial)
    "npos_lever":        NposLever,
    "npos_contact_no":   lambda id, a, b, p: NposContact(id, a, b, {**p, "normally_open": True}),
    "npos_contact_nc":   lambda id, a, b, p: NposContact(id, a, b, {**p, "normally_open": False}),
}


def build_element(
    element_id: str,
    element_type: str,
    terminal_a: str,
    terminal_b: str,
    params: dict[str, Any],
) -> Element:
    factory = REGISTRY.get(element_type)
    if factory is None:
        raise ValueError(f"Unknown element type: {element_type!r}")
    return factory(element_id, terminal_a, terminal_b, params)
