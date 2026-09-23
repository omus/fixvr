---
layout: home

hero:
  name: "FixVR"
  text: "Index isn't a monitor"
  tagline: The Valve Index blank-EDID bug is fixed upstream in ddcutil 3.0.2. fixvr is now a legacy fallback for systems that can't update.
  actions:
    - theme: brand
      text: Read the root cause
      link: /root-cause
    - theme: alt
      text: Legacy install
      link: /install
    - theme: alt
      text: View on GitHub
      link: https://github.com/miguvt/fixvr

features:
  - icon: 🎯
    title: Root Cause Found
    details: The headset wasn't really "blank" - ddcutil's DDC/CI probe to I2C slave 0x37 wedged its EDID EEPROM. Diagnosed and fixed upstream by @omus in ddcutil 3.0.2.

  - icon: 🩺
    title: Fix the Cause, Not the Symptom
    details: Updating libddcutil to 3.0.2 makes ddcutil ignore the Index by default. No config file, no headset reboot, no udev rule required.

  - icon: 🖥️
    title: It Was Mostly Plasma
    details: KDE Plasma's powerdevil uses libddcutil to detect brightness control, which is why the bug hit many - but not all - setups. No Plasma/ddcutil, no probe, no wedge.

  - icon: 🌙
    title: Stop the Suspend Wakeup
    details: Add the kernel parameter usbcore.quirks=28de:2613:j to stop the Index waking the system from suspend. A proper kernel patch is in the works.

  - icon: 🧰
    title: Legacy Fallback Kept
    details: For systems that truly can't update ddcutil, the original udev reboot rule is still available and documented - clearly marked legacy.
---

::: warning fixvr is now a legacy fallback
The Valve Index wedge was fixed at the source in **ddcutil 3.0.2**. If you can
update `libddcutil`, you should **not** need fixvr. Start with
[The real root cause](/root-cause), then only fall back to the
[legacy udev rule](/install) if you genuinely can't update.

Thanks to [@omus](https://github.com/omus) for diagnosing and fixing the root issue.
:::
