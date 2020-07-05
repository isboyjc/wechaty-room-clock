/*
 * @Author: isboyjc
 * @Date: 2020-07-05 20:44:59
 * @LastEditors: isboyjc
 * @LastEditTime: 2020-07-05 20:45:33
 * @Description: plugin 积分打卡签到
 */
const fs = require("fs")
const low = require("lowdb")
const FileSync = require("lowdb/adapters/FileSync")

const DEFAULT_CONFIG = {
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

module.exports = function WechatyRoomClock(config = {}) {
  config = Object.assign({}, DEFAULT_CONFIG, config)

  if (typeof config.keyword === "string") config.keyword = [config.keyword]
  if (typeof config.success === "string") config.success = () => config.success
  if (typeof config.repeat === "string") config.repeat = () => config.repeat

  return (bot) => {
    // 消息监听
    bot.on("message", async (msg) => {
      if (msg.self()) return

      // 校验消息类型为文本 且 来自群聊
      if (msg.type() === bot.Message.Type.Text && msg.room()) {
        // 校验打卡关键字
        if (config.keyword.some((v) => v.trim() == msg.text().trim())) {
          // 获取机器人名字
          const selfName = bot.userSelf().name()
          // 获取群聊实例
          const room = await msg.room()
          // 获取消息来源人员实例
          const contact = msg.from()

          const roomId = room.id
          const roomName = await room.topic()
          const contactId = contact.id
          const contactName = contact.name()

          const dateTime = dateFormat("yyyy-MM-dd HH:mm:ss")
          const year = dateTime.split(" ")[0].split("-")[0]
          const date = dateTime.split(" ")[0]
          const time = dateTime.split(" ")[1]

          // 校验logs文件夹是否存在，不存在则创建
          if (!checkDir(`./${selfName}.clock-logs/`))
            await mkdir(`./${selfName}.clock-logs/`)

          // 适配器-main
          const mainAdapter = new FileSync(
            `./${selfName}.clock-logs/clock-logs-main.json`
          )
          const mainDB = low(mainAdapter)
          mainDB.defaults({ ROOMCLOCKLIST: [] }).write()

          // 适配器-年份
          const adapter = new FileSync(
            `./${selfName}.clock-logs/clock-logs-${year}.json`
          )
          const db = low(adapter)
          db.defaults({ ROOMCLOCKLIST: [] }).write()

          // 校验 ROOMCLOCKLIST 数组是否存在，不存在添加
          if (!mainDB.has("ROOMCLOCKLIST").value())
            mainDB.set("ROOMCLOCKLIST", []).write()
          if (!db.has("ROOMCLOCKLIST").value())
            db.set("ROOMCLOCKLIST", []).write()

          // 校验该 ROOM 对象是否存在，不存在添加
          if (
            mainDB.get("ROOMCLOCKLIST").find({ ROOMID: roomId }).value() ===
            undefined
          ) {
            mainDB
              .get("ROOMCLOCKLIST")
              .push({
                ROOMID: roomId,
                ROOMNAME: roomName,
                USERCLOCKLIST: [],
              })
              .write()
          }
          if (
            db.get("ROOMCLOCKLIST").find({ ROOMID: roomId }).value() ===
            undefined
          ) {
            db.get("ROOMCLOCKLIST")
              .push({
                ROOMID: roomId,
                ROOMNAME: roomName,
                CLOCKLOGS: [],
              })
              .write()
          }

          // 获取当前房间打卡日志数据包装方法
          const clockWrapperVal = db
            .get("ROOMCLOCKLIST")
            .find({ ROOMID: roomId })
            .get("CLOCKLOGS")
          const mainClockWrapperVal = mainDB
            .get("ROOMCLOCKLIST")
            .find({ ROOMID: roomId })
            .get("USERCLOCKLIST")

          // 校验今日是否已打卡
          if (
            clockWrapperVal
              .find({ CONTACTID: contactId, DATE: date })
              .value() === undefined
          ) {
            // 今日未签到
            clockWrapperVal
              .push({
                CONTACTID: contactId,
                CONTACTNAME: contactName,
                DATE: date,
                TIME: time,
              })
              .write()

            // 校验主表中room用户列表是否有该用户
            if (
              mainClockWrapperVal.find({ CONTACTID: contactId }).value() ===
              undefined
            ) {
              mainClockWrapperVal
                .push({
                  CONTACTID: contactId,
                  CONTACTNAME: contactName,
                  CLOCKNUM: 1,
                  CLOCKINFO: {
                    [year]: 1,
                  },
                  INTEGRALNUM: 1,
                })
                .write()
            } else {
              mainClockWrapperVal
                .find({ CONTACTID: contactId })
                .update("CLOCKNUM", (n) => n + 1)
                .update("INTEGRALNUM", (n) => n + 1)
                .update(`CLOCKINFO[${year}]`, (n) => n + 1)
                .write()
            }

            const current = mainClockWrapperVal
              .find({ CONTACTID: contactId })
              .value()
            await room.say(config.success(current), contact)
          } else {
            const current = mainClockWrapperVal
              .find({ CONTACTID: contactId })
              .value()
            // 今日已签到
            await room.say(config.repeat(current), contact)
          }
        }
      }
    })
  }
}

/**
 * fmt => ("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 * @description 将 Date 转化为指定格式的String
 * @param {String} fmt 转换时间格式，详见下
 *  月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 *  年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 *  fmt => ("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 *  fmt => ("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 *  fmt => ("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 *  fmt => ("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * @param {Object} date 时间对象，默认当前时间
 * @return {String}
 */
function dateFormat(fmt, date = new Date()) {
  var o = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours() % 12 == 0 ? 12 : date.getHours() % 12, //小时
    "H+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  }
  var week = {
    "0": "日",
    "1": "一",
    "2": "二",
    "3": "三",
    "4": "四",
    "5": "五",
    "6": "六",
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    )
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (RegExp.$1.length > 1 ? (RegExp.$1.length > 2 ? "星期" : "周") : "") +
        week[date.getDay() + ""]
    )
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      )
    }
  }
  return fmt
}

/**
 * @description 校验文件夹是否存在
 * @param {String} path 相对路径
 * @return {Boolean}
 */
function checkDir(path) {
  try {
    fs.accessSync(path, fs.F_OK)
  } catch (e) {
    return false
  }
  return true
}

/**
 * @description 创建文件夹
 * @param {String} path 相对路径
 * @return {Promise}
 */
function mkdir(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, (error) => {
      if (error) reject(false)
      resolve(true)
    })
  })
}
