# MKTMPSNAP

<img src="./icon.png" align="right" width="54" />

**MKTMPSNAP** (Mikrotik Temporary Snapshot) is a lightweight system for performing temporary and anonymous backups of Mikrotik configurations without worrying about losing previous settings. It uses the Mikrotik API and cronjobs to automatically perform backups.

> [!NOTE]
> The project is not complete yet.

## 🤔 Why this project was created?

This project was created from the frustrations during practical work at school, where time was often limited. MKTMPSNAP allows users to quickly download and restore Mikrotik backup files at any time (before 15 days).

## 🐈 How do I use it?

To use it, you can first run this project by typing:

```bash
bun run start
```

Or by running it via a docker image in the registry, or you can create your own docker image.

```bash
docker run --name mktmpsnap \
  --volume ./data:/app/data \
  -p 3500:3500 \
  ernestoyoofi/mktmpsnap:v0.1.0
```

> Make sure the `./data` folder exists on your host.

Once running, open your browser on the exposed port. Fill in the Mikrotik connection form:

- Hostname / IP of your Mikrotik
- Mikrotik username
- Mikrotik password (leave blank if none)
- Port (default or custom)

Next, set the last time for the backup. Backed-up data will be stored for 15 days unless deleted by cronjobs.

> Additional Information
>
> If you want to keep your connection to this system secure, please use Tailscale or Twingate to monitor/access the web safely!

### ✨ Contributing & Forking

This is a small, non-commercial project. Contributions are welcome, and you are free to fork it to create your own version. Please credit the creator *@ernestoyoofi* in your forked version or any derivative work.

<!--
TABLE snapshot;

id: int key ()
title: text (require)
uuid: text (require)
status: text (require)
mikrotik_hostname: text (require)
mikrotik_username: text (require)
mikrotik_password: text (default: null/undefined)
mikrotik_port: bigint (require)
backup_end: date (require)
backup_last: date
backup_again: date
-->