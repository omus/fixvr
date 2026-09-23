# Installation

::: warning fixvr is now a legacy fallback
The Valve Index wedge was fixed at its source in **ddcutil 3.0.2**. If you can
update `libddcutil`, you should **not** need this udev rule. Read
[The real root cause](/root-cause) first and prefer the root fix below.
:::

The sections below are ordered from *recommended* to *legacy*. Only use the
legacy udev rule if you cannot update ddcutil.


## Recommended fix (root cause)

### 1. Update ddcutil / libddcutil to 3.0.2 or newer

ddcutil 3.0.2 ships a built-in ignore list that includes the Valve Index, so it
no longer probes the headset. This is the real fix and needs no config file.

What matters is the **`libddcutil` shared library**, because that is what KDE
Plasma's `powerdevil` loads. After updating your distro package, restart
`powerdevil` (or simply log out and back in) so it picks up the new library.

```bash
ddcutil --version   # should report 3.0.2 or newer
```

### 2. Stop the Index waking the system on suspend (optional)

Add this kernel parameter to your bootloader (`grub`, `systemd-boot`, `limine`,
…):

```
usbcore.quirks=28de:2613:j
```

Reboot afterwards. This stops the headset's USB device from waking the machine
from suspend. A kernel patch is in progress so this will eventually not be
needed.

### 3. If you cannot update ddcutil

