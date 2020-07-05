/*
 * @Author: isboyjc
 * @Date: 2020-07-01 19:25:53
 * @LastEditors: isboyjc
 * @LastEditTime: 2020-07-05 21:05:50
 * @Description: test
 */
// Wechaty核心包
const { Wechaty } = require("wechaty")
// padplus协议包
const { PuppetPadplus } = require("wechaty-puppet-padplus")
// qr码
const Qrterminal = require("qrcode-terminal")
// 插件 WechatyRoomClock
const WechatyRoomClock = require("../index")

// 初始化 bot
const bot = new Wechaty({
  puppet: new PuppetPadplus({
    // 机器人padplus协议token
    token: PUPPET_PADPLUS_TOKEN,
  }),
  // 机器人名字
  name: ROBOT_NAME,
})

let options = {
  keyword: ["签到", "打卡"],
  success: (data) => {
    let str = "\n签到成功\n"
    Object.keys(data.CLOCKINFO).map(
      (v) => (str += `${v}年累计签到${data.CLOCKINFO[v]}次\n`)
    )
    return str + `共累计签到${data.CLOCKNUM}次\n拥有${data.INTEGRALNUM}积分`
  },
  repeat: () => `今日已签到，请勿重复签到`,
}

// 使用插件
bot.use(WechatyRoomClock(options))

bot
  .on("scan", (qrcode, status) => {
    Qrterminal.generate(qrcode, { small: true })
  })
  .start()
