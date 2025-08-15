## 🚀 Deploying the Node.js App in Production (Linux + PM2)

This guide explains how to deploy and keep your Node.js app running permanently in the background using **PM2**, with automatic restarts on crashes and reboots.

---

### 1️⃣ Prerequisites

Before you begin, make sure you have:

* **Node.js** and **npm** installed
* **PM2** installed globally
* Access to a Linux server (with `sudo` privileges)
* Your app’s code deployed on the server

Install PM2 globally:

```bash
npm install -g pm2
```

---

### 2️⃣ Install Dependencies

Navigate to your app’s root directory and install all dependencies:

```bash
cd /path/to/your/app
npm install
```

---

### 3️⃣ Initial Database Setup (Run Once)

**Step 1:** Create the database schema:

```bash
node config/schema-runner.js
```

**Step 2:** Populate the database with initial data:

```bash
node config/seed.js
```

> ⚠️ These steps are only needed **once** during the initial setup.

---

### 4️⃣ Start the App with PM2

Start your app with PM2:

```bash
pm2 start server.js --name "my-node-app"
```

Replace `server.js` with the entry point of your app if different.

---

### 5️⃣ Enable Automatic Restart on Reboot

To make PM2 restart your app automatically after a system reboot:

```bash
pm2 startup
```

This will print a command—copy and run it (usually something like `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username`).

Save the PM2 process list:

```bash
pm2 save
```

---

### 6️⃣ Useful PM2 Commands

| Command                                    | Description             |
| ------------------------------------------ | ----------------------- |
| `pm2 start server.js --name "my-node-app"` | Start the app           |
| `pm2 stop my-node-app`                     | Stop the app            |
| `pm2 restart my-node-app`                  | Restart the app         |
| `pm2 delete my-node-app`                   | Remove the app from PM2 |
| `pm2 logs my-node-app`                     | View logs               |
| `pm2 list`                                 | List all running apps   |

---

### 7️⃣ Crash Recovery

PM2 automatically restarts the app if it crashes.
You don’t need to run any special command for this—once your app is started and saved in PM2, it will keep running.

---

✅ **Your Node.js app is now permanently running in the background, restarts on crashes, and auto-starts after reboots.**