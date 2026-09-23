# FixVR

> **Legacy fallback.** The Valve Index wedge was fixed at its source in
> **ddcutil 3.0.2**. If you can update `libddcutil`, you should not need this
> project. See [The real root cause](https://fixvr.miguvt.com/root-cause).

A tiny udev rule that worked around the Valve Index blank EDID bug on Linux,
where the kernel would see the HMD as a 640×480 monitor.

## The root cause

The headset was never really enumerating with a blank EDID on its own. The
software `ddcutil` / `libddcutil` probes the display's I2C bus to detect DDC/CI
capabilities (for example brightness control). That probe to I2C slave `0x37`
causes the Valve Index firmware to stop answering EDID reads, after which the
kernel logs `EDID err: 2` / `EDID_NO_RESPONSE`, `amdgpu` falls back to 640×480
with `non-desktop=0`, and the headset is unusable until power-cycled.

The usual trigger is **KDE Plasma's `powerdevil`**, which uses `libddcutil` to
work out whether connected displays allow brightness control. That is why the
bug affected many setups — but **not all**: if `ddcutil` never probed your
headset, you never saw it.

Diagnosed and fixed upstream by [**@omus**](https://github.com/omus) in
[ddcutil #632](https://github.com/rockowitz/ddcutil/issues/632) /
[PR #637](https://github.com/rockowitz/ddcutil/pull/637). ddcutil **3.0.2** now
ignores the Index by default (equivalent to
`--ignore-mmid VLV-Index_HMD-37288`). Thank you! 🎉

## The recommended fix

1. Update `ddcutil` / `libddcutil` to **3.0.2 or newer**, then restart
   `powerdevil` (or log out/in). The index should disappear from `ddcutil detect`.
2. Optionally add the kernel parameter below to stop the Index waking the system
   from suspend (a kernel patch is in progress):
   ```
   usbcore.quirks=28de:2613:j
   ```
3. On ddcutil older than 3.0.2, use the `ddcutilrc` config file:
   ```bash
   mkdir -p ~/.config/ddcutil
   cat >~/.config/ddcutil/ddcutilrc <<EOF
   [global]
   options = --ignore-mmid VLV-Index_HMD-37288
   EOF
   ```

Full write-up: <https://fixvr.miguvt.com/root-cause>

## The legacy workaround

A udev rule sends a 64-byte HID reboot payload (`\x16\x01` + zeroes) to the
`hidraw` device node the first time the HMD is detected each boot. This forces
the firmware to re-enumerate and expose the correct EDID. It treats the symptom,
not the cause, and can interact badly with early-boot software (e.g. it can
[hang boot under Plymouth](https://github.com/MiguVT/fixvr/issues/6)). The flag
file in `/tmp` prevents it from running more than once per boot.

Installation (legacy): take a look at the
[docs](https://fixvr.miguvt.com/install) for automatic installation scripts for
Arch (AUR) and NixOS, or follow the manual instructions on the same page.

## License

MIT