On ddcutil older than 3.0.2, use the `ddcutilrc` config file. `libddcutil` reads
it, so `powerdevil` honours it after a restart. See the
[ddcutil configuration docs](https://www.ddcutil.com/config_file/).

```bash
mkdir -p ~/.config/ddcutil
cat >~/.config/ddcutil/ddcutilrc <<EOF
[global]
options = --ignore-mmid VLV-Index_HMD-37288
EOF
```

The flag `--ignore-mmid VLV-Index_HMD-37288` tells ddcutil to skip the Valve
Index (`VLV` / product `0x91a8`, model `Index HMD`).


## Legacy: the fixvr udev rule

::: danger Deprecated workaround
This rule reboots the headset's HID layer at boot. It treats the symptom, not
the cause. It can [hang boot under Plymouth](https://github.com/MiguVT/fixvr/issues/6)
and does **not** run when resuming from suspend
([issue #2](https://github.com/MiguVT/fixvr/issues/2)). Prefer the root fix
above.
:::

FixVR ships a single udev rule file (`99-valve-index-reboot.rules`) and a helper
install script. Pick the method that matches your distro.

### Automatic - install script

The easiest way on any distro. Run this script:

```bash
curl -fsSL https://raw.githubusercontent.com/MiguVT/fixvr/main/src/install.sh | bash
```

The script prints a deprecation warning and asks you to confirm before
installing the legacy rule. It auto-detects your distro:

| Distro family | What happens |
|---|---|
| Arch / Manjaro / EndeavourOS / Garuda | Installs the `fixvr-git` AUR package via **paru** or **yay** |
| Debian / Ubuntu / Mint / Pop!_OS | Copies the rule and reloads udev |
| Fedora / RHEL / openSUSE / any other | Copies the rule and reloads udev |

> **AUR helper** — If neither `paru` nor `yay` is found, the script will offer to install paru for you.

### Arch-based (AUR)

Install with your preferred AUR helper:

::: code-group

```bash [paru]
paru -S fixvr-git
```

```bash [yay]
yay -S fixvr-git
```

:::

### NixOS

NixOS manages udev rules declaratively. Add the following to your system configuration (e.g. `configuration.nix` or a dedicated module):

```nix
{ pkgs, ... }:

let
  resetValveIndex = pkgs.writeShellScript "reset-valve-index" ''
    set -eu

    device="$1"
    stateDir="/run/valve-index-reset"
    flag="$stateDir/done"
    lock="$stateDir/lock"

    case "$device" in
      hidraw*) ;;
      *) exit 1 ;;
    esac

    # Give the HID interface time to finish initialization.
    sleep 2

    # Serialize simultaneous matching hidraw events.
    exec 9>"$lock"
    ${pkgs.util-linux}/bin/flock 9

    # Reset only once per boot.
    # This prevents the reset itself from creating a reset/re-enumeration loop.
    if [ -e "$flag" ]; then
      exit 0
    fi

    # Keep the exact payload pipeline used by the known-good Arch rule:
    # 0x16 0x01 followed by 62 zero bytes.
    if ! printf '\x16\x01' \
      | ${pkgs.coreutils}/bin/cat - /dev/zero \
      | ${pkgs.coreutils}/bin/head -c 64 \
      > "/dev/$device"
    then
      exit 1
    fi

    # Record success only after the reset command completes successfully.
    ${pkgs.coreutils}/bin/touch "$flag"
  '';
in
{
  # Boot-scoped runtime state.
  # /run is volatile and cleared on reboot.
  systemd.tmpfiles.settings."valve-index-reset" = {
    "/run/valve-index-reset".d = {
      mode = "0755";
      user = "root";
      group = "root";
    };
  };

  systemd.services."valve-index-reset@" = {
    description = "Reset Valve Index HID interface";

    # Wait for the hidraw device to exist, but do not bind service
    # lifetime to it because the reset intentionally causes re-enumeration.
    after = [ "dev-%i.device" ];

    serviceConfig = {
      Type = "oneshot";
      ExecStart = "${resetValveIndex} %i";
      TimeoutStartSec = "15s";

      # Service hardening.
      NoNewPrivileges = true;
      PrivateTmp = true;
      ProtectHome = true;
      ProtectSystem = "strict";
      ProtectKernelTunables = true;
      ProtectKernelModules = true;
      ProtectControlGroups = true;
      RestrictSUIDSGID = true;
      LockPersonality = true;

      ReadWritePaths = [
        "/run/valve-index-reset"
      ];
    };
  };

  services.udev.extraRules = ''
    ACTION=="add", \
      SUBSYSTEM=="hidraw", \
      KERNEL=="hidraw*", \
      ATTRS{idVendor}=="28de", \
      ATTRS{idProduct}=="2300", \
      TAG+="systemd", \
      ENV{SYSTEMD_WANTS}+="valve-index-reset@%k.service"
  '';
}
```

Then rebuild:

```bash
sudo nixos-rebuild switch
```

### Manual (all distros)

Download and install the rule file, then reload udev:

```bash
sudo curl -fsSL https://raw.githubusercontent.com/MiguVT/fixvr/main/src/99-valve-index-reboot.rules \
  -o /etc/udev/rules.d/99-valve-index-reboot.rules
sudo udevadm control --reload-rules
sudo udevadm trigger --action=add --subsystem-match=hidraw
```

Reconnect your Valve Index — the legacy rule is now active.


## Uninstall

If you installed fixvr and later fixed the root cause, remove the legacy rule:

```bash
sudo rm /etc/udev/rules.d/99-valve-index-reboot.rules
sudo udevadm control --reload-rules
```

On Arch (AUR):

```bash
paru -R fixvr-git   # or: yay -R fixvr-git
```

On NixOS, remove the `services.udev.extraRules` block and run `sudo nixos-rebuild switch`.

On any distro, you can also undo the older workarounds:

```bash
rm -f ~/.config/ddcutil/ddcutilrc   # only needed on ddcutil < 3.0.2
```


## How the legacy rule works

The udev rule matches the Valve Index HMD by its USB vendor/product ID (`28de:2300`). On the `add` event — i.e. each time the device is enumerated — it fires a backgrounded shell one-liner:

1. A subshell is spawned in the background (`&`) so udev's event queue is not blocked.
2. After a 2-second delay (giving the HMD firmware time to finish initialising), it checks for a flag file `/tmp/.valve-index-rebooted`.
3. If the flag is absent, it writes a 64-byte HID reboot payload (`\x16\x01` followed by zeroes) directly to the `hidraw` device node.
4. Only if the write succeeds (`&&`), the flag file is created — this prevents the flag from being set when udev tries a wrong `hidraw` interface.
5. The HMD reboots its HID layer, re-reads the EDID correctly, and presents itself at the right resolution.

Because `/tmp` is cleared every boot, the flag is always absent on the first plug-in of each session, and always present for subsequent plug-ins, preventing double-reboots.

This is a software workaround for a problem that is now fixed upstream. See
[The real root cause](/root-cause) for why it was ever necessary.


## Troubleshooting

### I updated ddcutil but the headset still wedges

Make sure the **library** `powerdevil` actually loads is new enough, then
restart `powerdevil` (or log out/in). Check with:

```bash
ddcutil --version
ldconfig -p | grep ddcutil
```

The Index should no longer show up in `ddcutil detect`.

### The legacy fix doesn't seem to apply on boot

Make sure the rule file is installed and udev has been reloaded:

```bash
cat /etc/udev/rules.d/99-valve-index-reboot.rules
sudo udevadm control --reload-rules
```

Reconnect your headset or trigger manually:

```bash
sudo rm -f /tmp/.valve-index-rebooted
sudo udevadm trigger --action=add --subsystem-match=hidraw
sleep 4
ls -l /tmp/.valve-index-rebooted
```

If the flag file exists, the rule fired successfully.

### The flag file exists but the headset still shows as 640×480

This sometimes happens if the timing is tight. Try increasing the sleep value in the rule from `2` to `5` and rebooting. Better yet, fix the root cause instead — see [The real root cause](/root-cause).
