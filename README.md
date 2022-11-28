# Intermediator

Intermediator是一个轻量开源工具，用于 Windows(x64)、 Mac 系统上修改接口返回值。

您可以使用它修改HTTP(S)响应值、重定向静态文件请求到本地文件目录，支持使用正则的方式批量修改请求返回值。

---

## 使用方式

    1. 输入包含http/https的网址

<img title="" src="./readme/2022-11-26-13-10-19-image.png" alt="" width="215">

    2. 点击添加规则

    3. 编辑你的规则

```便捷的编辑你的规则
     当前支持指定API、批量正则和路径的方式匹配要改变的api
     在Changed value中输入改变后的值/本地路径
     eg:选择path模式 
        输入被监听的api路径 支持模糊匹配
        Changed value中输入本地路径
        值得注意的是path模式匹配到路径而不是文件
     eg:选择api模式
        输入被监听的api路径完整值 暂不匹配api中的GET参数 ?x= &y=
        Changed value中输入请求响应结果的右击复制值并修改成你想要的值
```

    4. 点击浏览器图标即可看到效果

## Intermediator工作流程

| 生命周期              | Intermediator执行                                     | 读写磁盘 | 新开进程 | 监听端口 |
| ----------------- | --------------------------------------------------- | ---- | ---- | ---- |
| 打开                | 读取软件目录中的规则文件Rule.qy                                 | √    | x    | x    |
| 初始化               | 应用保存按钮储存的规则并默认选择第一个规则                               | x    | x    | x    |
| 点击新增规则            | 仅修改state值                                           | x    | x    | x    |
| 点击保存规则            | 写当前规则到Rule.qy                                       | √    | x    | x    |
| 点击打开浏览器           | 启动本地node进程并仅应用当前网址的规则构建代理服务，打开内置浏览器注入代理规则打开devTools | √    | √    | √    |
| 改变规则后再次点击打开浏览器    | 启动本地node进程监听新的端口构建当前网址新规则代理服务器，打开内置浏览器新窗口注入代理       | √    | √    | √    |
| 改变网址和规则后再次点击打开浏览器 | 同上                                                  | √    | √    | √    |
| 关闭某个浏览器窗口         | 不执行任何操作                                             | x    | x    | x    |
| 关闭所有窗口            | 结束进程并关闭所有代理服务                                       | x    | x    | x    |

## 

## 发送您的反馈

    您可以直接在ISSUES中反馈

    [Issues · name-q/intermediator · GitHub](https://github.com/name-q/intermediator/issues)

## 下载链接

    mac：

        Intel芯片下载Intermediator-1.0.0.dmg

        M1或M2芯片下载Intermediator-1.0.0-arm64.dmg

    win：

        下载Intermediator.Setup.1.0.0.exe 仅适用64位系统

    [Release Intermediator · name-q/intermediator · GitHub](https://github.com/name-q/intermediator/releases/tag/PublicTest)

## 常见问题

    Q：和PostMan有什么区别

    A：PostMan主要用于后端调试接口,Intermediator用于前端调试页面

    Q：常见的使用场景

    A：  1.部分环境有数据但不允许直接连调，可复制值到你的环境上

            2.修改某个值让前端工程师看到修改后的效果

            3.将多个静态文件请求映射到本地热更新编译后的目录

    Q：为何不支持PC全局请求获取

    A：    全局请求获取必须要修改您的网络代理&信任我们生成的CA证书

              当使用VPN或其他代理软件时会出现互相争夺网络代理当然我们

              可以注入某个软件例如Chrome支持不安全的CA和Proxy的注入。

              市场上的抓包改包工具很丰富例如charles\fiddler\wireshark

              有偿且有学习成本，我们仅代理了自带的浏览器不存在污染。

              做抓包工具可以实现但并不符合我们明确

且轻量的初衷和方向。
