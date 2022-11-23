/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
const cp = require('child_process')

// 终端命令
let cps: Array<any> = []

// Proxy ignore
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');


//引入node原生fs模块
const fs = require("fs")
//引入node原生读写配置
const ini = require('ini');
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let ruleWindow: BrowserWindow;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// 打开内部浏览器并应用规则
ipcMain.on('intermediator', async (event, arg) => {
  let [rule, url] = arg
  console.log(rule, '<<<<>>>', url)
  try {
    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
    };
    ruleWindow = new BrowserWindow({
      show: false,
      width: 333,
      height: 666,
      icon: getAssetPath('icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
        webSecurity: false,
      }
    });

    // const spawn = cp.spawn(process.execPath, ['index.js'], {
    //   maxBuffer: 1024 * 1024 * 999,
    //   cwd: app.isPackaged
    //     ? path.join(process.resourcesPath, 'mockttpx')
    //     : path.join(__dirname, '../../mockttpx')
    // })
    // cps[cps.length] = spawn

    // spawn.stdout.on('data', (data: any) => {
      // get proxy prot & PEM
      // let [prot, PEM] = (data+"").split('>>>')
      console.log(JSON.stringify(rule),'<<<<XXXX')
      ruleWindow.webContents.session.setProxy({
        // proxyRules:`127.0.0.1:${prot}`
        proxyRules:`127.0.0.1:8000`
      })
      ruleWindow.loadURL(url);
      ruleWindow.once('ready-to-show', () => {
        if (!ruleWindow) {
          throw new Error('"ruleWindow" is not defined');
        } else {
          setTimeout(() => ruleWindow?.show(), 200)
        }
      });
    // })

  } catch (error) {
    event.reply('intermediator', error)
  }
  event.reply('intermediator', 'success')
})

// 获取规则缓存文件
ipcMain.on('fs', async (event, arg) => {
  const msgTemplate = (msg: string) => `fs: ${msg}`;
  console.log(msgTemplate(arg));

  let rulePath = path.join(__dirname, 'Rule.qy')
  if (!fs.existsSync(rulePath)) {
    // 写入初始缓存文件
    fs.writeFileSync(rulePath, ini.stringify([]))
  }

  // 获取缓存文件
  if (arg[0] === 'getCache') {
    let rule = ini.parse(fs.readFileSync(rulePath).toString());
    event.reply('fs', rule);
  }

  // 写入缓存文件
  if (arg[0] === 'setCache') {
    fs.writeFileSync(rulePath, ini.stringify(arg[1]))
    event.reply('fs', 'rule save ok');
  }

});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 333,
    height: 666,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      setTimeout(() => mainWindow?.show(), 200)
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // close all proxy
  for (let i = 0; i < cps.length; i++) {
    cps[i].kill()
  }
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 阻止点击内部链接打开新窗口
let contentTemp: any = null;
const newWindowListener = (e: any) => {
  e.preventDefault();
  dialog.showMessageBox(ruleWindow, {
    type: 'error',
    message: 'Rules in effect',
    detail: 'Prevent opening new windows through links'
  })
  contentTemp?.removeListener("new-window", newWindowListener);
};
app.on("web-contents-created", (e, webContents) => {
  webContents.addListener("new-window", newWindowListener);
  contentTemp = webContents;
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
