# wechaty-room-clock
[![Wechaty Plugin Contrib](https://img.shields.io/badge/Wechaty%20Plugin-wechaty--room--clock-brightgreen.svg)](https://github.com/isboyjc/wechaty-room-clock) [![Powered by Wechaty](https://img.shields.io/badge/Powered%20By-Wechaty-brightgreen.svg)](https://github.com/Wechaty/wechaty)

integral, clock

积分，打卡签到

## 开始

### 简介

看名字，功能不难猜到，在群聊中打卡签到，每次打卡签到后累计打卡签到次数+1，积分+1，每日只可打卡一次，打卡总数/积分总数/打卡日志等等

你可能觉得这些操作需要用到数据库，但是在我的理解中，微信机器人越简单越便捷越好，而微信群聊的数据量不是很大，一个插件的使用，需要额外配置很多东西是很麻烦的，所以，此插件采用了本地存储，用了一个三方轻量化的基于 `Node` 的 `JSON` 文件数据库 `LOWDB`，避免了数据库这一繁琐的配置

插件会自动在项目根目录创建一个 `[机器人名字].clock-logs` 的文件夹，用以存放数据

其中 `clock-logs-[年份].json` 文件存储的是打卡日志，为避免读写操作数据量过大产生的负荷，所以每年会生成对应的 `json` 文件，这样每个群聊上限是 500 人，以5个群聊为基础，一年的打卡数据量也不会太大

其中 `clock-logs-main.json` 文件为主文件，存储的是对应群聊/对应用户的打卡签到数据等等

当然，如果你有更好的想法，请务必告知哦

### 安装

```txt
npm install wechaty-room-clock

or

yarn add wechaty-room-clock
```

### 使用

```js
const WechatyRoomClock = require("wechaty-room-clock")

bot.use(WechatyRoomClock(options))
```

如上所示

使用插件只要按需传入配置对象 `options` 即可

| Options 参数属性  | 类型             | 简介                                                         |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| keyword           | String\|Array    | 触发签到的关键字，只有一个可以使用字符串类型，多个关键字使用数组类型，默认为 ["签到", "打卡"] |
| success           | String\|Function           | 打卡成功提示该用户的一句话，可为字符串类型，也可以是函数类型，函数类型时，有一个参数data，即当前群成员在本地数据库中的数据对象，函数最终需返回一个字符串function(data){return ...}，此项默认值请看下文示例 |
| repeat   | String\|Function            | 重复打卡时提示该用户的一句话，可为字符串类型，也可以是函数类型，函数类型时，有一个参数data，即当前群成员在本地数据库中的数据对象，函数最终需返回一个字符串function(data){return ...}，此项默认值为 “今日已签到，请勿重复签到” |

参数 `success` 和 `repeat` 为函数类型时行参 `data` 示例

```js
{
  	// 该用户微信id
  	"CONTACTID": "wxid_nrsh4yc8yupm22",
  	// 该用户昵称
  	"CONTACTNAME": "isboyjc",
    // 该用户打卡总数
  	"CLOCKNUM": 170,
  	"CLOCKINFO": {
      // 该用户2020年打卡总数
     	"2020": 69,
      // 该用户2019年打卡总数
     	"2019": 101
  	},
    // 该用户积分
  	"INTEGRALNUM": 170
}
```



### 示例

```js
const { Wechaty } = require("wechaty")
const { PuppetPadplus } = require("wechaty-puppet-padplus")
const Qrterminal = require("qrcode-terminal")
const WechatyRoomClock = require("wechaty-room-clock")

const bot = new Wechaty({
  puppet: new PuppetPadplus({
    // 机器人padplus协议token
    token: PUPPET_PADPLUS_TOKEN,
  }),
  // 机器人名字
  name: ROBOT_NAME,
})

let options = {
  // 此处为默认项配置，也可为一个字符串
  keyword: ["签到", "打卡"],
  // 此处为默认项配置，也可为一个字符串
  success: (data) => {
    let str = "\n签到成功\n"
    Object.keys(data.CLOCKINFO).map(
      (v) => (str += `${v}年累计签到${data.CLOCKINFO[v]}次\n`)
    )
    return str + `共累计签到${data.CLOCKNUM}次\n拥有${data.INTEGRALNUM}积分`
  },
  // 此处为默认项配置，也可为一个字符串
  repeat: (data) => `今日已签到，请勿重复签到`,
}

// 使用插件
bot.use(WechatyRoomClock(options))

bot
  .on("scan", (qrcode, status) => {
    Qrterminal.generate(qrcode, { small: true })
  })
  .start()

```

如上所示，如果你对默认配置认同的话，只需要调用 `bot.use(WechatyRoomClock())` 这一行代码就OK了，是不是方便快捷呢😄



### 最后

扫描二维码，加圈子微信，可进交流群哦，效果如下图，赶快来试试吧

<img src="https://gitee.com/IsboyJC/PictureBed/raw/master/other/asdakshdajshdas1.jpeg" width="200" height="200" alt="图片名称" align=left />

![image-20200705213657340](https://gitee.com/IsboyJC/PictureBed/raw/master/other/image-20200705213657340.png)